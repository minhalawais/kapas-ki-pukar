import type { GeoCoordinates } from "./complaint";
import type { Priority } from "./priority";
import type { PrivacyMode } from "./privacy";
import type { ActorType, CaseActionType, CaseActionVisibility, CaseStatus } from "./status";
import type {
  EmploymentType,
  Gender,
  GroupImpact,
  ReporterType,
  SubcategoryCode,
  WorkerCategoryCode,
} from "./taxonomy";

export type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

export interface CreateComplaintCommand {
  /** Canonical hash of the validated public payload, before randomized encryption. */
  readonly canonicalRequestHash?: string;
  readonly clientSubmissionId?: string;
  readonly evidenceStatus?: "none" | "pending" | "processing" | "complete" | "action_required";
  readonly categoryCode: WorkerCategoryCode;
  readonly subcategoryCode?: SubcategoryCode;
  readonly priority: Priority;
  readonly privacyMode: PrivacyMode;
  readonly reporterType: ReporterType;
  readonly reporterDisplayName?: string;
  readonly contactAllowed: boolean;
  readonly contactPreference?: "call" | "message" | "either" | "representative" | "do-not-initiate";
  readonly safeContactWindow?: string;
  readonly preferredLanguage?: "ur" | "en";
  readonly safeVoicemail?: boolean;
  readonly representativeContact?: string;
  readonly affectedWorkerType?: EmploymentType;
  readonly gender?: Gender;
  readonly submittedAt: string;
  readonly dueAt: string;
  readonly createdSource: "mobile" | "staff" | "system";
  readonly schemaVersion: number;
  readonly incident: {
    readonly whenLabel: string;
    readonly occurredAt?: string;
    readonly description?: string;
    readonly currentDanger: boolean;
    readonly immediateDanger: boolean;
    readonly othersAffected: GroupImpact;
    readonly structuredAnswers: JsonObject;
    readonly schemaVersion: number;
  };
  readonly location: {
    readonly province: string;
    readonly district: string;
    readonly tehsil?: string;
    readonly villageLabel?: string;
    readonly descriptivePlace?: string;
    readonly source: "device" | "manual";
    readonly accuracyMeters?: number;
    readonly analyticsProvince: string;
    readonly analyticsDistrict: string;
    readonly exactCoordinates?: EncryptedValue;
  };
  readonly privateIdentity?: PrivateIdentityInput;
  readonly privateIdentities?: readonly PrivateIdentityInput[];
  readonly workerProfileId?: string;
  readonly requestId: string;
  readonly idempotencyKeyHash: string;
  readonly idempotencyScope: string;
  readonly approvedEvidence?: readonly ApprovedEvidenceMetadata[];
  readonly declaredEvidence?: readonly DeclaredEvidenceMetadata[];
  readonly intakeReceipt?: IntakeReceiptMetadata;
  readonly trackingSecretHash?: string;
}

export interface EncryptedValue {
  readonly ciphertext: Uint8Array;
  readonly nonce: Uint8Array;
  readonly keyId: string;
  readonly algorithm: "AES-256-GCM";
  readonly tag?: Uint8Array;
  readonly aadContext?: string;
  readonly cryptoVersion?: number;
}

export interface DeclaredEvidenceMetadata {
  readonly clientMediaId: string;
  readonly kind: "voice" | "photo" | "document";
  readonly displayName: string;
  readonly declaredMimeType: string;
  readonly totalBytes: bigint;
  readonly capturedAt?: string;
  readonly recordedAt?: string;
  readonly durationMs?: number;
}

export interface IntakeReceiptMetadata extends EncryptedValue {
  readonly idempotencyKeyHash: string;
  readonly acceptedAt: string;
  readonly recoveryExpiresAt: string;
}

export interface PrivateIdentityInput extends EncryptedValue {
  readonly kind: "cnic" | "phone";
  readonly displaySuffix: string;
}

export interface ComplaintWriteResult {
  readonly id: string;
  readonly referenceNumber: string;
  readonly status: CaseStatus;
  readonly priority: Priority;
  readonly version: number;
  readonly submittedAt: string;
  readonly idempotentReplay?: boolean;
}

export interface CaseMutationContext {
  readonly complaintId: string;
  readonly expectedVersion: number;
  readonly actorType: ActorType;
  readonly actorId?: string;
  readonly requestId: string;
  readonly reason?: JsonObject;
  readonly visibility?: CaseActionVisibility;
}

export interface WorkerComplaintSummary {
  readonly referenceNumber: string;
  readonly status: CaseStatus;
  readonly categoryCode: WorkerCategoryCode;
  readonly priority: Priority;
  readonly submittedAt: string;
  readonly updatedAt: string;
  readonly dueAt: string;
  readonly overdue: boolean;
  readonly version: number;
}

export interface WorkerVisibleAction {
  readonly id: string;
  readonly type: CaseActionType;
  readonly at: string;
  readonly note?: string;
  readonly reason?: JsonObject;
}

