import { createHash, randomUUID } from "node:crypto";
import { appendFile, mkdir, open, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import type { RuntimeConfig } from "@kapas/config";
import { PostgresComplaintRepository, type DatabaseClient } from "@kapas/database";
import {
  assertTaxonomySelection,
  type ApprovedEvidenceMetadata,
  type CreateComplaintCommand,
  type Priority,
  type PrivacyMode,
  type ReporterType,
  type WorkerCategoryCode,
  normalizePakistanCnic,
  normalizePakistanPhone,
} from "@kapas/domain";
import {
  deriveKey,
  encryptEnvelope,
  generateOpaqueToken,
  hashOpaqueToken,
  hashPassword,
} from "@kapas/security";
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  Headers,
  Head,
  Inject,
  NotFoundException,
  Options,
  Param,
  Patch,
  Post,
  Req,
  Res,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";

import { DATABASE_CLIENT, RUNTIME_CONFIG } from "./tokens";

type UploadKind = "voice" | "photo" | "document";
type UploadRow = {
  id: string;
  tokenHash: string;
  clientSubmissionId: string;
  clientMediaId: string | null;
  kind: string;
  originalName: string;
  declaredMimeType: string;
  detectedMimeType: string | null;
  maxBytes: bigint;
  expectedBytes: bigint | null;
  receivedBytes: bigint;
  status: string;
  quarantinePath: string;
  finalObjectPath: string | null;
  sha256Digest: Uint8Array | null;
  scanState: string;
  rejectionCode: string | null;
  expiresAt: Date;
  lastActivityAt: Date;
  encryptionKeyId: string | null;
  encryptionAlgorithm: string | null;
  createdAt: Date;
};

const LIMITS: Record<UploadKind, { maxBytes: number; mime: readonly string[] }> = {
  voice: { maxBytes: 25 * 1024 * 1024, mime: ["audio/"] },
  photo: { maxBytes: 10 * 1024 * 1024, mime: ["image/jpeg", "image/png"] },
  document: { maxBytes: 15 * 1024 * 1024, mime: ["application/pdf"] },
};
const MAX_COMPLAINT_MEDIA_BYTES = 50 * 1024 * 1024;
const TUS_VERSION = "1.0.0";

function parseUploadMetadata(value?: string): Record<string, string> {
  if (!value) return {};
  const result: Record<string, string> = {};
  for (const entry of value.split(",")) {
    const [rawKey, encoded = ""] = entry.trim().split(" ", 2);
    if (!rawKey || !/^[A-Za-z0-9_-]{1,64}$/u.test(rawKey))
      throw new BadRequestException("Upload metadata is invalid");
    try {
      result[rawKey] = Buffer.from(encoded, "base64").toString("utf8");
    } catch {
      throw new BadRequestException("Upload metadata is invalid");
    }
  }
  return result;
}

function asKind(value: unknown): UploadKind {
  if (value === "voice" || value === "photo" || value === "document") return value;
  throw new BadRequestException("Unsupported upload kind");
}

function safeName(value: unknown): string {
  if (typeof value !== "string") throw new BadRequestException("A file name is required");
  const normalized = value
    .replace(/[^\p{L}\p{N}._ -]+/gu, " ")
    .trim()
    .slice(0, 255);
  if (!normalized) throw new BadRequestException("A file name is required");
  return normalized;
}

function detectMime(kind: UploadKind, bytes: Uint8Array, declared: string): string | null {
  if (kind === "photo" && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return "image/jpeg";
  if (
    kind === "photo" &&
    bytes
      .slice(0, 8)
      .every((value, index) => value === [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a][index])
  )
    return "image/png";
  if (kind === "document" && Buffer.from(bytes.slice(0, 5)).toString() === "%PDF-")
    return "application/pdf";
  if (kind === "voice" && declared.startsWith("audio/") && bytes.length > 0) return declared;
  return null;
}

function isAllowed(kind: UploadKind, mime: string): boolean {
  return LIMITS[kind].mime.some((prefix) =>
    prefix.endsWith("/") ? mime.startsWith(prefix) : mime === prefix,
  );
}

function assertBoundedString(value: unknown, field: string, max: number): string {
  if (typeof value !== "string" || value.trim().length === 0 || value.length > max)
    throw new BadRequestException(`${field} is invalid`);
  return value.trim();
}

@Controller("api/v1")
export class IntakeController {
  private readonly complaints: PostgresComplaintRepository;

  constructor(
    @Inject(DATABASE_CLIENT) private readonly client: DatabaseClient,
    @Inject(RUNTIME_CONFIG) private readonly config: RuntimeConfig,
  ) {
    this.complaints = new PostgresComplaintRepository(client);
  }

  @Options("uploads")
  uploadOptions(@Res({ passthrough: true }) reply: FastifyReply) {
    reply.headers({
      "tus-resumable": TUS_VERSION,
      "tus-version": TUS_VERSION,
      "tus-extension": "creation,termination",
      "tus-max-size": String(MAX_COMPLAINT_MEDIA_BYTES),
    });
    return undefined;
  }

  @Post("uploads")
  async createUpload(
    @Body()
    body: {
      kind?: string;
      clientSubmissionId?: string;
      mediaId?: string;
      fileName?: string;
      mimeType?: string;
      size?: number;
    },
    @Headers("tus-resumable") tusVersion: string | undefined,
    @Headers("upload-length") uploadLength: string | undefined,
    @Headers("upload-metadata") uploadMetadata: string | undefined,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const tus = tusVersion !== undefined;
    if (tus && tusVersion !== TUS_VERSION) throw new BadRequestException("Unsupported Tus version");
    const metadata = tus ? parseUploadMetadata(uploadMetadata) : {};
    const kind = asKind(tus ? metadata.kind : body.kind);
    const clientSubmissionId = assertBoundedString(
      tus ? metadata.clientSubmissionId : body.clientSubmissionId,
      "clientSubmissionId",
      100,
    );
    const rawClientMediaId = tus ? metadata.mediaId : body.mediaId;
    const clientMediaId =
      rawClientMediaId === undefined
        ? undefined
        : assertBoundedString(rawClientMediaId, "mediaId", 100);
    const originalName = safeName(tus ? metadata.fileName : body.fileName);
    const declaredMimeType = assertBoundedString(
      tus ? metadata.mimeType : body.mimeType,
      "mimeType",
      100,
    ).toLowerCase();
    const size = Number(tus ? uploadLength : body.size);
    if (!Number.isSafeInteger(size) || size < 1 || size > LIMITS[kind].maxBytes)
      throw new BadRequestException({
        code: "upload_size_limit",
        message: "Upload size exceeds the limit",
      });
    if (!isAllowed(kind, declaredMimeType))
      throw new BadRequestException({
        code: "unsupported_media_type",
        message: "Unsupported media type",
      });

    const id = randomUUID();
    const token = generateOpaqueToken(32);
    const quarantinePath = resolve(this.config.quarantineRoot, `${id}.part`);
    await mkdir(this.config.quarantineRoot, { recursive: true, mode: 0o700 });
    await writeFile(quarantinePath, Buffer.alloc(0), { mode: 0o600, flag: "wx" });
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    let allocationId: string = id;
    let allocationOffset = 0;
    let allocationStatus = "created";
    let reused = false;
    let stalePaths: string[] = [];
    try {
      await this.client.$transaction(
        async (tx) => {
          await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`upload-allocation:${clientSubmissionId}`}))::text AS lock`;
          const staleBefore = new Date(Date.now() - 5 * 60 * 1000);
          // Compatibility repair for legacy clients that could lose the response
          // after allocating their single voice upload. Restrict this cleanup to
          // zero-byte, identifier-less voice grants so valid queued documents are
          // never discarded merely because they have not started transferring yet.
          const stale =
            kind === "voice"
              ? await tx.uploadSession.findMany({
                  where: {
                    clientSubmissionId,
                    clientMediaId: null,
                    kind: "voice",
                    status: { in: ["created", "uploading"] },
                    receivedBytes: 0n,
                    lastActivityAt: { lt: staleBefore },
                  },
                  select: { id: true, quarantinePath: true },
                })
              : [];
          if (stale.length) {
            stalePaths = stale.map((entry) => entry.quarantinePath);
            await tx.uploadSession.updateMany({
              where: { id: { in: stale.map((entry) => entry.id) } },
              data: { status: "expired", rejectionCode: "superseded", lastActivityAt: new Date() },
            });
          }
          const reusable = clientMediaId
            ? await tx.uploadSession.findFirst({
                where: {
                  clientSubmissionId,
                  clientMediaId,
                  status: { in: ["created", "uploading", "processing", "complete"] },
                },
              })
            : null;
          if (reusable) {
            if (
              reusable.kind !== kind ||
              reusable.declaredMimeType !== declaredMimeType ||
              reusable.expectedBytes !== BigInt(size)
            )
              throw new ConflictException({
                code: "upload_media_conflict",
                message: "The media identifier is already assigned to a different file",
              });
            const refreshed = await tx.uploadSession.update({
              where: { id: reusable.id },
              data: {
                tokenHash: hashOpaqueToken(token, this.config.sessionSecret),
                expiresAt,
                lastActivityAt: new Date(),
              },
            });
            allocationId = refreshed.id;
            allocationOffset = Number(refreshed.receivedBytes);
            allocationStatus = refreshed.status;
            reused = true;
            return;
          }
          const existing = await tx.uploadSession.findMany({
            where: {
              clientSubmissionId,
              status: { in: ["created", "uploading", "processing", "complete"] },
            },
            select: { kind: true, expectedBytes: true, receivedBytes: true },
          });
          const attachmentCount = existing.filter((item) => item.kind !== "voice").length;
          const voiceCount = existing.filter((item) => item.kind === "voice").length;
          if (kind === "voice" ? voiceCount >= 1 : attachmentCount >= 5)
            throw new BadRequestException({
              code: "upload_count_limit",
              message: "Upload count exceeds the limit",
            });
          const allocated = existing.reduce(
            (total, item) => total + Number(item.expectedBytes ?? item.receivedBytes),
            0,
          );
          if (allocated + size > MAX_COMPLAINT_MEDIA_BYTES)
            throw new BadRequestException({
              code: "upload_aggregate_limit",
              message: "Aggregate upload size exceeds the limit",
            });
          await tx.uploadSession.create({
            data: {
              id,
              tokenHash: hashOpaqueToken(token, this.config.sessionSecret),
              clientSubmissionId,
              clientMediaId,
              kind,
              originalName,
              declaredMimeType,
              maxBytes: BigInt(LIMITS[kind].maxBytes),
              expectedBytes: BigInt(size),
              quarantinePath,
              expiresAt,
              lastActivityAt: new Date(),
            },
          });
        },
        { isolationLevel: "Serializable" },
      );
    } catch (error) {
      await rm(quarantinePath, { force: true });
      if (error instanceof BadRequestException || error instanceof ConflictException) throw error;
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? String(error.code)
          : undefined;
      if (["P1001", "P1002", "P2021", "P2022"].includes(code ?? "")) {
        throw new ServiceUnavailableException({
          code: "upload_storage_unavailable",
          message: "Upload storage is temporarily unavailable",
        });
      }
      throw error;
    }
    await Promise.all(stalePaths.map((path) => rm(path, { force: true }).catch(() => undefined)));
    if (reused) await rm(quarantinePath, { force: true });

    const location = `/api/v1/uploads/${allocationId}`;
    if (tus) {
      reply.code(201).headers({
        location,
        "tus-resumable": TUS_VERSION,
        "upload-token": token,
        "upload-expires": expiresAt.toUTCString(),
        "upload-offset": String(allocationOffset),
        "upload-status": allocationStatus,
      });
    }
    return {
      uploadId: allocationId,
      uploadUrl: location,
      uploadToken: token,
      offset: allocationOffset,
      status: allocationStatus,
      maxBytes: LIMITS[kind].maxBytes,
      expiresAt,
    };
  }

  @Get("uploads/:id/status")
  async uploadStatus(
    @Param("id") id: string,
    @Headers("upload-token") token?: string,
    @Headers("x-upload-token") legacyToken?: string,
  ) {
    const upload = await this.authorizeUpload(id, token ?? legacyToken);
    return {
      uploadId: upload.id,
      status: upload.status,
      offset: Number(upload.receivedBytes),
      totalBytes: Number(upload.expectedBytes ?? upload.maxBytes),
      expiresAt: upload.expiresAt,
      errorCode:
        upload.status === "rejected"
          ? (upload.rejectionCode ?? "upload_rejected")
          : upload.scanState === "failed"
            ? "scan_temporarily_unavailable"
            : undefined,
    };
  }

  @Head("uploads/:id")
  async uploadHead(
    @Param("id") id: string,
    @Headers("upload-token") token: string | undefined,
    @Headers("x-upload-token") legacyToken: string | undefined,
    @Headers("tus-resumable") tusVersion: string | undefined,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    if (tusVersion !== TUS_VERSION) throw new BadRequestException("Unsupported Tus version");
    const upload = await this.authorizeUpload(id, token ?? legacyToken);
    reply.headers({
      "tus-resumable": TUS_VERSION,
      "upload-offset": String(upload.receivedBytes),
      "upload-length": String(upload.expectedBytes ?? upload.maxBytes),
      "upload-expires": upload.expiresAt.toUTCString(),
      "upload-status": upload.status,
      "cache-control": "no-store",
    });
    return undefined;
  }

  @Get("uploads/:id")
  async uploadDetails(
    @Param("id") id: string,
    @Headers("upload-token") token?: string,
    @Headers("x-upload-token") legacyToken?: string,
  ) {
    return this.uploadStatus(id, token, legacyToken);
  }

  @Delete("uploads/:id")
  async cancelUpload(
    @Param("id") id: string,
    @Headers("upload-token") token?: string,
    @Headers("x-upload-token") legacyToken?: string,
  ) {
    const upload = await this.authorizeUpload(id, token ?? legacyToken);
    if (upload.status === "attached")
      throw new ConflictException("Attached uploads cannot be cancelled");
    await Promise.all([
      rm(upload.quarantinePath, { force: true }),
      upload.finalObjectPath ? rm(upload.finalObjectPath, { force: true }) : Promise.resolve(),
    ]);
    await this.client.uploadSession.update({
      where: { id: upload.id },
      data: { status: "expired", rejectionCode: "cancelled", lastActivityAt: new Date() },
    });
    return { uploadId: id, status: "expired" };
  }

  @Patch("uploads/:id")
  async patchUpload(
    @Param("id") id: string,
    @Headers("upload-token") token: string | undefined,
    @Headers("x-upload-token") legacyToken: string | undefined,
    @Headers("tus-resumable") tusVersion: string | undefined,
    @Headers("upload-offset") uploadOffset: string | undefined,
    @Headers("content-type") contentType: string | undefined,
    @Body() body: Buffer | { offset?: number; chunkBase64?: string; complete?: boolean },
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    if (contentType?.startsWith("application/offset+octet-stream")) {
      if (tusVersion !== TUS_VERSION) throw new BadRequestException("Unsupported Tus version");
      if (!Buffer.isBuffer(body) || body.byteLength === 0 || body.byteLength > 1024 * 1024)
        throw new BadRequestException("Invalid upload chunk");
      const offset = Number(uploadOffset);
      if (!Number.isSafeInteger(offset) || offset < 0)
        throw new BadRequestException("Upload offset is invalid");
      let result: { offset: number; status: "uploading" | "processing" };
      try {
        result = await this.appendTusChunk(id, token ?? legacyToken, offset, body);
      } catch (error) {
        const authoritativeOffset = (error as { authoritativeOffset?: unknown })
          .authoritativeOffset;
        if (typeof authoritativeOffset === "number")
          reply.header("upload-offset", String(authoritativeOffset));
        throw error;
      }
      reply.code(204).headers({
        "tus-resumable": TUS_VERSION,
        "upload-offset": String(result.offset),
        "upload-status": result.status,
      });
      return undefined;
    }

    const upload = await this.authorizeUpload(id, token ?? legacyToken);
    if (!["created", "uploading"].includes(upload.status))
      throw new ConflictException("Upload is no longer writable");
    if (Buffer.isBuffer(body)) throw new BadRequestException("Invalid legacy upload body");
    const offset = Number(body.offset);
    if (!Number.isSafeInteger(offset) || offset !== Number(upload.receivedBytes))
      throw new ConflictException("Upload offset conflict");
    if (typeof body.chunkBase64 !== "string")
      throw new BadRequestException("chunkBase64 is required");
    const chunk = Buffer.from(body.chunkBase64, "base64");
    if (chunk.length === 0 || chunk.length > 5 * 1024 * 1024)
      throw new BadRequestException("Invalid upload chunk");
    if (BigInt(offset + chunk.length) > upload.maxBytes)
      throw new BadRequestException("Upload exceeds the limit");
    await appendFile(upload.quarantinePath, chunk);
    const receivedBytes = BigInt(offset + chunk.length);
    if (!body.complete) {
      await this.client.uploadSession.update({
        where: { id: upload.id },
        data: {
          receivedBytes,
          status: "uploading",
          lastActivityAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
      return { uploadId: upload.id, status: "uploading", offset: Number(receivedBytes) };
    }
    if (receivedBytes === 0n) throw new BadRequestException("An empty upload cannot be completed");
    if (upload.expectedBytes !== null && receivedBytes !== upload.expectedBytes)
      throw new BadRequestException("Upload length does not match the declared length");
    return this.completeUpload(upload, receivedBytes);
  }

  @Post("complaints")
  async submitComplaint(@Body() body: Record<string, unknown>, @Req() request: FastifyRequest) {
    const clientSubmissionId = assertBoundedString(
      body.clientSubmissionId,
      "clientSubmissionId",
      100,
    );
    const idempotencyKey = assertBoundedString(body.idempotencyKey, "idempotencyKey", 200);
    const privacyMode = body.privacyMode as PrivacyMode;
    if (!["ANON", "CONF", "IDEN"].includes(privacyMode))
      throw new BadRequestException("privacyMode is invalid");
    const categoryCode = body.categoryCode as WorkerCategoryCode;
    const subcategoryCode =
      typeof body.subcategoryCode === "string" ? body.subcategoryCode : undefined;
    try {
      assertTaxonomySelection(categoryCode, subcategoryCode as never);
    } catch {
      throw new BadRequestException("Invalid category selection");
    }
    const incident = body.incident as Record<string, unknown> | undefined;
    const location = body.location as Record<string, unknown> | undefined;
    if (!incident || !location) throw new BadRequestException("incident and location are required");
    const uploads = Array.isArray(body.uploads) ? body.uploads : [];
    const evidence = await this.resolveUploads(uploads, clientSubmissionId);
    const schemaVersion = Number(body.schemaVersion) || 1;
    if (evidence.filter((item) => item.kind !== "voice").length > 5)
      throw new BadRequestException("A maximum of five attachments is allowed");
    if (evidence.filter((item) => item.kind === "voice").length > 1)
      throw new BadRequestException("Only one voice statement is allowed");
    const privateInput = body.privateIdentity as { kind?: string; value?: string } | undefined;
    const privateValue = typeof privateInput?.value === "string" ? privateInput.value : undefined;
    const privateKind = privateInput?.kind;
    if (privacyMode === "ANON" && privateInput)
      throw new BadRequestException("Anonymous complaints cannot contain identity");
    if (
      schemaVersion < 2 &&
      privacyMode !== "ANON" &&
      (!privateValue || !["cnic", "phone"].includes(String(privateKind)))
    )
      throw new BadRequestException("Identity is required for this privacy mode");
    const identity =
      privateValue && privateKind
        ? encryptEnvelope(
            new TextEncoder().encode(privateValue),
            deriveKey(this.config.sessionSecret, "reporter"),
            this.config.encryptionKeyId,
            `reporter:${clientSubmissionId}`,
          )
        : undefined;
    const privateReporter = body.privateReporter as { phone?: unknown; cnic?: unknown } | undefined;
    let canonicalPhone: string | undefined;
    let canonicalCnic: string | undefined;
    if (schemaVersion >= 2) {
      if (privacyMode !== "CONF" && privacyMode !== "IDEN")
        throw new BadRequestException("New complaints must be confidential or identified");
      try {
        canonicalPhone = normalizePakistanPhone(String(privateReporter?.phone ?? ""));
        canonicalCnic = privateReporter?.cnic
          ? normalizePakistanCnic(String(privateReporter.cnic))
          : undefined;
      } catch {
        throw new BadRequestException(
          "A valid Pakistani mobile number and optional 13-digit CNIC are required",
        );
      }
      if (
        !["call", "message", "either", "do-not-initiate"].includes(
          String(body.contactPreference ?? ""),
        )
      )
        throw new BadRequestException("A safe contact preference is required");
    }
    const protectedIdentities = canonicalPhone
      ? [
          { kind: "phone" as const, value: canonicalPhone },
          ...(canonicalCnic ? [{ kind: "cnic" as const, value: canonicalCnic }] : []),
        ].map((field) => {
          const aadContext = `reporter:${clientSubmissionId}:${field.kind}:${randomUUID()}`;
          const envelope = encryptEnvelope(
            new TextEncoder().encode(field.value),
            deriveKey(this.config.sessionSecret, "reporter"),
            this.config.encryptionKeyId,
            aadContext,
          );
          return {
            ...envelope,
            kind: field.kind,
            displaySuffix: field.value.slice(-4),
            aadContext,
            cryptoVersion: 1,
          };
        })
      : undefined;
    const workerProfile = canonicalPhone
      ? await this.client.workerIdentityProfile.upsert({
          where: {
            phoneBlindIndex: hashOpaqueToken(
              `phone:${canonicalPhone}`,
              this.config.identityLookupPepper,
            ),
          },
          create: {
            phoneBlindIndex: hashOpaqueToken(
              `phone:${canonicalPhone}`,
              this.config.identityLookupPepper,
            ),
            cnicBlindIndex: canonicalCnic
              ? hashOpaqueToken(`cnic:${canonicalCnic}`, this.config.identityLookupPepper)
              : undefined,
          },
          update: canonicalCnic
            ? {
                cnicBlindIndex: hashOpaqueToken(
                  `cnic:${canonicalCnic}`,
                  this.config.identityLookupPepper,
                ),
              }
            : {},
        })
      : undefined;
    const exactCoordinates = location.exactCoordinates as
      { latitude?: number; longitude?: number } | null | undefined;
    const coordinates =
      exactCoordinates?.latitude !== undefined && exactCoordinates.longitude !== undefined
        ? encryptEnvelope(
            new TextEncoder().encode(JSON.stringify(exactCoordinates)),
            deriveKey(this.config.sessionSecret, "coordinates"),
            this.config.encryptionKeyId,
            `coordinates:${clientSubmissionId}`,
          )
        : undefined;
    const submittedAt = new Date();
    const trackingSecret = generateOpaqueToken(24);
    const command: CreateComplaintCommand = {
      categoryCode,
      subcategoryCode: subcategoryCode as never,
      priority: (body.priority as Priority) ?? "Standard",
      privacyMode,
      reporterType: (body.reporterType as ReporterType) ?? "self",
      reporterDisplayName:
        typeof body.reporterDisplayName === "string"
          ? body.reporterDisplayName.slice(0, 160)
          : undefined,
      contactAllowed:
        schemaVersion >= 2
          ? ["call", "message", "either"].includes(String(body.contactPreference ?? ""))
          : body.contactAllowed === true,
      affectedWorkerType: body.affectedWorkerType as never,
      gender: body.gender as never,
      submittedAt: submittedAt.toISOString(),
      dueAt: new Date(submittedAt.getTime() + 7 * 86400000).toISOString(),
      createdSource: "mobile",
      schemaVersion,
      workerProfileId: workerProfile?.id,
      incident: {
        whenLabel: assertBoundedString(incident.whenLabel, "incident.whenLabel", 100),
        occurredAt: typeof incident.occurredAt === "string" ? incident.occurredAt : undefined,
        description:
          typeof incident.description === "string"
            ? incident.description.slice(0, 4000)
            : undefined,
        currentDanger: incident.currentDanger === true,
        immediateDanger: incident.immediateDanger === true,
        othersAffected: (incident.othersAffected as never) ?? "individual",
        structuredAnswers: ((incident.structuredAnswers as Record<string, unknown>) ?? {}) as never,
        schemaVersion: Number(incident.schemaVersion) || 1,
      },
      location: {
        province: assertBoundedString(location.province, "location.province", 100),
        district: assertBoundedString(location.district, "location.district", 100),
        tehsil: typeof location.tehsil === "string" ? location.tehsil.slice(0, 100) : undefined,
        villageLabel:
          typeof location.villageLabel === "string"
            ? location.villageLabel.slice(0, 160)
            : undefined,
        descriptivePlace:
          typeof location.descriptivePlace === "string"
            ? location.descriptivePlace.slice(0, 500)
            : undefined,
        source: location.source === "device" ? "device" : "manual",
        accuracyMeters:
          typeof location.accuracyMeters === "number"
            ? Math.min(100000, Math.max(0, location.accuracyMeters))
            : undefined,
        analyticsProvince: assertBoundedString(location.province, "location.province", 100),
        analyticsDistrict: assertBoundedString(location.district, "location.district", 100),
        exactCoordinates: coordinates
          ? {
              ciphertext: coordinates.ciphertext,
              nonce: coordinates.nonce,
              keyId: coordinates.keyId,
              algorithm: coordinates.algorithm,
              tag: coordinates.tag,
              aadContext: `coordinates:${clientSubmissionId}`,
              cryptoVersion: 1,
            }
          : undefined,
      },
      privateIdentity: identity
        ? {
            kind: privateInput?.kind as "cnic" | "phone",
            ciphertext: identity.ciphertext,
            nonce: identity.nonce,
            keyId: identity.keyId,
            algorithm: identity.algorithm,
            displaySuffix: privateValue?.slice(-4) ?? "",
          }
        : undefined,
      privateIdentities: protectedIdentities,
      requestId: request.id,
      idempotencyKeyHash: hashOpaqueToken(idempotencyKey, this.config.sessionSecret),
      idempotencyScope: `mobile:${clientSubmissionId}`,
      approvedEvidence: evidence,
      trackingSecretHash: await hashPassword(trackingSecret),
    };
    const result = await this.complaints.create(command);
    if (evidence.length > 0)
      await this.client.uploadSession.updateMany({
        where: { id: { in: evidence.map((item) => item.storageId) } },
        data: { status: "attached", attachedAt: new Date(), lastActivityAt: new Date() },
      });
    return {
      complaintId: result.id,
      referenceNumber: result.referenceNumber,
      trackingSecret: result.idempotentReplay ? undefined : trackingSecret,
      status: result.status,
      priority: result.priority,
      version: result.version,
      submittedAt: result.submittedAt,
      nextAction: "Keep this reference and tracking secret safe.",
    };
  }

  @Get("complaints/submissions/:clientSubmissionId")
  async submissionStatus(
    @Param("clientSubmissionId") clientSubmissionId: string,
    @Headers("x-idempotency-key") key?: string,
  ) {
    if (!key) throw new BadRequestException("x-idempotency-key is required");
    const record = await this.client.idempotencyRecord.findUnique({
      where: {
        scope_keyHash: {
          scope: `mobile:${clientSubmissionId}`,
          keyHash: hashOpaqueToken(key, this.config.sessionSecret),
        },
      },
    });
    if (!record) throw new NotFoundException("Submission not found");
    return record.response;
  }

  private async authorizeUpload(id: string, token?: string): Promise<UploadRow> {
    if (!token) throw new UnauthorizedException("Upload authorization required");
    const upload = (await this.client.uploadSession.findUnique({
      where: { id },
    })) as UploadRow | null;
    if (!upload || hashOpaqueToken(token, this.config.sessionSecret) !== upload.tokenHash)
      throw new UnauthorizedException("Upload authorization required");
    if (upload.expiresAt.getTime() <= Date.now()) throw new ConflictException("Upload expired");
    return upload;
  }

  private async appendTusChunk(
    id: string,
    token: string | undefined,
    requestedOffset: number,
    chunk: Buffer,
  ): Promise<{ offset: number; status: "uploading" | "processing" }> {
    if (!token) throw new UnauthorizedException("Upload authorization required");
    return this.client.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${id}))::text AS lock`;
      const upload = (await tx.uploadSession.findUnique({ where: { id } })) as UploadRow | null;
      if (!upload || hashOpaqueToken(token, this.config.sessionSecret) !== upload.tokenHash)
        throw new UnauthorizedException("Upload authorization required");
      if (upload.expiresAt.getTime() <= Date.now()) throw new ConflictException("Upload expired");
      if (!upload.expectedBytes) throw new ConflictException("Upload length is unavailable");
      if (!["created", "uploading"].includes(upload.status))
        throw new ConflictException("Upload is no longer writable");
      const currentOffset = Number(upload.receivedBytes);
      if (requestedOffset !== currentOffset) {
        const error = new ConflictException("Upload offset conflict") as ConflictException & {
          authoritativeOffset?: number;
        };
        error.authoritativeOffset = currentOffset;
        throw error;
      }
      const nextOffset = requestedOffset + chunk.byteLength;
      if (nextOffset > Number(upload.expectedBytes) || nextOffset > Number(upload.maxBytes))
        throw new BadRequestException("Upload exceeds the declared length");

      const file = await open(upload.quarantinePath, "r+");
      try {
        await file.write(chunk, 0, chunk.byteLength, requestedOffset);
        await file.sync();
      } finally {
        await file.close();
      }

      const complete = nextOffset === Number(upload.expectedBytes);
      const status = complete ? "processing" : "uploading";
      await tx.uploadSession.update({
        where: { id },
        data: {
          receivedBytes: BigInt(nextOffset),
          status,
          scanState: complete ? "pending" : upload.status === "created" ? "pending" : undefined,
          lastActivityAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
      if (complete) {
        await tx.outboxEvent.upsert({
          where: { dedupeKey: `evidence.scan.requested:${id}` },
          update: { status: "pending", availableAt: new Date(), lastErrorCode: null },
          create: {
            aggregateType: "upload",
            aggregateId: id,
            eventType: "evidence.scan.requested.v1",
            payload: { uploadId: id },
            dedupeKey: `evidence.scan.requested:${id}`,
          },
        });
      }
      return { offset: nextOffset, status };
    });
  }

  private async completeUpload(upload: UploadRow, receivedBytes: bigint) {
    const kind = asKind(upload.kind);
    const bytes = await readFile(upload.quarantinePath);
    const detectedMimeType = detectMime(kind, bytes, upload.declaredMimeType);
    if (!detectedMimeType || !isAllowed(kind, detectedMimeType)) {
      await this.client.uploadSession.update({
        where: { id: upload.id },
        data: {
          status: "rejected",
          receivedBytes,
          scanState: "failed",
          rejectionCode: "mime_mismatch",
          lastActivityAt: new Date(),
        },
      });
      throw new BadRequestException("File content does not match the permitted media type");
    }
    if (bytes.includes(Buffer.from("EICAR-STANDARD-ANTIVIRUS-TEST-FILE"))) {
      await this.client.uploadSession.update({
        where: { id: upload.id },
        data: {
          status: "rejected",
          receivedBytes,
          detectedMimeType,
          scanState: "infected",
          scanEngine: "eicar-fixture",
          scanResultCode: "malware_detected",
          rejectionCode: "malware_detected",
          scannedAt: new Date(),
          lastActivityAt: new Date(),
        },
      });
      throw new BadRequestException("Malware scan rejected the upload");
    }
    const digest = createHash("sha256").update(bytes).digest();
    const ciphertext = encryptEnvelope(
      bytes,
      deriveKey(this.config.sessionSecret, `evidence:${upload.id}`),
      this.config.encryptionKeyId,
      `evidence:${upload.id}:${kind}`,
    );
    const now = new Date();
    const storageDate = upload.createdAt;
    const finalPath = join(
      this.config.evidenceRoot,
      storageDate.getUTCFullYear().toString(),
      String(storageDate.getUTCMonth() + 1).padStart(2, "0"),
      upload.id,
      "ciphertext.bin",
    );
    await mkdir(join(finalPath, ".."), { recursive: true, mode: 0o700 });
    await writeFile(
      finalPath,
      Buffer.concat([
        Buffer.from(ciphertext.nonce),
        Buffer.from(ciphertext.tag),
        Buffer.from(ciphertext.ciphertext),
      ]),
      { mode: 0o600, flag: "wx" },
    );
    await rm(upload.quarantinePath, { force: true });
    await this.client.uploadSession.update({
      where: { id: upload.id },
      data: {
        receivedBytes,
        status: "complete",
        completedAt: now,
        expectedBytes: upload.expectedBytes ?? receivedBytes,
        finalObjectPath: finalPath,
        sha256Digest: digest,
        detectedMimeType,
        scanState: "clean",
        scanEngine: "legacy-eicar-fixture",
        scanEngineVersion: "compatibility",
        scanResultCode: "clean",
        scannedAt: now,
        encryptionKeyId: ciphertext.keyId,
        encryptionAlgorithm: ciphertext.algorithm,
        lastActivityAt: now,
        expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      },
    });
    return {
      uploadId: upload.id,
      status: "complete",
      offset: Number(receivedBytes),
      sha256: digest.toString("hex"),
    };
  }

  private async resolveUploads(
    raw: unknown[],
    clientSubmissionId: string,
  ): Promise<ApprovedEvidenceMetadata[]> {
    const result: ApprovedEvidenceMetadata[] = [];
    for (const item of raw) {
      if (!item || typeof item !== "object")
        throw new BadRequestException("Invalid upload reference");
      const value = item as {
        id?: string;
        token?: string;
        capturedAt?: string;
        recordedAt?: string;
        durationMs?: number;
      };
      const upload = await this.authorizeUpload(String(value.id ?? ""), value.token);
      if (
        upload.clientSubmissionId !== clientSubmissionId ||
        upload.status !== "complete" ||
        !upload.sha256Digest ||
        !upload.detectedMimeType ||
        !upload.encryptionKeyId
      )
        throw new BadRequestException("Upload is not approved for this submission");
      result.push({
        storageId: upload.id,
        kind: asKind(upload.kind),
        originalName: upload.originalName,
        storageName: upload.id,
        detectedMimeType: upload.detectedMimeType,
        byteLength: upload.receivedBytes,
        sha256Digest: upload.sha256Digest,
        encryptionKeyId: upload.encryptionKeyId,
        encryptionAlgorithm: "AES-256-GCM",
        capturedAt: typeof value.capturedAt === "string" ? value.capturedAt : undefined,
        recordedAt: typeof value.recordedAt === "string" ? value.recordedAt : undefined,
        durationMs:
          Number.isInteger(value.durationMs) && Number(value.durationMs) >= 0
            ? Number(value.durationMs)
            : undefined,
        uploaderActorType: "worker",
      });
    }
    if (new Set(result.map((item) => item.storageId)).size !== result.length)
      throw new BadRequestException("Duplicate upload references");
    return result;
  }
}
