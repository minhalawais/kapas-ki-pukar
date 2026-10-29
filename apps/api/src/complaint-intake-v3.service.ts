import { createHash, randomUUID } from "node:crypto";

import {
  intakeSubmissionV3Schema,
  type IntakeReceiptV3,
  type IntakeSubmissionV3,
} from "@kapas/api-contracts";
import type { RuntimeConfig } from "@kapas/config";
import {
  IdempotencyConflictError,
  PostgresComplaintRepository,
  type DatabaseClient,
} from "@kapas/database";
import {
  assertTaxonomySelection,
  normalizePakistanCnic,
  normalizePakistanPhone,
  type CreateComplaintCommand,
} from "@kapas/domain";
import {
  decryptEnvelope,
  deriveKey,
  encryptEnvelope,
  generateOpaqueToken,
  hashOpaqueToken,
  hashPassword,
} from "@kapas/security";
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";

import { DATABASE_CLIENT, RUNTIME_CONFIG } from "./tokens";

const RECEIPT_RECOVERY_DAYS = 90;

function canonicalHash(value: unknown): string {
  const stable = (input: unknown): string => {
    if (Array.isArray(input)) return `[${input.map(stable).join(",")}]`;
    if (input !== null && typeof input === "object") {
      return `{${Object.entries(input as Record<string, unknown>)
        .filter(([, nested]) => nested !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => `${JSON.stringify(key)}:${stable(nested)}`)
        .join(",")}}`;
    }
    return JSON.stringify(input);
  };
  return createHash("sha256").update(stable(value)).digest("hex");
}

function validationError(code: string, messageKey = `errors.${code}`): BadRequestException {
  return new BadRequestException({
    code,
    disposition: "user_action",
    messageKey,
    message: "Request validation failed",
  });
}

@Injectable()
export class ComplaintIntakeV3Service {
  private readonly complaints: PostgresComplaintRepository;

  constructor(
    @Inject(DATABASE_CLIENT) private readonly client: DatabaseClient,
    @Inject(RUNTIME_CONFIG) private readonly config: RuntimeConfig,
  ) {
    this.complaints = new PostgresComplaintRepository(client);
  }

  async submit(
    raw: unknown,
    headerKey: string | undefined,
    requestId: string,
  ): Promise<IntakeReceiptV3> {
    const parsed = intakeSubmissionV3Schema.safeParse(raw);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const path = issue?.path
        .map((part) =>
          String(part)
            .replace(/[^a-zA-Z0-9]+/g, "_")
            .toLowerCase(),
        )
        .filter(Boolean)
        .join("_");
      throw validationError(path ? `invalid_${path}` : "invalid_submission");
    }
    const submission = parsed.data;
    if (!headerKey || headerKey !== submission.idempotencyKey) {
      throw validationError("idempotency_key_required");
    }
    try {
      assertTaxonomySelection(
        submission.complaint.categoryCode,
        submission.complaint.subcategoryCode as never,
      );
    } catch {
      throw validationError("invalid_category_selection");
    }

    const payloadHash = canonicalHash(submission);
    const idempotencyKeyHash = hashOpaqueToken(headerKey, this.config.sessionSecret);
    const existing = await this.client.intakeReceipt.findUnique({
      where: { clientSubmissionId: submission.clientSubmissionId },
    });
    if (existing) {
      if (
        existing.idempotencyKeyHash !== idempotencyKeyHash ||
        existing.requestHash !== payloadHash
      ) {
        throw new ConflictException({
          code: "idempotency_payload_conflict",
          disposition: "user_action",
          messageKey: "errors.idempotency_payload_conflict",
          message: "The submission identifier was already used for different content",
        });
      }
      return this.receiptFor(submission.clientSubmissionId, idempotencyKeyHash);
    }

    const acceptedAt = new Date();
    const trackingSecret = generateOpaqueToken(24);
    const receiptAad = `intake-receipt:${submission.clientSubmissionId}`;
    const receiptEnvelope = encryptEnvelope(
      new TextEncoder().encode(trackingSecret),
      deriveKey(this.config.sessionSecret, "intake-receipt-v3"),
      this.config.encryptionKeyId,
      receiptAad,
    );
    const protectedIdentities = this.protectReporter(submission);
    const coordinates = submission.complaint.location.exactCoordinates
      ? encryptEnvelope(
          new TextEncoder().encode(JSON.stringify(submission.complaint.location.exactCoordinates)),
          deriveKey(this.config.sessionSecret, "coordinates"),
          this.config.encryptionKeyId,
          `coordinates:${submission.clientSubmissionId}`,
        )
      : undefined;
    const complaint = submission.complaint;
    const command: CreateComplaintCommand = {
      clientSubmissionId: submission.clientSubmissionId,
      canonicalRequestHash: payloadHash,
      evidenceStatus: submission.attachments.length ? "pending" : "none",
      categoryCode: complaint.categoryCode,
      subcategoryCode: complaint.subcategoryCode as never,
      priority: complaint.priority,
      privacyMode: submission.privacyMode,
      reporterType: complaint.reporterType,
      reporterDisplayName: complaint.reporterDisplayName,
      contactAllowed: ["call", "message", "either", "representative"].includes(
        complaint.contactPreference,
      ),
      contactPreference: complaint.contactPreference,
      safeContactWindow: complaint.safeContactWindow,
      preferredLanguage: complaint.preferredLanguage,
      safeVoicemail: complaint.safeVoicemail,
      representativeContact: complaint.representativeContact,
      affectedWorkerType: complaint.affectedWorkerType,
      gender: complaint.gender,
      submittedAt: acceptedAt.toISOString(),
      dueAt: new Date(acceptedAt.getTime() + 7 * 86_400_000).toISOString(),
      createdSource: "mobile",
      schemaVersion: 3,
      incident: complaint.incident,
      location: {
        ...complaint.location,
        analyticsProvince: complaint.location.province,
        analyticsDistrict: complaint.location.district,
        exactCoordinates: coordinates
          ? {
              ...coordinates,
              aadContext: `coordinates:${submission.clientSubmissionId}`,
              cryptoVersion: 1,
            }
          : undefined,
      },
      privateIdentities: protectedIdentities,
      requestId,
      idempotencyKeyHash,
      idempotencyScope: `mobile-v3:${submission.clientSubmissionId}`,
      declaredEvidence: submission.attachments.map((attachment) => ({
        ...attachment,
        totalBytes: BigInt(attachment.totalBytes),
      })),
      trackingSecretHash: await hashPassword(trackingSecret),
      intakeReceipt: {
        ...receiptEnvelope,
        idempotencyKeyHash,
        acceptedAt: acceptedAt.toISOString(),
        recoveryExpiresAt: new Date(
          acceptedAt.getTime() + RECEIPT_RECOVERY_DAYS * 86_400_000,
        ).toISOString(),
        aadContext: receiptAad,
        cryptoVersion: 1,
      },
    };

