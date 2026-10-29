import { randomUUID } from "node:crypto";

import { attachmentDeclarationV3Schema, type EvidenceDeliveryV3 } from "@kapas/api-contracts";
import type { RuntimeConfig } from "@kapas/config";
import type { DatabaseClient } from "@kapas/database";
import { hashOpaqueToken, verifyPassword } from "@kapas/security";
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";

import { DATABASE_CLIENT, RUNTIME_CONFIG } from "./tokens";

type AuthenticatedComplaint = {
  id: string;
  referenceNumber: string;
  evidenceStatus: string;
};

@Injectable()
export class EvidenceDeliveryV3Service {
  constructor(
    @Inject(DATABASE_CLIENT) private readonly client: DatabaseClient,
    @Inject(RUNTIME_CONFIG) private readonly config: RuntimeConfig,
  ) {}

  async delivery(referenceNumber: string, trackingSecret: string | undefined) {
    const complaint = await this.authenticate(referenceNumber, trackingSecret);
    const declarations = await this.client.evidenceDeclaration.findMany({
      where: { complaintId: complaint.id },
      orderBy: { createdAt: "asc" },
    });
    return {
      referenceNumber: complaint.referenceNumber,
      acknowledged: true,
      evidenceStatus: complaint.evidenceStatus,
      evidence: declarations.map((row) => this.deliveryRow(row)),
    };
  }

  async grant(referenceNumber: string, clientMediaId: string, trackingSecret: string | undefined) {
    const complaint = await this.authenticate(referenceNumber, trackingSecret);
    const evidence = await this.client.evidenceDeclaration.findUnique({
      where: { complaintId_clientMediaId: { complaintId: complaint.id, clientMediaId } },
      include: { uploadGrant: true },
    });
    if (!evidence) throw new NotFoundException("Evidence declaration was not found");
    if (["available", "omitted"].includes(evidence.status)) {
      throw new ConflictException({
        code: "evidence_delivery_final",
        disposition: "user_action",
        messageKey: "errors.evidence_delivery_final",
        attachmentId: clientMediaId,
        message: "Evidence delivery is already final",
      });
    }
    const now = new Date();
    let grant = evidence.uploadGrant;
    if (!grant || grant.status !== "active" || grant.expiresAt <= now) {
      if (grant) {
        await this.client.tusUploadGrant.update({
          where: { id: grant.id },
          data: { status: "expired" },
        });
      }
      const id = randomUUID();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const token = this.grantToken(id, evidence.id, expiresAt);
      try {
        grant = await this.client.tusUploadGrant.upsert({
          where: { evidenceId: evidence.id },
          create: {
            id,
            evidenceId: evidence.id,
            tokenHash: hashOpaqueToken(token, this.config.sessionSecret),
            expiresAt,
          },
          update: {
            tusUploadId: null,
            tokenHash: hashOpaqueToken(token, this.config.sessionSecret),
            status: "active",
            expiresAt,
            terminatedAt: null,
          },
        });
      } catch (error) {
        // Only recover from a concurrent unique-key race. Other database
        // failures must remain visible to the error boundary and operator.
        if ((error as { code?: string }).code !== "P2002") throw error;
        grant = await this.client.tusUploadGrant.findUniqueOrThrow({
          where: { evidenceId: evidence.id },
        });
      }
    }
    const uploadToken = this.grantToken(grant.id, evidence.id, grant.expiresAt);
    return {
      evidenceId: evidence.id,
      clientMediaId: evidence.clientMediaId,
      uploadUrl: this.config.tusdPublicUrl,
      uploadToken,
      uploadExpiresAt: grant.expiresAt.toISOString(),
      tusUploadId: grant.tusUploadId ?? undefined,
      metadata: {
        grantId: grant.id,
        evidenceId: evidence.id,
        clientMediaId: evidence.clientMediaId,
        kind: evidence.kind,
        filetype: evidence.declaredMimeType,
      },
    };
  }

