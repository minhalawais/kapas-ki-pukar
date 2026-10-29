import {
  simplifiedStageIndex,
  workerFacingStatusKey,
  workerNextStepKey,
  type CaseStatus,
} from "@kapas/domain";

import type { TrackedComplaint } from "../../services/workerApi";

export type ComplaintFilter = "all" | "attention" | "active" | "complete";

const completedStatuses = new Set<CaseStatus>(["Closed"]);
export function isComplaintComplete(complaint: TrackedComplaint): boolean {
  return completedStatuses.has(complaint.status);
}

export function complaintNeedsAttention(complaint: TrackedComplaint): boolean {
  return complaint.status === "Outcome Verification"
    || complaint.overdue
    || complaint.incident.currentDanger;
}

export function filterComplaints(complaints: TrackedComplaint[], filter: ComplaintFilter): TrackedComplaint[] {
  if (filter === "attention") return complaints.filter(complaintNeedsAttention);
  if (filter === "active") return complaints.filter((item) => !isComplaintComplete(item));
  if (filter === "complete") return complaints.filter(isComplaintComplete);
  return complaints;
}

export function complaintProgress(complaint: TrackedComplaint): number {
  return simplifiedStageIndex(complaint.actions ?? [], complaint.status);
}

export function complaintStatusTone(complaint: TrackedComplaint): "progress" | "success" | "offline" | "critical" {
  if (isComplaintComplete(complaint)) return "success";
  if (complaintNeedsAttention(complaint)) return "critical";
  return "progress";
}

export function latestComplaintDate(complaint: TrackedComplaint): string {
  return complaint.actions.at(-1)?.at ?? complaint.updatedAt;
}

export function formatComplaintDate(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return new Intl.DateTimeFormat(locale === "ur" ? "ur-PK" : "en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function complaintLocation(complaint: TrackedComplaint): string {
  const location = complaint.location;
  return [location.villageLabel, location.district, location.province]
    .filter(Boolean)
    .join(", ");
}

export function complaintNextStepKey(status: CaseStatus): string {
  return workerNextStepKey[status];
}

export function complaintWorkerStatusKey(complaint: TrackedComplaint): string {
  return workerFacingStatusKey[complaint.status];
}

export function complaintWorkerNextStepKey(complaint: TrackedComplaint): string {
  return workerNextStepKey[complaint.status];
}

export function formatRelativeListRefresh(updatedAtMs: number, locale: "en" | "ur"): string {
  const diffMs = Date.now() - updatedAtMs;
  if (diffMs < 45_000) {
    return locale === "ur" ? "ابھی تازہ" : "Updated just now";
  }
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) {
    return locale === "ur" ? `${minutes} منٹ پہلے` : `Updated ${minutes} min ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return locale === "ur" ? `${hours} گھنٹے پہلے` : `Updated ${hours} h ago`;
  }
  return locale === "ur" ? "تازہ ترین فہرست" : "List refreshed";
}
