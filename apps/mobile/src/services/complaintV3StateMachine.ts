import type { AttachmentDeliveryState } from "./complaintV3Database";

const transitions: Readonly<Record<AttachmentDeliveryState, readonly AttachmentDeliveryState[]>> = {
  staged: ["pending_allocation", "omitted"],
  pending_allocation: ["allocated", "retry_wait", "action_required", "omitted"],
  allocated: ["uploading", "pending_allocation", "retry_wait", "action_required", "omitted"],
  uploading: ["uploading", "server_processing", "pending_allocation", "retry_wait", "action_required", "omitted"],
  server_processing: ["server_processing", "available", "retry_wait", "action_required", "omitted"],
  available: ["available"],
  retry_wait: ["pending_allocation", "allocated", "uploading", "server_processing", "action_required", "omitted"],
  action_required: ["action_required", "omitted"],
  omitted: ["omitted"],
};

export function canTransitionAttachment(from: AttachmentDeliveryState, to: AttachmentDeliveryState) {
  return from === to || transitions[from].includes(to);
}

export function assertAttachmentTransition(from: AttachmentDeliveryState, to: AttachmentDeliveryState) {
  if (!canTransitionAttachment(from, to)) throw new Error(`invalid_attachment_transition:${from}:${to}`);
}
