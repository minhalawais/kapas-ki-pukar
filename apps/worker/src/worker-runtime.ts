import { createWriteStream } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";

import { DeterministicAIProvider } from "@kapas/ai";
import type { RuntimeConfig } from "@kapas/config";
import { createDatabaseClient } from "@kapas/database";
import type { ComplaintContext } from "@kapas/domain";
import { Inject, Injectable, type OnApplicationShutdown, type OnModuleInit } from "@nestjs/common";
import { Job, Queue, UnrecoverableError, Worker } from "bullmq";
import Redis from "ioredis";
import type { Logger } from "pino";

import { EvidenceProcessor } from "./evidence-processor";
import { EvidenceV3Processor } from "./evidence-v3-processor";
import { MaintenanceCoordinator } from "./maintenance";
import { ExpoPushNotificationAdapter } from "./notification";
import { OutboxDispatcher, QUEUES } from "./outbox-dispatcher";
import { deliverComplaintPushNotifications } from "./push-delivery";
import { classifyRetry } from "./retry";
import { RUNTIME_CONFIG, WORKER_LOGGER } from "./worker.tokens";

export const diagnosticsQueueName = "diagnostics";
export const diagnosticsJobName = "diagnostics.ping.v1";

export interface FinalFailureRecord {
  readonly queue: string;
  readonly jobName: string;
  readonly jobId: string | undefined;
  readonly attemptsMade: number;
  readonly errorName: string;
}

export interface FinalFailureRecorder {
  record(failure: FinalFailureRecord): Promise<void>;
}

@Injectable()
export class LogFinalFailureRecorder implements FinalFailureRecorder {
  public constructor(@Inject(WORKER_LOGGER) private readonly logger: Logger) {}

  public async record(failure: FinalFailureRecord): Promise<void> {
    this.logger.error({ failure }, "job permanently failed");
  }
}

@Injectable()
export class WorkerRuntime implements OnModuleInit, OnApplicationShutdown {
  private readonly queueConnection: Redis;
  private readonly workerConnection: Redis;
  private readonly queue: Queue;
  private readonly worker: Worker;
  private readonly database: ReturnType<typeof createDatabaseClient>;
  private readonly queues: Record<string, Queue> = {};
  private readonly backgroundWorkers: Worker[] = [];
  private readonly dispatcher: OutboxDispatcher;
  private readonly aiProvider = new DeterministicAIProvider();
  private readonly notificationAdapter: ExpoPushNotificationAdapter;
  private readonly maintenance: MaintenanceCoordinator;
  private readonly evidenceProcessor: EvidenceProcessor;
  private readonly evidenceV3Processor: EvidenceV3Processor;
  private maintenanceTimer: NodeJS.Timeout | undefined;

