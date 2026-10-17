export const caseStatuses = [
  "Draft",
  "Submitted",
  "Under Review",
  "Action in Progress",
  "Proposed Resolution",
  "Resolved",
  "Reopened",
  "Closed",
] as const;
export type CaseStatus = (typeof caseStatuses)[number];

export const terminalStatuses: readonly CaseStatus[] = ["Resolved", "Closed"];

export const caseActionTypes = [
  "Review Started",
  "Priority Changed",
  "Internal Note Added",
  "Worker Contact Attempted",
  "Worker Contact Successful",
  "More Information Requested",
  "Evidence Added",
  "Investigation Finding Added",
  "Action Taken",
  "Referral Recorded",
  "Escalated",
  "Proposed Resolution",
  "Resolved",
  "Closed",
  "Reopened",
  "Worker Feedback Recorded",
  "Complaint Received",
] as const;
export type CaseActionType = (typeof caseActionTypes)[number];
