import type { CaseActionType, CaseStatus } from "./status";

export const allowedCaseTransitions: Readonly<Record<CaseStatus, readonly CaseStatus[]>> = {
  Received: ["Triage", "Investigation"],
  Triage: ["Verification", "Investigation", "Escalated", "Closed"],
  Verification: ["Investigation", "Escalated", "Closed"],
  Investigation: ["Action in Progress", "Outcome Verification", "Escalated", "Closed"],
  "Action in Progress": ["Outcome Verification", "Investigation", "Escalated", "Closed"],
  "Outcome Verification": ["Action in Progress", "Investigation", "Closed"],
  Escalated: ["Triage", "Investigation", "Action in Progress"],
  Closed: ["Reopened"],
  Reopened: ["Triage"],
};

export class InvalidCaseTransitionError extends Error {
  readonly code = "INVALID_TRANSITION";

  constructor(
    readonly from: CaseStatus,
    readonly to: CaseStatus,
  ) {
    super(`Transition ${from} → ${to} is not allowed.`);
    this.name = "InvalidCaseTransitionError";
  }
}

export class VersionConflictError extends Error {
  readonly code = "VERSION_CONFLICT";

  constructor(readonly currentVersion: number) {
    super("The complaint was changed by another request.");
    this.name = "VersionConflictError";
  }
}

export function canTransitionCase(from: CaseStatus, to: CaseStatus): boolean {
  return allowedCaseTransitions[from].includes(to);
}

export function assertCaseTransition(from: CaseStatus, to: CaseStatus): void {
  if (!canTransitionCase(from, to)) {
    throw new InvalidCaseTransitionError(from, to);
  }
}

/** Closure and reopening always require an auditable human-readable reason. */
export function assertTransitionReason(to: CaseStatus, reason?: { reason?: unknown }): void {
  if (
    (to === "Closed" || to === "Reopened") &&
    (typeof reason?.reason !== "string" || reason.reason.trim().length < 3)
  ) {
    throw new Error(`${to} transitions require a reason.`);
  }
}

export function actionForTransition(to: CaseStatus): CaseActionType {
  switch (to) {
    case "Received":
      return "Complaint Received";
    case "Triage":
      return "Triage Completed";
    case "Verification":
      return "Contact Attempted";
    case "Investigation":
      return "Investigation Finding Recorded";
    case "Escalated":
      return "Escalated";
    case "Outcome Verification":
      return "Outcome Recorded";
    case "Closed":
      return "Complaint Closed";
    case "Reopened":
      return "Complaint Reopened";
    default:
      return "Action Updated";
  }
}
