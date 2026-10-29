import { z } from "zod";

export const requestIdSchema = z.string().regex(/^[A-Za-z0-9._:-]{8,128}$/);
export const utcTimestampSchema = z.iso.datetime({ offset: true });

export const fieldErrorSchema = z.object({
  field: z.string().min(1).max(200),
  code: z.string().min(1).max(100),
  message: z.string().min(1).max(500),
});

export const errorEnvelopeSchema = z.object({
  code: z.string().min(1).max(100),
  message: z.string().min(1).max(500),
  requestId: requestIdSchema,
  fieldErrors: z.array(fieldErrorSchema).max(100).optional(),
});

export const dependencyStatusSchema = z.object({
  status: z.enum(["up", "down"]),
  latencyMs: z.number().nonnegative(),
});

export const livenessResponseSchema = z.object({
  status: z.literal("ok"),
  service: z.literal("api"),
  version: z.string().min(1),
  time: utcTimestampSchema,
});

export const readinessResponseSchema = z.object({
  status: z.enum(["ready", "not_ready"]),
  service: z.literal("api"),
  version: z.string().min(1),
  time: utcTimestampSchema,
  dependencies: z.object({
    postgres: dependencyStatusSchema,
    redis: dependencyStatusSchema,
  }),
});

export const metaResponseSchema = z.object({
  service: z.literal("api"),
  version: z.string().min(1),
  environment: z.enum(["development", "test", "production"]),
  apiVersion: z.literal("v1"),
});

export const attachmentKindSchema = z.enum(["voice", "photo", "document"]);
export const serverEvidenceStatusSchema = z.enum([
  "declared",
  "uploading",
  "quarantined",
  "scanning",
  "available",
  "rejected",
  "omitted",
  "expired",
]);
export const complaintEvidenceStatusSchema = z.enum([
  "none",
  "pending",
  "processing",
  "complete",
  "action_required",
]);

const boundedOptionalString = (maximum: number) => z.string().trim().min(1).max(maximum).optional();

export const attachmentDeclarationV3Schema = z
  .object({
    clientMediaId: z.uuid(),
    kind: attachmentKindSchema,
    displayName: z.string().trim().min(1).max(255),
    declaredMimeType: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .regex(/^[a-z0-9][a-z0-9.+-]*\/[a-z0-9][a-z0-9.+-]*$/),
    totalBytes: z
      .number()
      .int()
      .positive()
      .max(25 * 1024 * 1024),
    capturedAt: utcTimestampSchema.optional(),
    recordedAt: utcTimestampSchema.optional(),
    durationMs: z
      .number()
      .int()
      .positive()
      .max(24 * 60 * 60 * 1000)
      .optional(),
  })
  .superRefine((attachment, context) => {
    const maximum =
      attachment.kind === "voice"
        ? 25 * 1024 * 1024
        : attachment.kind === "photo"
          ? 10 * 1024 * 1024
          : 15 * 1024 * 1024;
    const allowed =
      attachment.kind === "voice"
        ? attachment.declaredMimeType.startsWith("audio/")
        : attachment.kind === "photo"
          ? ["image/jpeg", "image/png"].includes(attachment.declaredMimeType)
          : attachment.declaredMimeType === "application/pdf";
    if (attachment.totalBytes > maximum) {
      context.addIssue({ code: "custom", path: ["totalBytes"], message: "attachment_size_limit" });
    }
    if (!allowed) {
      context.addIssue({
        code: "custom",
        path: ["declaredMimeType"],
        message: "unsupported_media_type",
      });
    }
  });

export const structuredComplaintInputSchema = z.object({
  categoryCode: z.enum([
    "WAG",
    "PES",
    "HSE",
    "HAR",
    "CHL",
    "FOL",
    "CON",
    "HRS",
    "SAN",
    "DIS",
    "OTH",
  ]),
  subcategoryCode: boundedOptionalString(7),
  priority: z.enum(["Emergency", "Critical", "High", "Standard"]).default("Standard"),
  reporterType: z
    .enum(["self", "coworker", "family", "puwf-field", "community", "other"])
    .default("self"),
  reporterDisplayName: boundedOptionalString(160),
  contactPreference: z
    .enum(["call", "message", "either", "representative", "do-not-initiate"])
    .default("do-not-initiate"),
  safeContactWindow: boundedOptionalString(160),
  preferredLanguage: z.enum(["ur", "en"]).optional(),
  safeVoicemail: z.boolean().default(false),
  representativeContact: boundedOptionalString(160),
  affectedWorkerType: z
    .enum([
      "seasonal-picker",
      "daily-wage",
      "piece-rate",
      "migrant",
      "contractor",
      "tenant-associated",
      "other",
    ])
    .optional(),
  gender: z.enum(["Female", "Male", "Other", "Not Stated"]).optional(),
  incident: z.object({
    whenLabel: z.string().trim().min(1).max(100),
    occurredAt: utcTimestampSchema.optional(),
    description: z.string().max(4000).optional(),
    currentDanger: z.boolean().default(false),
    immediateDanger: z.boolean().default(false),
    othersAffected: z
      .enum(["individual", "2-5", "6-20", "more-than-20", "not-sure"])
      .default("individual"),
    structuredAnswers: z.record(z.string(), z.json()).default({}),
    schemaVersion: z.number().int().positive().default(3),
  }),
  location: z.object({
    province: z.string().trim().min(1).max(100),
    district: z.string().trim().min(1).max(100),
    tehsil: boundedOptionalString(100),
    villageLabel: boundedOptionalString(160),
    descriptivePlace: boundedOptionalString(500),
    source: z.enum(["device", "manual"]).default("manual"),
    accuracyMeters: z.number().int().nonnegative().max(100_000).optional(),
    exactCoordinates: z
      .object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
      })
      .optional(),
  }),
});

