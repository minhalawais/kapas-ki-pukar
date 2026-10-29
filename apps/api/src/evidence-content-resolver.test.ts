import { createCipheriv, randomBytes } from "node:crypto";

import { deriveKey, encryptEnvelope } from "@kapas/security";
import { describe, expect, it } from "vitest";

import { createV3EvidenceDecipher, unwrapV3DataKey } from "./evidence-content-resolver";

describe("V3 evidence cryptography", () => {
  it("unwraps and decrypts the worker storage format", () => {
    const evidenceId = "018f0000-0000-7000-8000-000000000001";
    const kind = "voice";
    const secret = "development-secret-with-sufficient-entropy";
    const dataKey = randomBytes(32);
    const wrapped = encryptEnvelope(
      dataKey,
      deriveKey(secret, "evidence-data-key-v3"),
      "key-1",
      `evidence-data-key:${evidenceId}`,
    );
    const storedWrapped = Buffer.concat([
      Buffer.from(wrapped.nonce),
      Buffer.from(wrapped.tag),
      Buffer.from(wrapped.ciphertext),
    ]);
    const nonce = randomBytes(12);
    const plaintext = Buffer.from("evidence bytes");
    const cipher = createCipheriv("aes-256-gcm", dataKey, nonce);
    cipher.setAAD(Buffer.from(`evidence-v3:${evidenceId}:${kind}`));
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const restored = unwrapV3DataKey(evidenceId, storedWrapped, "key-1", secret);
    const decipher = createV3EvidenceDecipher(
      evidenceId,
      kind,
      restored,
      nonce,
      cipher.getAuthTag(),
    );
    expect(Buffer.concat([decipher.update(ciphertext), decipher.final()])).toEqual(plaintext);
  });

  it("rejects tampered authenticated content", () => {
    const key = randomBytes(32);
    const nonce = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", key, nonce);
    cipher.setAAD(Buffer.from("evidence-v3:id:photo"));
    const ciphertext = Buffer.concat([cipher.update("photo"), cipher.final()]);
    const tag = cipher.getAuthTag();
    tag[0] ^= 0xff;
    const decipher = createV3EvidenceDecipher("id", "photo", key, nonce, tag);
    expect(() => Buffer.concat([decipher.update(ciphertext), decipher.final()])).toThrow();
  });
});
