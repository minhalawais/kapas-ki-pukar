import { createDecipheriv } from "node:crypto";
import { createReadStream } from "node:fs";
import { join } from "node:path";
import { Transform } from "node:stream";

import { deriveKey } from "@kapas/security";

export interface EncryptedEvidenceLocation {
  readonly storageId: string;
  readonly kind: string;
  readonly receivedAt: Date;
}

/**
 * Streams an evidence object through authenticated decryption without loading the
 * protected file into application memory or exposing its filesystem location.
 */
export function createEvidenceContentStream(
  evidenceRoot: string,
  sessionSecret: string,
  evidence: EncryptedEvidenceLocation,
) {
  const key = deriveKey(sessionSecret, `evidence:${evidence.storageId}`);
  const associatedData = `evidence:${evidence.storageId}:${evidence.kind}`;
  let header = Buffer.alloc(0);
  let decipher: ReturnType<typeof createDecipheriv> | undefined;

  const decryptStream = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      try {
        if (!decipher) {
          header = Buffer.concat([header, chunk]);
          if (header.length < 28) return callback();
          decipher = createDecipheriv("aes-256-gcm", key, header.subarray(0, 12));
          const authenticatedDecipher = decipher as unknown as {
            setAAD(value: Buffer): void;
            setAuthTag(value: Buffer): void;
          };
          authenticatedDecipher.setAAD(Buffer.from(associatedData));
          authenticatedDecipher.setAuthTag(header.subarray(12, 28));
          const output = decipher.update(header.subarray(28));
          header = Buffer.alloc(0);
          return callback(null, output);
        }
        callback(null, decipher.update(chunk));
      } catch (error) {
        callback(error as Error);
      }
    },
    flush(callback) {
      try {
        if (!decipher) return callback(new Error("Encrypted evidence header is invalid"));
        callback(null, decipher.final());
      } catch (error) {
        callback(error as Error);
      }
    },
  });

  const year = evidence.receivedAt.getUTCFullYear().toString();
  const month = String(evidence.receivedAt.getUTCMonth() + 1).padStart(2, "0");
  return createReadStream(
    join(evidenceRoot, year, month, evidence.storageId, "ciphertext.bin"),
  ).pipe(decryptStream);
}
