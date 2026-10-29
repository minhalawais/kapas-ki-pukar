import { rm } from "node:fs/promises";
import { join } from "node:path";

import type { DatabaseClient } from "@kapas/database";

export class MaintenanceCoordinator {
  public constructor(
    private readonly database: DatabaseClient,
    private readonly owner: string,
  ) {}

  public async withLock<T>(
    name: string,
    ttlMs: number,
    work: () => Promise<T>,
  ): Promise<T | undefined> {
    const now = new Date();
    const expiry = new Date(now.getTime() + ttlMs);
    const acquired = await this.database.$transaction(async (tx) => {
      const row = await tx.maintenanceLock.findUnique({ where: { name } });
      if (row && row.expiresAt > now && row.owner !== this.owner) return false;
      await tx.maintenanceLock.upsert({
        where: { name },
        update: { owner: this.owner, expiresAt: expiry },
        create: { name, owner: this.owner, expiresAt: expiry },
      });
      return true;
    });
    if (!acquired) return undefined;
    try {
      return await work();
    } finally {
      await this.database.maintenanceLock.deleteMany({ where: { name, owner: this.owner } });
    }
  }

  public async cleanupExpiredUploads(): Promise<number> {
    const now = new Date();
    const rejectedCutoff = new Date(now.getTime() - 72 * 60 * 60 * 1000);
    const expired = await this.database.uploadSession.findMany({
      where: {
        attachedAt: null,
        OR: [
          {
            expiresAt: { lt: now },
            status: { in: ["created", "uploading", "processing", "complete"] },
          },
          { status: "rejected", lastActivityAt: { lt: rejectedCutoff } },
        ],
      },
      select: { id: true, quarantinePath: true, finalObjectPath: true },
      take: 500,
    });
    for (const upload of expired) {
      await Promise.all([
        rm(upload.quarantinePath, { force: true }).catch(() => undefined),
        upload.finalObjectPath
          ? rm(upload.finalObjectPath, { force: true }).catch(() => undefined)
          : Promise.resolve(),
      ]);
      await this.database.uploadSession.updateMany({
        where: { id: upload.id, attachedAt: null },
        data: { status: "expired", rejectionCode: "expired", lastActivityAt: now },
      });
    }
    return expired.length;
  }

  public async cleanupExpiredIdempotency(): Promise<number> {
    return (
      await this.database.idempotencyRecord.deleteMany({ where: { expiresAt: { lt: new Date() } } })
    ).count;
  }

  public async cleanupExpiredExports(root: string): Promise<number> {
    const expired = await this.database.exportJob.findMany({
      where: { expiresAt: { lt: new Date() }, status: { in: ["ready", "failed"] } },
      select: { id: true, filePath: true },
    });
    const prefix = join(root, "");
    for (const job of expired)
      if (job.filePath?.startsWith(prefix))
        await rm(job.filePath, { force: true }).catch(() => undefined);
    if (expired.length)
      await this.database.exportJob.updateMany({
        where: { id: { in: expired.map((job) => job.id) } },
        data: { status: "expired", filePath: null },
      });
    return expired.length;
  }

  public async reviewRetention(): Promise<number> {
    const cutoff = new Date(Date.now() - 365 * 86_400_000);
    const candidates = await this.database.complaint.findMany({
      where: {
        retentionState: "active",
        status: { in: ["Resolved", "Closed"] },
        updatedAt: { lt: cutoff },
        legalHolds: { none: { active: true } },
      },
      select: { id: true },
      take: 500,
    });
    for (const complaint of candidates)
      await this.database.retentionDisposition.upsert({
        where: { complaintId_dataClass: { complaintId: complaint.id, dataClass: "complaint" } },
        update: {},
        create: {
          complaintId: complaint.id,
          dataClass: "complaint",
          action: "review",
          reason: "resolved record exceeded interim review period",
        },
      });
    return candidates.length;
  }
}
