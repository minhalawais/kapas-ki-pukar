import type { RuntimeConfig } from "@kapas/config";
import type { DatabaseClient } from "@kapas/database";
import { constantTimeEqual, hashOpaqueToken } from "@kapas/security";
import { Body, Controller, Headers, Inject, Post, UnauthorizedException } from "@nestjs/common";

import { postFinishLengthMatches, postReceiveUpdateWhere } from "./tus-hook-evidence";
import { DATABASE_CLIENT, RUNTIME_CONFIG } from "./tokens";

type TusHook = {
  Type?: string;
  Event?: {
    Upload?: {
      ID?: string;
      Size?: number;
      Offset?: number;
      MetaData?: Record<string, string>;
      Storage?: { Type?: string; Bucket?: string; Key?: string };
    };
    HTTPRequest?: { Header?: Record<string, string[]> };
  };
};

function rejection(code: string, statusCode = 403) {
  return {
    RejectUpload: true,
    StopUpload: true,
    RejectTermination: true,
    HTTPResponse: {
      StatusCode: statusCode,
      Body: JSON.stringify({ code }),
      Header: { "Content-Type": "application/json" },
    },
  };
}

@Controller("internal/tusd-hooks")
export class TusHookController {
  constructor(
    @Inject(DATABASE_CLIENT) private readonly client: DatabaseClient,
    @Inject(RUNTIME_CONFIG) private readonly config: RuntimeConfig,
  ) {}

  @Post()
  async handle(
    @Body() hook: TusHook,
    @Headers("x-tusd-hook-secret") hookSecret: string | undefined,
  ) {
    if (!hookSecret || !constantTimeEqual(hookSecret, this.config.tusdHookSecret)) {
      throw new UnauthorizedException("Invalid tusd hook credential");
    }
    const upload = hook.Event?.Upload;
    const metadata = upload?.MetaData ?? {};
    const grantId = metadata.grantId;
    const evidenceId = metadata.evidenceId;
    const token =
      hook.Event?.HTTPRequest?.Header?.["Upload-Token"]?.[0] ??
      hook.Event?.HTTPRequest?.Header?.["upload-token"]?.[0];
    if (!grantId || !evidenceId || !token) return rejection("upload_authorization_missing");
    const grant = await this.client.tusUploadGrant.findUnique({
      where: { id: grantId },
      include: { evidence: true },
    });
    if (
      !grant ||
      grant.evidenceId !== evidenceId ||
      grant.status !== "active" ||
      grant.expiresAt.getTime() <= Date.now() ||
      !constantTimeEqual(grant.tokenHash, hashOpaqueToken(token, this.config.sessionSecret))
    )
      return rejection("upload_authorization_invalid");

    if (hook.Type === "pre-create") {
      if (upload?.Size !== Number(grant.evidence.totalBytes))
        return rejection("upload_length_mismatch", 400);
      if (
        metadata.kind !== grant.evidence.kind ||
        metadata.filetype !== grant.evidence.declaredMimeType
      ) {
        return rejection("upload_metadata_mismatch", 400);
      }
      return {
        ChangeFileInfo: {
          ID: grant.id,
          MetaData: {
            grantId: grant.id,
            evidenceId: grant.evidence.id,
            clientMediaId: grant.evidence.clientMediaId,
            kind: grant.evidence.kind,
            filetype: grant.evidence.declaredMimeType,
          },
        },
      };
    }

    if (hook.Type === "post-create") {
      await this.client.$transaction([
        this.client.tusUploadGrant.update({
          where: { id: grant.id },
          data: { tusUploadId: upload?.ID ?? grant.id },
        }),
        this.client.evidenceDeclaration.update({
          where: { id: evidenceId },
          data: { status: "uploading" },
        }),
      ]);
    } else if (hook.Type === "post-receive") {
      const offset = BigInt(upload?.Offset ?? 0);
      if (offset > grant.evidence.totalBytes) return rejection("upload_offset_invalid", 409);
      await this.client.evidenceDeclaration.updateMany({
        where: postReceiveUpdateWhere(evidenceId, offset),
        data: { status: "uploading", uploadedBytes: offset },
      });
    } else if (hook.Type === "post-finish") {
      if (!postFinishLengthMatches(upload?.Offset, grant.evidence.totalBytes))
        return rejection("upload_length_mismatch", 409);
      await this.client.$transaction(async (tx) => {
        await tx.evidenceDeclaration.update({
          where: { id: evidenceId },
          data: {
            status: "quarantined",
            uploadedBytes: grant.evidence.totalBytes,
            quarantineBucket: upload?.Storage?.Bucket ?? "quarantine",
            quarantineKey: upload?.Storage?.Key ?? upload?.ID ?? grant.id,
          },
        });
        await tx.complaint.update({
          where: { id: grant.evidence.complaintId },
          data: { evidenceStatus: "processing" },
        });
        await tx.outboxEvent.upsert({
          where: { dedupeKey: `evidence.scan.requested.v3:${evidenceId}` },
          create: {
            complaintId: grant.evidence.complaintId,
            aggregateType: "evidence",
            aggregateId: evidenceId,
            eventType: "evidence.scan.requested.v3",
            payload: { evidenceId },
            dedupeKey: `evidence.scan.requested.v3:${evidenceId}`,
          },
          update: {},
        });
      });
    } else if (hook.Type === "post-terminate") {
      await this.client.$transaction([
        this.client.tusUploadGrant.update({
          where: { id: grant.id },
          data: { status: "terminated", terminatedAt: new Date() },
        }),
        this.client.evidenceDeclaration.update({
          where: { id: evidenceId },
          data: { status: "expired", reasonCode: "upload_terminated" },
        }),
      ]);
    }
    return {};
  }
}
