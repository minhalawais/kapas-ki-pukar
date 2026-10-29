import type { CaseAction } from "./complaint";
import type { CaseActionType, CaseStatus } from "./status";

/** Staff/worker-facing lifecycle labels (includes optional contact steps). */
export const simplifiedCaseStages = [
  "Investigation started",
  "Record contact",
  "Record worker contact",
  "Root cause analysis",
  "Corrective action taken",
  "Close complaint",
] as const;

export type SimplifiedCaseStage = (typeof simplifiedCaseStages)[number];

export type SimplifiedRecordKind =
  | "investigation-started"
  | "record-contact"
  | "record-worker-contact"
  | "root-cause-analysis"
  | "corrective-action-taken"
  | "close-complaint";

export const simplifiedRecordOptions: { value: SimplifiedRecordKind; label: string }[] = [
  { value: "investigation-started", label: "Investigation started" },
  { value: "record-contact", label: "Record contact" },
  { value: "record-worker-contact", label: "Record worker contact" },
  { value: "root-cause-analysis", label: "Root cause analysis" },
  { value: "corrective-action-taken", label: "Corrective action taken" },
  { value: "close-complaint", label: "Close complaint" },
];

const stageLabelByKind: Record<SimplifiedRecordKind, SimplifiedCaseStage> = {
  "investigation-started": "Investigation started",
  "record-contact": "Record contact",
  "record-worker-contact": "Record worker contact",
  "root-cause-analysis": "Root cause analysis",
  "corrective-action-taken": "Corrective action taken",
  "close-complaint": "Close complaint",
};

const investigationStartedTypes = new Set<CaseActionType>([
  "Review Started",
  "Triage Completed",
  "Investigation Finding Recorded",
  "Investigation Finding Added",
]);

const recordContactTypes = new Set<CaseActionType>(["Verified Fact Recorded"]);

const workerContactTypes = new Set<CaseActionType>([
  "Contact Attempted",
  "Contact Successful",
  "Worker Contact Attempted",
  "Worker Contact Successful",
  "Emergency Contact Override",
]);

const optionalContactTimelineTypes = workerContactTypes;

const rootCauseTypes = new Set<CaseActionType>([
  "Investigation Finding Recorded",
  "Investigation Finding Added",
]);

const correctiveTypes = new Set<CaseActionType>([
  "Action Planned",
  "Action Updated",
  "Action Taken",
]);

const closedTypes = new Set<CaseActionType>(["Complaint Closed", "Closed"]);

type ActionRow = Pick<CaseAction, "type" | "reason">;

function reasonStage(reason: Record<string, unknown> | undefined): string | undefined {
  const stage = reason?.simplifiedStage;
  return typeof stage === "string" ? stage : undefined;
}

function hasStageMarker(actions: readonly ActionRow[], stage: SimplifiedRecordKind): boolean {
  return actions.some((entry) => reasonStage(entry.reason as Record<string, unknown> | undefined) === stage);
}

/** Employer / third-party contact recorded via simplified “Record contact”. */
export function hasSimplifiedRecordContact(actions: readonly ActionRow[] | undefined): boolean {
  const rows = actions ?? [];
  return (
    rows.some(
      (entry) =>
        recordContactTypes.has(entry.type) &&
        (reasonStage(entry.reason as Record<string, unknown> | undefined) === "record-contact" ||
          (entry.reason as Record<string, unknown> | undefined)?.sourceType === "employer"),
    ) || hasStageMarker(rows, "record-contact")
  );
}

/** Worker contact recorded via simplified “Record worker contact”. */
export function hasSimplifiedRecordWorkerContact(actions: readonly ActionRow[] | undefined): boolean {
  const rows = actions ?? [];
  return (
    rows.some(
      (entry) =>
        workerContactTypes.has(entry.type) &&
        reasonStage(entry.reason as Record<string, unknown> | undefined) === "record-worker-contact",
    ) || hasStageMarker(rows, "record-worker-contact")
  );
}

export type SimplifiedProgressStage = {
  kind: SimplifiedRecordKind;
  label: SimplifiedCaseStage;
  optional: boolean;
};

/** Visible progress steps: optional contact stages appear only after they are recorded. */
export function simplifiedProgressStages(
  actions: readonly ActionRow[] | undefined,
): readonly SimplifiedProgressStage[] {
  const stages: SimplifiedProgressStage[] = [
    { kind: "investigation-started", label: stageLabelByKind["investigation-started"], optional: false },
  ];
  if (hasSimplifiedRecordContact(actions)) {
    stages.push({ kind: "record-contact", label: stageLabelByKind["record-contact"], optional: true });
  }
  if (hasSimplifiedRecordWorkerContact(actions)) {
    stages.push({
      kind: "record-worker-contact",
      label: stageLabelByKind["record-worker-contact"],
      optional: true,
    });
  }
  stages.push(
    { kind: "root-cause-analysis", label: stageLabelByKind["root-cause-analysis"], optional: false },
    { kind: "corrective-action-taken", label: stageLabelByKind["corrective-action-taken"], optional: false },
    { kind: "close-complaint", label: stageLabelByKind["close-complaint"], optional: false },
  );
  return stages;
}

