import type { RuntimeConfig } from "@kapas/config";
import { PostgresComplaintRepository, type DatabaseClient } from "@kapas/database";
import type { IdentityAccessRepository } from "@kapas/domain";
import { hashOpaqueToken, verifyPassword } from "@kapas/security";
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";

import { resolveEvidenceContent } from "./evidence-content-resolver";
import { DATABASE_CLIENT, IDENTITY_REPOSITORY, RUNTIME_CONFIG } from "./tokens";
import {
  expoPushTokenFingerprint,
  parseWorkerPushRegistrationBody,
} from "./worker-push-registration";

const WORKER_COOKIE = "kapas_worker_session";
type CookieRequest = FastifyRequest & { cookies?: Record<string, string | undefined> };
type WorkerAccessSession = {
  sessionId: string;
  complaintId?: string;
  referenceNumber?: string;
  profileId?: string;
};

@Controller("api/v1/worker")
export class WorkerController {
  private readonly complaints: PostgresComplaintRepository;

  constructor(
    @Inject(DATABASE_CLIENT) private readonly client: DatabaseClient,
    @Inject(IDENTITY_REPOSITORY) private readonly identity: IdentityAccessRepository,
    @Inject(RUNTIME_CONFIG) private readonly config: RuntimeConfig,
  ) {
    this.complaints = new PostgresComplaintRepository(client);
  }

  @Get("complaints")
  async list(@Req() request: CookieRequest, @Query("cursor") cursor?: string) {
    const session = await this.session(request);
    if (session.profileId) {
      const rows = await this.client.complaint.findMany({
        where: { workerProfileId: session.profileId },
        select: { id: true, referenceNumber: true },
        orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
        take: 51,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      });
      const page = rows.slice(0, 50);
      const details = await Promise.all(
        page.map((row) => this.complaints.getByReference(row.referenceNumber)),
      );
      return {
        items: details.filter((item) => item !== null),
        nextCursor: rows.length > 50 ? (page.at(-1)?.id ?? null) : null,
      };
    }
    const detail = session.referenceNumber
      ? await this.complaints.getByReference(session.referenceNumber)
      : null;
    return detail ? [detail] : [];
  }

  @Get("complaints/:referenceNumber")
  async detail(@Req() request: CookieRequest, @Param("referenceNumber") referenceNumber: string) {
    const session = await this.session(request);
    await this.assertReferenceAccess(session, referenceNumber);
    const detail = await this.complaints.getByReference(referenceNumber);
    if (!detail) throw new NotFoundException("Complaint not found");
    return detail;
  }

  @Get("complaints/:referenceNumber/evidence/:evidenceId/content")
  async evidenceContent(
    @Req() request: CookieRequest,
    @Param("referenceNumber") referenceNumber: string,
    @Param("evidenceId") evidenceId: string,
    @Res() reply: FastifyReply,
  ) {
    const session = await this.authorizedReference(request, referenceNumber);
    const complaint = await this.assertReferenceAccess(session, referenceNumber);
    const evidence = await resolveEvidenceContent(
      this.client,
      this.config,
      complaint.id,
      evidenceId,
    );
    if (!evidence) throw new NotFoundException("Evidence not found");
    await this.client.auditEvent.create({
      data: {
        complaintId: complaint.id,
        actorType: "worker",
        actorId: session.sessionId,
        action: "evidence.content.read",
        targetType: "evidence_asset",
        targetId: evidence.id,
        outcome: "success",
        requestId: request.id,
      },
    });
    reply
      .header("Content-Type", evidence.mimeType)
      .header(
        "Content-Disposition",
        `inline; filename="${evidence.originalName.replace(/[^\w. -]/gu, "_")}"`,
      )
      .header("X-Content-Type-Options", "nosniff")
      .header("Cache-Control", "private, no-store");
    return reply.send(evidence.stream);
  }

