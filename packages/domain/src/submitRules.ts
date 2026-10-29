import type { ComplaintDraft } from "./complaint";

export type ComplaintValidationCode =
  | "identity_required"
  | "category_required"
  | "privacy_required"
  | "contact_preference_required"
  | "incident_time_required"
  | "affected_workers_required"
  | "danger_required"
  | "location_required";

export type ComplaintValidationResult =
  | { valid: true }
  | { valid: false; code: ComplaintValidationCode; stepId: string; field?: string };

export function validateComplaintDraft(draft: ComplaintDraft): ComplaintValidationResult {
  if (!draft.privacyMode || !["ANON", "CONF", "IDEN"].includes(draft.privacyMode))
    return { valid: false, code: "privacy_required", stepId: "identity", field: "privacyMode" };
  const identityComplete = draft.privacyMode === "ANON"
    ? draft.reporterIdentity?.mode === "anonymous"
    : (draft.reporterIdentity?.mode === "cnic" && draft.reporterIdentity.cnicLast4.length === 4 && draft.reporterIdentity.phoneLast4.length === 4)
      || (draft.reporterIdentity?.mode === "phone" && draft.reporterIdentity.phoneLast4.length === 4);
  if (!identityComplete) return { valid: false, code: "identity_required", stepId: "identity", field: "reporterIdentity" };
  if (!draft.category) return { valid: false, code: "category_required", stepId: "category", field: "category" };
  const contactPreference = draft.incident.structuredAnswers?.contactPreference;
  if (draft.privacyMode !== "ANON" && !["call", "message", "either", "do-not-initiate"].includes(String(contactPreference)))
    return { valid: false, code: "contact_preference_required", stepId: "contact", field: "contactPreference" };
  if (!draft.incident.whenLabel) return { valid: false, code: "incident_time_required", stepId: "when", field: "whenLabel" };
  if (!draft.incident.othersAffected) return { valid: false, code: "affected_workers_required", stepId: "others", field: "othersAffected" };
  if (typeof draft.incident.immediateDanger !== "boolean") return { valid: false, code: "danger_required", stepId: "danger", field: "immediateDanger" };
  const locationComplete = draft.location.source === "device"
    ? Boolean(draft.location.exactCoordinates && draft.location.province && draft.location.district)
    : Boolean(draft.location.province && draft.location.district && draft.location.placeLabel);
  if (!locationComplete) return { valid: false, code: "location_required", stepId: draft.location.source === "device" ? "where-current" : "where-province", field: "location" };
  return { valid: true };
}

export function canSubmitDraft(draft: ComplaintDraft): boolean {
  return validateComplaintDraft(draft).valid;
}
