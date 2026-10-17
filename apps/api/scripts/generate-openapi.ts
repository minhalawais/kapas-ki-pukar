import "reflect-metadata";

import { readFile, writeFile, mkdir } from "node:fs/promises";

import { loadRuntimeConfig } from "@kapas/config";

import { createApplication } from "../src/application";
import type { DependencyHealth } from "../src/dependency-health";
import { createOpenApiDocument, stableJson } from "../src/openapi";

const outputPath = new URL("../openapi/openapi.json", import.meta.url);
const mode = process.argv[2];

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
  ENCRYPTION_KEY_ID: "openapi-generation",
  SESSION_SECRET: "openapi-generation-session-secret-32-characters",
  INTERNAL_METRICS_TOKEN: "openapi-generation-metrics-token",
  OPENAPI_ENABLED: "false",
  QUEUE_PREFIX: "kapas-openapi",
});
const noDependencies: DependencyHealth = {
  async check() {
    return {
      postgres: { status: "up", latencyMs: 0 },
      redis: { status: "up", latencyMs: 0 },
    };
  },
  async close() {},
};

async function main(): Promise<void> {
  const app = await createApplication(config, noDependencies);
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  const generated = stableJson(createOpenApiDocument(app, config));
  await app.close();

  if (mode === "write") {
    await mkdir(new URL("../openapi/", import.meta.url), { recursive: true });
    await writeFile(outputPath, generated, "utf8");
  } else if (mode === "check") {
    const committed = await readFile(outputPath, "utf8");
    if (committed !== generated) {
      throw new Error("OpenAPI artifact is stale; run pnpm openapi:generate");
    }
  } else {
    throw new Error("Expected write or check mode");
  }
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? (error.stack ?? error.message) : String(error);
  process.stderr.write(`OpenAPI generation failed: ${message}\n`);
  process.exitCode = 1;
});
