import {
  closureCodes,
  contactChannels,
  contactOutcomes,
  correctiveActionStates,
  findingConclusions,
  priorities,
} from "@kapas/domain";
import { z } from "zod";

const requestMeta = z.object({
  expectedVersion: z.number().int().positive(),
  requestId: z.string().min(8).max(100),
});

export const triageInputSchema = requestMeta.extend({
  assignedStaffId: z.string().uuid().optional(),
  categoryCode: z.string().length(3),
  subcategoryCode: z.string().max(7).optional(),
  priority: z.enum(priorities),
  priorityReason: z.string().min(8).max(4_000),
  scope: z.enum(["individual", "collective"]),
  safetyRisk: z.boolean(),
  safeguardingRisk: z.boolean(),
  retaliationRisk: z.boolean(),
  conflictOfInterest: z.boolean(),
  investigationRoute: z.string().min(3).max(4_000),
  nextAction: z.string().min(3).max(4_000),
  nextActionAt: z.string().datetime(),
  nextStatus: z.enum(["Verification", "Investigation", "Escalated"]),
});

export const workerContactInputSchema = requestMeta.extend({
  channel: z.enum(contactChannels),
  outcome: z.enum(contactOutcomes),
  occurredAt: z.string().datetime(),
  language: z.enum(["ur", "en"]),
  safeContactConfirmed: z.boolean(),
  emergencyOverride: z.boolean().default(false),
  overrideReason: z.string().max(4_000).optional(),
  representativeName: z.string().max(160).optional(),
  additionalFacts: z.string().max(8_000).optional(),
  requestedOutcome: z.string().max(4_000).optional(),
  readBackConfirmed: z.boolean().optional(),
  followUpAt: z.string().datetime().optional(),
  summary: z.string().min(3).max(4_000),
  visibility: z.enum(["internal", "worker-visible"]),
}).superRefine((value, context) => {
  if (value.emergencyOverride && (!value.overrideReason || value.overrideReason.trim().length < 8)) {
    context.addIssue({ code: "custom", path: ["overrideReason"], message: "Emergency override reason is required" });
  }
  if (value.channel === "representative" && !value.representativeName?.trim()) {
    context.addIssue({ code: "custom", path: ["representativeName"], message: "Representative name is required" });
  }
});

export const caseFactInputSchema = requestMeta.extend({
  workerContactId: z.string().uuid().optional(),
  fact: z.string().min(3).max(8_000),
  structuredValue: z.record(z.string(), z.unknown()).optional(),
  sourceType: z.enum(["original-report", "worker-call", "witness", "employer", "document", "site-visit", "staff-observation"]),
  sourceRecordId: z.string().uuid().optional(),
  verificationState: z.enum(["reported", "corroborated", "verified", "disputed"]),
});

export const findingInputSchema = requestMeta.extend({
  issue: z.string().min(3).max(4_000),
  allegation: z.string().min(3).max(8_000),
  conclusion: z.enum(findingConclusions),
  rationale: z.string().min(8).max(8_000),
  rootCause: z.string().max(4_000).optional(),
  affectedScope: z.string().max(2_000).optional(),
  recommendedAction: z.string().max(4_000).optional(),
});

export const correctiveActionInputSchema = requestMeta.extend({
  type: z.string().min(2).max(64),
  title: z.string().min(3).max(200),
  description: z.string().min(8).max(8_000),
  ownerStaffId: z.string().uuid().optional(),
  responsibleParty: z.string().max(200).optional(),
  expectedOutcome: z.string().min(3).max(4_000),
  workerVisibleSummary: z.string().max(4_000).optional(),
  dueAt: z.string().datetime(),
  followUpAt: z.string().datetime().optional(),
  attachmentEvidenceIds: z.array(z.string().uuid()).max(5).optional(),
});

export const correctiveActionUpdateSchema = requestMeta.extend({
  state: z.enum(correctiveActionStates),
  actualResult: z.string().max(8_000).optional(),
  cancellationReason: z.string().max(4_000).optional(),
  followUpAt: z.string().datetime().optional(),
}).superRefine((value, context) => {
  if (value.state === "completed" && !value.actualResult?.trim()) {
    context.addIssue({ code: "custom", path: ["actualResult"], message: "Completed actions require an actual result" });
  }
  if (value.state === "cancelled" && !value.cancellationReason?.trim()) {
    context.addIssue({ code: "custom", path: ["cancellationReason"], message: "Cancelled actions require a reason" });
  }
});

export const referralInputSchema = requestMeta.extend({
  organization: z.string().min(2).max(200),
  reason: z.string().min(8).max(8_000),
  referenceNumber: z.string().max(100).optional(),
  consentState: z.enum(["obtained", "not-required", "not-obtained", "emergency-override"]),
  referredAt: z.string().datetime(),
  ownerStaffId: z.string().uuid(),
  status: z.enum(["submitted", "accepted", "in-progress", "completed", "declined"]),
  outcome: z.string().max(8_000).optional(),
});

export const caseOutcomeInputSchema = requestMeta.extend({
  remedyType: z.string().min(2).max(64),
  details: z.string().min(8).max(8_000),
  remedyDelivered: z.boolean(),
  deliveredAt: z.string().datetime().optional(),
  amountPaid: z.number().nonnegative().optional(),
  communicated: z.boolean(),
  communicationChannel: z.enum(contactChannels).optional(),
  communicatedAt: z.string().datetime().optional(),
  communicationExceptionReason: z.string().max(4_000).optional(),
  retaliationSafetyResult: z.string().max(4_000).optional(),
  workerVisibleSummary: z.string().min(8).max(4_000),
}).superRefine((value, context) => {
  if (value.remedyDelivered && !value.deliveredAt) context.addIssue({ code: "custom", path: ["deliveredAt"], message: "Delivery date is required" });
  if (!value.communicated && (!value.communicationExceptionReason || value.communicationExceptionReason.trim().length < 8)) {
    context.addIssue({ code: "custom", path: ["communicationExceptionReason"], message: "Communication exception reason is required" });
  }
});

export const caseClosureInputSchema = requestMeta.extend({
  code: z.enum(closureCodes),
  summary: z.string().min(8).max(8_000),
  communicationExceptionReason: z.string().max(4_000).optional(),
  outstandingReferralAcknowledged: z.boolean(),
});

