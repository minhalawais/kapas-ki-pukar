import type { Priority } from "./priority";
import type { CaseActionVisibility, CaseStatus } from "./status";

export const contactChannels = ["call", "message", "representative", "none"] as const;
export type ContactChannel = (typeof contactChannels)[number];

export const contactOutcomes = [
  "connected",
  "follow-up-needed",
  "no-answer",
  "unavailable",
  "wrong-number",
  "unsafe-to-speak",
  "callback-requested",
  "prohibited",
  "representative-contacted",
] as const;
export type ContactOutcome = (typeof contactOutcomes)[number];

export const findingConclusions = [
  "substantiated",
  "partially-substantiated",
  "not-substantiated",
  "unable-to-determine",
] as const;
export type FindingConclusion = (typeof findingConclusions)[number];

export const correctiveActionStates = [
  "planned",
  "accepted",
  "in-progress",
  "completed",
  "rejected",
  "cancelled",
  "overdue",
] as const;
export type CorrectiveActionState = (typeof correctiveActionStates)[number];

export const closureCodes = [
  "remedy-verified",
  "partially-remedied",
  "referred-externally",
  "outside-mandate",
  "duplicate-merged",
  "worker-withdrew",
  "unable-to-proceed",
] as const;
export type ClosureCode = (typeof closureCodes)[number];

export interface TriageInput {
  assignedStaffId: string;
  categoryCode: string;
  subcategoryCode?: string;
  priority: Priority;
  priorityReason: string;
  scope: "individual" | "collective";
  safetyRisk: boolean;
  safeguardingRisk: boolean;
  retaliationRisk: boolean;
  conflictOfInterest: boolean;
  investigationRoute: string;
  nextAction: string;
  nextActionAt: string;
  nextStatus: Extract<CaseStatus, "Verification" | "Investigation" | "Escalated">;
}

export interface WorkerContactInput {
  channel: ContactChannel;
  outcome: ContactOutcome;
  occurredAt: string;
  language: "ur" | "en";
  safeContactConfirmed: boolean;
  emergencyOverride?: boolean;
  overrideReason?: string;
  representativeName?: string;
  additionalFacts?: string;
  requestedOutcome?: string;
  readBackConfirmed?: boolean;
  followUpAt?: string;
  summary: string;
  visibility: CaseActionVisibility;
}

export interface FindingInput {
  issue: string;
  allegation: string;
  conclusion: FindingConclusion;
  rationale: string;
  rootCause?: string;
  affectedScope?: string;
  recommendedAction?: string;
}

export interface CorrectiveActionInput {
  type: string;
  title: string;
  description: string;
  ownerStaffId: string;
  responsibleParty?: string;
  expectedOutcome: string;
  workerVisibleSummary?: string;
  dueAt: string;
  followUpAt?: string;
}

export interface CaseOutcomeInput {
  remedyType: string;
  details: string;
  remedyDelivered: boolean;
  deliveredAt?: string;
  amountPaid?: number;
  communicated: boolean;
  communicationChannel?: ContactChannel;
  communicatedAt?: string;
  communicationExceptionReason?: string;
  retaliationSafetyResult?: string;
  workerVisibleSummary: string;
}

export interface CaseClosureInput {
  code: ClosureCode;
  summary: string;
  communicationExceptionReason?: string;
  outstandingReferralAcknowledged: boolean;
}

const SLA_MINUTES: Record<Priority, { triage: number; contact: number; update: number }> = {
  Emergency: { triage: 15, contact: 30, update: 24 * 60 },
  Critical: { triage: 4 * 60, contact: 8 * 60, update: 2 * 24 * 60 },
  High: { triage: 24 * 60, contact: 2 * 24 * 60, update: 3 * 24 * 60 },
  Standard: { triage: 2 * 24 * 60, contact: 3 * 24 * 60, update: 5 * 24 * 60 },
};

export function complaintSla(priority: Priority, acceptedAt: Date) {
  const policy = SLA_MINUTES[priority];
  const add = (minutes: number) => new Date(acceptedAt.getTime() + minutes * 60_000);
  return {
    triageDueAt: add(policy.triage),
    contactDueAt: add(policy.contact),
    nextUpdateDueAt: add(policy.update),
  };
}
