import { createHash } from "node:crypto";

import {
  actionDetailFromReason,
  actionForTransition,
  complaintSla,
  assertCaseTransition,
  assertTransitionReason,
  assertTaxonomySelection,
  getMinimumPriority,
  reconcilePriority,
  VersionConflictError,
  type ApprovedEvidenceMetadata,
  type AnalyticsComplaintFact,
  type AnalyticsReadRepository,
  type AuditEventInput,
  type AuditEventRepository,
  type CaseHistoryRecord,
  type CaseHistoryRepository,
  type CaseMutationContext,
  type CaseStatus,
  type ComplaintCommandRepository,
  type ComplaintWriteResult,
  type CreateComplaintCommand,
  type EvidenceMetadataRepository,
  type JsonObject,
  type Priority,
  type OutboxEventRepository,
  type PendingOutboxEvent,
  type SensitiveReporterDetail,
  type SensitiveReporterRepository,
  type StaffCaseDetail,
  type StaffCaseListItem,
  type StaffCaseQueryRepository,
  type WorkerComplaintDetail,
  type WorkerTrackingQueryRepository,
  type IdentityAccessRepository,
  type AuthenticatedStaff,
  type WorkerTrackingSession,
  type EncryptedSecretInput,
} from "@kapas/domain";
import {
  decryptEnvelope,
  deriveKey,
  generateOpaqueToken,
  hashOpaqueToken,
  hashPassword,
  verifyPassword,
  verifyTotp,
} from "@kapas/security";

import { Prisma } from "./generated/prisma/client";

import type { DatabaseClient } from "./index";

const transactionOptions = {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
} as const;

const createTransactionOptions = {
  isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
} as const;

function asJson(value: JsonObject | undefined): Prisma.InputJsonValue | undefined {
  return value as Prisma.InputJsonValue | undefined;
}

function asBytes(value: Uint8Array | undefined): Uint8Array<ArrayBuffer> | undefined {
  return value ? Uint8Array.from(value) : undefined;
}

function output(row: {
  id: string;
  referenceNumber: string;
  status: string;
  priority: string;
  version: number;
  submittedAt: Date;
}): ComplaintWriteResult {
  return {
    id: row.id,
    referenceNumber: row.referenceNumber,
    status: row.status as CaseStatus,
    priority: row.priority as Priority,
    version: row.version,
    submittedAt: row.submittedAt.toISOString(),
  };
}

function isOverdue(dueAt: Date, status: string): boolean {
  return status !== "Closed" && dueAt.getTime() < Date.now();
}

function workerComplaintMedia(
  legacyEvidence: Array<{
    storageId: string;
    kind: string;
    originalName: string;
    detectedMimeType: string;
    byteLength: bigint;
    capturedAt: Date | null;
    recordedAt: Date | null;
    durationMs: number | null;
  }>,
  declarations: Array<{
    id: string;
    kind: string;
    displayName: string;
    declaredMimeType: string;
    detectedMimeType: string | null;
    scanEngine: string | null;
    totalBytes: bigint;
    capturedAt: Date | null;
    recordedAt: Date | null;
    durationMs: number | null;
  }>,
  submittedAt: Date,
): Pick<WorkerComplaintDetail, "evidence" | "voice"> {
  const combined = [
    ...legacyEvidence.map((item) => ({
      id: item.storageId,
      kind: item.kind,
      originalName: item.originalName,
      mimeType: item.detectedMimeType,
      byteLength: Number(item.byteLength),
      capturedAt: item.capturedAt?.toISOString(),
      recordedAt: item.recordedAt?.toISOString(),
      durationMs: item.durationMs ?? undefined,
      source: "worker" as const,
    })),
    ...declarations.map((item) => ({
      id: item.id,
      kind: item.kind,
      originalName: item.displayName,
      mimeType: item.detectedMimeType ?? item.declaredMimeType,
      byteLength: Number(item.totalBytes),
      capturedAt: item.capturedAt?.toISOString(),
      recordedAt: item.recordedAt?.toISOString(),
      durationMs: item.durationMs ?? undefined,
      source: item.scanEngine === "staff-inline" ? ("office" as const) : ("worker" as const),
    })),
  ];
  const voiceItem = combined.find((item) => item.kind === "voice");
  return {
    evidence: combined
      .filter((item) => item.kind !== "voice")
      .map((item) => ({
        id: item.id,
        kind: item.kind as "photo" | "document",
        originalName: item.originalName,
        mimeType: item.mimeType,
        byteLength: item.byteLength,
        capturedAt: item.capturedAt,
        source: item.source,
      })),
    voice: voiceItem
      ? {
          id: voiceItem.id,
          originalName: voiceItem.originalName,
          mimeType: voiceItem.mimeType,
          byteLength: voiceItem.byteLength,
          durationMs: voiceItem.durationMs ?? 0,
          recordedAt: voiceItem.recordedAt ?? voiceItem.capturedAt ?? submittedAt.toISOString(),
        }
      : undefined,
  };
}

function requestHash(command: CreateComplaintCommand): string {
  if (command.canonicalRequestHash) return command.canonicalRequestHash;
  const transportFields = new Set([
    "canonicalRequestHash",
    "idempotencyKeyHash",
    "idempotencyScope",
    "requestId",
    "trackingSecretHash",
    "intakeReceipt",
  ]);
  const payload = Object.fromEntries(
    Object.entries(command).filter(([key]) => !transportFields.has(key)),
  );
  return createHash("sha256").update(stableSerialize(payload)).digest("hex");
}

