export type ComplaintCompletionStatus =
  | "complaint_pending"
  | "evidence_pending"
  | "action_required"
  | "completed";

export interface CompletionMediaState {
  state: "pending" | "uploading" | "processing" | "uploaded" | "rejected" | "missing";
}

export function complaintCompletionStatus(
  referenceNumber: string | undefined,
  blocked: boolean,
  media: readonly CompletionMediaState[],
): ComplaintCompletionStatus {
  if (blocked || media.some((item) => item.state === "missing" || item.state === "rejected"))
    return "action_required";
  if (!referenceNumber) return "complaint_pending";
  return media.every((item) => item.state === "uploaded") ? "completed" : "evidence_pending";
}
