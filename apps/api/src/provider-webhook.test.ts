import { createHmac } from "node:crypto";

import { describe, expect, it } from "vitest";

import { verifyProviderWebhookSignature } from "./provider-webhook.controller";

describe("provider webhook signatures", () => {
  it("accepts a current signed payload", () => {
    const secret = "provider-secret";
    const timestamp = String(Math.floor(Date.now() / 1_000));
    const raw = Buffer.from('{"type":"delivered"}');
    const signature = createHmac("sha256", secret)
      .update(`${timestamp}.${raw.toString("utf8")}`)
      .digest("hex");
    expect(verifyProviderWebhookSignature(secret, `sha256=${signature}`, timestamp, raw)).toBe(
      true,
    );
  });

  it("rejects forged and replayed payloads", () => {
    const raw = Buffer.from("{}");
    expect(
      verifyProviderWebhookSignature(
        "secret",
        "sha256=bad",
        String(Math.floor(Date.now() / 1_000)),
        raw,
      ),
    ).toBe(false);
    expect(
      verifyProviderWebhookSignature(
        "secret",
        "sha256=bad",
        String(Math.floor(Date.now() / 1_000) - 600),
        raw,
      ),
    ).toBe(false);
  });
});
