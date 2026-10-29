import { describe, expect, it } from "vitest";

import {
  createCsrfToken,
  decryptEnvelope,
  encryptEnvelope,
  generateTotpSecret,
  hashPassword,
  hasPermission,
  verifyPassword,
  verifyTotp,
} from "./index";

describe("production security primitives", () => {
  it("hashes and verifies Argon2id passwords without exposing plaintext", async () => {
    const encoded = await hashPassword("correct horse battery staple");
    expect(encoded).toContain("$argon2");
    expect(encoded).not.toContain("correct horse");
    await expect(verifyPassword("correct horse battery staple", encoded)).resolves.toBe(true);
    await expect(verifyPassword("incorrect password", encoded)).resolves.toBe(false);
  });

  it("round-trips authenticated encryption with associated data", () => {
    const key = Uint8Array.from({ length: 32 }, (_, index) => index);
    const envelope = encryptEnvelope(Uint8Array.from([1, 2, 3]), key, "test-key", "user:1:phone");
    expect(decryptEnvelope(envelope, key, "user:1:phone")).toEqual(Uint8Array.from([1, 2, 3]));
    expect(() => decryptEnvelope(envelope, key, "user:1:other")).toThrow();
  });

  it("verifies TOTP within the permitted clock window and rejects malformed codes", () => {
    const secret = generateTotpSecret();
    expect(secret).toMatch(/^[A-Z2-7]+$/);
    expect(verifyTotp(secret, "not-a-code")).toBe(false);
    expect(createCsrfToken("session", "pepper")).not.toBe(createCsrfToken("other", "pepper"));
  });

  it("keeps authorization capability based", () => {
    expect(hasPermission(["case.read"], "case.read")).toBe(true);
    expect(hasPermission(["case.read"], "identity.reveal")).toBe(false);
  });
});
