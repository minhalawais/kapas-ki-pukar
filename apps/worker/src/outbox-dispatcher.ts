import { randomUUID } from "node:crypto";

import type { DatabaseClient } from "@kapas/database";
import { Queue } from "bullmq";
import type { Logger } from "pino";

import { queueForEvent, QUEUES } from "./job-catalog";

export interface ClaimedOutboxEvent {
  readonly id: string;
  readonly eventType: string;
  readonly aggregateId: string;
  readonly payload: Record<string, unknown>;
  readonly attemptCount: number;
}

export class OutboxDispatcher {
  private readonly owner = `dispatcher-${randomUUID()}`;
  private timer: NodeJS.Timeout | undefined;

  public constructor(
    private readonly database: DatabaseClient,
    private readonly queues: Readonly<Record<string, Queue>>,
    private readonly logger: Logger,
    private readonly pollMs = 1_000,
  ) {}

  public start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => void this.dispatchOnce(), this.pollMs);
    this.timer.unref();
    void this.dispatchOnce();
  }

  public stop(): void {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = undefined;
  }

  public async recoverStale(): Promise<number> {
    const result = await this.database.outboxEvent.updateMany({
      where: {
        status: "processing",
        lockedAt: { lt: new Date(Date.now() - 5 * 60_000) },
      },
      data: { status: "pending", lockedBy: null, lockedAt: null },
    });
    return result.count;
  }

  public async dispatchOnce(limit = 50): Promise<number> {
    await this.recoverStale();
    const claimed = await this.claim(limit);
    for (const event of claimed) {
      const queueName = queueForEvent(event.eventType);
      const queue = this.queues[queueName];
      if (!queue) continue;
      try {
        const evidenceScan =
          event.eventType === "evidence.scan.requested.v1" ||
          event.eventType === "evidence.scan.requested.v3";
        await queue.add(
          event.eventType,
          { eventId: event.id, aggregateId: event.aggregateId, payload: event.payload },
          {
            jobId: event.id,
            // A post-finish tus hook and the outbox transaction can become
            // visible to the worker a few milliseconds apart. Give evidence
            // scans enough time to observe the quarantined row before the job
            // is dead-lettered as `evidence_not_ready_for_scan`.
            attempts: evidenceScan ? 10 : 5,
            backoff: {
              type: "exponential",
              delay: evidenceScan ? 5_000 : 1_000,
              jitter: 0.25,
            },
            priority: event.eventType === "retention.review-due.v1" ? 5 : 10,
          },
        );
        await this.database.outboxEvent.updateMany({
          where: { id: event.id, status: "processing", lockedBy: this.owner },
          data: {
            status: "delivered",
            deliveredAt: new Date(),
            lockedBy: null,
            lockedAt: null,
            lastAttemptAt: new Date(),
            attemptCount: { increment: 1 },
          },
        });
      } catch (error) {
        await this.database.outboxEvent.updateMany({
          where: { id: event.id, status: "processing", lockedBy: this.owner },
          data: {
            status: "pending",
            availableAt: new Date(Date.now() + 2_000),
            lockedBy: null,
            lockedAt: null,
            lastAttemptAt: new Date(),
            lastErrorCode: "queue_publish_failed",
            attemptCount: { increment: 1 },
          },
        });
        this.logger.warn({ eventId: event.id, err: error }, "outbox publish deferred");
      }
    }
    return claimed.length;
  }

  private async claim(limit: number): Promise<readonly ClaimedOutboxEvent[]> {
    return this.database.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<ClaimedOutboxEvent[]>`
        UPDATE outbox_events
        SET status = 'processing', locked_by = ${this.owner}, locked_at = CURRENT_TIMESTAMP,
            last_attempt_at = CURRENT_TIMESTAMP
        WHERE id IN (
          SELECT id FROM outbox_events
          WHERE status = 'pending' AND available_at <= CURRENT_TIMESTAMP
          ORDER BY available_at ASC LIMIT ${Math.min(Math.max(limit, 1), 100)}
          FOR UPDATE SKIP LOCKED
        )
        RETURNING id, event_type AS "eventType", aggregate_id AS "aggregateId", payload, attempt_count AS "attemptCount"
      `;
      return rows;
    });
  }
}

export { QUEUES };
