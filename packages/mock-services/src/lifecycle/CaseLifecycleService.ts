import {
  actionForTransition,
  canTransitionCase,
  InvalidCaseTransitionError,
  type CaseStatus,
  type Complaint,
  type TransitionMeta,
} from "@kapas/domain";

export class InvalidTransitionError extends InvalidCaseTransitionError {}

export type PortalCaseAction =
  | "startReview"
  | "changePriority"
  | "addNote"
  | "recordContact"
  | "addFinding"
  | "recordAction"
  | "escalate"
  | "recordOutcome"
  | "resolve"
  | "close"
  | "reopen";

export const caseLifecycleService = {
  canTransition(from: CaseStatus, to: CaseStatus): boolean {
    return canTransitionCase(from, to);
  },
  availableActions(status: CaseStatus): Record<PortalCaseAction, boolean> {
    const can = (to: CaseStatus) => this.canTransition(status, to);
    return {
      startReview: can("Triage"),
      changePriority: status !== "Closed",
      addNote: true,
      recordContact: status !== "Closed",
      addFinding: ["Investigation", "Action in Progress", "Outcome Verification"].includes(status),
      recordAction: status === "Action in Progress" || can("Action in Progress"),
      escalate:
        ["Triage", "Verification", "Investigation", "Action in Progress"].includes(status),
      recordOutcome: can("Outcome Verification"),
      resolve: can("Closed"),
      close: can("Closed"),
      reopen: can("Reopened"),
    };
  },
  transition(complaint: Complaint, to: CaseStatus, meta: TransitionMeta): Complaint {
    if (!this.canTransition(complaint.status, to)) {
      throw new InvalidTransitionError(complaint.status, to);
    }
    return {
      ...complaint,
      status: to,
      updatedAt: meta.at,
      actions: [
        ...complaint.actions,
        {
          id: `${meta.at}-${to}-${Math.random().toString(36).slice(2, 8)}`,
          type: actionForTransition(to),
          at: meta.at,
          actorRole: meta.actorRole,
          note: meta.note,
          visibility: meta.visibility ?? "worker-visible",
        },
      ],
    };
  },
};
