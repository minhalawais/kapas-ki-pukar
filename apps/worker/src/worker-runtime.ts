import type { RuntimeConfig } from "@kapas/config";
import { Inject, Injectable, type OnApplicationShutdown, type OnModuleInit } from "@nestjs/common";
import { Job, Queue, UnrecoverableError, Worker } from "bullmq";
import Redis from "ioredis";
import type { Logger } from "pino";

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

  public constructor(
    @Inject(RUNTIME_CONFIG) private readonly config: RuntimeConfig,
    @Inject(WORKER_LOGGER) private readonly logger: Logger,
    private readonly finalFailures: LogFinalFailureRecorder,
  ) {
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
    await Promise.all([this.queue.waitUntilReady(), this.worker.waitUntilReady()]);
    this.worker.run();
    this.logger.info(
      { queue: diagnosticsQueueName, concurrency: this.config.workerConcurrency },
      "worker started",
    );
  }

  public async ping(): Promise<boolean> {
    if (this.queueConnection.status === "wait") {
      await this.queueConnection.connect();
    }
    return (await this.queueConnection.ping()) === "PONG";
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
    const graceful = Promise.allSettled([this.worker.close(), this.queue.close()]);
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
}
