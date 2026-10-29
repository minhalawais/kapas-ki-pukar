import { randomUUID } from "node:crypto";

import { type DatabaseClient } from "@kapas/database";
import { Controller, Get, Inject, Query, Req, UseGuards } from "@nestjs/common";
import type { FastifyRequest } from "fastify";

import { RequirePermission, StaffAuthorizationGuard } from "./authorization";
import { DATABASE_CLIENT } from "./tokens";

@Controller("api/v1/audit")
@UseGuards(StaffAuthorizationGuard)
@RequirePermission("audit.read")
export class AuditController {
  public constructor(@Inject(DATABASE_CLIENT) private readonly client: DatabaseClient) {}

  @Get()
  async list(
    @Query("limit") limit: string | undefined,
    @Query("cursor") cursor: string | undefined,
    @Req() request: FastifyRequest & { user?: { userId: string } },
  ) {
    const take = Math.min(Math.max(Number(limit) || 50, 1), 100);
    const rows = await this.client.auditEvent.findMany({
      take: take + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        complaintId: true,
        actorType: true,
        actorId: true,
        action: true,
        targetType: true,
        targetId: true,
        outcome: true,
        purpose: true,
        requestId: true,
        metadata: true,
        occurredAt: true,
      },
    });
    const nextCursor = rows.length > take ? rows[take - 1]?.id : undefined;
    const result = rows.slice(0, take);
    await this.client.auditEvent.create({
      data: {
        actorType: "staff",
        actorId: request.user?.userId,
        action: "audit.read",
        targetType: "audit_event",
        targetId: result[0]?.id ?? randomUUID(),
        outcome: "success",
        requestId: randomUUID(),
        metadata: { returned: result.length },
      },
    });
    return { items: result, nextCursor };
  }
}