export const protectedReporterInputSchema = z.object({
  phone: z.string().trim().min(1).max(32),
  cnic: z.string().trim().min(1).max(32).optional(),
});

export const intakeSubmissionV3Schema = z
  .object({
    clientSubmissionId: z.uuid(),
    idempotencyKey: z.string().min(16).max(200),
    schemaVersion: z.literal(3),
    revision: z.number().int().positive(),
    privacyMode: z.enum(["ANON", "CONF", "IDEN"]),
    complaint: structuredComplaintInputSchema,
    privateReporter: protectedReporterInputSchema.optional(),
    attachments: z.array(attachmentDeclarationV3Schema).max(6),
  })
  .superRefine((submission, context) => {
    const nonVoice = submission.attachments.filter((attachment) => attachment.kind !== "voice");
    const voice = submission.attachments.filter((attachment) => attachment.kind === "voice");
    const aggregate = submission.attachments.reduce(
      (total, attachment) => total + attachment.totalBytes,
      0,
    );
    if (nonVoice.length > 5)
      context.addIssue({
        code: "custom",
        path: ["attachments"],
        message: "attachment_count_limit",
      });
    if (voice.length > 1)
      context.addIssue({ code: "custom", path: ["attachments"], message: "voice_count_limit" });
    if (aggregate > 50 * 1024 * 1024)
      context.addIssue({ code: "custom", path: ["attachments"], message: "aggregate_media_limit" });
    if (submission.privacyMode === "ANON" && submission.privateReporter) {
      context.addIssue({
        code: "custom",
        path: ["privateReporter"],
        message: "anonymous_identity_prohibited",
      });
    }
    if (submission.privacyMode !== "ANON" && !submission.privateReporter) {
      context.addIssue({ code: "custom", path: ["privateReporter"], message: "identity_required" });
    }
  });

export const intakeReceiptV3Schema = z.object({
  clientSubmissionId: z.uuid(),
  referenceNumber: z.string().min(1).max(32),
  trackingSecret: z.string().min(16).max(200),
  acceptedAt: utcTimestampSchema,
  evidenceStatus: complaintEvidenceStatusSchema,
});

export const evidenceDeliveryV3Schema = z.object({
  clientMediaId: z.uuid(),
  evidenceId: z.uuid(),
  status: serverEvidenceStatusSchema,
  uploadedBytes: z.number().int().nonnegative(),
  totalBytes: z.number().int().positive(),
  reasonCode: z.string().min(1).max(100).optional(),
});

export const apiErrorV3Schema = z.object({
  code: z.string().min(1).max(100),
  disposition: z.enum(["retry", "user_action", "upgrade_required", "support"]),
  messageKey: z.string().min(1).max(160),
  requestId: requestIdSchema,
  retryAfterSeconds: z.number().int().positive().optional(),
  attachmentId: z.uuid().optional(),
});

export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>;
export type LivenessResponse = z.infer<typeof livenessResponseSchema>;
export type ReadinessResponse = z.infer<typeof readinessResponseSchema>;
export type MetaResponse = z.infer<typeof metaResponseSchema>;
export type AttachmentDeclarationV3 = z.infer<typeof attachmentDeclarationV3Schema>;
export type IntakeSubmissionV3 = z.infer<typeof intakeSubmissionV3Schema>;
export type IntakeReceiptV3 = z.infer<typeof intakeReceiptV3Schema>;
export type EvidenceDeliveryV3 = z.infer<typeof evidenceDeliveryV3Schema>;
export type ApiErrorV3 = z.infer<typeof apiErrorV3Schema>;

export const contractJsonSchemas = Object.freeze({
  ErrorEnvelope: z.toJSONSchema(errorEnvelopeSchema, { target: "draft-7" }),
  LivenessResponse: z.toJSONSchema(livenessResponseSchema, { target: "draft-7" }),
  ReadinessResponse: z.toJSONSchema(readinessResponseSchema, { target: "draft-7" }),
  MetaResponse: z.toJSONSchema(metaResponseSchema, { target: "draft-7" }),
  AttachmentDeclarationV3: z.toJSONSchema(attachmentDeclarationV3Schema, { target: "draft-7" }),
  IntakeSubmissionV3: z.toJSONSchema(intakeSubmissionV3Schema, { target: "draft-7" }),
  IntakeReceiptV3: z.toJSONSchema(intakeReceiptV3Schema, { target: "draft-7" }),
  EvidenceDeliveryV3: z.toJSONSchema(evidenceDeliveryV3Schema, { target: "draft-7" }),
  ApiErrorV3: z.toJSONSchema(apiErrorV3Schema, { target: "draft-7" }),
});
