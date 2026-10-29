import "@fastify/cookie";
import type { RuntimeConfig } from "@kapas/config";
import type { DatabaseClient } from "@kapas/database";
import type { IdentityAccessRepository } from "@kapas/domain";
import { normalizePakistanCnic, normalizePakistanPhone } from "@kapas/domain";
import {
  createCsrfToken,
  deriveKey,
  encryptEnvelope,
  generateOpaqueToken,
  generateTotpSecret,
  hashOpaqueToken,
} from "@kapas/security";
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Inject,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";

import { DATABASE_CLIENT, IDENTITY_REPOSITORY, RUNTIME_CONFIG } from "./tokens";

const STAFF_COOKIE = "kapas_staff_session";
const WORKER_COOKIE = "kapas_worker_session";
type CookieRequest = FastifyRequest & { cookies?: Record<string, string | undefined> };
type CookieReply = FastifyReply & {
  setCookie(name: string, value: string, options: Record<string, unknown>): FastifyReply;
  clearCookie(name: string, options: Record<string, unknown>): FastifyReply;
};

@Controller("api/v1")
export class AuthController {
  private readonly historyFailures = new Map<string, { count: number; lockedUntil: number }>();

  constructor(
    @Inject(IDENTITY_REPOSITORY) private readonly identity: IdentityAccessRepository,
    @Inject(RUNTIME_CONFIG) private readonly config: RuntimeConfig,
    @Inject(DATABASE_CLIENT) private readonly client: DatabaseClient,
  ) {}

  @Post("auth/login")
  async login(
    @Body() body: { loginIdentifier?: string; password?: string },
    @Res({ passthrough: true }) reply: CookieReply,
  ) {
    if (!body.loginIdentifier || !body.password)
      throw new BadRequestException("Credentials are required");
    const token = generateOpaqueToken(32);
    const authenticated = await this.identity.authenticateStaff(
      body.loginIdentifier,
      body.password,
    );
    if (!authenticated) throw new UnauthorizedException("Invalid credentials");
    const session = await this.identity.createStaffSession(
      authenticated.userId,
      authenticated.assurance,
      hashOpaqueToken(token, this.config.sessionSecret),
    );
    reply.setCookie(STAFF_COOKIE, token, {
      httpOnly: true,
      secure: this.config.nodeEnv === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 8 * 60 * 60,
    });
    reply.setCookie("kapas_csrf", createCsrfToken(token, this.config.sessionSecret), {
      httpOnly: false,
      secure: this.config.nodeEnv === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 8 * 60 * 60,
    });
    return {
      userId: authenticated.userId,
      displayName: authenticated.displayName,
      assurance: authenticated.assurance,
      expiresAt: session.expiresAt,
    };
  }

  @Post("auth/logout")
  async logout(@Req() request: CookieRequest, @Res({ passthrough: true }) reply: CookieReply) {
    const token = request.cookies?.[STAFF_COOKIE];
    if (token)
      await this.identity.revokeSession(
        hashOpaqueToken(token, this.config.sessionSecret),
        "logout",
      );
    reply.clearCookie(STAFF_COOKIE, { path: "/" });
    reply.clearCookie("kapas_csrf", { path: "/" });
    return { ok: true };
  }

  @Post("auth/mfa/enroll")
  async enrollMfa(@Req() request: CookieRequest) {
    const token = request.cookies?.[STAFF_COOKIE];
    if (!token) throw new UnauthorizedException("Authentication required");
    const session = await this.identity.resolveStaffSession(
      hashOpaqueToken(token, this.config.sessionSecret),
    );
    if (!session) throw new UnauthorizedException("Authentication required");
    if (session.assurance !== "reauthenticated")
      throw new UnauthorizedException("Recent reauthentication required");
    const secret = generateTotpSecret();
    const envelope = encryptEnvelope(
      new TextEncoder().encode(secret),
      deriveKey(this.config.sessionSecret, "mfa"),
      this.config.encryptionKeyId,
      `mfa:${session.userId}`,
    );
    await this.identity.enrollTotp(session.userId, envelope);
    return {
      secret,
      recoveryCodes: await this.identity.rotateRecoveryCodes(session.userId),
      status: "pending",
    };
  }

  @Post("auth/mfa/verify")
  async verifyMfa(@Req() request: CookieRequest, @Body() body: { code?: string }) {
    const token = request.cookies?.[STAFF_COOKIE];
    if (!token || !body.code) throw new UnauthorizedException("Authentication required");
    const session = await this.identity.resolveStaffSession(
      hashOpaqueToken(token, this.config.sessionSecret),
    );
    if (
      !session ||
      (!(await this.identity.verifyMfa(session.userId, body.code)) &&
        !(await this.identity.consumeRecoveryCode(session.userId, body.code)))
    )
      throw new UnauthorizedException("MFA verification failed");
    await this.identity.markSessionMfa(hashOpaqueToken(token, this.config.sessionSecret));
    return { verified: true };
  }

