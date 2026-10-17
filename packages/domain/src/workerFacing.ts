import type { CaseAction } from "./complaint";
import type { CaseActionType, CaseStatus } from "./status";

/** Locale key ids for worker-facing status copy. Strings live in localization files. */
export const workerFacingStatusKey: Record<CaseStatus, string> = {
  Draft: "status.worker.savedOnDevice",
  Submitted: "status.worker.received",
  "Under Review": "status.worker.review",
  "Action in Progress": "status.worker.action",
  "Proposed Resolution": "status.worker.proposed",
  Resolved: "status.worker.resolved",
  Reopened: "status.worker.reopened",
  Closed: "status.worker.closed",
};

export const workerFacingActionKey: Partial<Record<CaseActionType, string>> = {
  "Complaint Received": "status.action.received",
  "Review Started": "status.action.review",
  "More Information Requested": "status.action.needInfo",
  "Action Taken": "status.action.action",
  Escalated: "status.action.escalated",
  "Proposed Resolution": "status.action.proposed",
  Resolved: "status.action.resolved",
  Closed: "status.action.closed",
  Reopened: "status.action.reopened",
  "Worker Feedback Recorded": "status.action.feedback",
};

export function workerFacingActionLabelKey(type: CaseActionType): string {
  return workerFacingActionKey[type] ?? "status.action.update";
}

export const workerNextStepKey: Record<CaseStatus, string> = {
  Draft: "complaints.next.draft",
  Submitted: "complaints.next.received",
  "Under Review": "complaints.next.review",
  "Action in Progress": "complaints.next.action",
  "Proposed Resolution": "complaints.next.proposed",
  Resolved: "complaints.next.resolved",
  Reopened: "complaints.next.reopened",
  Closed: "complaints.next.closed",
};

const internalActionTypes = new Set<CaseActionType>([
  "Priority Changed",
  "Internal Note Added",
  "Worker Contact Attempted",
  "Worker Contact Successful",
  "Investigation Finding Added",
  "Referral Recorded",
]);

export function isWorkerVisibleAction(action: CaseAction): boolean {
  if (action.visibility) return action.visibility === "worker-visible";
  return !internalActionTypes.has(action.type);
}
