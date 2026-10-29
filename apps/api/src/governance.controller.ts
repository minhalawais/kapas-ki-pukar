import type { DatabaseClient } from "@kapas/database";
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { FastifyRequest } from "fastify";

import { RequirePermission, StaffAuthorizationGuard } from "./authorization";
import { DATABASE_CLIENT } from "./tokens";

@Controller("api/v1/governance")
@UseGuards(StaffAuthorizationGuard)
export class GovernanceController {
  public constructor(@Inject(DATABASE_CLIENT) private readonly client: DatabaseClient) {}

  @Get("quality")
  @RequirePermission("audit.read")
  async quality() {
    return this.client.dataQualityFinding.findMany({
      where: { resolvedAt: null },
      orderBy: [{ severity: "desc" }, { observedAt: "desc" }],
      take: 500,
    });
  }

  @Post("legal-holds")
  @RequirePermission("case.mutate")
  async placeHold(
    @Body() body: { complaintId?: string; reason?: string },
    @Req() request: FastifyRequest & { user?: { userId: string } },
  ) {
    if (!body.complaintId || !body.reason?.trim())
      throw new BadRequestException("complaintId and reason are required");
    const hold = await this.client.legalHold.upsert({
      where: { complaintId: body.complaintId },
      update: {
        reason: body.reason.slice(0, 500),
        placedBy: request.user?.userId as string,
        active: true,
        placedAt: new Date(),
        releasedAt: null,
        releasedBy: null,
      },
      create: {
        complaintId: body.complaintId,
        reason: body.reason.slice(0, 500),
        placedBy: request.user?.userId as string,
      },
    });
    await this.client.auditEvent.create({
      data: {
        actorType: "staff",
        actorId: request.user?.userId,
        action: "legal_hold.place",
        targetType: "complaint",
        targetId: body.complaintId,
        outcome: "success",
        requestId: String(request.id),
        metadata: { reasonLength: body.reason.length },
      },
    });
    return hold;
  }

  @Post("legal-holds/:complaintId/release")
  @RequirePermission("case.mutate")
  async releaseHold(
    @Param("complaintId") complaintId: string,
    @Req() request: FastifyRequest & { user?: { userId: string } },
  ) {
    const hold = await this.client.legalHold.update({
      where: { complaintId },
      data: { active: false, releasedAt: new Date(), releasedBy: request.user?.userId as string },
    });
    await this.client.auditEvent.create({
      data: {
        actorType: "staff",
        actorId: request.user?.userId,
        action: "legal_hold.release",
        targetType: "complaint",
        targetId: complaintId,
        outcome: "success",
        requestId: String(request.id),
      },
    });
    return hold;
  }
}
