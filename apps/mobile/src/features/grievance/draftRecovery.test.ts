import { describe, expect, it } from "vitest";

import { getDraftRecoveryFingerprint, shouldOfferDraftRecovery } from "./draftRecovery";

const draft = { id: "draft-1", updatedAt: "2026-08-23T08:00:00.000Z" };

describe("draft recovery prompt", () => {
  it("does not appear until the saved dismissal has loaded", () => {
    expect(shouldOfferDraftRecovery(draft, null, false)).toBe(false);
  });

  it("appears once for a previously unacknowledged draft", () => {
    expect(shouldOfferDraftRecovery(draft, null, true)).toBe(true);
  });

  it("stays hidden after the exact draft version is dismissed", () => {
    expect(shouldOfferDraftRecovery(draft, getDraftRecoveryFingerprint(draft), true)).toBe(false);
  });

  it("can appear once again after the draft is genuinely changed", () => {
    const updatedDraft = { ...draft, updatedAt: "2026-08-23T08:10:00.000Z" };
    expect(shouldOfferDraftRecovery(updatedDraft, getDraftRecoveryFingerprint(draft), true)).toBe(true);
  });

  it("can appear for a newly created draft", () => {
    const newDraft = { ...draft, id: "draft-2" };
    expect(shouldOfferDraftRecovery(newDraft, getDraftRecoveryFingerprint(draft), true)).toBe(true);
  });
});
