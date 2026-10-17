import type { CaseStatus, Complaint, TransitionMeta } from "@kapas/domain";

const allowed: ReadonlyArray<readonly [CaseStatus, CaseStatus]> = [
  ["Draft", "Submitted"],
  ["Submitted", "Under Review"],
  ["Under Review", "Action in Progress"],
  ["Action in Progress", "Proposed Resolution"],
  ["Proposed Resolution", "Resolved"],
  ["Proposed Resolution", "Action in Progress"],
  ["Resolved", "Reopened"],
  ["Resolved", "Closed"],
  ["Closed", "Reopened"],
  ["Reopened", "Under Review"],
];

export class InvalidTransitionError extends Error {
  constructor(from: CaseStatus, to: CaseStatus) {
    super(`Transition ${from} → ${to} is not allowed.`);
    this.name = "InvalidTransitionError";
  }
}

export type PortalCaseAction =
  | "startReview"
  | "changePriority"
  | "addNote"
  | "recordContact"
  | "requestInformation"
  | "addFinding"
  | "recordAction"
  | "escalate"
  | "proposeResolution"
  | "resolve"
  | "close"
  | "reopen";

export const caseLifecycleService = {
  canTransition(from: CaseStatus, to: CaseStatus): boolean {
    return allowed.some(([a, b]) => a === from && b === to);
  },
  availableActions(status: CaseStatus): Record<PortalCaseAction, boolean> {
    const can = (to: CaseStatus) => this.canTransition(status, to);
    return {
      startReview: can("Under Review"),
      changePriority: status !== "Draft" && status !== "Closed",
      addNote: status !== "Draft",
      recordContact: status !== "Draft" && status !== "Closed",
      requestInformation: status === "Under Review" || status === "Action in Progress" || status === "Proposed Resolution",
      addFinding:
        status === "Under Review" ||
        status === "Action in Progress" ||
        status === "Proposed Resolution",
      recordAction: status === "Action in Progress" || can("Action in Progress"),
      escalate: status === "Submitted" || status === "Under Review" || status === "Action in Progress",
      proposeResolution: can("Proposed Resolution"),
      resolve: can("Resolved"),
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
          type:
            to === "Submitted"
              ? "Complaint Received"
              : to === "Under Review"
                ? "Review Started"
                : to === "Proposed Resolution"
                  ? "Proposed Resolution"
                  : to === "Resolved"
                    ? "Resolved"
                    : to === "Closed"
                      ? "Closed"
                      : to === "Reopened"
                        ? "Reopened"
                        : "Action Taken",
          at: meta.at,
          actorRole: meta.actorRole,
          note: meta.note,
          visibility: meta.visibility ?? "worker-visible",
        },
      ],
    };
  },
};