function isStageComplete(kind: SimplifiedRecordKind, rows: readonly ActionRow[], status: CaseStatus): boolean {
  switch (kind) {
    case "investigation-started":
      return (
        rows.some((entry) => investigationStartedTypes.has(entry.type)) ||
        hasStageMarker(rows, "investigation-started") ||
        !["Received", "Triage"].includes(status)
      );
    case "record-contact":
      return hasSimplifiedRecordContact(rows);
    case "record-worker-contact":
      return hasSimplifiedRecordWorkerContact(rows);
    case "root-cause-analysis":
      return (
        rows.some((entry) => rootCauseTypes.has(entry.type)) || hasStageMarker(rows, "root-cause-analysis")
      );
    case "corrective-action-taken":
      return rows.some((entry) => correctiveTypes.has(entry.type)) || hasStageMarker(rows, "corrective-action-taken");
    case "close-complaint":
      return status === "Closed" || rows.some((entry) => closedTypes.has(entry.type));
    default:
      return false;
  }
}

export function simplifiedStageCompletion(
  actions: readonly ActionRow[] | undefined,
  status: CaseStatus,
): boolean[] {
  const rows = actions ?? [];
  const stages = simplifiedProgressStages(rows);
  return stages.map((stage) => isStageComplete(stage.kind, rows, status));
}

/** Index of the active simplified stage within {@link simplifiedProgressStages}. */
export function simplifiedStageIndex(
  actions: readonly ActionRow[] | undefined,
  status: CaseStatus,
): number {
  const stages = simplifiedProgressStages(actions);
  if (status === "Closed") return Math.max(stages.length - 1, 0);
  const done = simplifiedStageCompletion(actions, status);
  const firstOpen = done.findIndex((complete) => !complete);
  return firstOpen === -1 ? stages.length - 1 : firstOpen;
}

/** Worker complaint timeline: hide optional contact entries until staff records them. */
export function includeInWorkerComplaintTimeline(action: ActionRow): boolean {
  const stage = reasonStage(action.reason as Record<string, unknown> | undefined);
  if (stage === "record-contact" || stage === "record-worker-contact") return true;
  if (optionalContactTimelineTypes.has(action.type)) return false;
  if (recordContactTypes.has(action.type) && stage !== "record-contact") return false;
  return true;
}

export function filterWorkerComplaintTimelineActions<T extends ActionRow>(actions: readonly T[] | undefined): T[] {
  return (actions ?? []).filter(includeInWorkerComplaintTimeline);
}

const reasonSummaryKeys = [
  "summary",
  "rationale",
  "details",
  "reason",
  "note",
  "actualResult",
  "workerVisibleSummary",
] as const;

export function actionSummaryFromReason(reason: Record<string, unknown> | null | undefined): string | undefined {
  if (!reason) return undefined;
  for (const key of reasonSummaryKeys) {
    const value = reason[key];
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
  }
  return undefined;
}

export function actionDetailFromReason(reason: Record<string, unknown> | null | undefined): string | undefined {
  if (!reason) return undefined;
  let main: string | undefined;
  for (const key of reasonSummaryKeys) {
    const value = reason[key];
    if (typeof value === "string" && value.trim().length > 0) {
      main = value.trim();
      break;
    }
  }
  const attached = reason.attachedDocuments;
  if (Array.isArray(attached) && attached.length > 0) {
    const names = attached.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
    if (names.length > 0) {
      const docLine = names.join(", ");
      return main ? `${main}\n${docLine}` : docLine;
    }
  }
  return main;
}

export function actionDetailText(
  action: Pick<CaseAction, "note" | "reason"> & { reason?: Record<string, unknown> },
): string | undefined {
  const reason = action.reason as Record<string, unknown> | undefined;
  if (reason && Object.keys(reason).length > 0) {
    const merged = actionDetailFromReason(reason);
    if (merged) return merged;
  }
  return action.note?.trim() || undefined;
}

export function actionSummaryText(
  action: Pick<CaseAction, "note" | "reason"> & { reason?: Record<string, unknown> },
): string | undefined {
  const reason = action.reason as Record<string, unknown> | undefined;
  if (reason && Object.keys(reason).length > 0) {
    const summary = actionSummaryFromReason(reason);
    if (summary) return summary;
  }
  return action.note?.trim() || undefined;
}
