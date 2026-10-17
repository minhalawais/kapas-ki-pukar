import type { CaseStatus, Complaint, ComplaintFilters, Priority } from "@kapas/domain";
import { persistenceKeys, workerFacingActionLabelKey } from "@kapas/domain";

import type { DashboardFilterDraft } from "@/components/complaints/FilterBar";

export const emptyFilters = (): DashboardFilterDraft => ({
  search: "",
  category: "",
  status: "",
  priority: "",
  province: "",
  privacy: "",
  from: "",
  to: "",
});

export function toComplaintFilters(draft: DashboardFilterDraft): ComplaintFilters {
  return {
    search: draft.search.trim() || undefined,
    category: draft.category ? [draft.category] : undefined,
    status: draft.status ? [draft.status] : undefined,
    priority: draft.priority ? [draft.priority] : undefined,
    province: draft.province ? [draft.province] : undefined,
    privacyMode: draft.privacy ? [draft.privacy] : undefined,
    from: draft.from || undefined,
    to: draft.to || undefined,
  };
}

export function hasActiveFilters(draft: DashboardFilterDraft): boolean {
  return Object.values(draft).some((value) => value.length > 0);
}

export function readStoredFilters(): DashboardFilterDraft {
  if (typeof window === "undefined") {
    return emptyFilters();
  }
  try {
    const raw = window.localStorage.getItem(persistenceKeys.filters);
    if (!raw) {
      return emptyFilters();
    }
    return { ...emptyFilters(), ...(JSON.parse(raw) as Partial<DashboardFilterDraft>) };
  } catch {
    return emptyFilters();
  }
}

export function writeStoredFilters(draft: DashboardFilterDraft): void {
  window.localStorage.setItem(persistenceKeys.filters, JSON.stringify(draft));
}

export function locationLabel(complaint: Complaint): string {
  return [
    complaint.location.placeLabel ?? complaint.location.villageLabel ?? complaint.location.village,
    complaint.location.district,
    complaint.location.province,
  ].filter(Boolean).join(", ");
}

export type QueueKind = "attention" | "emergency" | "overdue" | "awaiting" | "new" | "all";

const CLOSED = new Set<CaseStatus>(["Resolved", "Closed"]);

export function matchesQueue(complaint: Complaint, queue: QueueKind): boolean {
  if (queue === "all") return true;
  if (queue === "emergency") return complaint.priority === "Emergency" || complaint.priority === "Critical";
  if (queue === "overdue") return complaint.overdue && !CLOSED.has(complaint.status);
  if (queue === "awaiting") return complaint.actions.some((action) => action.type === "More Information Requested") && !CLOSED.has(complaint.status);
  if (queue === "new") return complaint.status === "Submitted";
  return (
    complaint.overdue ||
    complaint.priority === "Emergency" ||
    complaint.priority === "Critical" ||
    complaint.status === "Submitted" ||
    complaint.status === "Reopened"
  );
}

const priorityRank: Record<Priority, number> = { Emergency: 0, Critical: 1, High: 2, Standard: 3 };

export function triageSort(a: Complaint, b: Complaint): number {
  const rank = (row: Complaint) => {
    if (row.priority === "Emergency") return 0;
    if (row.overdue && !CLOSED.has(row.status)) return 1;
    if (row.priority === "Critical") return 2;
    if (row.actions.some((action) => action.type === "More Information Requested") && !CLOSED.has(row.status)) return 3;
    if (row.status === "Submitted" || row.status === "Reopened") return 4;
    return 5 + priorityRank[row.priority];
  };
  return rank(a) - rank(b) || b.updatedAt.localeCompare(a.updatedAt);
}

export function queueCounts(rows: Complaint[]): Record<QueueKind, number> {
  return {
    attention: rows.filter((row) => matchesQueue(row, "attention")).length,
    emergency: rows.filter((row) => matchesQueue(row, "emergency")).length,
    overdue: rows.filter((row) => matchesQueue(row, "overdue")).length,
    awaiting: rows.filter((row) => matchesQueue(row, "awaiting")).length,
    new: rows.filter((row) => matchesQueue(row, "new")).length,
    all: rows.length,
  };
}

export function lastActionKey(complaint: Complaint): string {
  const latest = complaint.actions[complaint.actions.length - 1];
  if (!latest) {
    return "status.action.update";
  }
  return workerFacingActionLabelKey(latest.type);
}

export function priorityClass(priority: Priority): string {
  if (priority === "Emergency") {
    return "text-critical";
  }
  if (priority === "Critical") {
    return "text-warning";
  }
  if (priority === "High") {
    return "text-info";
  }
  return "text-muted";
}

export function statusLabelKey(status: CaseStatus): string {
  return `portal.status.${status}`;
}