    try {
      await this.complaints.create(command);
    } catch (error) {
      if (error instanceof IdempotencyConflictError) {
        throw new ConflictException({
          code: "idempotency_payload_conflict",
          disposition: "user_action",
          messageKey: "errors.idempotency_payload_conflict",
          message: "The idempotency key was already used for different content",
        });
      }
      // A concurrent request may have committed the receipt after our initial read.
      const concurrent = await this.client.intakeReceipt.findUnique({
        where: { clientSubmissionId: submission.clientSubmissionId },
      });
      if (!concurrent) throw error;
      if (
        concurrent.idempotencyKeyHash !== idempotencyKeyHash ||
        concurrent.requestHash !== payloadHash
      ) {
        throw new ConflictException({
          code: "idempotency_payload_conflict",
          disposition: "user_action",
          messageKey: "errors.idempotency_payload_conflict",
          message: "The submission identifier was already used for different content",
        });
      }
    }
    return this.receiptFor(submission.clientSubmissionId, idempotencyKeyHash);
  }

  async recover(
    clientSubmissionId: string,
    headerKey: string | undefined,
  ): Promise<IntakeReceiptV3> {
    if (!headerKey)
      throw new UnauthorizedException("The original idempotency credential is required");
    return this.receiptFor(
      clientSubmissionId,
      hashOpaqueToken(headerKey, this.config.sessionSecret),
    );
  }

  private protectReporter(submission: IntakeSubmissionV3) {
    if (submission.privacyMode === "ANON") return undefined;
    if (!submission.privateReporter) throw validationError("identity_required");
    let phone: string;
    let cnic: string | undefined;
    try {
      phone = normalizePakistanPhone(submission.privateReporter.phone);
      cnic = submission.privateReporter.cnic
        ? normalizePakistanCnic(submission.privateReporter.cnic)
        : undefined;
    } catch {
      throw validationError("invalid_reporter_identity");
    }
    return [
      { kind: "phone" as const, value: phone },
      ...(cnic ? [{ kind: "cnic" as const, value: cnic }] : []),
    ].map((field) => {
      const aadContext = `reporter:${submission.clientSubmissionId}:${field.kind}:${randomUUID()}`;
      return {
        ...encryptEnvelope(
          new TextEncoder().encode(field.value),
          deriveKey(this.config.sessionSecret, "reporter"),
          this.config.encryptionKeyId,
          aadContext,
        ),
        kind: field.kind,
        displaySuffix: field.value.slice(-4),
        aadContext,
        cryptoVersion: 1,
      };
    });
  }

  private async receiptFor(
    clientSubmissionId: string,
    idempotencyKeyHash: string,
  ): Promise<IntakeReceiptV3> {
    const row = await this.client.intakeReceipt.findUnique({
      where: { clientSubmissionId },
      include: { complaint: true },
    });
    if (!row) throw new NotFoundException("Submission was not found");
    if (row.idempotencyKeyHash !== idempotencyKeyHash) {
      throw new UnauthorizedException("The original idempotency credential is required");
    }
    if (row.recoveryExpiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException("Receipt recovery has expired");
    }
    const trackingSecret = new TextDecoder().decode(
      decryptEnvelope(
        {
          ciphertext: row.secretCiphertext,
          nonce: row.secretNonce,
          tag: row.secretAuthTag,
          keyId: row.secretKeyId,
          algorithm: "AES-256-GCM",
        },
        deriveKey(this.config.sessionSecret, "intake-receipt-v3"),
        `intake-receipt:${clientSubmissionId}`,
      ),
    );
    return {
      clientSubmissionId,
      referenceNumber: row.complaint.referenceNumber,
      trackingSecret,
      acceptedAt: row.acceptedAt.toISOString(),
      evidenceStatus: row.complaint.evidenceStatus as IntakeReceiptV3["evidenceStatus"],
    };
  }
}
