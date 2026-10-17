import { describe, expect, it } from "vitest";

import { demoAudioSrc, eventLabelKey, formatDuration, impactLabelKey } from "./case-workspace";

describe("case workspace helpers", () => {
  it("maps bundled demo audio URIs to the portal worker audio", () => {
    expect(demoAudioSrc("asset://demo-audio/KP-26-000101.m4a")).toBe("/demo-audio/worker-statement.mp3");
    expect(demoAudioSrc("/local.wav")).toBe("/local.wav");
    expect(demoAudioSrc(undefined)).toBe("/demo-audio/worker-statement.mp3");
  });

  it("formats duration and maps event and impact keys", () => {
    expect(formatDuration(42000)).toBe("0:42");
    expect(eventLabelKey("Review Started")).toBe("portal.case.event.reviewStarted");
    expect(impactLabelKey("2-5")).toBe("range.2-5");
    expect(impactLabelKey(undefined)).toBeNull();
  });
});
