import "reflect-metadata";

import { createHmac, randomUUID } from "node:crypto";

import { loadRuntimeConfig } from "@kapas/config";
import { createDatabaseClient, type DatabaseClient } from "@kapas/database";
import { hashPassword } from "@kapas/security";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createApplication } from "./application";

const enabled = process.env.TEST_DATABASE_URL && process.env.REDIS_URL;
const integration = enabled ? describe : describe.skip;
let app: NestFastifyApplication;
let client: DatabaseClient;
let cookie = "";
let csrfToken = "";
let loginIdentifier = "";
const password = "correct horse battery staple";

integration("API identity and authorization", () => {
  beforeAll(async () => {
    const suffix = randomUUID();
    loginIdentifier = `phase04-${suffix}@example.test`;
    client = createDatabaseClient({ connectionString: process.env.TEST_DATABASE_URL as string });
    const role = await client.role.create({
      data: { code: `phase04_manager_${suffix}`, description: "Phase 04 integration" },
    });
    for (const code of ["case.read", "case.mutate", "audit.read", "evidence.download"]) {
      const permission = await client.permission.upsert({
        where: { code },
        create: { code, description: `${code} permission` },
        update: {},
      });
      await client.rolePermission.create({
        data: { roleId: role.id, permissionId: permission.id },
      });
    }
    await client.user.create({
      data: {
        displayName: "Phase 04 Synthetic User",
        loginIdentifier,
        passwordCredential: { create: { passwordHash: await hashPassword(password) } },
        roles: { create: { roleId: role.id } },
      },
    });

    const config = loadRuntimeConfig({
      ...process.env,
      NODE_ENV: "test",
      APP_VERSION: "0.1.0",
      API_HOST: "127.0.0.1",
      API_PORT: "4000",
      PUBLIC_API_URL: "http://127.0.0.1:4000",
      PORTAL_ORIGIN: "http://127.0.0.1:3000",
      DATABASE_URL: process.env.TEST_DATABASE_URL,
      LOG_LEVEL: "silent",
      TRUST_PROXY_COUNT: "0",
      EVIDENCE_ROOT: "./storage/evidence",
      QUARANTINE_ROOT: "./storage/quarantine",
      ENCRYPTION_KEY_ID: "phase04-integration",
      SESSION_SECRET: "phase04-integration-session-secret-32-characters",
      IDENTITY_LOOKUP_PEPPER: "phase04-identity-lookup-pepper-32-characters",
      INTERNAL_METRICS_TOKEN: "phase04-integration-metrics-token",
      OPENAPI_ENABLED: "false",
      QUEUE_PREFIX: "kapas-phase04-integration",
    });
    app = await createApplication(config);
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    if (app) await app.close();
    if (client) await client.$disconnect();
  });

  it("requires reauthentication for MFA enrollment and rejects TOTP replay", async () => {
    const denied = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { loginIdentifier, password: "wrong password" },
    });
    expect(denied.statusCode).toBe(401);

    const login = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { loginIdentifier, password },
    });
    expect(login.statusCode).toBe(201);
    const setCookies = login.headers["set-cookie"] as string[];
    cookie = setCookies.map((value) => value.split(";")[0]).join("; ");
    csrfToken =
      setCookies
        .map((value) => value.split(";")[0])
        .find((value) => value.startsWith("kapas_csrf="))
        ?.slice("kapas_csrf=".length) ?? "";
    const protectedHeaders = { cookie, "x-csrf-token": csrfToken };

    const enrollmentDenied = await app.inject({
      method: "POST",
      url: "/api/v1/auth/mfa/enroll",
      headers: protectedHeaders,
    });
    expect(enrollmentDenied.statusCode).toBe(401);

    const reauth = await app.inject({
      method: "POST",
      url: "/api/v1/auth/reauthenticate",
      headers: protectedHeaders,
      payload: { password },
    });
    expect(reauth.statusCode).toBe(201);

    const enrollment = await app.inject({
      method: "POST",
      url: "/api/v1/auth/mfa/enroll",
      headers: protectedHeaders,
    });
    expect(enrollment.statusCode).toBe(201);
    const body = enrollment.json() as { secret: string; recoveryCodes: string[] };
    expect(body.recoveryCodes).toHaveLength(10);

    const code = totpCode(body.secret, Math.floor(Date.now() / 30_000));
    const verified = await app.inject({
      method: "POST",
      url: "/api/v1/auth/mfa/verify",
      headers: protectedHeaders,
      payload: { code },
    });
    expect(verified.statusCode).toBe(201);

    const replay = await app.inject({
      method: "POST",
      url: "/api/v1/auth/mfa/verify",
      headers: protectedHeaders,
      payload: { code },
    });
    expect(replay.statusCode).toBe(401);
  }, 30_000);

  it("allows a permitted MFA session to read cases and blocks CSRF-less logout", async () => {
    const unauthenticated = await app.inject({ method: "GET", url: "/api/v1/cases" });
    expect(unauthenticated.statusCode).toBe(401);
    const cases = await app.inject({ method: "GET", url: "/api/v1/cases", headers: { cookie } });
    expect(cases.statusCode).toBe(200);
    const logout = await app.inject({
      method: "POST",
      url: "/api/v1/auth/logout",
      headers: { cookie },
    });
    expect(logout.statusCode).toBe(403);
    const audit = await app.inject({
      method: "GET",
      url: "/api/v1/audit?limit=10",
      headers: { cookie },
    });
    expect(audit.statusCode).toBe(200);
    expect(audit.json()).toHaveProperty("items");
  });
});

function totpCode(secret: string, counter: number): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const character of secret) bits += alphabet.indexOf(character).toString(2).padStart(5, "0");
  const key = Buffer.alloc(Math.floor(bits.length / 8));
  for (let index = 0; index < key.length; index += 1)
    key[index] = Number.parseInt(bits.slice(index * 8, index * 8 + 8), 2);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", key).update(counterBuffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  return String((digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000).padStart(6, "0");
}
