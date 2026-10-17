import { describe, expect, it } from "vitest";

import { buildLoggerOptions, createServiceMetrics } from "./index";

describe("observability foundation", () => {
  it("configures mandatory redaction paths", () => {
    const options = buildLoggerOptions({
      service: "test",
      version: "0.1.0",
      environment: "test",
      level: "silent",
    });

    expect(options.redact).toMatchObject({ censor: "[REDACTED]" });
    expect(JSON.stringify(options.redact)).toContain("authorization");
    expect(JSON.stringify(options.redact)).toContain("req.body");
  });

  it("uses an isolated Prometheus registry", async () => {
    const metrics = createServiceMetrics("test-service");
    metrics.httpRequests.inc({ method: "GET", route: "/test", status: "200" });

    await expect(metrics.registry.metrics()).resolves.toContain("kapas_http_requests_total");
  });
});