  @Post("complaints/:referenceNumber/feedback")
  async feedback(
    @Req() request: CookieRequest,
    @Param("referenceNumber") referenceNumber: string,
    @Body()
    body: {
      expectedVersion?: number;
      outcome?: "satisfied" | "partial" | "unresolved";
      comment?: string;
      requestId?: string;
    },
  ) {
    const session = await this.authorizedReference(request, referenceNumber);
    if (!Number.isInteger(body.expectedVersion) || !body.outcome || !body.requestId)
      throw new BadRequestException("expectedVersion, outcome and requestId are required");
    if (
      body.comment !== undefined &&
      (typeof body.comment !== "string" || body.comment.length > 2_000)
    )
      throw new BadRequestException("comment is invalid");
    const existing = await this.client.workerFeedback.findFirst({
      where: { complaintId: session.complaintId, requestId: body.requestId },
    });
    if (existing) return this.complaints.getByReference(referenceNumber);
    return this.complaints.recordFeedback(
      {
        complaintId: session.complaintId,
        expectedVersion: body.expectedVersion as number,
        actorType: "worker",
        requestId: body.requestId,
        visibility: "worker-visible",
      },
      body.outcome,
      body.comment?.trim(),
    );
  }

  @Post("complaints/:referenceNumber/information-responses")
  async informationResponse(
    @Req() request: CookieRequest,
    @Param("referenceNumber") referenceNumber: string,
    @Body() body: { requestId?: string; answers?: unknown },
  ) {
    const session = await this.authorizedReference(request, referenceNumber);
    if (!body.requestId || typeof body.requestId !== "string" || !body.answers)
      throw new BadRequestException("requestId and answers are required");
    const existing = await this.client.workerInformationResponse.findFirst({
      where: { complaintId: session.complaintId, requestId: body.requestId },
    });
    if (!existing) {
      await this.client.workerInformationResponse.create({
        data: {
          complaintId: session.complaintId,
          requestId: body.requestId,
          responseData: body.answers as object,
        },
      });
    }
    return this.complaints.getByReference(referenceNumber);
  }

  @Post("complaints/:referenceNumber/push-token")
  async registerPushToken(
    @Req() request: CookieRequest,
    @Param("referenceNumber") referenceNumber: string,
    @Body() body: unknown,
  ) {
    const session = await this.authorizedReference(request, referenceNumber);
    const parsed = parseWorkerPushRegistrationBody(body);
    if ("error" in parsed) throw new BadRequestException(parsed.error);
    const fingerprint = expoPushTokenFingerprint(parsed.expoPushToken);
    const locale = parsed.locale?.toLowerCase().startsWith("ur") ? "ur" : "en";
    await this.client.$transaction(async (tx) => {
      const existing = await tx.workerPushRegistration.findUnique({
        where: { tokenFingerprint: fingerprint },
      });
      if (existing?.complaintId === session.complaintId && !existing.revokedAt) {
        await tx.workerPushRegistration.update({
          where: { id: existing.id },
          data: {
            lastSeenAt: new Date(),
            locale,
            platform: parsed.platform,
            deviceInstallId: parsed.deviceInstallId,
          },
        });
      } else {
        if (existing) {
          await tx.workerPushRegistration.update({
            where: { id: existing.id },
            data: { revokedAt: new Date() },
          });
        }
        await tx.workerPushRegistration.create({
          data: {
            complaintId: session.complaintId,
            expoPushToken: parsed.expoPushToken,
            tokenFingerprint: fingerprint,
            platform: parsed.platform,
            locale,
            deviceInstallId: parsed.deviceInstallId,
          },
        });
      }
      await tx.auditEvent.create({
        data: {
          complaintId: session.complaintId,
          actorType: "worker",
          actorId: session.sessionId,
          action: "worker.push.registered",
          targetType: "complaint",
          targetId: session.complaintId,
          outcome: "success",
          requestId: parsed.requestId,
          metadata: { platform: parsed.platform, locale },
        },
      });
    });
    return { registered: true };
  }

