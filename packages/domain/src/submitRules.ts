import type { ComplaintDraft } from "./complaint";

export function canSubmitDraft(draft: ComplaintDraft): boolean {
  const identityComplete = draft.reporterIdentity?.mode === "anonymous"
    || (draft.reporterIdentity?.mode === "cnic" && draft.reporterIdentity.cnicLast4.length === 4)
    || (draft.reporterIdentity?.mode === "phone" && draft.reporterIdentity.phoneLast4.length === 4);
  const locationComplete = draft.location.source === "device"
    ? Boolean(draft.location.exactCoordinates)
    : Boolean(draft.location.province && draft.location.district && draft.location.placeLabel);

  return Boolean(
    identityComplete
    && draft.category
    && draft.privacyMode
    && draft.incident.whenLabel
    && draft.incident.othersAffected
    && typeof draft.incident.immediateDanger === "boolean"
    && locationComplete,
  );
}
