import "reflect-metadata";

import { loadRuntimeConfig } from "@kapas/config";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createApplication } from "./application";
import type { DependencyHealth } from "./dependency-health";
import { createOpenApiDocument, stableJson } from "./openapi";

const config = loadRuntimeConfig({
  NODE_ENV: "test",
  APP_VERSION: "0.1.0",
  API_HOST: "127.0.0.1",
  API_PORT: "4000",
  PUBLIC_API_URL: "http://127.0.0.1:4000",
  PORTAL_ORIGIN: "http://127.0.0.1:3000",
  DATABASE_URL: "postgresql://unused:unused@127.0.0.1:5432/unused_test",
  REDIS_URL: "redis://:unused@127.0.0.1:6379/15",
  LOG_LEVEL: "silent",
  TRUST_PROXY_COUNT: "0",
  EVIDENCE_ROOT: "./storage/evidence",
  QUARANTINE_ROOT: "./storage/quarantine",
  ENCRYPTION_KEY_ID: "test",
  SESSION_SECRET: "test-session-secret-with-at-least-32-characters",
  IDENTITY_LOOKUP_PEPPER: "test-identity-lookup-pepper-at-least-32-characters",
  INTERNAL_METRICS_TOKEN: "test-internal-metrics-token",
  // Exercise the documented local OpenAPI path so optional Swagger runtime peers
  // cannot be omitted from the production image unnoticed.
  OPENAPI_ENABLED: "true",
  JSON_BODY_LIMIT_BYTES: "1024",
  QUEUE_PREFIX: "kapas-test",
});

const healthy: DependencyHealth = {
  async check() {
    return {
      postgres: { status: "up", latencyMs: 1 },
      redis: { status: "up", latencyMs: 1 },
    };
  },
  async close() {},
};

describe("foundation API", () => {
  let app: NestFastifyApplication;

  beforeEach(async () => {
    app = await createApplication(config, healthy);
    app
      .getHttpAdapter()
      .getInstance()
      .post("/__test/body", async () => ({ ok: true }));
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it("keeps liveness independent and propagates request IDs", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/health/live",
      headers: { "x-request-id": "test-request-1234" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["x-request-id"]).toBe("test-request-1234");
    expect(response.json()).toMatchObject({ status: "ok", service: "api" });
  });

  it("returns 503 when a readiness dependency is down", async () => {
    await app.close();
    app = await createApplication(config, {
      ...healthy,
      async check() {
        return {
          postgres: { status: "down", latencyMs: 3 },
          redis: { status: "up", latencyMs: 1 },
        };
      },
    });
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({ method: "GET", url: "/api/v1/health/ready" });
    expect(response.statusCode).toBe(503);
    expect(response.json()).toMatchObject({ code: "dependencies_unavailable" });
    expect(JSON.stringify(response.json())).not.toContain("postgresql://");
  });

  it("enforces CORS allowlists and bounded JSON bodies", async () => {
    const allowed = await app.inject({
      method: "OPTIONS",
      url: "/api/v1/meta",
      headers: {
        origin: "http://127.0.0.1:3000",
        "access-control-request-method": "GET",
      },
    });
    expect(allowed.headers["access-control-allow-origin"]).toBe("http://127.0.0.1:3000");

    const oversized = await app.inject({
      method: "POST",
      url: "/__test/body",
      headers: { "content-type": "application/json" },
      payload: { value: "x".repeat(2_000) },
    });
    expect(oversized.statusCode).toBe(413);
    expect(oversized.json()).toMatchObject({ code: "payload_too_large" });
  });

  it("protects metrics and generates deterministic OpenAPI", async () => {
    const denied = await app.inject({ method: "GET", url: "/internal/metrics" });
    expect(denied.statusCode).toBe(401);
    expect(denied.json()).toMatchObject({ code: "unauthorized" });
    const accepted = await app.inject({
      method: "GET",
      url: "/internal/metrics",
      headers: { "x-internal-metrics-token": config.internalMetricsToken },
    });
    expect(accepted.statusCode).toBe(200);
    expect(accepted.body).toContain("kapas_http_requests_total");

    expect(stableJson(createOpenApiDocument(app, config))).toBe(
      stableJson(createOpenApiDocument(app, config)),
    );
  });

  it("rejects protected case reads without an MFA-assured staff session", async () => {
    const response = await app.inject({ method: "GET", url: "/api/v1/cases" });
    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ code: "unauthorized" });

    const admin = await app.inject({ method: "GET", url: "/api/v1/admin/users" });
    expect(admin.statusCode).toBe(401);

    const identity = await app.inject({
      method: "GET",
      url: "/api/v1/cases/example/identity?purpose=review",
    });
    expect(identity.statusCode).toBe(401);
  });
});
