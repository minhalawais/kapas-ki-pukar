import type {
  ActionInput,
  CaseAction,
  CaseStatus,
  Complaint,
  ComplaintFilters,
  ContactAction,
  Priority,
  ResolutionInput,
} from "@kapas/domain";
import { withDerivedFields } from "@kapas/domain";

import { filterComplaints } from "./analyticsSelectors";
import { InvalidTransitionError, caseLifecycleService } from "./lifecycle/CaseLifecycleService";
import { getPortalRepository } from "./runtime";

function nowIso(): string {
  return new Date().toISOString();
}

function actionId(type: string, at: string): string {
  return `${at}-${type}-${Math.random().toString(36).slice(2, 8)}`;
}

function appendAction(
  complaint: Complaint,
  type: CaseAction["type"],
  note: string | undefined,
  at: string,
  visibility: CaseAction["visibility"] = "internal",
): Complaint {
  return {
    ...complaint,
    updatedAt: at,
    actions: [
      ...complaint.actions,
      {
        id: actionId(type, at),
        type,
        at,
        actorRole: "puwf-grievance-manager",
        note,
        visibility,
      },
    ],
  };
}

async function mutate(
  id: string,
  to: CaseStatus | null,
  apply: (complaint: Complaint) => Complaint,
  note?: string,
): Promise<Complaint> {
  const repo = getPortalRepository();
  const current = await repo.get(id);
  if (!current) {
    throw new Error(`Complaint ${id} was not found.`);
  }
  const at = nowIso();
  const nextBase = to
    ? caseLifecycleService.transition(current, to, {
        at,
        actorRole: "puwf-grievance-manager",
        note,
      })
    : current;
  const next = withDerivedFields(apply(nextBase));
  await repo.save(next);
  return next;
}

export const caseManagementService = {
  async list(filters?: ComplaintFilters): Promise<Complaint[]> {
    const rows = await getPortalRepository().list();
    return filterComplaints(rows, filters);
  },
  async get(id: string): Promise<Complaint | null> {
    return getPortalRepository().get(id);
  },
  startReview(id: string): Promise<Complaint> {
    return mutate(id, "Triage", (c) => c);
  },
  changePriority(id: string, priority: Priority, reason?: string): Promise<Complaint> {
    return mutate(id, null, (c) => {
      const at = nowIso();
      return appendAction({ ...c, priority, updatedAt: at }, "Priority Changed", reason, at);
    });
  },
  addNote(id: string, note: string): Promise<Complaint> {
    return mutate(id, null, (c) => appendAction(c, "Internal Note Added", note, nowIso()));
  },
  recordContact(id: string, data: ContactAction): Promise<Complaint> {
    return mutate(id, null, (c) =>
      appendAction(c, "Contact Attempted", data.note ?? data.channel, nowIso()),
    );
  },
  addFinding(id: string, finding: string): Promise<Complaint> {
    return mutate(id, null, (c) => appendAction(c, "Investigation Finding Recorded", finding, nowIso()));
  },
  recordAction(id: string, action: ActionInput): Promise<Complaint> {
    return mutate(id, null, (c) => {
      const at = nowIso();
      const note = `${action.type}: ${action.note}`;
      if (c.status === "Triage") {
        const investigated = caseLifecycleService.transition(c, "Investigation", {
          at,
          actorRole: "puwf-grievance-manager",
          note: "Mock triage completed",
        });
        return caseLifecycleService.transition(investigated, "Action in Progress", {
          at,
          actorRole: "puwf-grievance-manager",
          note,
        });
      }
      if (c.status === "Investigation") {
        return caseLifecycleService.transition(c, "Action in Progress", {
          at,
          actorRole: "puwf-grievance-manager",
          note,
        });
      }
      return appendAction(c, "Action Updated", note, at, "worker-visible");
    });
  },
  escalate(id: string, reason: string): Promise<Complaint> {
    return mutate(id, null, (c) => appendAction(c, "Escalated", reason, nowIso(), "worker-visible"));
  },
  proposeResolution(id: string, resolution: ResolutionInput): Promise<Complaint> {
    const at = nowIso();
    return mutate(
      id,
      "Outcome Verification",
      (c) => ({
        ...c,
        resolution: { summary: resolution.summary, proposedAt: at },
      }),
      resolution.summary,
    );
  },
  resolve(id: string, note?: string): Promise<Complaint> {
    const at = nowIso();
    return mutate(
      id,
      "Closed",
      (c) => ({
        ...c,
        resolution: {
          summary: c.resolution?.summary ?? note ?? "Recorded",
          proposedAt: c.resolution?.proposedAt,
          resolvedAt: at,
        },
      }),
      note,
    );
  },
  close(id: string, reason: string): Promise<Complaint> {
    return mutate(id, "Closed", (c) => c, reason);
  },
  reopen(id: string, reason: string): Promise<Complaint> {
    return mutate(id, "Reopened", (c) => c, reason);
  },
};

export { InvalidTransitionError };
