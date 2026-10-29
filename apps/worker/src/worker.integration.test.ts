import "reflect-metadata";

import { loadRuntimeConfig } from "@kapas/config";
import { createServiceLogger } from "@kapas/observability";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { LogFinalFailureRecorder, WorkerRuntime } from "./worker-runtime";

const enabled = Boolean(process.env.REDIS_URL);
const integration = enabled ? describe : describe.skip;
let runtime: WorkerRuntime;

integration("worker Redis integration", () => {
  beforeAll(async () => {
    const config = loadRuntimeConfig({
      NODE_ENV: "test",
      APP_VERSION: "0.1.0",
      API_HOST: "127.0.0.1",
      API_PORT: "4000",
      PUBLIC_API_URL: "http://127.0.0.1:4000",
      PORTAL_ORIGIN: "http://127.0.0.1:3000",
      DATABASE_URL:
        process.env.TEST_DATABASE_URL ?? "postgresql://unused:unused@localhost:5432/unused_test",
      REDIS_URL: process.env.REDIS_URL,
      LOG_LEVEL: "silent",
      TRUST_PROXY_COUNT: "0",
      EVIDENCE_ROOT: "./storage/evidence",
      QUARANTINE_ROOT: "./storage/quarantine",
      ENCRYPTION_KEY_ID: "integration",
      SESSION_SECRET: "integration-test-session-secret-32-characters",
      IDENTITY_LOOKUP_PEPPER: "integration-identity-lookup-pepper-32-characters",
      INTERNAL_METRICS_TOKEN: "integration-test-metrics-token",
      OPENAPI_ENABLED: "false",
      QUEUE_PREFIX: `kapas-test-${Date.now()}`,
    });
    const logger = createServiceLogger({
      service: "worker-test",
      version: config.appVersion,
      environment: config.nodeEnv,
      level: "silent",
    });
    runtime = new WorkerRuntime(config, logger, new LogFinalFailureRecorder(logger));
    await runtime.onModuleInit();
  });

  afterAll(async () => {
    await runtime.onApplicationShutdown();
  });

  it("connects and accepts the diagnostics job", async () => {
    await expect(runtime.ping()).resolves.toBe(true);
    await expect(runtime.enqueueDiagnostic(`diagnostic-${Date.now()}`)).resolves.toBeTruthy();
  });
});
