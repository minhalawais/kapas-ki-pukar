import { encryptEnvelope, deriveKey } from "@kapas/security";
import { describe, expect, it } from "vitest";

import {
  decryptLocationCoordinates,
  parseDecryptedCoordinatesPlaintext,
} from "./decrypt-location-coordinates";

const sessionSecret = "test-session-secret-with-at-least-32-characters";

describe("decryptLocationCoordinates", () => {
  it("round-trips coordinates encrypted at intake", () => {
    const coords = { latitude: 31.5204, longitude: 74.3587 };
    const aad = "coordinates:client-submission-123";
    const envelope = encryptEnvelope(
      new TextEncoder().encode(JSON.stringify(coords)),
      deriveKey(sessionSecret, "coordinates"),
      "test-key",
      aad,
    );

    const decrypted = decryptLocationCoordinates(
      {
        exactCoordinatesCiphertext: envelope.ciphertext,
        exactCoordinatesNonce: envelope.nonce,
        exactCoordinatesAuthTag: envelope.tag,
        exactCoordinatesKeyId: envelope.keyId,
        exactCoordinatesAlgorithm: envelope.algorithm,
        exactCoordinatesAadContext: aad,
      },
      sessionSecret,
    );

    expect(decrypted).toEqual(coords);
  });

  it("returns null when ciphertext is missing", () => {
    expect(decryptLocationCoordinates(null, sessionSecret)).toBeNull();
    expect(
      decryptLocationCoordinates(
        {
          exactCoordinatesCiphertext: null,
          exactCoordinatesNonce: null,
          exactCoordinatesAuthTag: null,
          exactCoordinatesKeyId: null,
          exactCoordinatesAlgorithm: null,
          exactCoordinatesAadContext: null,
        },
        sessionSecret,
      ),
    ).toBeNull();
  });

  it("parses valid JSON coordinates", () => {
    expect(
      parseDecryptedCoordinatesPlaintext(
        new TextEncoder().encode(JSON.stringify({ latitude: 1, longitude: 2 })),
      ),
    ).toEqual({ latitude: 1, longitude: 2 });
  });

  it("rejects invalid coordinate payloads", () => {
    expect(parseDecryptedCoordinatesPlaintext(new TextEncoder().encode("{}"))).toBeNull();
    expect(parseDecryptedCoordinatesPlaintext(new TextEncoder().encode("not-json"))).toBeNull();
  });
});
