import { describe, expect, it } from "vitest";

import {
  expoPushTokenFingerprint,
  parseWorkerPushRegistrationBody,
} from "./worker-push-registration";

describe("worker push registration", () => {
  it("fingerprints tokens deterministically", () => {
    expect(expoPushTokenFingerprint("ExpoPushToken[abc]")).toHaveLength(64);
    expect(expoPushTokenFingerprint("ExpoPushToken[abc]")).toBe(
      expoPushTokenFingerprint("ExpoPushToken[abc]"),
    );
  });

  it("validates registration payloads", () => {
    expect(
      parseWorkerPushRegistrationBody({
        expoPushToken: "ExpoPushToken[device-1]",
        platform: "android",
        requestId: "req-1",
      }),
    ).toMatchObject({ platform: "android" });
    expect(parseWorkerPushRegistrationBody({ platform: "android" })).toEqual({
      error: "expoPushToken is invalid",
    });
  });
});
