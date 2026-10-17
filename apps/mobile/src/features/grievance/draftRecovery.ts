import type { ComplaintDraft } from "@kapas/domain";

type RecoverableDraft = Pick<ComplaintDraft, "id" | "updatedAt">;

export function getDraftRecoveryFingerprint(draft: RecoverableDraft): string {
  return `${draft.id}:${draft.updatedAt}`;
}

export function shouldOfferDraftRecovery(
  draft: RecoverableDraft | null | undefined,
  dismissedFingerprint: string | null | undefined,
  dismissalLoaded: boolean,
): boolean {
  if (!dismissalLoaded || !draft) return false;
  return getDraftRecoveryFingerprint(draft) !== dismissedFingerprint;
}