  @Post("complaints/:referenceNumber/push-token/revoke")
  async revokePushToken(
    @Req() request: CookieRequest,
    @Param("referenceNumber") referenceNumber: string,
    @Body() body: { expoPushToken?: string; requestId?: string },
  ) {
    const session = await this.authorizedReference(request, referenceNumber);
    if (typeof body.expoPushToken !== "string" || !body.requestId)
      throw new BadRequestException("expoPushToken and requestId are required");
    const fingerprint = expoPushTokenFingerprint(body.expoPushToken.trim());
    await this.client.workerPushRegistration.updateMany({
      where: { complaintId: session.complaintId, tokenFingerprint: fingerprint, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.client.auditEvent.create({
      data: {
        complaintId: session.complaintId,
        actorType: "worker",
        actorId: session.sessionId,
        action: "worker.push.revoked",
        targetType: "complaint",
        targetId: session.complaintId,
        outcome: "success",
        requestId: body.requestId,
        metadata: {},
      },
    });
    return { revoked: true };
  }

  @Post("complaints/:referenceNumber/claim")
  async claim(
    @Req() request: CookieRequest,
    @Param("referenceNumber") referenceNumber: string,
    @Body() body: { trackingSecret?: string },
  ) {
    const session = await this.session(request);
    if (!session.profileId || !body.trackingSecret)
      throw new UnauthorizedException(
        "History authentication and tracking credentials are required",
      );
    const complaint = await this.client.complaint.findUnique({
      where: { referenceNumber },
      include: { workerCredential: true },
    });
    if (
      !complaint?.workerCredential ||
      !(await verifyPassword(body.trackingSecret, complaint.workerCredential.secretHash))
    )
      throw new NotFoundException("Complaint not found");
    if (complaint.workerProfileId && complaint.workerProfileId !== session.profileId)
      throw new NotFoundException("Complaint not found");
    await this.client.$transaction(async (tx) => {
      await tx.complaint.update({
        where: { id: complaint.id },
        data: { workerProfileId: session.profileId },
      });
      await tx.auditEvent.create({
        data: {
          complaintId: complaint.id,
          actorType: "worker",
          actorId: session.sessionId,
          action: "worker_history.claim",
          targetType: "complaint",
          targetId: complaint.id,
          outcome: "success",
          requestId: request.id,
          metadata: {},
        },
      });
    });
    return { referenceNumber, claimed: true };
  }

  private async authorizedReference(
    request: CookieRequest,
    referenceNumber: string,
  ): Promise<{ sessionId: string; complaintId: string; referenceNumber: string }> {
    const session = await this.session(request);
    const complaint = await this.assertReferenceAccess(session, referenceNumber);
    return { sessionId: session.sessionId, complaintId: complaint.id, referenceNumber };
  }

  private async session(request: CookieRequest): Promise<WorkerAccessSession> {
    const bearer = request.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    const token = bearer ?? request.cookies?.[WORKER_COOKIE];
    if (!token) throw new UnauthorizedException("Worker authentication required");
    const tokenHash = hashOpaqueToken(token, this.config.sessionSecret);
    const history = await this.client.workerHistorySession.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
    });
    if (history) return { sessionId: history.id, profileId: history.profileId };
    const session = await this.identity.resolveWorkerSession(tokenHash);
    if (!session) throw new UnauthorizedException("Worker authentication required");
    return session;
  }

  private async assertReferenceAccess(session: WorkerAccessSession, referenceNumber: string) {
    const complaint = await this.client.complaint.findUnique({
      where: { referenceNumber },
      select: { id: true, referenceNumber: true, workerProfileId: true },
    });
    if (!complaint) throw new NotFoundException("Complaint not found");
    const authorized = session.complaintId
      ? complaint.id === session.complaintId
      : session.profileId
        ? complaint.workerProfileId === session.profileId
        : complaint.referenceNumber === session.referenceNumber;
    if (!authorized) throw new NotFoundException("Complaint not found");
    return complaint;
  }
}
