import { describe, expect, it } from "vitest";

import {
  isValidExpoPushToken,
  pushDeliveryPermitted,
  resolveNotificationLocale,
} from "./pushNotifications";

describe("pushNotifications", () => {
  it("accepts Expo push token shapes", () => {
    expect(isValidExpoPushToken("ExpoPushToken[abc-def-123]")).toBe(true);
    expect(isValidExpoPushToken("ExponentPushToken[legacy]")).toBe(true);
    expect(isValidExpoPushToken("phone-number")).toBe(false);
    expect(isValidExpoPushToken("")).toBe(false);
  });

  it("requires at least one active registration", () => {
    expect(pushDeliveryPermitted({ activeRegistrationCount: 0 })).toBe(false);
    expect(pushDeliveryPermitted({ activeRegistrationCount: 1 })).toBe(true);
  });

  it("normalizes locale to en or ur", () => {
    expect(resolveNotificationLocale("ur-PK", null)).toBe("ur");
    expect(resolveNotificationLocale(null, "en-US")).toBe("en");
    expect(resolveNotificationLocale(undefined, undefined)).toBe("en");
  });
});
