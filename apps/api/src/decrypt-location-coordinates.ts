import type { GeoCoordinates } from "@kapas/domain";
import { decryptEnvelope, deriveKey } from "@kapas/security";

export type ComplaintLocationCoordinateFields = Readonly<{
  exactCoordinatesCiphertext: Uint8Array | Buffer | null;
  exactCoordinatesNonce: Uint8Array | Buffer | null;
  exactCoordinatesAuthTag: Uint8Array | Buffer | null;
  exactCoordinatesKeyId: string | null;
  exactCoordinatesAlgorithm: string | null;
  exactCoordinatesAadContext: string | null;
}>;

function asUint8Array(value: Uint8Array | Buffer): Uint8Array {
  return value instanceof Uint8Array ? value : Uint8Array.from(value);
}

export function parseDecryptedCoordinatesPlaintext(bytes: Uint8Array): GeoCoordinates | null {
  try {
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as {
      latitude?: unknown;
      longitude?: unknown;
    };
    if (
      typeof parsed.latitude === "number" &&
      typeof parsed.longitude === "number" &&
      Number.isFinite(parsed.latitude) &&
      Number.isFinite(parsed.longitude)
    ) {
      return { latitude: parsed.latitude, longitude: parsed.longitude };
    }
    return null;
  } catch {
    return null;
  }
}

export function decryptLocationCoordinates(
  location: ComplaintLocationCoordinateFields | null | undefined,
  sessionSecret: string,
): GeoCoordinates | null {
  if (!location?.exactCoordinatesCiphertext || !location.exactCoordinatesNonce) return null;
  if (!location.exactCoordinatesAuthTag || !location.exactCoordinatesKeyId) return null;
  if (location.exactCoordinatesAlgorithm !== "AES-256-GCM") return null;
  const aad = location.exactCoordinatesAadContext;
  if (!aad) return null;

  const plaintext = decryptEnvelope(
    {
      ciphertext: asUint8Array(location.exactCoordinatesCiphertext),
      nonce: asUint8Array(location.exactCoordinatesNonce),
      tag: asUint8Array(location.exactCoordinatesAuthTag),
      keyId: location.exactCoordinatesKeyId,
      algorithm: "AES-256-GCM",
    },
    deriveKey(sessionSecret, "coordinates"),
    aad,
  );
  return parseDecryptedCoordinatesPlaintext(plaintext);
}
