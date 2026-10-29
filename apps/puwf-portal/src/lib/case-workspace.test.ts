import type { CaseAction } from "@kapas/domain";
import { describe, expect, it } from "vitest";


import {
  protectedAudioSrc,
  eventLabelKey,
  formatDuration,
  impactLabelKey,
  sortedTimeline,
  timelineAttachmentsForAction,
  whenLabelMessageKey,
} from "./case-workspace";

describe("case workspace helpers", () => {
  it("only accepts protected or explicit media URLs", () => {
    expect(protectedAudioSrc("asset://demo-audio/KP-26-000101.m4a")).toBeUndefined();
    expect(protectedAudioSrc("/api/v1/evidence/1")).toBe("/api/v1/evidence/1");
    expect(protectedAudioSrc(undefined)).toBeUndefined();
  });

  it("hides corrective attachment evidence rows from the timeline", () => {
    const actions = [
      { id: "1", type: "Action Taken", at: "2026-10-28T10:00:00.000Z", actorRole: "puwf-grievance-manager" },
      {
        id: "2",
        type: "Evidence Added",
        at: "2026-10-28T10:00:01.000Z",
        actorRole: "puwf-grievance-manager",
        reason: { source: "staff-corrective-upload" },
      },
      {
        id: "3",
        type: "Evidence Added",
        at: "2026-10-28T10:00:02.000Z",
        actorRole: "puwf-grievance-manager",
        reason: { targetType: "corrective-action" },
      },
    ] as CaseAction[];
    expect(sortedTimeline(actions).map((row) => row.id)).toEqual(["1"]);
  });

  it("resolves corrective attachments for timeline modal", () => {
    const action = {
      id: "a1",
      type: "Action Taken",
      at: "2026-10-28T10:00:00.000Z",
      actorRole: "puwf-grievance-manager",
      reason: { attachedEvidenceIds: ["ev-1"], attachedDocuments: ["letter.pdf"] },
    } as CaseAction;
    const files = timelineAttachmentsForAction(
      action,
      [{ id: "ev-1", fileName: "letter.pdf", localUri: "/content/1", kind: "document" }],
      "KP-TEST",
    );
    expect(files).toEqual([{ id: "ev-1", label: "letter.pdf", href: "/content/1", kind: "document" }]);
  });

  it("formats duration and maps event and impact keys", () => {
    expect(formatDuration(42000)).toBe("0:42");
    expect(eventLabelKey("Review Started")).toBe("portal.case.event.reviewStarted");
    expect(impactLabelKey("2-5")).toBe("range.2-5");
    expect(impactLabelKey(undefined)).toBeNull();
  });

  it("maps canonical when labels to locale keys", () => {
    expect(whenLabelMessageKey("older")).toBe("when.older");
    expect(whenLabelMessageKey("2026-01-01")).toBeNull();
  });
});
