import { workerFacingStatusKey, workerNextStepKey, type CaseStatus, type Complaint } from "@kapas/domain";

export type ComplaintFilter = "all" | "attention" | "active" | "complete";

const completedStatuses = new Set<CaseStatus>(["Resolved", "Closed"]);

function hasInformationRequest(complaint: Complaint): boolean {
  return complaint.actions?.some((action) => action.type === "More Information Requested") ?? false;
}

export function isComplaintComplete(complaint: Complaint): boolean {
  return completedStatuses.has(complaint.status);
}

export function complaintNeedsAttention(complaint: Complaint): boolean {
  return complaint.status === "Draft"
    || complaint.status === "Proposed Resolution"
    || hasInformationRequest(complaint)
    || complaint.overdue
    || complaint.incident.currentDanger;
}

export function filterComplaints(complaints: Complaint[], filter: ComplaintFilter): Complaint[] {
  if (filter === "attention") return complaints.filter(complaintNeedsAttention);
  if (filter === "active") return complaints.filter((item) => !isComplaintComplete(item));
  if (filter === "complete") return complaints.filter(isComplaintComplete);
  return complaints;
}

export function complaintProgress(status: CaseStatus): number {
  if (["Submitted", "Draft"].includes(status)) return 0;
  if (status === "Under Review") return 1;
  if (["Action in Progress", "Reopened"].includes(status)) return 2;
  return 3;
}

export function complaintStatusTone(complaint: Complaint): "progress" | "success" | "offline" | "critical" {
  if (isComplaintComplete(complaint)) return "success";
  if (complaint.status === "Draft") return "offline";
  if (complaintNeedsAttention(complaint)) return "critical";
  return "progress";
}

export function latestComplaintDate(complaint: Complaint): string {
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

export function complaintLocation(complaint: Complaint): string {
  const location = complaint.location;
  return location.formattedAddress
    ?? [location.placeLabel ?? location.villageLabel ?? location.village, location.district, location.province]
      .filter(Boolean)
      .join(", ");
}

export function complaintNextStepKey(status: CaseStatus): string {
  return workerNextStepKey[status];
}

export function complaintWorkerStatusKey(complaint: Complaint): string {
  if (hasInformationRequest(complaint) && !isComplaintComplete(complaint)) {
    return "status.worker.needInfo";
  }
  return workerFacingStatusKey[complaint.status];
}

export function complaintWorkerNextStepKey(complaint: Complaint): string {
  if (hasInformationRequest(complaint) && !isComplaintComplete(complaint)) {
    return "complaints.next.awaiting";
  }
  return workerNextStepKey[complaint.status];
}