  @Post("auth/reauthenticate")
  async reauthenticate(@Req() request: CookieRequest, @Body() body: { password?: string }) {
    const token = request.cookies?.[STAFF_COOKIE];
    if (!token || !body.password) throw new UnauthorizedException("Authentication required");
    const valid = await this.identity.reauthenticate(
      hashOpaqueToken(token, this.config.sessionSecret),
      body.password,
    );
    if (!valid) throw new UnauthorizedException("Reauthentication failed");
    return { reauthenticated: true };
  }

  @Post("auth/mfa/recovery-codes/rotate")
  async rotateRecoveryCodes(@Req() request: CookieRequest) {
    const token = request.cookies?.[STAFF_COOKIE];
    if (!token) throw new UnauthorizedException("Authentication required");
    const session = await this.identity.resolveStaffSession(
      hashOpaqueToken(token, this.config.sessionSecret),
    );
    if (!session || session.assurance !== "reauthenticated")
      throw new UnauthorizedException("Recent reauthentication required");
    return { recoveryCodes: await this.identity.rotateRecoveryCodes(session.userId) };
  }

  @Post("worker-sessions")
  async workerSession(
    @Body() body: { referenceNumber?: string; trackingSecret?: string },
    @Res({ passthrough: true }) reply: CookieReply,
  ) {
    if (!body.referenceNumber || !body.trackingSecret)
      throw new BadRequestException("Tracking credentials are required");
    const token = generateOpaqueToken(32);
    const session = await this.identity.authenticateWorker(
      body.referenceNumber,
      body.trackingSecret,
      hashOpaqueToken(token, this.config.sessionSecret),
    );
    if (!session) throw new UnauthorizedException("Unable to authenticate tracking credentials");
    reply.setCookie(WORKER_COOKIE, token, {
      httpOnly: true,
      secure: this.config.nodeEnv === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 15 * 60,
    });
    // Mobile clients cannot reliably access Set-Cookie through the platform fetch
    // implementation, so return the short-lived session token for secure storage.
    return {
      referenceNumber: session.referenceNumber,
      expiresAt: session.expiresAt,
      sessionToken: token,
    };
  }

  @Post("worker-history-sessions")
  async workerHistorySession(
    @Body() body: { phone?: string; cnic?: string },
    @Req() request: FastifyRequest,
  ) {
    let phone: string;
    let cnic: string | undefined;
    try {
      phone = normalizePakistanPhone(body.phone ?? "");
      cnic = body.cnic ? normalizePakistanCnic(body.cnic) : undefined;
    } catch {
      throw new UnauthorizedException("Unable to authenticate worker history");
    }
    const phoneBlindIndex = hashOpaqueToken(`phone:${phone}`, this.config.identityLookupPepper);
    const failure = this.historyFailures.get(phoneBlindIndex);
    if (failure && failure.lockedUntil > Date.now())
      throw new UnauthorizedException("Unable to authenticate worker history");
    const profile = await this.client.workerIdentityProfile.findUnique({
      where: { phoneBlindIndex },
    });
    const cnicMatches =
      !profile?.cnicBlindIndex ||
      (cnic &&
        profile.cnicBlindIndex ===
          hashOpaqueToken(`cnic:${cnic}`, this.config.identityLookupPepper));
    if (!profile || !cnicMatches) {
      const count = (failure?.count ?? 0) + 1;
      this.historyFailures.set(phoneBlindIndex, {
        count,
        lockedUntil: Date.now() + Math.min(15 * 60_000, count ** 2 * 1_000),
      });
      throw new UnauthorizedException("Unable to authenticate worker history");
    }
    this.historyFailures.delete(phoneBlindIndex);
    const token = generateOpaqueToken(32);
    const expiresAt = new Date(Date.now() + 15 * 60_000);
    const session = await this.client.workerHistorySession.create({
      data: {
        profileId: profile.id,
        tokenHash: hashOpaqueToken(token, this.config.sessionSecret),
        expiresAt,
      },
    });
    await this.client.auditEvent.create({
      data: {
        actorType: "worker",
        actorId: session.id,
        action: "worker_history.authenticate",
        targetType: "worker_identity_profile",
        targetId: profile.id,
        outcome: "success",
        requestId: request.id,
        metadata: {},
      },
    });
    return { sessionToken: token, expiresAt: expiresAt.toISOString() };
  }

  @Delete("worker-sessions/current")
  async workerLogout(
    @Req() request: CookieRequest,
    @Res({ passthrough: true }) reply: CookieReply,
  ) {
    const token = request.cookies?.[WORKER_COOKIE];
    if (token)
      await this.identity.revokeWorkerSession(hashOpaqueToken(token, this.config.sessionSecret));
    reply.clearCookie(WORKER_COOKIE, { path: "/" });
    return { ok: true };
  }
}
