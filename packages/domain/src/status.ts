export const caseStatuses = [
  "Received",
  "Triage",
  "Verification",
  "Investigation",
  "Action in Progress",
  "Escalated",
  "Outcome Verification",
  "Reopened",
  "Closed",
] as const;
export type CaseStatus = (typeof caseStatuses)[number];

export const terminalStatuses: readonly CaseStatus[] = ["Closed"];

export const caseActionTypes = [
  "Triage Completed",
  "Priority Changed",
  "Internal Note Added",
  "Contact Attempted",
  "Contact Successful",
  "Emergency Contact Override",
  "Verified Fact Recorded",
  "Evidence Added",
  "Investigation Finding Recorded",
  "Action Planned",
  "Action Updated",
  "External Referral Recorded",
  "Escalated",
  "Outcome Recorded",
  "Complaint Closed",
  "Complaint Reopened",
  "Worker Feedback Recorded",
  "Complaint Received",
  // Legacy values remain renderable for immutable historical records.
  "Review Started",
  "Worker Contact Attempted",
  "Worker Contact Successful",
  "More Information Requested",
  "Investigation Finding Added",
  "Action Taken",
  "Referral Recorded",
  "Proposed Resolution",
  "Resolved",
  "Closed",
  "Reopened",
  "Assignment Changed",
] as const;
export type CaseActionType = (typeof caseActionTypes)[number];

export const caseActionVisibilities = ["internal", "worker-visible"] as const;
export type CaseActionVisibility = (typeof caseActionVisibilities)[number];

export const actorTypes = ["worker", "staff", "system"] as const;
export type ActorType = (typeof actorTypes)[number];
