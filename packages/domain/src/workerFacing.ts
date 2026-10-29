import type { CaseAction } from "./complaint";
import type { CaseActionType, CaseStatus } from "./status";

/** Locale key ids for worker-facing status copy. Strings live in localization files. */
export const workerFacingStatusKey: Record<CaseStatus, string> = {
  Received: "status.worker.received",
  Triage: "status.worker.review",
  Verification: "status.worker.verification",
  Investigation: "status.worker.verification",
  "Action in Progress": "status.worker.action",
  Escalated: "status.worker.escalated",
  "Outcome Verification": "status.worker.outcomeVerification",
  Reopened: "status.worker.reopened",
  Closed: "status.worker.closed",
};

export const workerFacingActionKey: Partial<Record<CaseActionType, string>> = {
  "Complaint Received": "status.action.received",
  "Triage Completed": "status.action.review",
  "Contact Attempted": "status.action.contactAttempted",
  "Contact Successful": "status.action.contactSuccessful",
  "Verified Fact Recorded": "status.action.factVerified",
  "Action Planned": "status.action.action",
  "Action Updated": "status.action.action",
  Escalated: "status.action.escalated",
  "Outcome Recorded": "status.action.outcome",
  "Complaint Closed": "status.action.closed",
  "Complaint Reopened": "status.action.reopened",
  "Worker Feedback Recorded": "status.action.feedback",
  "Review Started": "status.action.review",
  "More Information Requested": "status.action.update",
  "Action Taken": "status.action.action",
  "Proposed Resolution": "status.action.outcome",
  Resolved: "status.action.outcome",
  Closed: "status.action.closed",
  Reopened: "status.action.reopened",
};

export function workerFacingActionLabelKey(type: CaseActionType): string {
  return workerFacingActionKey[type] ?? "status.action.update";
}

export const workerNextStepKey: Record<CaseStatus, string> = {
  Received: "complaints.next.received",
  Triage: "complaints.next.review",
  Verification: "complaints.next.verification",
  Investigation: "complaints.next.verification",
  "Action in Progress": "complaints.next.action",
  Escalated: "complaints.next.escalated",
  "Outcome Verification": "complaints.next.outcomeVerification",
  Reopened: "complaints.next.reopened",
  Closed: "complaints.next.closed",
};

const internalActionTypes = new Set<CaseActionType>([
  "Priority Changed",
  "Internal Note Added",
  "Worker Contact Attempted",
  "Worker Contact Successful",
  "Contact Attempted",
  "Contact Successful",
  "Emergency Contact Override",
  "Verified Fact Recorded",
  "Investigation Finding Recorded",
  "External Referral Recorded",
  "Investigation Finding Added",
  "Referral Recorded",
]);

export function isWorkerVisibleAction(action: CaseAction): boolean {
  if (action.visibility) return action.visibility === "worker-visible";
  return !internalActionTypes.has(action.type);
}
