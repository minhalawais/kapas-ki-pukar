import { randomUUID } from "node:crypto";

import type { RuntimeConfig } from "@kapas/config";
import {
  PostgresComplaintRepository,
  PostgresSensitiveReporterRepository,
  type DatabaseClient,
} from "@kapas/database";
import type { CaseStatus, Priority, StaffCaseDetail, StaffCaseListItem } from "@kapas/domain";
import { decryptEnvelope, deriveKey } from "@kapas/security";
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";

import { RequirePermission, StaffAuthorizationGuard } from "./authorization";
import { decryptLocationCoordinates } from "./decrypt-location-coordinates";
import { resolveEvidenceContent } from "./evidence-content-resolver";
import { DATABASE_CLIENT, RUNTIME_CONFIG } from "./tokens";

@Controller("api/v1/cases")
@UseGuards(StaffAuthorizationGuard)
@RequirePermission("case.read")
export class CaseController {
  private readonly repository: PostgresComplaintRepository;
  private readonly sensitive: PostgresSensitiveReporterRepository;

  constructor(
    @Inject(DATABASE_CLIENT) private readonly client: DatabaseClient,
    @Inject(RUNTIME_CONFIG) private readonly config: RuntimeConfig,
  ) {
    this.repository = new PostgresComplaintRepository(client);
    this.sensitive = new PostgresSensitiveReporterRepository(this.repository);
  }

  @Get()
  async list(
    @Query()
    query: {
      limit?: string;
      status?: string;
      priority?: string;
      province?: string;
      district?: string;
      search?: string;
      overdue?: string;
    },
  ): Promise<readonly StaffCaseListItem[]> {
    const rows = await this.repository.list(query.limit ? Number(query.limit) : 50);
    return rows.filter(
      (row) =>
        (!query.status || row.status === query.status) &&
        (!query.priority || row.priority === query.priority) &&
        (!query.province || row.province === query.province) &&
        (!query.district || row.district === query.district) &&
        (!query.search ||
          `${row.referenceNumber} ${row.categoryCode}`
            .toLowerCase()
            .includes(query.search.toLowerCase())) &&
        (query.overdue !== "true" || row.overdue),
    );
  }

  @Get("reference-data/locations")
  async locations() {
    const rows = await this.client.complaintLocation.findMany({
      distinct: ["province", "district"],
      select: { province: true, district: true },
      orderBy: [{ province: "asc" }, { district: "asc" }],
    });
    return rows;
  }

  @Get(":id/available-actions")
  async availableActions(@Param("id") id: string) {
    const complaintId = await this.repository.resolveComplaintId(id);
    if (!complaintId) return null;
    const row = await this.client.complaint.findUnique({
      where: { id: complaintId },
      select: { status: true, priority: true, version: true },
    });
    if (!row) return null;
    const terminal = row.status === "Closed";
    return {
      version: row.version,
      status: row.status,
      actions: {
        startTriage: ["Received", "Reopened"].includes(row.status),
        completeTriage: row.status === "Triage",
        changePriority: !terminal,
        addInternalNote: !terminal,
        recordContact: row.status === "Verification",
        addFact: ["Verification", "Investigation"].includes(row.status),
        addFinding: row.status === "Investigation",
        planAction: ["Investigation", "Action in Progress"].includes(row.status),
        updateAction: row.status === "Action in Progress",
        addReferral: !terminal,
        recordOutcome: ["Investigation", "Action in Progress"].includes(row.status),
        close: row.status === "Outcome Verification",
        reopen: terminal,
      },
    };
  }

  @Get(":id")
  async get(@Param("id") id: string): Promise<StaffCaseDetail | null> {
    const complaintId = await this.resolveCaseKey(id);
    const detail = await this.repository.get(complaintId);
    if (!detail) return null;
    const locationRow = await this.client.complaintLocation.findUnique({
      where: { complaintId },
      select: {
        exactCoordinatesCiphertext: true,
        exactCoordinatesNonce: true,
        exactCoordinatesAuthTag: true,
        exactCoordinatesKeyId: true,
        exactCoordinatesAlgorithm: true,
        exactCoordinatesAadContext: true,
      },
    });
    const exactCoordinates = decryptLocationCoordinates(
      locationRow,
      this.config.sessionSecret,
    );
    return { ...detail, exactCoordinates };
  }