  async omit(
    referenceNumber: string,
    clientMediaId: string,
    trackingSecret: string | undefined,
    requestId: string,
  ) {
    const complaint = await this.authenticate(referenceNumber, trackingSecret);
    const delivery = await this.client.evidenceDeclaration.findUnique({
      where: { complaintId_clientMediaId: { complaintId: complaint.id, clientMediaId } },
      include: { uploadGrant: true },
    });
    if (!delivery) throw new NotFoundException("Evidence declaration was not found");
    const activeGrant = delivery.uploadGrant;
    if (activeGrant?.status === "active" && activeGrant.tusUploadId) {
      const token = this.grantToken(activeGrant.id, delivery.id, activeGrant.expiresAt);
      const terminationUrl = new URL(
        encodeURIComponent(activeGrant.tusUploadId),
        this.config.tusdInternalUrl,
      ).toString();
      let terminated: Response;
      try {
        terminated = await fetch(terminationUrl, {
          method: "DELETE",
          headers: { "Tus-Resumable": "1.0.0", "Upload-Token": token },
          signal: AbortSignal.timeout(5_000),
        });
      } catch {
        throw new ServiceUnavailableException({
          code: "evidence_termination_unavailable",
          disposition: "retry",
          messageKey: "errors.evidence_termination_unavailable",
          attachmentId: clientMediaId,
          retryAfterSeconds: 5,
          message: "Evidence termination is temporarily unavailable",
        });
      }
      if (!terminated.ok && ![404, 410].includes(terminated.status)) {
        throw new ServiceUnavailableException({
          code: "evidence_termination_unavailable",
          disposition: "retry",
          messageKey: "errors.evidence_termination_unavailable",
          attachmentId: clientMediaId,
          retryAfterSeconds: 5,
          message: "Evidence termination is temporarily unavailable",
        });
      }
    }
    await this.client.$transaction(async (tx) => {
      const evidence = await tx.evidenceDeclaration.findUnique({
        where: { complaintId_clientMediaId: { complaintId: complaint.id, clientMediaId } },
      });
      if (!evidence) throw new NotFoundException("Evidence declaration was not found");
      if (evidence.status === "available") {
        throw new ConflictException({
          code: "available_evidence_cannot_be_omitted",
          disposition: "user_action",
          messageKey: "errors.available_evidence_cannot_be_omitted",
          attachmentId: clientMediaId,
          message: "Available evidence cannot be omitted",
        });
      }
      await tx.evidenceDeclaration.update({
        where: { id: evidence.id },
        data: { status: "omitted", reasonCode: "worker_omitted" },
      });
      await tx.tusUploadGrant.updateMany({
        where: { evidenceId: evidence.id, status: "active" },
        data: { status: "terminated", terminatedAt: new Date() },
      });
      await tx.auditEvent.create({
        data: {
          complaintId: complaint.id,
          actorType: "worker",
          action: "evidence.omit",
          targetType: "evidence_declaration",
          targetId: evidence.id,
          outcome: "success",
          requestId,
          metadata: { clientMediaId },
        },
      });
      await this.recomputeStatus(tx, complaint.id);
    });
    return this.delivery(referenceNumber, trackingSecret);
  }

