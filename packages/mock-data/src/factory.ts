import type { CaseAction, Complaint, VoiceEvidence } from "@kapas/domain";
import {
  DEMO_NOW_ISO,
  isOverdue,
  type CaseActionType,
  type CaseStatus,
  type EmploymentType,
  type Gender,
  type GroupImpact,
  type Priority,
  type PrivacyMode,
  type ReporterType,
  type SubcategoryCode,
  type WorkerCategoryCode,
} from "@kapas/domain";

export function trackingIdFromIndex(index: number): string {
  return `KP-26-${String(index).padStart(6, "0")}`;
}

export function confidenceBand(score: number): "high" | "medium" | "low" {
  if (score >= 0.8) {
    return "high";
  }
  if (score >= 0.65) {
    return "medium";
  }
  return "low";
}

function slaDays(priority: Priority): number {
  if (priority === "Emergency") {
    return 1;
  }
  if (priority === "Critical") {
    return 3;
  }
  if (priority === "High") {
    return 7;
  }
  return 14;
}

export function dueAtFrom(createdAt: string, priority: Priority): string {
  const due = new Date(createdAt);
  due.setUTCDate(due.getUTCDate() + slaDays(priority));
  return due.toISOString();
}

export function receivedAction(at: string): CaseAction {
  return {
    id: `${at}-received`,
    type: "Complaint Received",
    at,
    actorRole: "system",
  };
}

export function action(
  type: CaseActionType,
  at: string,
  note?: string,
  actorRole: CaseAction["actorRole"] = "puwf-grievance-manager",
): CaseAction {
  return { id: `${at}-${type}`, type, at, actorRole, note };
}

export function timelineForStatus(status: CaseStatus, submittedAt: string): CaseAction[] {
  const day = (offset: number) => {
    const d = new Date(submittedAt);
    d.setUTCDate(d.getUTCDate() + offset);
    return d.toISOString();
  };
  const events: CaseAction[] = [receivedAction(submittedAt)];
  if (status === "Submitted" || status === "Draft") {
    return events;
  }
  events.push(action("Review Started", day(1)));
  if (status === "Under Review") {
    return events;
  }
  events.push(action("Worker Contact Attempted", day(2)));
  if (status === "Action in Progress") {
    events.push(action("Action Taken", day(3), "Site follow-up recorded."));
    return events;
  }
  events.push(action("Investigation Finding Added", day(3)));
  events.push(action("Action Taken", day(4)));
  events.push(action("Proposed Resolution", day(5), "Remedy proposed."));
  if (status === "Proposed Resolution") {
    return events;
  }
  events.push(action("Resolved", day(6)));
  if (status === "Resolved") {
    return events;
  }
  if (status === "Reopened") {
    events.push(action("Closed", day(8)));
    events.push(action("Reopened", day(10), "Worker not satisfied."));
    return events;
  }
  events.push(action("Closed", day(8)));
  return events;
}

interface ComplaintSeed {
  index: number;
  categoryCode: WorkerCategoryCode;
  subcategoryCode?: SubcategoryCode;
  status: CaseStatus;
  priority: Priority;
  privacyMode: PrivacyMode;
  reporterType: ReporterType;
  gender: Gender;
  affectedWorkerType: EmploymentType;
  affectedRange: GroupImpact;
  location: Complaint["location"];
  createdAt: string;
  currentDanger: boolean;
  description: string;
  descriptionUr?: string;
  whenLabel: string;
  confidenceScore: number;
  aiFailed?: boolean;
  hasVoice?: boolean;
  hasEvidence?: boolean;
  scenarioId?: string;
  displayName?: string;
  resolutionSummary?: string;
  feedback?: Complaint["workerFeedback"];
}

export function buildComplaint(seed: ComplaintSeed): Complaint {
  const trackingId = trackingIdFromIndex(seed.index);
  const submittedAt = seed.createdAt;
  const dueAt = dueAtFrom(seed.createdAt, seed.priority);
  const othersAffected = seed.affectedRange !== "individual";
  const voice: VoiceEvidence | null =
    seed.hasVoice === false
      ? null
      : {
          id: `${trackingId}-voice`,
          localUri: `asset://demo-audio/${trackingId}.m4a`,
          durationMs: 42000,
          recordedAt: seed.createdAt,
          locale: "ur",
        };
  const evidence =
    seed.hasEvidence === false
      ? []
      : [
          {
            id: `${trackingId}-ev-1`,
            kind: "photo" as const,
            localUri: "asset://demo-evidence/field.png",
            fileName: "field-demo.png",
            mimeType: "image/png",
            capturedAt: seed.createdAt,
          },
        ];
  const failed = Boolean(seed.aiFailed);
  const confidenceScore = failed ? 0 : seed.confidenceScore;
  const complaint: Complaint = {
    id: trackingId,
    trackingId,
    referenceNumber: trackingId,
    createdAt: seed.createdAt,
    submittedAt,
    updatedAt: DEMO_NOW_ISO,
    dueAt,
    categoryCode: seed.categoryCode,
    subcategoryCode: seed.subcategoryCode,
    category: seed.categoryCode,
    subcategory: seed.subcategoryCode,
    priority: seed.priority,
    status: seed.status,
    privacyMode: seed.privacyMode,
    reporterType: seed.reporterType,
    reporter: {
      type: seed.reporterType,
      displayName:
        seed.privacyMode === "ANON" ? undefined : seed.displayName ?? "Cotton worker",
      contactAllowed: seed.privacyMode !== "ANON",
    },
    affectedWorkerType: seed.affectedWorkerType,
    gender: seed.gender,
    location: { ...seed.location, exactCoordinates: null },
    othersAffected,
    affectedRange: seed.affectedRange,
    incident: {
      whenLabel: seed.whenLabel,
      occurredAt: seed.createdAt,
      description: seed.description,
      currentDanger: seed.currentDanger,
      immediateDanger: seed.currentDanger,
      othersAffected: seed.affectedRange,
      structuredAnswers: {},
    },
    evidence,
    voice,
    ai: {
      suggestedCategory: seed.categoryCode,
      suggestedSubcategory: seed.subcategoryCode,
      suggestedPriority: seed.priority,
      summaryEn: seed.description,
      summaryUr: seed.descriptionUr ?? seed.description,
      transcriptEn: failed ? undefined : seed.description,
      transcriptUr: failed ? undefined : seed.descriptionUr ?? seed.description,
      confidenceScore,
      confidence: confidenceBand(confidenceScore),
      failed,
      humanReviewRequired: failed || confidenceScore < 0.65 || seed.categoryCode === "HAR" || seed.categoryCode === "CHL" || seed.categoryCode === "FOL",
      extractedFacts: failed
        ? undefined
        : {
            locationText: seed.location.district,
            affectedWorkers: seed.affectedRange,
          },
    },
    actions: timelineForStatus(seed.status, submittedAt),
    resolution: seed.resolutionSummary
      ? { summary: seed.resolutionSummary, resolvedAt: seed.createdAt }
      : null,
    workerFeedback: seed.feedback ?? null,
    overdue: false,
    scenarioId: seed.scenarioId,
  };
  complaint.overdue = isOverdue(complaint);
  return complaint;
}