  @Get(":id/history")
  async history(@Param("id") id: string) {
    const complaintId = await this.resolveCaseKey(id);
    return this.client.caseHistory.findMany({
      where: { complaintId },
      orderBy: { occurredAt: "asc" },
      select: {
        id: true,
        actionType: true,
        actorType: true,
        occurredAt: true,
        visibility: true,
        reasonData: true,
        resourceVersion: true,
      },
    });
  }

  @Patch(":id/status")
  @RequirePermission("case.mutate")
  async transition(
    @Param("id") id: string,
    @Body()
    body: { expectedVersion?: number; status?: CaseStatus; reason?: string; requestId?: string },
    @Req() request: FastifyRequest & { user?: { userId: string } },
  ) {
    if (!Number.isInteger(body.expectedVersion) || !body.status)
      throw new BadRequestException("expectedVersion and status are required");
    if (body.status !== "Triage")
      throw new BadRequestException("Use the structured workflow endpoint for this transition");
    const complaintId = await this.resolveCaseKey(id);
    const expectedVersion = body.expectedVersion as number;
    return this.repository.transition(
      {
        complaintId,
        expectedVersion,
        actorType: "staff",
        actorId: request.user?.userId,
        requestId: body.requestId ?? randomUUID(),
        reason: body.reason ? { reason: body.reason.slice(0, 500) } : undefined,
        visibility: "worker-visible",
      },
      body.status,
    );
  }

  @Patch(":id/priority")
  @RequirePermission("case.mutate")
  async priority(
    @Param("id") id: string,
    @Body()
    body: { expectedVersion?: number; priority?: Priority; reason?: string; requestId?: string },
    @Req() request: FastifyRequest & { user?: { userId: string } },
  ) {
    if (!Number.isInteger(body.expectedVersion) || !body.priority)
      throw new BadRequestException("expectedVersion and priority are required");
    const complaintId = await this.resolveCaseKey(id);
    const expectedVersion = body.expectedVersion as number;
    return this.repository.changePriority(
      {
        complaintId,
        expectedVersion,
        actorType: "staff",
        actorId: request.user?.userId,
        requestId: body.requestId ?? randomUUID(),
        reason: body.reason ? { reason: body.reason.slice(0, 500) } : undefined,
        visibility: "internal",
      },
      body.priority,
    );
  }

  @Patch(":id/assignment")
  @RequirePermission("case.mutate")
  async assignment(
    @Param("id") id: string,
    @Body() body: { expectedVersion?: number; assigneeId?: string | null; requestId?: string },
    @Req() request: FastifyRequest & { user?: { userId: string } },
  ) {
    if (!Number.isInteger(body.expectedVersion))
      throw new BadRequestException("expectedVersion is required");
    const complaintId = await this.resolveCaseKey(id);
    const requestId = body.requestId ?? randomUUID();
    return this.client.$transaction(async (tx) => {
      const current = await tx.complaint.findUniqueOrThrow({ where: { id: complaintId } });
      if (current.version !== body.expectedVersion) throw new ConflictException("VERSION_CONFLICT");
      const assigneeId = body.assigneeId?.trim() || null;
      if (assigneeId) await tx.user.findUniqueOrThrow({ where: { id: assigneeId } });
      const version = current.version + 1;
      await tx.complaint.update({
        where: { id: complaintId },
        data: { assignedStaffId: assigneeId, version, updatedAt: new Date() },
      });
      await tx.caseHistory.create({
        data: {
          complaintId,
          actionType: "Assignment Changed",
          actorType: "staff",
          actorId: request.user?.userId,
          visibility: "internal",
          requestId,
          reasonData: { assigneeId },
          resourceVersion: version,
        },
      });
      await tx.auditEvent.create({
        data: {
          complaintId,
          actorType: "staff",
          actorId: request.user?.userId,
          action: "case.assignment",
          targetType: "complaint",
          targetId: complaintId,
          outcome: "success",
          requestId,
          metadata: { assigneeId },
        },
      });
      return { id: complaintId, assignedStaffId: assigneeId, version };
    });
  }

