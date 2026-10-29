import { afterEach, describe, expect, it, vi } from "vitest";

import { ExpoPushNotificationAdapter } from "./notification";

describe("Expo push adapter", () => {
  afterEach(() => vi.restoreAllMocks());

  it("blocks unsafe or non-Expo destinations without a network call", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const adapter = new ExpoPushNotificationAdapter({ enabled: true });
    await expect(
      adapter.send({
        channel: "push",
        templateId: "case-update",
        templateVersion: "v1",
        locale: "en",
        destinationRef: "phone-number",
        reason: "case-update",
        contactAllowed: true,
        safeChannel: true,
        optional: true,
      }),
    ).resolves.toEqual({ state: "unknown" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("maps an Expo ticket to an accepted delivery", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ data: { status: "ok", id: "ticket-1" } }), { status: 200 }),
    );
    const adapter = new ExpoPushNotificationAdapter({ enabled: true });
    await expect(
      adapter.send({
        channel: "push",
        templateId: "case-update",
        templateVersion: "v1",
        locale: "en",
        destinationRef: "ExpoPushToken[test]",
        reason: "case-update",
        contactAllowed: true,
        safeChannel: true,
        optional: true,
      }),
    ).resolves.toEqual({ state: "accepted", providerMessageId: "ticket-1" });
  });
});