export interface WorkerComplaintDetail extends WorkerComplaintSummary {
  readonly privacyMode: PrivacyMode;
  readonly location: {
    readonly province: string;
    readonly district: string;
    readonly villageLabel?: string;
  };
  readonly incident: {
    readonly whenLabel: string;
    readonly description?: string;
    readonly currentDanger: boolean;
    readonly immediateDanger: boolean;
    readonly othersAffected: GroupImpact;
    readonly structuredAnswers: JsonObject;
  };
  readonly evidence: readonly {
    readonly id: string;
    readonly kind: "photo" | "document";
    readonly originalName: string;
    readonly mimeType: string;
    readonly byteLength: number;
    readonly capturedAt?: string;
    readonly source: "worker" | "office";
  }[];
  readonly voice?: {
    readonly id: string;
    readonly originalName: string;
    readonly mimeType: string;
    readonly byteLength: number;
    readonly durationMs: number;
    readonly recordedAt: string;
  };
  readonly resolutionSummary?: string;
  readonly feedbackOutcome?: "satisfied" | "partial" | "unresolved";
  readonly actions: readonly WorkerVisibleAction[];
}

export interface StaffCaseListItem {
  readonly id: string;
  readonly referenceNumber: string;
  readonly categoryCode: WorkerCategoryCode;
  readonly subcategoryCode?: SubcategoryCode;
  readonly status: CaseStatus;
  readonly priority: Priority;
  readonly privacyMode: PrivacyMode;
  readonly province: string;
  readonly district: string;
  readonly assignedStaffId?: string;
  readonly submittedAt: string;
  readonly updatedAt: string;
  readonly dueAt: string;
  readonly overdue: boolean;
  readonly version: number;
  readonly evidenceStatus: "none" | "pending" | "processing" | "complete" | "action_required";
}

export interface StaffCaseDetail extends StaffCaseListItem {
  readonly reporterType: ReporterType;
  readonly affectedWorkerType?: EmploymentType;
  readonly gender?: Gender;
  readonly whenLabel: string;
  readonly currentDanger: boolean;
  readonly immediateDanger: boolean;
  readonly othersAffected: GroupImpact;
  readonly tehsil?: string;
  readonly villageLabel?: string;
  readonly descriptivePlace?: string;
  readonly locationSource?: "device" | "manual";
  readonly locationAccuracyMeters?: number;
  readonly exactCoordinates?: GeoCoordinates | null;
  readonly incidentDescription?: string;
  readonly structuredAnswers: JsonObject;
  readonly contactAllowed: boolean;
  readonly contactPreference: "call" | "message" | "either" | "representative" | "do-not-initiate";
  readonly safeContactWindow?: string;
  readonly preferredLanguage?: "ur" | "en";
  readonly safeVoicemail: boolean;
  readonly representativeContact?: string;
  readonly reporterDisplayName?: string;
  readonly phoneLast4?: string;
  readonly cnicLast4?: string;
  readonly evidence: readonly {
    readonly id: string;
    readonly kind: "photo" | "document";
    readonly originalName: string;
    readonly mimeType: string;
    readonly byteLength: number;
    readonly capturedAt?: string;
  }[];
  readonly voice?: {
    readonly id: string;
    readonly originalName: string;
    readonly mimeType: string;
    readonly byteLength: number;
    readonly durationMs: number;
    readonly recordedAt: string;
  };
  readonly actions: readonly {
    readonly id: string;
    readonly type: CaseActionType;
    readonly at: string;
    readonly actorType: ActorType;
    readonly visibility: CaseActionVisibility;
    readonly note?: string;
    readonly reason?: JsonObject;
  }[];
}

export interface SensitiveReporterDetail {
  readonly complaintId: string;
  readonly privacyMode: Exclude<PrivacyMode, "ANON">;
  readonly kind: "cnic" | "phone";
  readonly displaySuffix: string;
  readonly encryptedValue: EncryptedValue;
}

export interface AnalyticsComplaintFact {
  readonly categoryCode: WorkerCategoryCode;
  readonly subcategoryCode?: SubcategoryCode;
  readonly status: CaseStatus;
  readonly priority: Priority;
  readonly privacyMode: PrivacyMode;
  readonly analyticsProvince: string;
  readonly analyticsDistrict: string;
  readonly submittedAt: string;
  readonly resolvedAt?: string;
}

export interface ComplaintCommandRepository {
  create(command: CreateComplaintCommand): Promise<ComplaintWriteResult>;
  transition(context: CaseMutationContext, to: CaseStatus): Promise<ComplaintWriteResult>;
  changePriority(context: CaseMutationContext, priority: Priority): Promise<ComplaintWriteResult>;
  resolve(context: CaseMutationContext, summary: string): Promise<ComplaintWriteResult>;
  recordFeedback(
    context: CaseMutationContext,
    outcome: "satisfied" | "partial" | "unresolved",
    comment?: string,
  ): Promise<ComplaintWriteResult>;
}

