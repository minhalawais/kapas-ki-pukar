import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { resolve } from "node:path";

import type { RuntimeConfig } from "@kapas/config";
import type { DatabaseClient } from "@kapas/database";
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";

import { buildAnalyticsSnapshot, loadAnalyticsRows, type AnalyticsQuery } from "./analytics";
import { RequirePermission, StaffAuthorizationGuard } from "./authorization";
import { DATABASE_CLIENT, RUNTIME_CONFIG } from "./tokens";

@Controller("api/v1/analytics")
@UseGuards(StaffAuthorizationGuard)
@RequirePermission("case.read")
export class AnalyticsController {
  public constructor(@Inject(DATABASE_CLIENT) private readonly client: DatabaseClient) {}

  @Get("summary")
  async summary(
    @Query() query: AnalyticsQuery,
    @Req() request: FastifyRequest & { user?: { userId: string } },
  ) {
    try {
      const result = buildAnalyticsSnapshot(await loadAnalyticsRows(this.client, query));
      await this.audit(request, "analytics.summary", "success", {
        shape: Object.keys(query).sort(),
      });
      return result;
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : "Invalid analytics query",
      );
    }
  }

  @Get("breakdowns")
  async breakdowns(@Query() query: AnalyticsQuery) {
    const result = buildAnalyticsSnapshot(await loadAnalyticsRows(this.client, query));
    return {
      byCategory: result.byCategory,
      byStatus: result.byStatus,
      byPriority: result.byPriority,
      byProvince: result.byProvince,
      byOutcome: result.byOutcome,
    };
  }

  @Get("trends")
  async trends(@Query() query: AnalyticsQuery) {
    return { trend: buildAnalyticsSnapshot(await loadAnalyticsRows(this.client, query)).trend };
  }

  private async audit(
    request: FastifyRequest & { user?: { userId: string } },
    action: string,
    outcome: "success" | "failure",
    metadata: Record<string, unknown>,
  ) {
    await this.client.auditEvent.create({
      data: {
        actorType: "staff",
        actorId: request.user?.userId,
        action,
        targetType: "analytics",
        targetId: randomUUID(),
        outcome,
        requestId: String(request.id),
        metadata: JSON.parse(JSON.stringify(metadata)),
      },
    });
  }
}

@Controller("api/v1/exports")
@UseGuards(StaffAuthorizationGuard)
@RequirePermission("export.create")
export class ExportController {
  public constructor(
    @Inject(DATABASE_CLIENT) private readonly client: DatabaseClient,
    @Inject(RUNTIME_CONFIG) private readonly config: RuntimeConfig,
  ) {}

  @Post()
  async create(
    @Body() body: { filters?: AnalyticsQuery; fields?: string[]; purpose?: string },
    @Req() request: FastifyRequest & { user?: { userId: string } },
  ) {
    if (!body.purpose?.trim()) throw new BadRequestException("purpose is required");
    const filters = body.filters ?? {};
    await loadAnalyticsRows(this.client, filters);
    const job = await this.client.exportJob.create({
      data: {
        requestedBy: request.user?.userId as string,
        purpose: body.purpose.slice(0, 240),
        format: "csv",
        filters: JSON.parse(JSON.stringify(filters)),
        fields: body.fields ?? [
          "referenceNumber",
          "category",
          "status",
          "priority",
          "province",
          "submittedAt",
        ],
        expiresAt: new Date(Date.now() + 24 * 3_600_000),
      },
    });
    await this.client.outboxEvent.create({
      data: {
        aggregateType: "export",
        aggregateId: job.id,
        eventType: "export.requested.v1",
        payload: { exportId: job.id },
        dedupeKey: `export.requested:${job.id}`,
      },
    });
    await this.client.auditEvent.create({
      data: {
        actorType: "staff",
        actorId: request.user?.userId,
        action: "export.create",
        targetType: "export",
        targetId: job.id,
        outcome: "success",
        purpose: body.purpose.slice(0, 100),
        requestId: String(request.id),
        metadata: { shape: Object.keys(filters).sort() },
      },
    });
    return { id: job.id, status: job.status, expiresAt: job.expiresAt.toISOString() };
  }

  @Get(":id")
  async status(
    @Param("id") id: string,
    @Req() request: FastifyRequest & { user?: { userId: string } },
  ) {
    const job = await this.client.exportJob.findFirst({
      where: { id, requestedBy: request.user?.userId },
    });
    if (!job) return null;
    return {
      id: job.id,
      status: job.status,
      rowCount: job.rowCount,
      expiresAt: job.expiresAt.toISOString(),
      failureCode: job.failureCode,
    };
  }

  @Get(":id/content")
  async content(
    @Param("id") id: string,
    @Req() request: FastifyRequest & { user?: { userId: string } },
    @Res() reply: FastifyReply,
  ) {
    const job = await this.client.exportJob.findFirst({
      where: { id, requestedBy: request.user?.userId },
    });
    const exportRoot = resolve(this.config.evidenceRoot, "exports");
    if (
      !job ||
      job.status !== "ready" ||
      !job.filePath ||
      !resolve(job.filePath).startsWith(
        `${exportRoot}${process.platform === "win32" ? "\\" : "/"}`,
      ) ||
      job.expiresAt <= new Date()
    )
      throw new BadRequestException("Export unavailable");
    await this.client.exportJob.update({ where: { id }, data: { downloadedAt: new Date() } });
    await this.client.auditEvent.create({
      data: {
        actorType: "staff",
        actorId: request.user?.userId,
        action: "export.download",
        targetType: "export",
        targetId: id,
        outcome: "success",
        requestId: String(request.id),
      },
    });
    reply
      .header("content-type", "text/csv; charset=utf-8")
      .header("content-disposition", `attachment; filename="${id}.csv"`)
      .header("cache-control", "no-store");
    return reply.send(createReadStream(job.filePath));
  }
}
