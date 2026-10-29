import { describe, expect, it } from "vitest";

import { ConfigurationError, configDiagnostics, loadRuntimeConfig } from "./index";

const validEnvironment: NodeJS.ProcessEnv = {
  NODE_ENV: "test",
  APP_VERSION: "0.1.0",
  API_HOST: "127.0.0.1",
  API_PORT: "4000",
  PUBLIC_API_URL: "http://127.0.0.1:4000",
  PORTAL_ORIGIN: "http://127.0.0.1:3000",
  DATABASE_URL: "postgresql://user:password@127.0.0.1:5432/kapas_test",
  REDIS_URL: "redis://:password@127.0.0.1:6379/0",
  LOG_LEVEL: "silent",
  TRUST_PROXY_COUNT: "0",
  EVIDENCE_ROOT: "./storage/evidence",
  QUARANTINE_ROOT: "./storage/quarantine",
  ENCRYPTION_KEY_ID: "test-key",
  SESSION_SECRET: "test-session-secret-with-at-least-32-characters",
  IDENTITY_LOOKUP_PEPPER: "test-identity-lookup-pepper-at-least-32-characters",
  INTERNAL_METRICS_TOKEN: "test-internal-metrics-token",
  OPENAPI_ENABLED: "true",
  QUEUE_PREFIX: "kapas-test",
};

describe("loadRuntimeConfig", () => {
  it("returns typed values without exposing secrets through diagnostics", () => {
    const config = loadRuntimeConfig(validEnvironment);

    expect(config.apiPort).toBe(4000);
    expect(config.portalOrigins).toEqual(["http://127.0.0.1:3000"]);
    expect(configDiagnostics(config)).not.toContain(config.sessionSecret);
    expect(configDiagnostics(config).SESSION_SECRET).toBe("configured");
  });

  it("reports invalid key names without their values", () => {
    expect(() => loadRuntimeConfig({ ...validEnvironment, SESSION_SECRET: "short" })).toThrowError(
      new ConfigurationError(["SESSION_SECRET"]),
    );
  });

  it("rejects unsafe production OpenAPI and host settings", () => {
    expect(() =>
      loadRuntimeConfig({ ...validEnvironment, NODE_ENV: "production", OPENAPI_ENABLED: "true" }),
    ).toThrowError(ConfigurationError);
  });
});
