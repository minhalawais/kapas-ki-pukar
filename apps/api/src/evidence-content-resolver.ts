import { createDecipheriv, type DecipherGCM } from "node:crypto";
import { Readable } from "node:stream";

import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { RuntimeConfig } from "@kapas/config";
import type { DatabaseClient } from "@kapas/database";
import { decryptEnvelope, deriveKey } from "@kapas/security";

import { createEvidenceContentStream } from "./evidence-content";

export type ResolvedEvidenceContent = {
  version: "legacy" | "v3";
  id: string;
  originalName: string;
  mimeType: string;
  byteLength: number;
  stream: NodeJS.ReadableStream;
};

function objectClient(config: RuntimeConfig) {
  return new S3Client({
    endpoint: config.objectStoreEndpoint,
    region: "us-east-1",
    forcePathStyle: true,
    credentials: {
      accessKeyId: config.objectStoreAccessKey,
      secretAccessKey: config.objectStoreSecretKey,
    },
  });
}

export function unwrapV3DataKey(
  evidenceId: string,
  wrappedValue: Uint8Array,
  keyId: string,
  kekSecret: string,
): Uint8Array {
  const wrapped = Buffer.from(wrappedValue);
  if (wrapped.byteLength <= 28) throw new Error("invalid_wrapped_evidence_key");
  return decryptEnvelope(
    {
      nonce: wrapped.subarray(0, 12),
      tag: wrapped.subarray(12, 28),
      ciphertext: wrapped.subarray(28),
      keyId,
      algorithm: "AES-256-GCM",
    },
    deriveKey(kekSecret, "evidence-data-key-v3"),
    `evidence-data-key:${evidenceId}`,
  );
}

export function createV3EvidenceDecipher(
  evidenceId: string,
  kind: string,
  dataKey: Uint8Array,
  nonce: Uint8Array,
  authTag: Uint8Array,
): DecipherGCM {
  const decipher = createDecipheriv("aes-256-gcm", dataKey, nonce);
  decipher.setAAD(Buffer.from(`evidence-v3:${evidenceId}:${kind}`, "utf8"));
  decipher.setAuthTag(Buffer.from(authTag));
  return decipher;
}

export async function resolveEvidenceContent(
  client: DatabaseClient,
  config: RuntimeConfig,
  complaintId: string,
  evidenceId: string,
): Promise<ResolvedEvidenceContent | null> {
  const legacy = await client.evidenceAsset.findFirst({
    where: {
      complaintId,
      storageId: evidenceId,
      availabilityState: "available",
      scanState: { in: ["clean", "approved"] },
      retentionState: "active",
      deletedAt: null,
    },
  });
  if (legacy) {
    return {
      version: "legacy",
      id: legacy.id,
      originalName: legacy.originalName,
      mimeType: legacy.detectedMimeType,
      byteLength: Number(legacy.byteLength),
      stream: createEvidenceContentStream(config.evidenceRoot, config.sessionSecret, legacy),
    };
  }

  const declaration = await client.evidenceDeclaration.findFirst({
    where: { id: evidenceId, complaintId, status: "available" },
  });
  if (
    !declaration?.protectedKey ||
    !declaration.wrappedDataKey ||
    !declaration.encryptionNonce ||
    !declaration.encryptionAuthTag ||
    !declaration.detectedMimeType
  )
    return null;

  const dataKey = unwrapV3DataKey(
    declaration.id,
    declaration.wrappedDataKey,
    declaration.encryptionKeyId ?? config.encryptionKeyId,
    config.evidenceKekSecret,
  );
  const object = await objectClient(config).send(
    new GetObjectCommand({
      Bucket: config.protectedEvidenceBucket,
      Key: declaration.protectedKey,
    }),
  );
  if (!object.Body) return null;
  const decipher = createV3EvidenceDecipher(
    declaration.id,
    declaration.kind,
    dataKey,
    declaration.encryptionNonce,
    declaration.encryptionAuthTag,
  );
  const source = object.Body as NodeJS.ReadableStream & {
    transformToWebStream?: () => ReadableStream;
  };
  const readable =
    typeof source.pipe === "function"
      ? source
      : Readable.fromWeb(source.transformToWebStream!() as never);
  return {
    version: "v3",
    id: declaration.id,
    originalName: declaration.displayName,
    mimeType: declaration.detectedMimeType,
    byteLength: Number(declaration.totalBytes),
    stream: readable.pipe(decipher),
  };
}