  @Patch(":id/resolve")
  @RequirePermission("case.mutate")
  async resolve(
    @Param("id") id: string,
    @Body() body: { expectedVersion?: number; summary?: string; requestId?: string },
    @Req() request: FastifyRequest & { user?: { userId: string } },
  ) {
    void id; void body; void request;
    throw new BadRequestException("Use POST /cases/:id/outcomes");
  }

  @Post(":id/actions")
  @RequirePermission("case.mutate")
  async action(
    @Param("id") id: string,
    @Body()
    body: {
      type?: string;
      expectedVersion?: number;
      reason?: string;
      note?: string;
      visibility?: "internal" | "worker-visible";
      requestId?: string;
    },
    @Req() request: FastifyRequest & { user?: { userId: string } },
  ) {
    if (!body.type || !Number.isInteger(body.expectedVersion))
      throw new BadRequestException("type and expectedVersion are required");
    const allowed: Record<
      string,
      { action: string; visibility: "internal" | "worker-visible"; toStatus?: CaseStatus }
    > = {
      startReview: {
        action: "Triage Completed",
        visibility: "worker-visible",
        toStatus: "Triage",
      },
      addInternalNote: { action: "Internal Note Added", visibility: "internal" },
    };
    const definition = allowed[body.type];
    if (!definition) throw new BadRequestException("Unsupported case action");
    const complaintId = await this.resolveCaseKey(id);
    const requestId = body.requestId ?? randomUUID();
    return this.client.$transaction(async (tx) => {
      const current = await tx.complaint.findUniqueOrThrow({ where: { id: complaintId } });
      if (current.version !== body.expectedVersion) throw new ConflictException("VERSION_CONFLICT");
      const nextVersion = current.version + 1;
      const toStatus = definition.toStatus;
      const valid =
        !toStatus ||
        (toStatus === "Triage" && ["Received", "Reopened"].includes(current.status));
      if (!valid) throw new BadRequestException("Invalid lifecycle transition");
      await tx.complaint.update({
        where: { id: complaintId },
        data: {
          version: nextVersion,
          ...(toStatus ? { status: toStatus } : {}),
          updatedAt: new Date(),
        },
      });
      await tx.caseHistory.create({
        data: {
          complaintId,
          actionType: definition.action,
          actorType: "staff",
          actorId: request.user?.userId,
          visibility: definition.visibility,
          requestId,
          fromStatus: toStatus ? current.status : undefined,
          toStatus,
          reasonData: { note: (body.note ?? body.reason ?? "").slice(0, 4_000) },
          resourceVersion: nextVersion,
        },
      });
      await tx.auditEvent.create({
        data: {
          complaintId,
          actorType: "staff",
          actorId: request.user?.userId,
          action: `case.${body.type}`,
          targetType: "complaint",
          targetId: complaintId,
          outcome: "success",
          requestId,
        },
      });
      return {
        id: complaintId,
        version: nextVersion,
        action: definition.action,
        visibility: definition.visibility,
      };
    });
  }

  @Get(":id/identity")
  @RequirePermission("identity.reveal")
  async identity(
    @Param("id") id: string,
    @Query("purpose") purpose: string | undefined,
    @Req() request: FastifyRequest & { user?: { userId: string; assurance: string } },
  ) {
    if (request.user?.assurance !== "reauthenticated")
      throw new BadRequestException("Recent reauthentication is required");
    if (!purpose?.trim()) throw new BadRequestException("purpose is required");
    const complaintId = await this.resolveCaseKey(id);
    const fields = await this.client.privateReporterField.findMany({
      where: { complaintId },
      orderBy: { kind: "asc" },
    });
    const values = Object.fromEntries(
      fields.map((field) => [
        field.kind,
        new TextDecoder().decode(
          decryptEnvelope(
            {
              ciphertext: field.ciphertext,
              nonce: field.nonce,
              tag: field.authTag,
              keyId: field.keyId,
              algorithm: "AES-256-GCM",
            },
            deriveKey(this.config.sessionSecret, "reporter"),
            field.aadContext,
          ),
        ),
      ]),
    );
    const legacy = fields.length === 0 ? await this.sensitive.get(complaintId) : null;
    const result =
      fields.length > 0
        ? { complaintId, phone: values.phone, cnic: values.cnic }
        : legacy
          ? {
              complaintId,
              legacyUnrecoverable: true,
              kind: legacy.kind,
              displaySuffix: legacy.displaySuffix,
            }
          : null;
    await this.client.auditEvent.create({
      data: {
        complaintId,
        actorType: "staff",
        actorId: request.user?.userId,
        action: "identity.reveal",
        targetType: "private_reporter_identity",
        targetId: complaintId,
        outcome: result ? "success" : "failure",
        purpose: purpose.trim().slice(0, 100),
        requestId: request.id,
      },
    });
    return result;
  }

