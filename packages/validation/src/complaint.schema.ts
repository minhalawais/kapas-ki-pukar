import {
  caseStatuses,
  COMPLAINT_ID_PATTERN,
  employmentTypes,
  genders,
  groupImpact,
  locales,
  priorities,
  privacyModes,
  reporterTypes,
  subcategoryCodes,
  workerCategoryCodes,
} from "@kapas/domain";
import { z } from "zod";

export const localeSchema = z.enum(locales);
export const privacyModeSchema = z.enum(privacyModes);
export const prioritySchema = z.enum(priorities);
export const caseStatusSchema = z.enum(caseStatuses);
export const categorySchema = z.enum(workerCategoryCodes);
export const subcategorySchema = z.enum(subcategoryCodes);
export const reporterTypeSchema = z.enum(reporterTypes);
export const trackingIdSchema = z.string().regex(COMPLAINT_ID_PATTERN);

export const locationSchema = z.object({
  province: z.string().min(1),
  district: z.string().min(1),
  tehsil: z.string().optional(),
  villageLabel: z.string().optional(),
  village: z.string().optional(),
  field: z.string().optional(),
  placeLabel: z.string().optional(),
  formattedAddress: z.string().optional(),
  source: z.enum(["device", "manual"]).optional(),
  accuracyMeters: z.number().nonnegative().optional(),
  exactCoordinates: z.object({ latitude: z.number(), longitude: z.number() }).nullable(),
});

export const incidentSchema = z.object({
  whenLabel: z.string().min(1),
  occurredAt: z.string().optional(),
  description: z.string().optional(),
  currentDanger: z.boolean(),
  immediateDanger: z.boolean(),
  othersAffected: z.enum(groupImpact),
  structuredAnswers: z.record(z.unknown()),
});

export const complaintSchema = z.object({
  id: trackingIdSchema,
  trackingId: trackingIdSchema,
  referenceNumber: trackingIdSchema,
  createdAt: z.string().min(1),
  submittedAt: z.string().min(1),
  updatedAt: z.string().min(1),
  dueAt: z.string().min(1),
  categoryCode: categorySchema,
  subcategoryCode: subcategorySchema.optional(),
  category: categorySchema,
  subcategory: z.string().optional(),
  priority: prioritySchema,
  status: caseStatusSchema,
  privacyMode: privacyModeSchema,
  reporterType: reporterTypeSchema,
  reporter: z.object({
    type: reporterTypeSchema,
    displayName: z.string().optional(),
    contactAllowed: z.boolean(),
  }),
  reporterIdentity: z.discriminatedUnion("mode", [
    z.object({ mode: z.literal("cnic"), cnicLast4: z.string().length(4), cnicVerified: z.boolean() }),
    z.object({ mode: z.literal("phone"), phoneLast4: z.string().length(4), cnicVerified: z.boolean() }),
    z.object({ mode: z.literal("anonymous"), cnicVerified: z.literal(false) }),
  ]).optional(),
  affectedWorkerType: z.enum(employmentTypes).optional(),
  gender: z.enum(genders).optional(),
  location: locationSchema,
  othersAffected: z.boolean(),
  affectedRange: z.enum(groupImpact).optional(),
  incident: incidentSchema,
  evidence: z.array(z.object({
    id: z.string(),
    kind: z.enum(["photo", "document"]),
    localUri: z.string(),
    fileName: z.string(),
    mimeType: z.string(),
    capturedAt: z.string(),
  })),
  voice: z
    .object({
      id: z.string(),
      localUri: z.string(),
      durationMs: z.number(),
      recordedAt: z.string(),
      locale: localeSchema,
    })
    .nullable(),
  ai: z
    .object({
      suggestedCategory: categorySchema.optional(),
      suggestedSubcategory: subcategorySchema.optional(),
      suggestedPriority: prioritySchema.optional(),
      summaryUr: z.string().optional(),
      summaryEn: z.string().optional(),
      transcriptUr: z.string().optional(),
      transcriptEn: z.string().optional(),
      confidenceScore: z.number().min(0).max(1),
      confidence: z.enum(["high", "medium", "low"]),
      failed: z.boolean(),
      humanReviewRequired: z.boolean(),
      extractedFacts: z
        .object({
          actor: z.string().optional(),
          amountExpected: z.number().optional(),
          amountReceived: z.number().optional(),
          affectedWorkers: z.string().optional(),
          symptoms: z.array(z.string()).optional(),
          locationText: z.string().optional(),
        })
        .optional(),
      warnings: z.array(z.string()).optional(),
    })
    .nullable(),
  actions: z.array(z.object({
    id: z.string(),
    type: z.string(),
    at: z.string(),
    actorRole: z.enum(["worker", "puwf-grievance-manager", "system"]),
    note: z.string().optional(),
  })),
  resolution: z
    .object({
      summary: z.string(),
      proposedAt: z.string().optional(),
      resolvedAt: z.string().optional(),
    })
    .nullable(),
  workerFeedback: z
    .object({
      outcome: z.enum(["satisfied", "partial", "unresolved"]),
      submittedAt: z.string(),
    })
    .nullable(),
  overdue: z.boolean(),
  scenarioId: z.string().optional(),
});

export const complaintDraftSchema = z.object({
  id: z.string().min(1),
  stepId: z.string().min(1),
  privacyMode: privacyModeSchema.optional(),
  reporterIdentity: z.discriminatedUnion("mode", [
    z.object({ mode: z.literal("cnic"), cnicLast4: z.string().length(4), cnicVerified: z.boolean() }),
    z.object({ mode: z.literal("phone"), phoneLast4: z.string().length(4), cnicVerified: z.boolean() }),
    z.object({ mode: z.literal("anonymous"), cnicVerified: z.literal(false) }),
  ]).optional(),
  category: categorySchema.optional(),
  incident: z.object({
    whenLabel: z.string().optional(),
    occurredAt: z.string().optional(),
    description: z.string().optional(),
    othersAffected: z.string().optional(),
    immediateDanger: z.boolean().optional(),
    currentDanger: z.boolean().optional(),
    structuredAnswers: z.record(z.unknown()).optional(),
  }),
  location: locationSchema.partial(),
  evidence: z.array(z.unknown()),
  voice: z.unknown().nullable(),
  ai: z.unknown().nullable().optional(),
  scenarioId: z.string().optional(),
  updatedAt: z.string().min(1),
});
