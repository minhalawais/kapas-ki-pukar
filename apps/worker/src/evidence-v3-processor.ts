import { createCipheriv, createHash, randomBytes } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdtemp, open, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";

import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type { RuntimeConfig } from "@kapas/config";
import type { DatabaseClient } from "@kapas/database";
import { deriveKey, encryptEnvelope } from "@kapas/security";

import { detectMime, scanFile } from "./evidence-processor";

export class EvidenceV3Processor {
  private readonly objects: S3Client;

  constructor(
    private readonly database: DatabaseClient,
    private readonly config: RuntimeConfig,
  ) {
    this.objects = new S3Client({
      endpoint: config.objectStoreEndpoint,
      region: "us-east-1",
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.objectStoreAccessKey,
        secretAccessKey: config.objectStoreSecretKey,
      },
    });
  }

  async readiness(): Promise<boolean> {
    try {
      await this.objects.send(
        new HeadObjectCommand({
          Bucket: this.config.quarantineBucket,
          Key: "readiness-probe-does-not-exist",
        }),
      );
      return true;
    } catch (error) {
      const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata
        ?.httpStatusCode;
      return status === 404;
    }
  }

  async process(evidenceId: string): Promise<void> {
    const evidence = await this.database.evidenceDeclaration.findUnique({
      where: { id: evidenceId },
      include: { complaint: true },
    });
    if (!evidence || evidence.status === "available" || evidence.status === "omitted") return;
    if (evidence.status !== "quarantined" || !evidence.quarantineKey) {
      throw new Error("evidence_not_ready_for_scan");
    }
    await this.database.evidenceDeclaration.update({
      where: { id: evidence.id },
      data: { status: "scanning", scanEngine: "clamav" },
    });
    const temporaryDirectory = await mkdtemp(join(tmpdir(), "kapas-evidence-v3-"));
    const plaintextPath = join(temporaryDirectory, "quarantine.bin");
    const ciphertextPath = join(temporaryDirectory, "ciphertext.bin");
    try {
      const source = await this.objects.send(
        new GetObjectCommand({
          Bucket: evidence.quarantineBucket ?? this.config.quarantineBucket,
          Key: evidence.quarantineKey,
        }),
      );
      if (!source.Body) throw new Error("quarantine_object_missing");
      await pipeline(
        Readable.fromWeb(source.Body.transformToWebStream()),
        createWriteStream(plaintextPath, { mode: 0o600 }),
      );
      const plaintext = await open(plaintextPath, "r");
      const header = Buffer.alloc(32);
      const { bytesRead } = await plaintext.read(header, 0, header.byteLength, 0);
      await plaintext.close();
      const detectedMimeType = detectMime(
        evidence.kind as "voice" | "photo" | "document",
        header.subarray(0, bytesRead),
        evidence.declaredMimeType,
      );
      const scan = await scanFile(this.config.clamavHost, this.config.clamavPort, plaintextPath);
      const declaredMimeType =
        evidence.declaredMimeType === "audio/x-m4a" ? "audio/mp4" : evidence.declaredMimeType;
      if (!scan.clean || !detectedMimeType || detectedMimeType !== declaredMimeType) {
        await this.reject(
          evidence.id,
          evidence.complaintId,
          scan.clean ? "mime_mismatch" : "malware_detected",
          scan.version,
        );
        return;
      }

      const dataKey = randomBytes(32);
      const nonce = randomBytes(12);
      const digest = createHash("sha256");
      const hashing = new Transform({
        transform(chunk: Buffer, _encoding, callback) {
          digest.update(chunk);
          callback(null, chunk);
        },
      });
      const cipher = createCipheriv("aes-256-gcm", dataKey, nonce);
      cipher.setAAD(Buffer.from(`evidence-v3:${evidence.id}:${evidence.kind}`, "utf8"));
      await pipeline(
        createReadStream(plaintextPath, { highWaterMark: 1024 * 1024 }),
        hashing,
        cipher,
        createWriteStream(ciphertextPath, { mode: 0o600 }),
      );
      const authTag = cipher.getAuthTag();
      const wrapped = encryptEnvelope(
        dataKey,
        deriveKey(this.config.evidenceKekSecret, "evidence-data-key-v3"),
        this.config.encryptionKeyId,
        `evidence-data-key:${evidence.id}`,
      );
      const wrappedDataKey = Buffer.concat([
        Buffer.from(wrapped.nonce),
        Buffer.from(wrapped.tag),
        Buffer.from(wrapped.ciphertext),
      ]);
      const temporaryKey = `evidence/${evidence.id}/${randomBytes(12).toString("hex")}.tmp`;
      const protectedKey = `evidence/${evidence.id}/ciphertext.bin`;
      await this.objects.send(
        new PutObjectCommand({
          Bucket: this.config.temporaryBucket,
          Key: temporaryKey,
          Body: createReadStream(ciphertextPath, { highWaterMark: 1024 * 1024 }),
          ContentLength: Number(evidence.totalBytes),
          ContentType: "application/octet-stream",
        }),
      );
      const temporaryHead = await this.objects.send(
        new HeadObjectCommand({
          Bucket: this.config.temporaryBucket,
          Key: temporaryKey,
        }),
      );
      if (temporaryHead.ContentLength !== Number(evidence.totalBytes))
        throw new Error("protected_length_mismatch");
      await this.objects.send(
        new CopyObjectCommand({
          Bucket: this.config.protectedEvidenceBucket,
          Key: protectedKey,
          CopySource: `${this.config.temporaryBucket}/${temporaryKey}`,
          MetadataDirective: "REPLACE",
          ContentType: "application/octet-stream",
        }),
      );
      const protectedHead = await this.objects.send(
        new HeadObjectCommand({
          Bucket: this.config.protectedEvidenceBucket,
          Key: protectedKey,
        }),
      );
      if (protectedHead.ContentLength !== Number(evidence.totalBytes))
        throw new Error("protected_length_mismatch");

      await this.database.$transaction(async (tx) => {
        await tx.evidenceDeclaration.update({
          where: { id: evidence.id },
          data: {
            status: "available",
            protectedKey,
            detectedMimeType,
            sha256Digest: digest.digest(),
            scanEngine: "clamav",
            scanEngineVersion: scan.version,
            scannedAt: new Date(),
            wrappedDataKey,
            encryptionNonce: nonce,
            encryptionAuthTag: authTag,
            encryptionKeyId: this.config.encryptionKeyId,
            reasonCode: null,
          },
        });
        const remaining = await tx.evidenceDeclaration.count({
          where: { complaintId: evidence.complaintId, status: { notIn: ["available", "omitted"] } },
        });
        await tx.complaint.update({
          where: { id: evidence.complaintId },
          data: { evidenceStatus: remaining === 0 ? "complete" : "pending" },
        });
        if (evidence.kind === "voice") {
          await tx.outboxEvent.upsert({
            where: { dedupeKey: `ai.voice-enrichment.requested.v3:${evidence.id}` },
            create: {
              complaintId: evidence.complaintId,
              aggregateType: "evidence",
              aggregateId: evidence.id,
              eventType: "ai.voice-enrichment.requested.v3",
              payload: { evidenceId: evidence.id },
              dedupeKey: `ai.voice-enrichment.requested.v3:${evidence.id}`,
            },
            update: {},
          });
        }
      });
      await Promise.all([
        this.objects.send(
          new DeleteObjectCommand({ Bucket: this.config.temporaryBucket, Key: temporaryKey }),
        ),
        this.objects.send(
          new DeleteObjectCommand({
            Bucket: evidence.quarantineBucket ?? this.config.quarantineBucket,
            Key: evidence.quarantineKey,
          }),
        ),
      ]);
    } catch (error) {
      await this.database.evidenceDeclaration.updateMany({
        where: { id: evidence.id, status: "scanning" },
        data: { status: "quarantined", reasonCode: "processing_retry" },
      });
      throw error;
    } finally {
      await rm(temporaryDirectory, { recursive: true, force: true });
    }
  }

  private async reject(
    evidenceId: string,
    complaintId: string,
    reasonCode: string,
    engineVersion: string,
  ) {
    await this.database.$transaction([
      this.database.evidenceDeclaration.update({
        where: { id: evidenceId },
        data: {
          status: "rejected",
          reasonCode,
          scanEngine: "clamav",
          scanEngineVersion: engineVersion,
          scannedAt: new Date(),
        },
      }),
      this.database.complaint.update({
        where: { id: complaintId },
        data: { evidenceStatus: "action_required" },
      }),
    ]);
  }
}
