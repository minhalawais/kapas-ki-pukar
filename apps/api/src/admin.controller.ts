import { randomUUID } from "node:crypto";

import type { DatabaseClient } from "@kapas/database";
import { hashPassword, normalizeLoginIdentifier } from "@kapas/security";
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Patch,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { FastifyRequest } from "fastify";

import { StaffAuthorizationGuard, RequirePermission } from "./authorization";
import { DATABASE_CLIENT } from "./tokens";

@Controller("api/v1/admin/users")
@UseGuards(StaffAuthorizationGuard)
@RequirePermission("user.manage")
export class AdminController {
  constructor(@Inject(DATABASE_CLIENT) private readonly client: DatabaseClient) {}

  @Get()
  async list() {
    return this.client.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        displayName: true,
        loginIdentifier: true,
        status: true,
        assignmentScope: true,
        createdAt: true,
        updatedAt: true,
        roles: { select: { role: { select: { code: true } } } },
      },
      take: 100,
    });
  }

  @Post()
  async create(
    @Body()
    body: {
      displayName?: string;
      loginIdentifier?: string;
      password?: string;
      role?: string;
    },
    @Req() request: FastifyRequest & { user?: { userId?: string } },
  ) {
    if (!body.displayName || !body.loginIdentifier || !body.password || !body.role) {
      throw new BadRequestException("displayName, loginIdentifier, password and role are required");
    }
    const role = await this.client.role.findUnique({ where: { code: body.role } });
    if (!role) throw new BadRequestException("Unknown role");
    const created = await this.client.user.create({
      data: {
        displayName: body.displayName,
        loginIdentifier: normalizeLoginIdentifier(body.loginIdentifier),
        passwordCredential: { create: { passwordHash: await hashPassword(body.password) } },
        roles: { create: { roleId: role.id } },
      },
      select: { id: true, displayName: true, loginIdentifier: true, status: true },
    });
    await this.client.auditEvent.create({
      data: {
        actorType: "staff",
        actorId: request.user?.userId,
        action: "user.create",
        targetType: "user",
        targetId: created.id,
        outcome: "success",
        requestId: String(request.id),
      },
    });
    return created;
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body()
    body: {
      status?: "active" | "disabled" | "locked";
      displayName?: string;
      assignmentScope?: string | null;
    },
    @Req() request: FastifyRequest & { user?: { userId?: string } },
  ) {
    const updated = await this.client.user.update({
      where: { id },
      data: {
        status: body.status,
        displayName: body.displayName,
        assignmentScope: body.assignmentScope,
      },
      select: {
        id: true,
        displayName: true,
        loginIdentifier: true,
        status: true,
        assignmentScope: true,
      },
    });
    if (body.status === "disabled" || body.status === "locked") {
      await this.client.session.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date(), revokeReason: `account_${body.status}` },
      });
    }
    await this.client.auditEvent.create({
      data: {
        actorType: "staff",
        actorId: request.user?.userId,
        action: "user.update",
        targetType: "user",
        targetId: id,
        outcome: "success",
        requestId: String(request.id),
        metadata: { status: body.status ?? null },
      },
    });
    return updated;
  }

  @Post(":id/sessions/revoke")
  async revokeSessions(
    @Param("id") id: string,
    @Req() request: FastifyRequest & { user?: { userId?: string } },
  ) {
    const result = await this.client.session.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date(), revokeReason: "administrator_revoke" },
    });
    await this.client.auditEvent.create({
      data: {
        actorType: "staff",
        actorId: request.user?.userId,
        action: "session.revoke_all",
        targetType: "user",
        targetId: id,
        outcome: "success",
        requestId: String(request.id || randomUUID()),
        metadata: { count: result.count },
      },
    });
    return { revoked: result.count };
  }
}
