import "reflect-metadata";

import { loadRuntimeConfig } from "@kapas/config";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createApplication } from "./application";

const enabled = process.env.TEST_DATABASE_URL && process.env.REDIS_URL;
const integration = enabled ? describe : describe.skip;
let app: NestFastifyApplication;

integration("API dependency integration", () => {
  beforeAll(async () => {
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
      ENCRYPTION_KEY_ID: "integration-test",
      SESSION_SECRET: "integration-test-session-secret-32-characters",
      INTERNAL_METRICS_TOKEN: "integration-test-metrics-token",
      OPENAPI_ENABLED: "false",
      QUEUE_PREFIX: "kapas-integration",
    });
    app = await createApplication(config);
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("reports PostgreSQL and Redis ready", async () => {
    const response = await app.inject({ method: "GET", url: "/api/v1/health/ready" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: "ready",
      dependencies: { postgres: { status: "up" }, redis: { status: "up" } },
    });
  });
});