function stableSerialize(value: unknown): string {
  if (typeof value === "bigint") return JSON.stringify(value.toString());
  if (value instanceof Uint8Array) return JSON.stringify(Buffer.from(value).toString("base64"));
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right));
    return `{${entries
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableSerialize(entry)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function isSerializationConflict(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { originalCode?: unknown; cause?: { originalCode?: unknown } };
  return candidate.originalCode === "40001" || candidate.cause?.originalCode === "40001";
}

function prismaErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : undefined;
}

function uniqueConstraintTarget(error: unknown): string {
  if (!error || typeof error !== "object") return "";
  const candidate = error as {
    message?: unknown;
    meta?: { target?: unknown; constraint?: unknown };
  };
  const target = candidate.meta?.target;
  if (Array.isArray(target)) return target.join(",");
  return String(target ?? candidate.meta?.constraint ?? candidate.message ?? "");
}

async function waitForRetry(attempt: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * 10));
}

export class PrivacyInvariantError extends Error {
  readonly code = "PRIVACY_INVARIANT_VIOLATION";

  constructor(message: string) {
    super(message);
    this.name = "PrivacyInvariantError";
  }
}

export class IdempotencyConflictError extends Error {
  readonly code = "IDEMPOTENCY_CONFLICT";

  constructor() {
    super("The idempotency key was already used for a different request.");
    this.name = "IdempotencyConflictError";
  }
}

export class PostgresComplaintRepository
  implements
    ComplaintCommandRepository,
    StaffCaseQueryRepository,
    WorkerTrackingQueryRepository,
    AnalyticsReadRepository
{
  constructor(
    private readonly client: DatabaseClient,
    private readonly referenceNumberFactory?: () => string,
  ) {}

  async create(command: CreateComplaintCommand): Promise<ComplaintWriteResult> {
    assertTaxonomySelection(command.categoryCode, command.subcategoryCode);
    const effectivePriority = reconcilePriority(
      command.priority,
      getMinimumPriority({
        category: command.categoryCode,
        immediateDanger: command.incident.immediateDanger,
        pesticideSymptoms: command.categoryCode === "PES" && command.incident.currentDanger,
        harassmentThreat: command.categoryCode === "HAR" && command.incident.currentDanger,
      }),
    );
    const protectedIdentities =
      command.privateIdentities ?? (command.privateIdentity ? [command.privateIdentity] : []);
    if (command.privacyMode === "ANON" && protectedIdentities.length > 0) {
      throw new PrivacyInvariantError("Anonymous complaints cannot contain private identity.");
    }
    if (command.privacyMode !== "ANON" && protectedIdentities.length === 0) {
      throw new PrivacyInvariantError(
        "Confidential and identified complaints require private identity.",
      );
    }

    const digest = requestHash(command);
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        return await this.client.$transaction(async (tx) => {
          const existing = await tx.idempotencyRecord.findUnique({
            where: {
              scope_keyHash: {
                scope: command.idempotencyScope,
                keyHash: command.idempotencyKeyHash,
              },
            },
          });
          if (existing) {
            if (existing.requestHash !== digest) throw new IdempotencyConflictError();
            const response = existing.response as Record<string, unknown>;
            return {
              id: String(response.id),
              referenceNumber: String(response.referenceNumber),
              status: String(response.status) as CaseStatus,
              priority: String(response.priority) as Priority,
              version: Number(response.version),
              submittedAt: String(response.submittedAt),
              idempotentReplay: true,
            };
          }

          const acceptedAt = new Date(command.submittedAt);
          const sla = complaintSla(effectivePriority, acceptedAt);
          const complaint = await tx.complaint.create({
            data: {
              clientSubmissionId: command.clientSubmissionId,
              referenceNumber: this.referenceNumberFactory?.(),
              categoryCode: command.categoryCode,
              subcategoryCode: command.subcategoryCode,
              priority: effectivePriority,
              status: "Received",
              privacyMode: command.privacyMode,
              reporterType: command.reporterType,
              affectedWorkerType: command.affectedWorkerType,
              gender: command.gender,
              submittedAt: acceptedAt,
              dueAt: sla.nextUpdateDueAt,
              legacyDueAt: new Date(command.dueAt),
              triageDueAt: sla.triageDueAt,
              contactDueAt: sla.contactDueAt,
              nextUpdateDueAt: sla.nextUpdateDueAt,
              createdSource: command.createdSource,
              schemaVersion: command.schemaVersion,
              workerProfileId: command.workerProfileId,
              evidenceStatus:
                command.evidenceStatus ??
                (command.declaredEvidence && command.declaredEvidence.length > 0
                  ? "pending"
                  : "none"),
              incident: {
                create: {
                  whenLabel: command.incident.whenLabel,
                  occurredAt: command.incident.occurredAt
                    ? new Date(command.incident.occurredAt)
                    : undefined,
                  description: command.incident.description,
                  currentDanger: command.incident.currentDanger,
                  immediateDanger: command.incident.immediateDanger,
                  othersAffected: command.incident.othersAffected,
                  structuredAnswers: asJson(command.incident.structuredAnswers),
                  schemaVersion: command.incident.schemaVersion,
                },
              },
              location: {
                create: {
                  province: command.location.province,
                  district: command.location.district,
                  tehsil: command.location.tehsil,
                  villageLabel: command.location.villageLabel,
                  descriptivePlace: command.location.descriptivePlace,
                  source: command.location.source,
                  accuracyMeters: command.location.accuracyMeters,
                  analyticsProvince: command.location.analyticsProvince,
                  analyticsDistrict: command.location.analyticsDistrict,
                  exactCoordinatesCiphertext: asBytes(
                    command.location.exactCoordinates?.ciphertext,
                  ),
                  exactCoordinatesNonce: asBytes(command.location.exactCoordinates?.nonce),
                  exactCoordinatesKeyId: command.location.exactCoordinates?.keyId,
                  exactCoordinatesAlgorithm: command.location.exactCoordinates?.algorithm,
                  exactCoordinatesAuthTag: asBytes(command.location.exactCoordinates?.tag),
                  exactCoordinatesAadContext: command.location.exactCoordinates?.aadContext,
                  cryptoVersion: command.location.exactCoordinates?.cryptoVersion,
                },
              },
              reporter: {
                create: {
                  type: command.reporterType,
                  displayName: command.reporterDisplayName,
                  contactAllowed: command.contactAllowed,
                  contactPreference: command.contactPreference ?? (command.contactAllowed ? "either" : "do-not-initiate"),
                  safeContactWindow: command.safeContactWindow,
                  preferredLanguage: command.preferredLanguage,
                  safeVoicemail: command.safeVoicemail ?? false,
                  representativeContact: command.representativeContact,
                },
              },
              privateIdentity: command.privateIdentity
                ? {
                    create: {
                      kind: command.privateIdentity.kind,
                      ciphertext: Uint8Array.from(command.privateIdentity.ciphertext),
                      nonce: Uint8Array.from(command.privateIdentity.nonce),
                      keyId: command.privateIdentity.keyId,
                      algorithm: command.privateIdentity.algorithm,
                      displaySuffix: command.privateIdentity.displaySuffix,
                    },
                  }
                : undefined,
              privateIdentityFields: command.privateIdentities
                ? {
                    create: command.privateIdentities.map((identity) => ({
                      kind: identity.kind,
                      ciphertext: Uint8Array.from(identity.ciphertext),
                      nonce: Uint8Array.from(identity.nonce),
                      authTag: Uint8Array.from(identity.tag ?? []),
                      aadContext: identity.aadContext ?? "legacy-unavailable",
                      keyId: identity.keyId,
                      algorithm: identity.algorithm,
                      displaySuffix: identity.displaySuffix,
                      cryptoVersion: identity.cryptoVersion ?? 1,
                    })),
                  }
                : undefined,
              workerCredential: command.trackingSecretHash
                ? { create: { secretHash: command.trackingSecretHash } }
                : undefined,
              evidenceDeclarations: command.declaredEvidence
                ? {
                    create: command.declaredEvidence.map((evidence) => ({
                      clientMediaId: evidence.clientMediaId,
                      kind: evidence.kind,
                      displayName: evidence.displayName,
                      declaredMimeType: evidence.declaredMimeType,
                      totalBytes: evidence.totalBytes,
                      capturedAt: evidence.capturedAt ? new Date(evidence.capturedAt) : undefined,
                      recordedAt: evidence.recordedAt ? new Date(evidence.recordedAt) : undefined,
                      durationMs: evidence.durationMs,
                    })),
                  }
                : undefined,
              intakeReceipt:
                command.intakeReceipt && command.clientSubmissionId
                  ? {
                      create: {
                        clientSubmissionId: command.clientSubmissionId,
                        idempotencyKeyHash: command.intakeReceipt.idempotencyKeyHash,
                        requestHash: digest,
                        secretCiphertext: Uint8Array.from(command.intakeReceipt.ciphertext),
                        secretNonce: Uint8Array.from(command.intakeReceipt.nonce),
                        secretAuthTag: Uint8Array.from(command.intakeReceipt.tag ?? []),
                        secretKeyId: command.intakeReceipt.keyId,
                        cryptoVersion: command.intakeReceipt.cryptoVersion ?? 1,
                        acceptedAt: new Date(command.intakeReceipt.acceptedAt),
                        recoveryExpiresAt: new Date(command.intakeReceipt.recoveryExpiresAt),
                      },
                    }
                  : undefined,
            },
          });
          for (const evidence of command.approvedEvidence ?? []) {
            await tx.evidenceAsset.create({
              data: {
                storageId: evidence.storageId,
                complaintId: complaint.id,
                kind: evidence.kind,
                originalName: evidence.originalName,
                storageName: evidence.storageName,
                detectedMimeType: evidence.detectedMimeType,
                byteLength: evidence.byteLength,
                sha256Digest: Uint8Array.from(evidence.sha256Digest),
                uploadState: "complete",
                scanState: "clean",
                availabilityState: "available",
                encryptionKeyId: evidence.encryptionKeyId,
                encryptionAlgorithm: evidence.encryptionAlgorithm,
                capturedAt: evidence.capturedAt ? new Date(evidence.capturedAt) : undefined,
                recordedAt: evidence.recordedAt ? new Date(evidence.recordedAt) : undefined,
                durationMs: evidence.durationMs,
                uploaderActorType: evidence.uploaderActorType,
                uploaderActorId: evidence.uploaderActorId,
              },
            });
          }
          const result = output(complaint);

          await tx.caseHistory.create({
            data: {
              complaintId: complaint.id,
              actionType: "Complaint Received",
              actorType: "worker",
              visibility: "worker-visible",
              requestId: command.requestId,
              toStatus: "Received",
              reasonData: { source: command.createdSource },
              resourceVersion: complaint.version,
            },
          });
          await tx.outboxEvent.create({
            data: {
              complaintId: complaint.id,
              aggregateType: "complaint",
              aggregateId: complaint.id,
              eventType: "complaint.created",
              payload: { complaintId: complaint.id, version: complaint.version },
              dedupeKey: `complaint.created:${complaint.id}:1`,
            },
          });
          if (command.schemaVersion === 3) {
            await tx.outboxEvent.create({
              data: {
                complaintId: complaint.id,
                aggregateType: "complaint",
                aggregateId: complaint.id,
                eventType: "complaint.acknowledged.v3",
                payload: {
                  complaintId: complaint.id,
                  clientSubmissionId: command.clientSubmissionId,
                  referenceNumber: complaint.referenceNumber,
                },
                dedupeKey: `complaint.acknowledged.v3:${complaint.id}`,
              },
            });
          }
          await tx.auditEvent.create({
            data: {
              complaintId: complaint.id,
              actorType: "worker",
              action: "complaint.create",
              targetType: "complaint",
              targetId: complaint.id,
              outcome: "success",
              requestId: command.requestId,
            },
          });
          await tx.idempotencyRecord.create({
            data: {
              scope: command.idempotencyScope,
              keyHash: command.idempotencyKeyHash,
              requestHash: digest,
              resourceType: "complaint",
              resourceId: complaint.id,
              response: { ...result } as Prisma.InputJsonObject,
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
          });
          return result;
        }, createTransactionOptions);
      } catch (error) {
        const constraintTarget = uniqueConstraintTarget(error);
        if (
          constraintTarget.includes("complaints_reference_number_key") ||
          constraintTarget.includes("reference_number") ||
          constraintTarget.includes("referenceNumber")
        ) {
          if (attempt < 4) continue;
        }
        if (
          constraintTarget.includes("idempotency_records_scope_key_hash_key") ||
          constraintTarget.includes("key_hash") ||
          constraintTarget.includes("keyHash")
        ) {
          if (attempt < 4) {
            await waitForRetry(attempt);
            continue;
          }
        }
        if ((isSerializationConflict(error) || prismaErrorCode(error) === "P2034") && attempt < 4) {
          await waitForRetry(attempt);
          continue;
        }
        if (prismaErrorCode(error) === "P2002") {
          throw error;
        }
        throw error;
      }
    }
    throw new Error("Unable to allocate a unique complaint reference.");
  }

  async transition(context: CaseMutationContext, to: CaseStatus): Promise<ComplaintWriteResult> {
    return this.mutate(context, async (tx, current, nextVersion) => {
      assertCaseTransition(current.status as CaseStatus, to);
      assertTransitionReason(to, context.reason as { reason?: unknown } | undefined);
      const changed = await tx.complaint.updateMany({
        where: { id: context.complaintId, version: context.expectedVersion },
        data: { status: to, version: { increment: 1 } },
      });
      if (changed.count !== 1) throw new VersionConflictError(current.version);
      await tx.caseHistory.create({
        data: {
          complaintId: current.id,
          actionType: actionForTransition(to),
          actorType: context.actorType,
          actorId: context.actorId,
          visibility: context.visibility ?? "worker-visible",
          requestId: context.requestId,
          fromStatus: current.status,
          toStatus: to,
          reasonData: asJson(context.reason),
          resourceVersion: nextVersion,
        },
      });
      await this.writeMutationEvents(
        tx,
        context,
        current.id,
        `complaint.${to.toLowerCase().replaceAll(" ", "_")}`,
        nextVersion,
      );
    });
  }

  async changePriority(
    context: CaseMutationContext,
    priority: Priority,
  ): Promise<ComplaintWriteResult> {
    return this.mutate(context, async (tx, current, nextVersion) => {
      const changed = await tx.complaint.updateMany({
        where: { id: context.complaintId, version: context.expectedVersion },
        data: { priority, version: { increment: 1 } },
      });
      if (changed.count !== 1) throw new VersionConflictError(current.version);
      await tx.caseHistory.create({
        data: {
          complaintId: current.id,
          actionType: "Priority Changed",
          actorType: context.actorType,
          actorId: context.actorId,
          visibility: context.visibility ?? "internal",
          requestId: context.requestId,
          fromPriority: current.priority,
          toPriority: priority,
          reasonData: asJson(context.reason),
          resourceVersion: nextVersion,
        },
      });
      await this.writeMutationEvents(
        tx,
        context,
        current.id,
        "complaint.priority_changed",
        nextVersion,
      );
    });
  }

  async resolve(context: CaseMutationContext, summary: string): Promise<ComplaintWriteResult> {
    return this.mutate(context, async (tx, current, nextVersion) => {
      assertCaseTransition(current.status as CaseStatus, "Outcome Verification");
      const changed = await tx.complaint.updateMany({
        where: { id: context.complaintId, version: context.expectedVersion },
        data: { status: "Outcome Verification", version: { increment: 1 } },
      });
      if (changed.count !== 1) throw new VersionConflictError(current.version);
      await tx.resolution.create({
        data: {
          complaintId: current.id,
          summary,
          resolvedAt: new Date(),
          actorType: context.actorType,
          actorId: context.actorId,
          requestId: context.requestId,
        },
      });
      await tx.caseHistory.create({
        data: {
          complaintId: current.id,
          actionType: "Outcome Recorded",
          actorType: context.actorType,
          actorId: context.actorId,
          visibility: "worker-visible",
          requestId: context.requestId,
          fromStatus: current.status,
          toStatus: "Outcome Verification",
          reasonData: asJson(context.reason),
          resourceVersion: nextVersion,
        },
      });
      await this.writeMutationEvents(tx, context, current.id, "complaint.outcome_recorded", nextVersion);
    });
  }

  async recordFeedback(
    context: CaseMutationContext,
    outcome: "satisfied" | "partial" | "unresolved",
    comment?: string,
  ): Promise<ComplaintWriteResult> {
    return this.mutate(context, async (tx, current, nextVersion) => {
      const changed = await tx.complaint.updateMany({
        where: { id: context.complaintId, version: context.expectedVersion },
        data: {
          version: { increment: 1 },
        },
      });
      if (changed.count !== 1) throw new VersionConflictError(current.version);
      await tx.workerFeedback.create({
        data: { complaintId: current.id, outcome, comment, requestId: context.requestId },
      });
      await tx.caseHistory.create({
        data: {
          complaintId: current.id,
          actionType: "Worker Feedback Recorded",
          actorType: context.actorType,
          actorId: context.actorId,
          visibility: "worker-visible",
          requestId: context.requestId,
          reasonData: { outcome },
          resourceVersion: nextVersion,
        },
      });
      await this.writeMutationEvents(
        tx,
        context,
        current.id,
        "complaint.feedback_recorded",
        nextVersion,
      );
    });
  }

  async list(limit: number): Promise<readonly StaffCaseListItem[]> {
    const rows = await this.client.complaint.findMany({
      take: Math.min(Math.max(limit, 1), 100),
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        referenceNumber: true,
        categoryCode: true,
        subcategoryCode: true,
        status: true,
        priority: true,
        privacyMode: true,
        assignedStaffId: true,
        submittedAt: true,
        updatedAt: true,
        dueAt: true,
        version: true,
        evidenceStatus: true,
        location: { select: { province: true, district: true } },
      },
    });
    return rows.map((row) => ({
      id: row.id,
      referenceNumber: row.referenceNumber,
      categoryCode: row.categoryCode as StaffCaseListItem["categoryCode"],
      subcategoryCode: row.subcategoryCode as StaffCaseListItem["subcategoryCode"],
      status: row.status as StaffCaseListItem["status"],
      priority: row.priority as StaffCaseListItem["priority"],
      privacyMode: row.privacyMode as StaffCaseListItem["privacyMode"],
      province: row.location?.province ?? "",
      district: row.location?.district ?? "",
      assignedStaffId: row.assignedStaffId ?? undefined,
      submittedAt: row.submittedAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      dueAt: row.dueAt.toISOString(),
      overdue: isOverdue(row.dueAt, row.status),
      version: row.version,
      evidenceStatus: row.evidenceStatus as StaffCaseListItem["evidenceStatus"],
    }));
  }

  async resolveComplaintId(key: string): Promise<string | null> {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key);
    const row = await this.client.complaint.findFirst({
      where: isUuid
        ? { OR: [{ id: key }, { referenceNumber: key }] }
        : { referenceNumber: key },
      select: { id: true },
    });
    return row?.id ?? null;
  }

  async get(id: string): Promise<StaffCaseDetail | null> {
    const complaintId = await this.resolveComplaintId(id);
    if (!complaintId) return null;
    const row = await this.client.complaint.findUnique({
      where: { id: complaintId },
      include: {
        incident: true,
        location: true,
        reporter: true,
        privateIdentityFields: { select: { kind: true, displaySuffix: true } },
        evidence: {
          where: { availabilityState: "available", retentionState: "active", deletedAt: null },
          orderBy: { receivedAt: "asc" },
        },
        // V3 intake media is finalized into protected object storage and is
        // represented by declarations rather than the legacy EvidenceAsset
        // row. Include it in the same worker-safe projection once scanning is
        // complete so newly submitted complaints are not shown without media.
        evidenceDeclarations: {
          where: { status: "available" },
          select: {
            id: true,
            kind: true,
            displayName: true,
            declaredMimeType: true,
            detectedMimeType: true,
            totalBytes: true,
            capturedAt: true,
            recordedAt: true,
            durationMs: true,
          },
          orderBy: { createdAt: "asc" },
        },
        history: { orderBy: { occurredAt: "asc" } },
        caseEvidenceLinks: {
          select: {
            correctiveActionId: true,
            evidenceId: true,
            evidence: { select: { displayName: true } },
          },
        },
      },
    });
    if (!row || !row.location || !row.incident) return null;
    const correctiveAttachments = new Map<string, { ids: string[]; names: string[] }>();
    for (const link of row.caseEvidenceLinks) {
      if (!link.correctiveActionId) continue;
      const bucket = correctiveAttachments.get(link.correctiveActionId) ?? { ids: [], names: [] };
      bucket.ids.push(link.evidenceId);
      bucket.names.push(link.evidence.displayName);
      correctiveAttachments.set(link.correctiveActionId, bucket);
    }
    return {
      id: row.id,
      referenceNumber: row.referenceNumber,
      categoryCode: row.categoryCode as StaffCaseDetail["categoryCode"],
      subcategoryCode: row.subcategoryCode as StaffCaseDetail["subcategoryCode"],
      status: row.status as StaffCaseDetail["status"],
      priority: row.priority as StaffCaseDetail["priority"],
      privacyMode: row.privacyMode as StaffCaseDetail["privacyMode"],
      province: row.location.province,
      district: row.location.district,
      assignedStaffId: row.assignedStaffId ?? undefined,
      submittedAt: row.submittedAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      dueAt: row.dueAt.toISOString(),
      overdue: isOverdue(row.dueAt, row.status),
      version: row.version,
      evidenceStatus: row.evidenceStatus as StaffCaseDetail["evidenceStatus"],
      reporterType: row.reporterType as StaffCaseDetail["reporterType"],
      affectedWorkerType: row.affectedWorkerType as StaffCaseDetail["affectedWorkerType"],
      gender: row.gender as StaffCaseDetail["gender"],
      whenLabel: row.incident.whenLabel,
      currentDanger: row.incident.currentDanger,
      immediateDanger: row.incident.immediateDanger,
      othersAffected: row.incident.othersAffected as StaffCaseDetail["othersAffected"],
      tehsil: row.location.tehsil ?? undefined,
      villageLabel: row.location.villageLabel ?? undefined,
      descriptivePlace: row.location.descriptivePlace ?? undefined,
      locationSource: row.location.source as StaffCaseDetail["locationSource"],
      locationAccuracyMeters: row.location.accuracyMeters ?? undefined,
      incidentDescription: row.incident.description ?? undefined,
      structuredAnswers: row.incident.structuredAnswers as JsonObject,
      contactAllowed: row.reporter?.contactAllowed ?? false,
      contactPreference: (row.reporter?.contactPreference ?? "do-not-initiate") as StaffCaseDetail["contactPreference"],
      safeContactWindow: row.reporter?.safeContactWindow ?? undefined,
      preferredLanguage: row.reporter?.preferredLanguage as StaffCaseDetail["preferredLanguage"],
      safeVoicemail: row.reporter?.safeVoicemail ?? false,
      representativeContact: row.reporter?.representativeContact ?? undefined,
      reporterDisplayName: row.reporter?.displayName ?? undefined,
      phoneLast4: row.privateIdentityFields.find((field) => field.kind === "phone")?.displaySuffix,
      cnicLast4: row.privateIdentityFields.find((field) => field.kind === "cnic")?.displaySuffix,
      evidence: [
        ...row.evidence.map((item) => ({
          id: item.storageId,
          kind: item.kind as "photo" | "document" | "voice",
          originalName: item.originalName,
          mimeType: item.detectedMimeType,
          byteLength: Number(item.byteLength),
          capturedAt: item.capturedAt?.toISOString(),
          recordedAt: item.recordedAt?.toISOString(),
          durationMs: item.durationMs ?? undefined,
        })),
        ...row.evidenceDeclarations.map((item) => ({
          id: item.id,
          kind: item.kind as "photo" | "document" | "voice",
          originalName: item.displayName,
          mimeType: item.detectedMimeType ?? item.declaredMimeType,
          byteLength: Number(item.totalBytes),
          capturedAt: item.capturedAt?.toISOString(),
          recordedAt: item.recordedAt?.toISOString(),
          durationMs: item.durationMs ?? undefined,
        })),
      ]
        .filter((item) => item.kind !== "voice")
        .map((item) => ({
          id: item.id,
          kind: item.kind as "photo" | "document",
          originalName: item.originalName,
          mimeType: item.mimeType,
          byteLength: item.byteLength,
          capturedAt: item.capturedAt,
        })),
      voice: [
        ...row.evidence.map((item) => ({
          id: item.storageId,
          kind: item.kind as "photo" | "document" | "voice",
          originalName: item.originalName,
          mimeType: item.detectedMimeType,
          byteLength: Number(item.byteLength),
          capturedAt: item.capturedAt?.toISOString(),
          recordedAt: item.recordedAt?.toISOString(),
          durationMs: item.durationMs ?? undefined,
        })),
        ...row.evidenceDeclarations.map((item) => ({
          id: item.id,
          kind: item.kind as "photo" | "document" | "voice",
          originalName: item.displayName,
          mimeType: item.detectedMimeType ?? item.declaredMimeType,
          byteLength: Number(item.totalBytes),
          capturedAt: item.capturedAt?.toISOString(),
          recordedAt: item.recordedAt?.toISOString(),
          durationMs: item.durationMs ?? undefined,
        })),
      ].find((item) => item.kind === "voice")
        ? (() => {
            const item = [
              ...row.evidence.map((candidate) => ({
                id: candidate.storageId,
                kind: candidate.kind as "photo" | "document" | "voice",
                originalName: candidate.originalName,
                mimeType: candidate.detectedMimeType,
                byteLength: Number(candidate.byteLength),
                capturedAt: candidate.capturedAt?.toISOString(),
                recordedAt: candidate.recordedAt?.toISOString(),
                durationMs: candidate.durationMs ?? undefined,
              })),
              ...row.evidenceDeclarations.map((candidate) => ({
                id: candidate.id,
                kind: candidate.kind as "photo" | "document" | "voice",
                originalName: candidate.displayName,
                mimeType: candidate.detectedMimeType ?? candidate.declaredMimeType,
                byteLength: Number(candidate.totalBytes),
                capturedAt: candidate.capturedAt?.toISOString(),
                recordedAt: candidate.recordedAt?.toISOString(),
                durationMs: candidate.durationMs ?? undefined,
              })),
            ].find((candidate) => candidate.kind === "voice")!;
            return {
              id: item.id,
              originalName: item.originalName,
              mimeType: item.mimeType,
              byteLength: item.byteLength,
              durationMs: item.durationMs ?? 0,
              recordedAt: item.recordedAt ?? item.capturedAt ?? row.submittedAt.toISOString(),
            };
          })()
        : undefined,
      actions: row.history.map((event) => {
        let reason = (event.reasonData as JsonObject | null) ?? undefined;
        if (event.actionType === "Action Taken" && reason) {
          const actionId = typeof reason.actionId === "string" ? reason.actionId : undefined;
          const linked = actionId ? correctiveAttachments.get(actionId) : undefined;
          if (linked && linked.names.length > 0) {
            reason = {
              ...reason,
              attachedDocuments: linked.names,
              attachedEvidenceIds: linked.ids,
            };
          }
        }
        return {
          id: event.id,
          type: event.actionType as StaffCaseDetail["actions"][number]["type"],
          at: event.occurredAt.toISOString(),
          actorType: event.actorType as StaffCaseDetail["actions"][number]["actorType"],
          visibility: event.visibility as StaffCaseDetail["actions"][number]["visibility"],
          note: actionDetailFromReason(reason),
          reason,
        };
      }),
    };
  }

  async getByReference(referenceNumber: string): Promise<WorkerComplaintDetail | null> {
    const row = await this.client.complaint.findUnique({
      where: { referenceNumber },
      include: {
        incident: true,
        location: {
          select: { province: true, district: true, villageLabel: true },
        },
        evidence: {
          where: { availabilityState: "available", retentionState: "active", deletedAt: null },
          select: {
            storageId: true,
            kind: true,
            originalName: true,
            detectedMimeType: true,
            byteLength: true,
            capturedAt: true,
            recordedAt: true,
            durationMs: true,
          },
          orderBy: { receivedAt: "asc" },
        },
        evidenceDeclarations: {
          where: { status: "available" },
          select: {
            id: true,
            kind: true,
            displayName: true,
            declaredMimeType: true,
            detectedMimeType: true,
            scanEngine: true,
            totalBytes: true,
            capturedAt: true,
            recordedAt: true,
            durationMs: true,
          },
          orderBy: { createdAt: "asc" },
        },
        feedback: { orderBy: { submittedAt: "desc" }, take: 1 },
        history: { where: { visibility: "worker-visible" }, orderBy: { occurredAt: "asc" } },
        resolutions: {
          where: { resolvedAt: { not: null } },
          orderBy: { resolvedAt: "desc" },
          take: 1,
        },
        caseOutcomes: { orderBy: { recordedAt: "desc" }, take: 1 },
      },
    });
    if (!row || !row.incident || !row.location) return null;
    const media = workerComplaintMedia(row.evidence, row.evidenceDeclarations, row.submittedAt);
    return {
      referenceNumber: row.referenceNumber,
      status: row.status as WorkerComplaintDetail["status"],
      categoryCode: row.categoryCode as WorkerComplaintDetail["categoryCode"],
      priority: row.priority as WorkerComplaintDetail["priority"],
      submittedAt: row.submittedAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      dueAt: row.dueAt.toISOString(),
      overdue: isOverdue(row.dueAt, row.status),
      version: row.version,
      privacyMode: row.privacyMode as WorkerComplaintDetail["privacyMode"],
      location: {
        province: row.location.province,
        district: row.location.district,
        villageLabel: row.location.villageLabel ?? undefined,
      },
      incident: {
        whenLabel: row.incident.whenLabel,
        description: row.incident.description ?? undefined,
        currentDanger: row.incident.currentDanger,
        immediateDanger: row.incident.immediateDanger,
        othersAffected: row.incident
          .othersAffected as WorkerComplaintDetail["incident"]["othersAffected"],
        structuredAnswers: row.incident.structuredAnswers as JsonObject,
      },
      evidence: media.evidence,
      voice: media.voice,
      resolutionSummary: row.caseOutcomes[0]?.workerVisibleSummary ?? row.resolutions[0]?.summary,
      feedbackOutcome: row.feedback[0]?.outcome as WorkerComplaintDetail["feedbackOutcome"],
      actions: row.history
        .filter((event) => event.visibility === "worker-visible")
        .map((event) => {
          const reason = (event.reasonData as JsonObject | null) ?? undefined;
          return {
            id: event.id,
            type: event.actionType as WorkerComplaintDetail["actions"][number]["type"],
            at: event.occurredAt.toISOString(),
            note: actionDetailFromReason(reason),
            reason,
          };
        }),
    };
  }

  async getReporter(complaintId: string): Promise<SensitiveReporterDetail | null> {
    const row = await this.client.privateReporterIdentity.findUnique({
      where: { complaintId },
      include: { complaint: { select: { privacyMode: true } } },
    });
    if (!row) return null;
    if (row.complaint.privacyMode === "ANON") {
      throw new PrivacyInvariantError("Anonymous complaint unexpectedly has private identity.");
    }
    return {
      complaintId,
      privacyMode: row.complaint.privacyMode as SensitiveReporterDetail["privacyMode"],
      kind: row.kind as SensitiveReporterDetail["kind"],
      displaySuffix: row.displaySuffix,
      encryptedValue: {
        ciphertext: row.ciphertext,
        nonce: row.nonce,
        keyId: row.keyId,
        algorithm: row.algorithm as "AES-256-GCM",
      },
    };
  }

  async listFacts(limit: number): Promise<readonly AnalyticsComplaintFact[]> {
    const rows = await this.client.complaint.findMany({
      take: Math.min(Math.max(limit, 1), 1_000),
      orderBy: { submittedAt: "desc" },
      select: {
        categoryCode: true,
        subcategoryCode: true,
        status: true,
        priority: true,
        privacyMode: true,
        submittedAt: true,
        location: { select: { analyticsProvince: true, analyticsDistrict: true } },
        resolutions: {
          where: { resolvedAt: { not: null } },
          orderBy: { resolvedAt: "desc" },
          take: 1,
          select: { resolvedAt: true },
        },
      },
    });
    return rows.map((row) => ({
      categoryCode: row.categoryCode as AnalyticsComplaintFact["categoryCode"],
      subcategoryCode: row.subcategoryCode as AnalyticsComplaintFact["subcategoryCode"],
      status: row.status as AnalyticsComplaintFact["status"],
      priority: row.priority as AnalyticsComplaintFact["priority"],
      privacyMode: row.privacyMode as AnalyticsComplaintFact["privacyMode"],
      analyticsProvince: row.location?.analyticsProvince ?? "",
      analyticsDistrict: row.location?.analyticsDistrict ?? "",
      submittedAt: row.submittedAt.toISOString(),
      resolvedAt: row.resolutions[0]?.resolvedAt?.toISOString(),
    }));
  }

  private async mutate(
    context: CaseMutationContext,
    operation: (
      tx: Prisma.TransactionClient,
      current: {
        id: string;
        referenceNumber: string;
        status: string;
        priority: string;
        version: number;
        submittedAt: Date;
      },
      nextVersion: number,
    ) => Promise<void>,
  ): Promise<ComplaintWriteResult> {
    return this.client.$transaction(async (tx) => {
      const current = await tx.complaint.findUnique({
        where: { id: context.complaintId },
        select: {
          id: true,
          referenceNumber: true,
          status: true,
          priority: true,
          version: true,
          submittedAt: true,
        },
      });
      if (!current) throw new Error("Complaint not found.");
      if (current.version !== context.expectedVersion)
        throw new VersionConflictError(current.version);
      await operation(tx, current, current.version + 1);
      const updated = await tx.complaint.findUniqueOrThrow({ where: { id: current.id } });
      return output(updated);
    }, transactionOptions);
  }

  private async writeMutationEvents(
    tx: Prisma.TransactionClient,
    context: CaseMutationContext,
    complaintId: string,
    eventType: string,
    version: number,
  ): Promise<void> {
    await tx.outboxEvent.create({
      data: {
        complaintId,
        aggregateType: "complaint",
        aggregateId: complaintId,
        eventType,
        payload: { complaintId, version },
        dedupeKey: `${eventType}:${complaintId}:${version}`,
      },
    });
    await tx.auditEvent.create({
      data: {
        complaintId,
        actorType: context.actorType,
        actorId: context.actorId,
        action: eventType,
        targetType: "complaint",
        targetId: complaintId,
        outcome: "success",
        requestId: context.requestId,
      },
    });
  }
}

// Explicit adapter prevents ordinary staff/query code from acquiring the private repository by accident.
export class PostgresSensitiveReporterRepository implements SensitiveReporterRepository {
  constructor(private readonly repository: PostgresComplaintRepository) {}

  get(complaintId: string): Promise<SensitiveReporterDetail | null> {
    return this.repository.getReporter(complaintId);
  }
}

export class PostgresEvidenceMetadataRepository implements EvidenceMetadataRepository {
  constructor(private readonly client: DatabaseClient) {}

  async attachApproved(
    context: CaseMutationContext,
    evidence: ApprovedEvidenceMetadata,
  ): Promise<ComplaintWriteResult> {
    return this.client.$transaction(async (tx) => {
      const current = await tx.complaint.findUnique({ where: { id: context.complaintId } });
      if (!current) throw new Error("Complaint not found.");
      if (current.version !== context.expectedVersion)
        throw new VersionConflictError(current.version);
      const nextVersion = current.version + 1;
      const changed = await tx.complaint.updateMany({
        where: { id: current.id, version: current.version },
        data: { version: { increment: 1 } },
      });
      if (changed.count !== 1) throw new VersionConflictError(current.version);
      await tx.evidenceAsset.create({
        data: {
          storageId: evidence.storageId,
          complaintId: current.id,
          kind: evidence.kind,
          originalName: evidence.originalName,
          storageName: evidence.storageName,
          detectedMimeType: evidence.detectedMimeType,
          byteLength: evidence.byteLength,
          sha256Digest: Uint8Array.from(evidence.sha256Digest),
          uploadState: "complete",
          scanState: "clean",
          availabilityState: "available",
          encryptionKeyId: evidence.encryptionKeyId,
          encryptionAlgorithm: evidence.encryptionAlgorithm,
          capturedAt: evidence.capturedAt ? new Date(evidence.capturedAt) : undefined,
          uploaderActorType: evidence.uploaderActorType,
          uploaderActorId: evidence.uploaderActorId,
        },
      });
      await tx.caseHistory.create({
        data: {
          complaintId: current.id,
          actionType: "Evidence Added",
          actorType: context.actorType,
          actorId: context.actorId,
          visibility: context.visibility ?? "internal",
          requestId: context.requestId,
          resourceVersion: nextVersion,
        },
      });
      await tx.outboxEvent.create({
        data: {
          complaintId: current.id,
          aggregateType: "complaint",
          aggregateId: current.id,
          eventType: "evidence.attached",
          payload: {
            complaintId: current.id,
            evidenceStorageId: evidence.storageId,
            version: nextVersion,
          },
          dedupeKey: `evidence.attached:${evidence.storageId}`,
        },
      });
      await tx.auditEvent.create({
        data: {
          complaintId: current.id,
          actorType: context.actorType,
          actorId: context.actorId,
          action: "evidence.attach",
          targetType: "complaint",
          targetId: current.id,
          outcome: "success",
          requestId: context.requestId,
        },
      });
      return output(await tx.complaint.findUniqueOrThrow({ where: { id: current.id } }));
    }, transactionOptions);
  }
}

export class PostgresCaseHistoryRepository implements CaseHistoryRepository {
  constructor(private readonly client: DatabaseClient) {}

  async listForComplaint(complaintId: string): Promise<readonly CaseHistoryRecord[]> {
    const rows = await this.client.caseHistory.findMany({
      where: { complaintId },
      orderBy: { occurredAt: "asc" },
    });
    return rows.map((row) => ({
      id: row.id,
      complaintId: row.complaintId,
      actionType: row.actionType as CaseHistoryRecord["actionType"],
      actorType: row.actorType as CaseHistoryRecord["actorType"],
      actorId: row.actorId ?? undefined,
      occurredAt: row.occurredAt.toISOString(),
      visibility: row.visibility as CaseHistoryRecord["visibility"],
      requestId: row.requestId,
      reason: (row.reasonData as JsonObject | null) ?? undefined,
      resourceVersion: row.resourceVersion,
    }));
  }
}

export class PostgresAuditEventRepository implements AuditEventRepository {
  constructor(private readonly client: DatabaseClient) {}

  async append(event: AuditEventInput): Promise<string> {
    const created = await this.client.auditEvent.create({
      data: {
        complaintId: event.complaintId,
        actorType: event.actorType,
        actorId: event.actorId,
        action: event.action,
        targetType: event.targetType,
        targetId: event.targetId,
        outcome: event.outcome,
        purpose: event.purpose,
        requestId: event.requestId,
        metadata: asJson(event.metadata),
      },
    });
    return created.id;
  }
}

export class PostgresOutboxEventRepository implements OutboxEventRepository {
  constructor(private readonly client: DatabaseClient) {}

  async listPending(limit: number): Promise<readonly PendingOutboxEvent[]> {
    const rows = await this.client.outboxEvent.findMany({
      where: { status: "pending", availableAt: { lte: new Date() } },
      orderBy: { availableAt: "asc" },
      take: Math.min(Math.max(limit, 1), 100),
    });
    return rows.map((row) => ({
      id: row.id,
      aggregateType: row.aggregateType,
      aggregateId: row.aggregateId,
      eventType: row.eventType,
      payload: row.payload as JsonObject,
      attemptCount: row.attemptCount,
    }));
  }

  async markDelivered(id: string): Promise<void> {
    await this.client.outboxEvent.update({
      where: { id },
      data: {
        status: "delivered",
        deliveredAt: new Date(),
        lastAttemptAt: new Date(),
        attemptCount: { increment: 1 },
      },
    });
  }

  async markFailed(id: string, safeErrorCode: string, final: boolean): Promise<void> {
    await this.client.outboxEvent.update({
      where: { id },
      data: {
        status: final ? "dead-letter" : "pending",
        lastAttemptAt: new Date(),
        lastErrorCode: safeErrorCode,
        attemptCount: { increment: 1 },
      },
    });
  }
}

const SESSION_IDLE_MS = 30 * 60 * 1_000;
const SESSION_ABSOLUTE_MS = 8 * 60 * 60 * 1_000;
const WORKER_SESSION_MS = 15 * 60 * 1_000;

export class PostgresIdentityAccessRepository implements IdentityAccessRepository {
  constructor(
    private readonly client: DatabaseClient,
    private readonly tokenPepper: string,
  ) {}

  async authenticateStaff(
    loginIdentifier: string,
    password: string,
  ): Promise<AuthenticatedStaff | null> {
    const normalized = loginIdentifier.trim().normalize("NFKC").toLowerCase();
    const loginHash = hashOpaqueToken(normalized, this.tokenPepper);
    const lockoutSince = new Date(Date.now() - 15 * 60 * 1_000);
    const recentFailures = await this.client.loginAttempt.count({
      where: { loginHash, outcome: "failure", occurredAt: { gte: lockoutSince } },
    });
    const user = await this.client.user.findUnique({
      where: { loginIdentifier: normalized },
      include: {
        passwordCredential: true,
        roles: {
          include: { role: { include: { permissions: { include: { permission: true } } } } },
        },
      },
    });
    const valid =
      recentFailures < 5 && user?.passwordCredential
        ? await verifyPassword(password, user.passwordCredential.passwordHash)
        : false;
    await this.client.loginAttempt.create({
      data: {
        userId: user?.id,
        loginHash,
        outcome: valid && user?.status === "active" ? "success" : "failure",
      },
    });
    if (!user || user.status !== "active" || !valid) return null;
    const roles = user.roles.map(({ role }) => role.code as AuthenticatedStaff["roles"][number]);
    const permissions = user.roles.flatMap(({ role }) =>
      role.permissions.map(
        ({ permission }) => permission.code as AuthenticatedStaff["permissions"][number],
      ),
    );
    return {
      userId: user.id,
      displayName: user.displayName,
      roles,
      permissions: [...new Set(permissions)],
      assurance: "password",
      sessionId: "",
    };
  }

  async createStaffSession(
    userId: string,
    assurance: AuthenticatedStaff["assurance"],
    tokenHash: string,
  ) {
    const now = Date.now();
    const session = await this.client.session.create({
      data: {
        userId,
        tokenHash,
        assurance,
        idleExpiresAt: new Date(now + SESSION_IDLE_MS),
        absoluteExpiresAt: new Date(now + SESSION_ABSOLUTE_MS),
      },
    });
    return { sessionId: session.id, expiresAt: session.absoluteExpiresAt.toISOString() };
  }

  async resolveStaffSession(tokenHash: string): Promise<AuthenticatedStaff | null> {
    const session = await this.client.session.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            roles: {
              include: { role: { include: { permissions: { include: { permission: true } } } } },
            },
          },
        },
      },
    });
    if (
      !session ||
      session.revokedAt ||
      session.idleExpiresAt < new Date() ||
      session.absoluteExpiresAt < new Date() ||
      session.user.status !== "active"
    )
      return null;
    await this.client.session.update({
      where: { id: session.id },
      data: { lastSeenAt: new Date(), idleExpiresAt: new Date(Date.now() + SESSION_IDLE_MS) },
    });
    const roles = session.user.roles.map(
      ({ role }) => role.code as AuthenticatedStaff["roles"][number],
    );
    const permissions = [
      ...new Set(
        session.user.roles.flatMap(({ role }) =>
          role.permissions.map(
            ({ permission }) => permission.code as AuthenticatedStaff["permissions"][number],
          ),
        ),
      ),
    ];
    return {
      userId: session.user.id,
      displayName: session.user.displayName,
      roles,
      permissions,
      assurance: session.assurance as AuthenticatedStaff["assurance"],
      sessionId: session.id,
    };
  }

  async revokeSession(tokenHash: string, reason: string): Promise<void> {
    await this.client.session.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date(), revokeReason: reason },
    });
  }

  async authenticateWorker(
    referenceNumber: string,
    secret: string,
    tokenHash: string,
  ): Promise<WorkerTrackingSession | null> {
    const credential = await this.client.workerCredential.findFirst({
      where: { complaint: { referenceNumber } },
      include: { complaint: true },
    });
    const valid = credential ? await verifyPassword(secret, credential.secretHash) : false;
    if (!credential || credential.revokedAt || !valid) return null;
    const session = await this.client.workerSession.create({
      data: {
        complaintId: credential.complaintId,
        tokenHash,
        expiresAt: new Date(Date.now() + WORKER_SESSION_MS),
      },
    });
    return {
      sessionId: session.id,
      complaintId: credential.complaintId,
      referenceNumber: credential.complaint.referenceNumber,
      expiresAt: session.expiresAt.toISOString(),
    };
  }

  async revokeWorkerSession(tokenHash: string): Promise<void> {
    await this.client.workerSession.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async resolveWorkerSession(tokenHash: string): Promise<WorkerTrackingSession | null> {
    const session = await this.client.workerSession.findUnique({
      where: { tokenHash },
      include: { complaint: true },
    });
    if (!session || session.revokedAt || session.expiresAt < new Date()) return null;
    return {
      sessionId: session.id,
      complaintId: session.complaintId,
      referenceNumber: session.complaint.referenceNumber,
      expiresAt: session.expiresAt.toISOString(),
    };
  }

  async verifyMfa(userId: string, code: string): Promise<boolean> {
    const factor = await this.client.mfaFactor.findFirst({
      where: { userId, type: "totp", status: { in: ["pending", "active"] } },
    });
    if (!factor) return false;
    const key = deriveKey(this.tokenPepper, "mfa");
    const secret = decryptEnvelope(
      {
        ciphertext: factor.secretCipher,
        nonce: factor.nonce,
        tag: factor.authTag,
        keyId: factor.keyId,
        algorithm: "AES-256-GCM",
      },
      key,
      `mfa:${userId}`,
    );
    const step = BigInt(Math.floor(Date.now() / 30_000));
    if (factor.lastUsedStep === step) return false;
    const valid = verifyTotp(Buffer.from(secret).toString("utf8"), code);
    if (!valid) return false;
    const consumed = await this.client.mfaFactor.updateMany({
      where: { id: factor.id, OR: [{ lastUsedStep: null }, { lastUsedStep: { not: step } }] },
      data: { lastUsedAt: new Date(), lastUsedStep: step, status: "active" },
    });
    return consumed.count === 1;
  }

  async markSessionMfa(tokenHash: string): Promise<void> {
    await this.client.session.updateMany({
      where: { tokenHash, revokedAt: null },
      data: {
        assurance: "mfa",
        lastSeenAt: new Date(),
        idleExpiresAt: new Date(Date.now() + SESSION_IDLE_MS),
      },
    });
  }

  async enrollTotp(userId: string, encryptedSecret: EncryptedSecretInput): Promise<string> {
    const factor = await this.client.mfaFactor.create({
      data: {
        userId,
        type: "totp",
        secretCipher: Uint8Array.from(encryptedSecret.ciphertext),
        nonce: Uint8Array.from(encryptedSecret.nonce),
        authTag: Uint8Array.from(encryptedSecret.tag),
        keyId: encryptedSecret.keyId,
        status: "pending",
      },
    });
    return factor.id;
  }

  async consumeRecoveryCode(userId: string, code: string): Promise<boolean> {
    const candidates = await this.client.recoveryCode.findMany({ where: { userId, usedAt: null } });
    for (const candidate of candidates) {
      if (await verifyPassword(code, candidate.codeHash)) {
        const consumed = await this.client.recoveryCode.updateMany({
          where: { id: candidate.id, usedAt: null },
          data: { usedAt: new Date() },
        });
        if (consumed.count === 1) return true;
      }
    }
    return false;
  }

  async reauthenticate(tokenHash: string, password: string): Promise<boolean> {
    const session = await this.client.session.findUnique({
      where: { tokenHash },
      include: { user: { include: { passwordCredential: true } } },
    });
    if (
      !session ||
      session.revokedAt ||
      session.absoluteExpiresAt < new Date() ||
      !session.user.passwordCredential
    )
      return false;
    const valid = await verifyPassword(password, session.user.passwordCredential.passwordHash);
    if (valid)
      await this.client.session.update({
        where: { id: session.id },
        data: {
          assurance: "reauthenticated",
          lastSeenAt: new Date(),
          idleExpiresAt: new Date(Date.now() + SESSION_IDLE_MS),
        },
      });
    return valid;
  }

  async rotateRecoveryCodes(userId: string): Promise<readonly string[]> {
    const codes = Array.from({ length: 10 }, () => generateOpaqueToken(9));
    await this.client.$transaction(async (tx) => {
      await tx.recoveryCode.updateMany({
        where: { userId, usedAt: null },
        data: { usedAt: new Date() },
      });
      for (const code of codes) {
        await tx.recoveryCode.create({ data: { userId, codeHash: await hashPassword(code) } });
      }
    });
    return codes;
  }
}