export interface StaffCaseQueryRepository {
  list(limit: number): Promise<readonly StaffCaseListItem[]>;
  get(id: string): Promise<StaffCaseDetail | null>;
}

export interface WorkerTrackingQueryRepository {
  getByReference(referenceNumber: string): Promise<WorkerComplaintDetail | null>;
}

export interface SensitiveReporterRepository {
  get(complaintId: string): Promise<SensitiveReporterDetail | null>;
}

export interface AnalyticsReadRepository {
  listFacts(limit: number): Promise<readonly AnalyticsComplaintFact[]>;
}

export interface ApprovedEvidenceMetadata {
  readonly storageId: string;
  readonly kind: "voice" | "photo" | "document";
  readonly originalName: string;
  readonly storageName: string;
  readonly detectedMimeType: string;
  readonly byteLength: bigint;
  readonly sha256Digest: Uint8Array;
  readonly encryptionKeyId: string;
  readonly encryptionAlgorithm: "AES-256-GCM";
  readonly capturedAt?: string;
  readonly recordedAt?: string;
  readonly durationMs?: number;
  readonly uploaderActorType: ActorType;
  readonly uploaderActorId?: string;
}

export interface EvidenceMetadataRepository {
  attachApproved(
    context: CaseMutationContext,
    evidence: ApprovedEvidenceMetadata,
  ): Promise<ComplaintWriteResult>;
}

export interface CaseHistoryRecord {
  readonly id: string;
  readonly complaintId: string;
  readonly actionType: CaseActionType;
  readonly actorType: ActorType;
  readonly actorId?: string;
  readonly occurredAt: string;
  readonly visibility: CaseActionVisibility;
  readonly requestId: string;
  readonly reason?: JsonObject;
  readonly resourceVersion: number;
}

export interface CaseHistoryRepository {
  listForComplaint(complaintId: string): Promise<readonly CaseHistoryRecord[]>;
}

export interface AuditEventInput {
  readonly complaintId?: string;
  readonly actorType: ActorType;
  readonly actorId?: string;
  readonly action: string;
  readonly targetType: string;
  readonly targetId: string;
  readonly outcome: "success" | "failure" | "denied";
  readonly purpose?: string;
  readonly requestId: string;
  readonly metadata?: JsonObject;
}

export interface AuditEventRepository {
  append(event: AuditEventInput): Promise<string>;
}

export interface PendingOutboxEvent {
  readonly id: string;
  readonly aggregateType: string;
  readonly aggregateId: string;
  readonly eventType: string;
  readonly payload: JsonObject;
  readonly attemptCount: number;
}

export interface OutboxEventRepository {
  listPending(limit: number): Promise<readonly PendingOutboxEvent[]>;
  markDelivered(id: string): Promise<void>;
  markFailed(id: string, safeErrorCode: string, final: boolean): Promise<void>;
}

export type StaffPermission =
  | "case.read"
  | "case.mutate"
  | "identity.reveal"
  | "evidence.download"
  | "export.create"
  | "user.manage"
  | "audit.read";

export type StaffRole = "grievance_manager" | "supervisor" | "administrator" | "auditor_read_only";

export interface AuthenticatedStaff {
  readonly userId: string;
  readonly displayName: string;
  readonly roles: readonly StaffRole[];
  readonly permissions: readonly StaffPermission[];
  readonly assurance: "password" | "mfa" | "reauthenticated";
  readonly sessionId: string;
}

export interface WorkerTrackingSession {
  readonly sessionId: string;
  readonly complaintId: string;
  readonly referenceNumber: string;
  readonly expiresAt: string;
}

export interface IdentityAccessRepository {
  authenticateStaff(loginIdentifier: string, password: string): Promise<AuthenticatedStaff | null>;
  createStaffSession(
    userId: string,
    assurance: AuthenticatedStaff["assurance"],
    tokenHash: string,
  ): Promise<{ sessionId: string; expiresAt: string }>;
  resolveStaffSession(tokenHash: string): Promise<AuthenticatedStaff | null>;
  revokeSession(tokenHash: string, reason: string): Promise<void>;
  authenticateWorker(
    referenceNumber: string,
    secret: string,
    tokenHash: string,
  ): Promise<WorkerTrackingSession | null>;
  resolveWorkerSession(tokenHash: string): Promise<WorkerTrackingSession | null>;
  revokeWorkerSession(tokenHash: string): Promise<void>;
  verifyMfa(userId: string, code: string): Promise<boolean>;
  markSessionMfa(tokenHash: string): Promise<void>;
  enrollTotp(userId: string, encryptedSecret: EncryptedSecretInput): Promise<string>;
  consumeRecoveryCode(userId: string, code: string): Promise<boolean>;
  rotateRecoveryCodes(userId: string): Promise<readonly string[]>;
  reauthenticate(tokenHash: string, password: string): Promise<boolean>;
}

export interface EncryptedSecretInput extends EncryptedValue {
  readonly tag: Uint8Array;
}