  @Get(":id/evidence")
  @RequirePermission("evidence.download")
  async evidence(
    @Param("id") id: string,
    @Req() request: FastifyRequest & { user?: { userId: string } },
  ) {
    const complaintId = await this.resolveCaseKey(id);
    const [legacy, v3] = await Promise.all([
      this.client.evidenceAsset.findMany({
        where: { complaintId, availabilityState: "available", retentionState: "active", deletedAt: null },
        orderBy: { receivedAt: "asc" },
        select: { storageId: true, kind: true, originalName: true, detectedMimeType: true,
          byteLength: true, sha256Digest: true, capturedAt: true, encryptionKeyId: true,
          encryptionAlgorithm: true, receivedAt: true },
      }),
      this.client.evidenceDeclaration.findMany({
        where: { complaintId, status: "available" },
        orderBy: { createdAt: "asc" },
        select: { id: true, kind: true, displayName: true, detectedMimeType: true,
          totalBytes: true, sha256Digest: true, capturedAt: true, encryptionKeyId: true,
          createdAt: true },
      }),
    ]);
    const rows = [
      ...legacy.map((item) => ({ ...item, id: item.storageId, version: "legacy" as const })),
      ...v3.map((item) => ({ id: item.id, storageId: item.id, version: "v3" as const,
        kind: item.kind, originalName: item.displayName, detectedMimeType: item.detectedMimeType,
        byteLength: item.totalBytes, sha256Digest: item.sha256Digest, capturedAt: item.capturedAt,
        encryptionKeyId: item.encryptionKeyId, encryptionAlgorithm: "AES-256-GCM",
        receivedAt: item.createdAt })),
    ].sort((left, right) => left.receivedAt.getTime() - right.receivedAt.getTime());
    await this.client.auditEvent.create({
      data: {
        complaintId,
        actorType: "staff",
        actorId: request.user?.userId,
        action: "evidence.metadata.read",
        targetType: "evidence_asset",
        targetId: complaintId,
        outcome: "success",
        requestId: randomUUID(),
      },
    });
    return rows;
  }

  @Get(":id/evidence/:evidenceId/content")
  @RequirePermission("evidence.download")
  async evidenceContent(
    @Param("id") id: string,
    @Param("evidenceId") evidenceId: string,
    @Res() reply: FastifyReply,
    @Req() request: FastifyRequest & { user?: { userId: string } },
  ) {
    const complaintId = await this.resolveCaseKey(id);
    const evidence = await resolveEvidenceContent(this.client, this.config, complaintId, evidenceId);
    if (!evidence) throw new NotFoundException("Evidence is unavailable");
    await this.client.auditEvent.create({
      data: {
        complaintId,
        actorType: "staff",
        actorId: request.user?.userId,
        action: "evidence.content.read",
        targetType: "evidence_asset",
        targetId: evidence.id,
        outcome: "success",
        requestId: randomUUID(),
      },
    });
    const safeName = evidence.originalName.replace(/[^\w. -]/gu, "_");
    const inlineVoice = evidence.mimeType.startsWith("audio/");
    const chunks: Buffer[] = [];
    for await (const chunk of evidence.stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const body = Buffer.concat(chunks);
    reply
      .header("Content-Type", evidence.mimeType)
      .header("Content-Length", body.length)
      .header(
        "Content-Disposition",
        `${inlineVoice ? "inline" : "attachment"}; filename="${safeName}"`,
      )
      .header("X-Content-Type-Options", "nosniff")
      .header("Cache-Control", "no-store");
    if (inlineVoice) reply.header("Accept-Ranges", "bytes");
    return reply.send(body);
  }

  private async resolveCaseKey(key: string): Promise<string> {
    const complaintId = await this.repository.resolveComplaintId(key);
    if (!complaintId) throw new NotFoundException("Complaint not found");
    return complaintId;
  }
}