  async replace(
    referenceNumber: string,
    replacementForId: string,
    raw: unknown,
    trackingSecret: string | undefined,
    requestId: string,
  ) {
    const parsed = attachmentDeclarationV3Schema.safeParse(raw);
    if (!parsed.success)
      throw new BadRequestException({
        code: parsed.error.issues[0]?.message ?? "invalid_attachment",
        disposition: "user_action",
        messageKey: "errors.invalid_attachment",
        message: "Attachment declaration is invalid",
      });
    const complaint = await this.authenticate(referenceNumber, trackingSecret);
    const attachment = parsed.data;
    await this.client.$transaction(async (tx) => {
      const replaced = await tx.evidenceDeclaration.findUnique({ where: { id: replacementForId } });
      if (!replaced || replaced.complaintId !== complaint.id) {
        throw new NotFoundException("Replacement target was not found");
      }
      const existing = await tx.evidenceDeclaration.findUnique({
        where: {
          complaintId_clientMediaId: {
            complaintId: complaint.id,
            clientMediaId: attachment.clientMediaId,
          },
        },
      });
      if (existing) {
        const identical =
          existing.replacementForId === replacementForId &&
          existing.kind === attachment.kind &&
          existing.displayName === attachment.displayName &&
          existing.declaredMimeType === attachment.declaredMimeType &&
          existing.totalBytes === BigInt(attachment.totalBytes);
        if (!identical)
          throw new ConflictException({
            code: "replacement_payload_conflict",
            disposition: "user_action",
            messageKey: "errors.replacement_payload_conflict",
            attachmentId: attachment.clientMediaId,
            message: "The replacement identifier was already used with different content",
          });
        return;
      }
      if (!["rejected", "expired"].includes(replaced.status)) {
        throw new ConflictException("Only evidence requiring action can be replaced");
      }
      const active = await tx.evidenceDeclaration.findMany({
        where: { complaintId: complaint.id, id: { not: replaced.id }, status: { not: "omitted" } },
        select: { kind: true, totalBytes: true },
      });
      const nonVoice =
        active.filter((entry) => entry.kind !== "voice").length +
        (attachment.kind === "voice" ? 0 : 1);
      const voice =
        active.filter((entry) => entry.kind === "voice").length +
        (attachment.kind === "voice" ? 1 : 0);
      const totalBytes =
        active.reduce((sum, entry) => sum + entry.totalBytes, 0n) + BigInt(attachment.totalBytes);
      if (nonVoice > 5 || voice > 1 || totalBytes > 50n * 1024n * 1024n) {
        throw new BadRequestException("Evidence count or aggregate quota exceeded");
      }
      await tx.evidenceDeclaration.create({
        data: {
          complaintId: complaint.id,
          clientMediaId: attachment.clientMediaId,
          kind: attachment.kind,
          displayName: attachment.displayName,
          declaredMimeType: attachment.declaredMimeType,
          totalBytes: BigInt(attachment.totalBytes),
          replacementForId,
          capturedAt: attachment.capturedAt ? new Date(attachment.capturedAt) : undefined,
          recordedAt: attachment.recordedAt ? new Date(attachment.recordedAt) : undefined,
          durationMs: attachment.durationMs,
        },
      });
      await tx.evidenceDeclaration.update({
        where: { id: replaced.id },
        data: { status: "omitted", reasonCode: "replaced" },
      });
      await tx.auditEvent.create({
        data: {
          complaintId: complaint.id,
          actorType: "worker",
          action: "evidence.replace",
          targetType: "evidence_declaration",
          targetId: replaced.id,
          outcome: "success",
          requestId,
          metadata: { replacementClientMediaId: attachment.clientMediaId },
        },
      });
      await this.recomputeStatus(tx, complaint.id);
    });
    return this.delivery(referenceNumber, trackingSecret);
  }

  private async authenticate(
    referenceNumber: string,
    trackingSecret: string | undefined,
  ): Promise<AuthenticatedComplaint> {
    if (!trackingSecret) throw new UnauthorizedException("Tracking credential is required");
    const complaint = await this.client.complaint.findUnique({
      where: { referenceNumber },
      include: { workerCredential: true },
    });
    if (
      !complaint?.workerCredential ||
      !(await verifyPassword(trackingSecret, complaint.workerCredential.secretHash))
    ) {
      throw new UnauthorizedException("Tracking credential is invalid");
    }
    return complaint;
  }

  private grantToken(grantId: string, evidenceId: string, expiresAt: Date): string {
    const payload = `${grantId}.${evidenceId}.${expiresAt.getTime()}`;
    return `${payload}.${hashOpaqueToken(`v3-upload:${payload}`, this.config.sessionSecret)}`;
  }

  private deliveryRow(row: {
    id: string;
    clientMediaId: string;
    status: string;
    uploadedBytes: bigint;
    totalBytes: bigint;
    reasonCode: string | null;
  }): EvidenceDeliveryV3 {
    return {
      evidenceId: row.id,
      clientMediaId: row.clientMediaId,
      status: row.status as EvidenceDeliveryV3["status"],
      uploadedBytes: Number(row.uploadedBytes),
      totalBytes: Number(row.totalBytes),
      reasonCode: row.reasonCode ?? undefined,
    };
  }

  private async recomputeStatus(
    tx: Pick<DatabaseClient, "evidenceDeclaration" | "complaint">,
    complaintId: string,
  ) {
    const rows = await tx.evidenceDeclaration.findMany({
      where: { complaintId },
      select: { status: true },
    });
    const active = rows.filter((row) => row.status !== "omitted");
    const evidenceStatus =
      active.length === 0
        ? "none"
        : active.some((row) => ["rejected", "expired"].includes(row.status))
          ? "action_required"
          : active.every((row) => row.status === "available")
            ? "complete"
            : active.some((row) => ["quarantined", "scanning"].includes(row.status))
              ? "processing"
              : "pending";
    await tx.complaint.update({ where: { id: complaintId }, data: { evidenceStatus } });
  }
}
