import { createCipheriv, createHash, randomBytes, randomUUID } from "node:crypto";

import {
  CopyObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type { RuntimeConfig } from "@kapas/config";
import type { DatabaseClient, Prisma } from "@kapas/database";
import { deriveKey, encryptEnvelope } from "@kapas/security";
import { BadRequestException, ConflictException, Inject, Injectable } from "@nestjs/common";

import { staffDocumentMimeCheck } from "./staff-case-evidence.mime";
import { DATABASE_CLIENT, RUNTIME_CONFIG } from "./tokens";

@Injectable()
export class StaffCaseEvidenceService {
  private readonly objects: S3Client;

  constructor(
    @Inject(DATABASE_CLIENT) private readonly client: DatabaseClient,
    @Inject(RUNTIME_CONFIG) private readonly config: RuntimeConfig,
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

  async uploadStaffDocument(input: {
    complaintId: string;
    actorId: string;
    expectedVersion: number;
    requestId: string;
    fileName: string;
    declaredMimeType: string;
    bytes: Buffer;
    recordTimeline?: boolean;
  }): Promise<{ evidenceId: string; version: number }> {
    const { kind, mime: detectedMimeType } = staffDocumentMimeCheck(
      input.fileName,
      input.declaredMimeType,
      input.bytes,
    );

    const evidenceId = randomUUID();
    const clientMediaId = randomUUID();
    const dataKey = randomBytes(32);
    const nonce = randomBytes(12);
    const digest = createHash("sha256").update(input.bytes).digest();
    const cipher = createCipheriv("aes-256-gcm", dataKey, nonce);
    cipher.setAAD(Buffer.from(`evidence-v3:${evidenceId}:${kind}`, "utf8"));
    const ciphertext = Buffer.concat([cipher.update(input.bytes), cipher.final()]);
    const authTag = cipher.getAuthTag();
    const wrapped = encryptEnvelope(
      dataKey,
      deriveKey(this.config.evidenceKekSecret, "evidence-data-key-v3"),
      this.config.encryptionKeyId,
      `evidence-data-key:${evidenceId}`,
    );
    const wrappedDataKey = Buffer.concat([
      Buffer.from(wrapped.nonce),
      Buffer.from(wrapped.tag),
      Buffer.from(wrapped.ciphertext),
    ]);
    const protectedKey = `evidence/${evidenceId}/ciphertext.bin`;
    const temporaryKey = `evidence/${evidenceId}/${randomBytes(12).toString("hex")}.tmp`;

    await this.objects.send(
      new PutObjectCommand({
        Bucket: this.config.temporaryBucket,
        Key: temporaryKey,
        Body: ciphertext,
        ContentLength: ciphertext.length,
        ContentType: "application/octet-stream",
      }),
    );
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
    if (protectedHead.ContentLength !== ciphertext.length) {
      throw new BadRequestException("Protected storage write failed");
    }

    const displayName = input.fileName.replace(/[^\w. -]/gu, "_").slice(0, 255) || "staff-document";

    return this.client.$transaction(async (tx) => {
      const current = await tx.complaint.findUnique({ where: { id: input.complaintId } });
      if (!current) throw new BadRequestException("Complaint not found");
      if (current.version !== input.expectedVersion) throw new ConflictException("VERSION_CONFLICT");
      if (current.status === "Closed") throw new BadRequestException("Case is closed");

      const version = current.version + 1;
      await tx.evidenceDeclaration.create({
        data: {
          id: evidenceId,
          complaintId: input.complaintId,
          clientMediaId,
          kind,
          displayName,
          declaredMimeType: detectedMimeType,
          detectedMimeType,
          totalBytes: BigInt(input.bytes.length),
          uploadedBytes: BigInt(input.bytes.length),
          status: "available",
          protectedKey,
          sha256Digest: digest,
          scanEngine: "staff-inline",
          scanEngineVersion: "1",
          scannedAt: new Date(),
          wrappedDataKey,
          encryptionNonce: nonce,
          encryptionAuthTag: authTag,
          encryptionKeyId: this.config.encryptionKeyId,
        },
      });
      await tx.complaint.update({
        where: { id: input.complaintId },
        data: { version },
      });
      if (input.recordTimeline !== false) {
        await tx.caseHistory.create({
          data: {
            complaintId: input.complaintId,
            actionType: "Evidence Added",
            actorType: "staff",
            actorId: input.actorId,
            visibility: "internal",
            requestId: input.requestId,
            resourceVersion: version,
            reasonData: {
              evidenceId,
              source: "staff-corrective-upload",
              fileName: displayName,
            } as Prisma.InputJsonValue,
          },
        });
      }
      await tx.auditEvent.create({
        data: {
          complaintId: input.complaintId,
          actorType: "staff",
          actorId: input.actorId,
          action: "case.staff_evidence.uploaded",
          targetType: "evidence_declaration",
          targetId: evidenceId,
          outcome: "success",
          requestId: input.requestId,
          metadata: { fileName: displayName, kind },
        },
      });
      return { evidenceId, version };
    });
  }
}
