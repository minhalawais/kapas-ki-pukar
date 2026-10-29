import type { RuntimeConfig } from "@kapas/config";
import type { IdentityAccessRepository } from "@kapas/domain";
import { hashOpaqueToken, hasPermission, type StaffPermission } from "@kapas/security";
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { FastifyRequest } from "fastify";

import { IDENTITY_REPOSITORY, RUNTIME_CONFIG } from "./tokens";

export const REQUIRED_PERMISSION = "kapas:required-permission";
export const RequirePermission = (permission: StaffPermission) =>
  SetMetadata(REQUIRED_PERMISSION, permission);

@Injectable()
export class StaffAuthorizationGuard implements CanActivate {
  constructor(
    @Inject(IDENTITY_REPOSITORY) private readonly identity: IdentityAccessRepository,
    @Inject(RUNTIME_CONFIG) private readonly config: RuntimeConfig,
    @Inject(Reflector) private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<
        FastifyRequest & { cookies?: Record<string, string | undefined>; user?: unknown }
      >();
    const token = request.cookies?.kapas_staff_session;
    if (!token) throw new UnauthorizedException();
    const staff = await this.identity.resolveStaffSession(
      hashOpaqueToken(token, this.config.sessionSecret),
    );
    if (!staff) throw new UnauthorizedException();
    request.user = staff;
    const required = this.reflector.getAllAndOverride<StaffPermission>(REQUIRED_PERMISSION, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (required && !hasPermission(staff.permissions, required)) throw new ForbiddenException();
    return true;
  }
}

export function assertStaffPermission(user: unknown, permission: StaffPermission): void {
  const permissions = (user as { permissions?: readonly StaffPermission[] } | undefined)
    ?.permissions;
  if (!permissions || !hasPermission(permissions, permission)) throw new ForbiddenException();
}
