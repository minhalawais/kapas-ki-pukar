import "reflect-metadata";

import { loadRuntimeConfig } from "@kapas/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createApplication } from "./application";
import { isTusdReachable, runV3EvidenceUploadFlow } from "./testing/v3-evidence-upload-flow";

const enabled = process.env.TEST_DATABASE_URL && process.env.REDIS_URL;
const integration = enabled ? describe : describe.skip;

integration("V3 evidence upload (mobile pipeline)", () => {
  let app: Awaited<ReturnType<typeof createApplication>>;
  let apiBase: string;
  let tusdUp = false;

  beforeAll(async () => {
    tusdUp = await isTusdReachable(process.env.TUSD_INTERNAL_URL ?? "http://127.0.0.1:1080/files/");
    const config = loadRuntimeConfig({
      ...process.env,
      NODE_ENV: "test",
      APP_VERSION: "0.1.0",
      API_HOST: "127.0.0.1",
      API_PORT: "4000",
      PUBLIC_API_URL: "http://127.0.0.1:4000",
      TUSD_PUBLIC_URL: "http://127.0.0.1:4000/files/",
      PORTAL_ORIGIN: "http://127.0.0.1:3000",
      DATABASE_URL: process.env.TEST_DATABASE_URL,
      REDIS_URL: process.env.REDIS_URL,
      LOG_LEVEL: "silent",
      TRUST_PROXY_COUNT: "0",
      EVIDENCE_ROOT: "./storage/test-evidence",
      QUARANTINE_ROOT: "./storage/test-quarantine",
      ENCRYPTION_KEY_ID: "phase05-integration",
      SESSION_SECRET: "phase05-integration-session-secret-32-characters",
      IDENTITY_LOOKUP_PEPPER: "phase05-identity-lookup-pepper-32-characters",
      INTERNAL_METRICS_TOKEN: "phase05-integration-metrics-token",
      OPENAPI_ENABLED: "false",
      QUEUE_PREFIX: `kapas-v3-upload-${Date.now()}`,
    });
    apiBase = config.publicApiUrl.replace(/\/$/u, "");
    app = await createApplication(config);
    await app.init();
    await app.listen(config.apiPort, config.apiHost);
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it("uploads declared evidence bytes through TUS like the mobile complaint form", async () => {
    if (!tusdUp) {
      console.warn(
        "Skipping TUS upload: tusd not reachable at TUSD_INTERNAL_URL (start deploy/compose/compose.local.yml tusd + hook-proxy).",
      );
      return;
    }

    const result = await runV3EvidenceUploadFlow(apiBase);

    expect(result.uploadedBytes).toBe(result.totalBytes);
    expect(result.totalBytes).toBeGreaterThan(0);
    expect(["uploading", "quarantined", "processing", "available"].includes(result.rowStatus)).toBe(
      true,
    );
    expect(result.referenceNumber).toMatch(/^KP-/u);
  }, 120_000);
});