  public constructor(
    @Inject(RUNTIME_CONFIG) private readonly config: RuntimeConfig,
    @Inject(WORKER_LOGGER) private readonly logger: Logger,
    private readonly finalFailures: LogFinalFailureRecorder,
  ) {
    this.database = createDatabaseClient({ connectionString: config.databaseUrl });
    this.notificationAdapter = new ExpoPushNotificationAdapter({
      enabled: config.expoPushEnabled,
      accessToken: config.expoPushAccessToken,
    });
    this.maintenance = new MaintenanceCoordinator(this.database, `worker-${process.pid}`);
    this.evidenceProcessor = new EvidenceProcessor(this.database, config);
    this.evidenceV3Processor = new EvidenceV3Processor(this.database, config);
    this.queueConnection = new Redis(config.redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      connectTimeout: 3_000,
      commandTimeout: 3_000,
    });
    this.workerConnection = new Redis(config.redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: null,
      connectTimeout: 3_000,
    });
    this.queueConnection.on("error", (error) =>
      this.logger.warn({ err: error }, "queue connection error"),
    );
    this.workerConnection.on("error", (error) =>
      this.logger.warn({ err: error }, "worker connection error"),
    );

    this.queue = new Queue(diagnosticsQueueName, {
      connection: this.queueConnection,
      prefix: config.queuePrefix,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 500 },
        removeOnComplete: { age: 3_600, count: 1_000 },
        removeOnFail: { age: 86_400, count: 5_000 },
      },
    });
    this.worker = new Worker(diagnosticsQueueName, (job) => this.process(job), {
      connection: this.workerConnection,
      prefix: config.queuePrefix,
      concurrency: config.workerConcurrency,
      autorun: false,
    });
    for (const queueName of Object.values(QUEUES)) {
      this.queues[queueName] = new Queue(queueName, {
        connection: this.queueConnection,
        prefix: config.queuePrefix,
        defaultJobOptions: {
          attempts: 5,
          backoff: { type: "exponential", delay: 1_000, jitter: 0.25 },
          removeOnComplete: { age: 3_600, count: 1_000 },
          removeOnFail: { age: 86_400, count: 5_000 },
        },
      });
      const consumer = new Worker(queueName, (job) => this.processBackground(job), {
        connection: this.workerConnection,
        prefix: config.queuePrefix,
        concurrency: config.workerConcurrency,
        autorun: false,
      });
      consumer.on(
        "failed",
        (job, error) => void this.handleBackgroundFailure(queueName, job, error),
      );
      consumer.on("error", (error) =>
        this.logger.error({ queue: queueName, err: error }, "background worker error"),
      );
      this.backgroundWorkers.push(consumer);
    }
    this.dispatcher = new OutboxDispatcher(this.database, this.queues, this.logger);
    this.worker.on("completed", (job) =>
      this.logger.info(
        { queue: diagnosticsQueueName, jobId: job.id, jobName: job.name },
        "job completed",
      ),
    );
    this.worker.on("failed", (job, error) => void this.handleFailure(job, error));
    this.worker.on("error", (error) => this.logger.error({ err: error }, "worker runtime error"));
  }

  public async onModuleInit(): Promise<void> {
    await Promise.all([
      this.queue.waitUntilReady(),
      this.worker.waitUntilReady(),
      ...Object.values(this.queues).map((queue) => queue.waitUntilReady()),
    ]);
    this.worker.run();
    this.backgroundWorkers.forEach((worker) => worker.run());
    this.dispatcher.start();
    this.maintenanceTimer = setInterval(() => {
      void this.maintenance.withLock("scheduled-maintenance", 55_000, async () => {
        await this.maintenance.cleanupExpiredUploads();
        await this.evidenceProcessor.retryStuck();
        await this.maintenance.cleanupExpiredIdempotency();
        await this.maintenance.cleanupExpiredExports(join(this.config.evidenceRoot, "exports"));
        await this.maintenance.reviewRetention();
        await this.reconcileNotifications();
      });
    }, 60_000);
    this.maintenanceTimer.unref();
    this.logger.info(
      { queue: diagnosticsQueueName, concurrency: this.config.workerConcurrency },
      "worker started",
    );
  }

  public async ping(): Promise<boolean> {
    if (this.queueConnection.status === "wait") {
      await this.queueConnection.connect();
    }
    const redisReady = (await this.queueConnection.ping()) === "PONG";
    if (!redisReady) return false;
    return (
      this.config.nodeEnv === "test" ||
      ((await this.evidenceProcessor.readiness()) && (await this.evidenceV3Processor.readiness()))
    );
  }

  public async enqueueDiagnostic(correlationId: string): Promise<string | undefined> {
    const job = await this.queue.add(
      diagnosticsJobName,
      { correlationId },
      { jobId: correlationId },
    );
    return job.id;
  }

  public async onApplicationShutdown(signal?: string): Promise<void> {
    this.logger.info({ signal }, "worker shutdown started");
    this.dispatcher.stop();
    if (this.maintenanceTimer) clearInterval(this.maintenanceTimer);
    this.maintenanceTimer = undefined;
    const graceful = Promise.allSettled([
      this.worker.close(),
      this.queue.close(),
      ...this.backgroundWorkers.map((worker) => worker.close()),
      ...Object.values(this.queues).map((queue) => queue.close()),
      this.database.$disconnect(),
    ]);
    const timeout = new Promise<"timeout">((resolve) => {
      setTimeout(() => resolve("timeout"), this.config.shutdownTimeoutMs).unref();
    });
    const result = await Promise.race([graceful, timeout]);
    if (result === "timeout") {
      this.logger.error("worker shutdown timed out; forcing connection closure");
      await this.worker.close(true);
    }
    this.workerConnection.disconnect(false);
    this.queueConnection.disconnect(false);
    this.logger.info("worker shutdown complete");
  }

  private async process(job: Job): Promise<Readonly<{ ok: true }>> {
    if (job.name !== diagnosticsJobName) {
      const error = new UnrecoverableError(
        "Unsupported diagnostics job version",
      ) as UnrecoverableError & {
        code: string;
      };
      error.code = "unsupported_job_version";
      throw error;
    }
    if (
      typeof job.data !== "object" ||
      job.data === null ||
      typeof (job.data as { correlationId?: unknown }).correlationId !== "string"
    ) {
      const error = new UnrecoverableError(
        "Invalid diagnostics job payload",
      ) as UnrecoverableError & {
        code: string;
      };
      error.code = "invalid_job_payload";
      throw error;
    }
    this.logger.debug({ jobId: job.id, jobName: job.name }, "diagnostic job processed");
    return { ok: true };
  }

  private async handleFailure(job: Job | undefined, error: Error): Promise<void> {
    if (!job) {
      this.logger.error({ err: error }, "job failed before it was materialized");
      return;
    }
    const configuredAttempts = job.opts.attempts ?? 1;
    if (
      error instanceof UnrecoverableError ||
      classifyRetry(error) === "discard" ||
      job.attemptsMade >= configuredAttempts
    ) {
      await this.finalFailures.record({
        queue: diagnosticsQueueName,
        jobName: job.name,
        jobId: job.id,
        attemptsMade: job.attemptsMade,
        errorName: error.name,
      });
    }
  }

  private async processBackground(job: Job): Promise<Readonly<{ ok: true }>> {
    const payload = job.data as { eventId?: unknown; aggregateId?: unknown; payload?: unknown };
    if (
      typeof payload.eventId !== "string" ||
      typeof payload.aggregateId !== "string" ||
      typeof payload.payload !== "object" ||
      payload.payload === null
    ) {
      const error = new UnrecoverableError("Invalid background job payload") as Error & {
        code: string;
      };
      error.code = "invalid_job_payload";
      throw error;
    }
    if (job.name === "complaint.created" || job.name === "complaint.submitted.v1") {
      await this.queues[QUEUES.ai]?.add(
        "ai.analysis.requested.v1",
        {
          // BullMQ custom IDs may not contain `:`. Keep the derived ID
          // deterministic for idempotency while using a safe delimiter.
          eventId: `${payload.eventId}-ai`,
          aggregateId: payload.aggregateId,
          payload: payload.payload,
        },
        {
          jobId: `${payload.eventId}-ai`,
          attempts: 3,
          backoff: { type: "exponential", delay: 1_000, jitter: 0.25 },
        },
      );
    }
    if (job.name === "evidence.scan.requested.v1") {
      await this.evidenceProcessor.process(payload.aggregateId);
    }
    if (job.name === "evidence.scan.requested.v3") {
      await this.evidenceV3Processor.process(payload.aggregateId);
    }
    if (job.name === "ai.analysis.requested.v1")
      await this.processAi(payload.aggregateId, payload.payload as Record<string, unknown>);
    if (job.name === "export.requested.v1")
      await this.processExport(
        String((payload.payload as { exportId?: unknown }).exportId ?? payload.aggregateId),
      );
    if (
      job.name === "worker.notification.requested.v1" ||
      job.name === "case.information-requested.v1" ||
      job.name === "case.resolution-proposed.v1" ||
      job.name === "case.status-changed.v1"
    ) {
      await this.processNotification(
        payload.eventId,
        payload.aggregateId,
        payload.payload as Record<string, unknown>,
      );
    }
    return { ok: true };
  }

  private async processAi(complaintId: string, payload: Record<string, unknown>): Promise<void> {
    const complaint = await this.database.complaint.findUnique({
      where: { id: complaintId },
      include: { incident: true },
    });
    if (!complaint) return;
    const context: ComplaintContext = {
      category: complaint.categoryCode as ComplaintContext["category"],
      subcategory: complaint.subcategoryCode as ComplaintContext["subcategory"],
      immediateDanger: complaint.incident?.immediateDanger ?? false,
      scenarioId: typeof payload.scenarioId === "string" ? payload.scenarioId : undefined,
    };
    const result = await this.aiProvider.summarize(context);
    const existing = await this.database.aiAnalysisRun.findFirst({
      where: {
        complaintId,
        inputHash: result.metadata.inputHash,
        provider: result.metadata.provider,
      },
    });
    if (existing) return;
    await this.database.aiAnalysisRun.create({
      data: {
        complaintId,
        inputReferences: { categoryCode: complaint.categoryCode, source: "minimized" },
        provider: result.metadata.provider,
        model: result.metadata.model,
        promptVersion: result.metadata.promptVersion,
        inputHash: result.metadata.inputHash,
        providerRegion: result.metadata.region,
        latencyMs: result.metadata.latencyMs,
        tokenCount: result.metadata.tokenCount,
        costMinorUnits: result.metadata.costMinorUnits,
        output: JSON.parse(JSON.stringify(result.value)),
        confidence:
          result.value.confidence === "high"
            ? 0.9
            : result.value.confidence === "medium"
              ? 0.7
              : 0.4,
        warnings: result.metadata.warnings,
        safetyWarnings: result.metadata.warnings,
        humanReviewState: result.value.confidence === "high" ? "not-required" : "required",
        startedAt: new Date(Date.now() - result.metadata.latencyMs),
        completedAt: new Date(),
      },
    });
  }

  private async processNotification(
    eventId: string,
    complaintId: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    await deliverComplaintPushNotifications(this.database, this.notificationAdapter, {
      eventId,
      complaintId,
      payload,
    });
  }

  private async processExport(exportId: string): Promise<void> {
    const job = await this.database.exportJob.findUnique({ where: { id: exportId } });
    if (!job || job.status === "expired") return;
    await this.database.exportJob.update({
      where: { id: exportId },
      data: { status: "processing", failureCode: null },
    });
    const root = join(this.config.evidenceRoot, "exports");
    const filePath = join(root, `${exportId}.csv`);
    const safe = (value: unknown): string => {
      let text = value == null ? "" : String(value);
      if (/^[=+\-@]/u.test(text)) text = `'${text}`;
      return `"${text.replaceAll('"', '""')}"`;
    };
    try {
      await mkdir(root, { recursive: true });
      const stream = createWriteStream(filePath, { flags: "w", encoding: "utf8" });
      stream.write(
        "referenceNumber,category,subcategory,status,priority,province,submittedAt,dueAt\n",
      );
      const filters = (job.filters ?? {}) as {
        from?: string;
        to?: string;
        status?: string;
        priority?: string;
        category?: string;
        subcategory?: string;
        province?: string;
        district?: string;
      };
      const where = {
        submittedAt: {
          gte: filters.from ? new Date(filters.from) : new Date(Date.now() - 365 * 86_400_000),
          lt: filters.to ? new Date(filters.to) : new Date(),
        },
        status: filters.status ? { in: filters.status.split(",").slice(0, 20) } : undefined,
        priority: filters.priority ? { in: filters.priority.split(",").slice(0, 20) } : undefined,
        categoryCode: filters.category
          ? { in: filters.category.split(",").slice(0, 20) }
          : undefined,
        subcategoryCode: filters.subcategory
          ? { in: filters.subcategory.split(",").slice(0, 20) }
          : undefined,
        location: {
          province: filters.province ? { in: filters.province.split(",").slice(0, 20) } : undefined,
          district: filters.district ? { in: filters.district.split(",").slice(0, 20) } : undefined,
        },
      };
      let skip = 0;
      let rowCount = 0;
      while (true) {
        const rows = await this.database.complaint.findMany({
          where,
          orderBy: { submittedAt: "asc" },
          skip,
          take: 500,
          select: {
            referenceNumber: true,
            categoryCode: true,
            subcategoryCode: true,
            status: true,
            priority: true,
            submittedAt: true,
            dueAt: true,
            location: { select: { province: true } },
          },
        });
        if (!rows.length) break;
        for (const row of rows)
          stream.write(
            [
              row.referenceNumber,
              row.categoryCode,
              row.subcategoryCode,
              row.status,
              row.priority,
              row.location?.province,
              row.submittedAt.toISOString(),
              row.dueAt.toISOString(),
            ]
              .map(safe)
              .join(",") + "\n",
          );
        rowCount += rows.length;
        skip += rows.length;
        if (rows.length < 500 || rowCount >= 100_000) break;
      }
      await new Promise<void>((resolve, reject) => {
        stream.once("finish", resolve);
        stream.once("error", reject);
        stream.end();
      });
      await this.database.exportJob.update({
        where: { id: exportId },
        data: { status: "ready", filePath, rowCount, completedAt: new Date() },
      });
    } catch (error) {
      await rm(filePath, { force: true }).catch(() => undefined);
      await this.database.exportJob.update({
        where: { id: exportId },
        data: { status: "failed", failureCode: "export_failed" },
      });
      throw error;
    }
  }

  private async reconcileNotifications(): Promise<void> {
    const pending = await this.database.notificationDelivery.findMany({
      where: { state: "accepted", providerMessageId: { not: null } },
      take: 100,
      orderBy: { updatedAt: "asc" },
    });
    const ids = pending
      .map((row) => row.providerMessageId)
      .filter((id): id is string => Boolean(id));
    const states = await this.notificationAdapter.reconcile(ids);
    for (const row of pending) {
      const state = row.providerMessageId ? states[row.providerMessageId] : undefined;
      if (!state || state === "unknown") continue;
      await this.database.notificationDelivery.update({
        where: { id: row.id },
        data: { state, deliveredAt: state === "delivered" ? new Date() : undefined },
      });
      if (state === "failed" && row.destinationRef) {
        await this.database.workerPushRegistration.updateMany({
          where: { expoPushToken: row.destinationRef, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
    }
  }

  private async handleBackgroundFailure(
    queueName: string,
    job: Job | undefined,
    error: Error,
  ): Promise<void> {
    if (!job || job.attemptsMade < (job.opts.attempts ?? 1)) return;
    const eventId =
      typeof (job.data as { eventId?: unknown } | undefined)?.eventId === "string"
        ? (job.data as { eventId: string }).eventId
        : undefined;
    if (eventId) {
      await this.database.outboxEvent.updateMany({
        where: { id: eventId },
        data: {
          status: "dead-letter",
          lastErrorCode: "worker_terminal_failure",
          lastAttemptAt: new Date(),
        },
      });
    }
    this.logger.error(
      { queue: queueName, jobId: job.id, eventType: job.name, errorName: error.name },
      "background job terminal failure",
    );
  }
}
