import { describe, expect, it } from "vitest";

import {
  errorEnvelopeSchema,
  livenessResponseSchema,
  metaResponseSchema,
  readinessResponseSchema,
} from "./index";

describe("foundation API contracts", () => {
  it("accepts the documented foundation responses", () => {
    expect(
      livenessResponseSchema.safeParse({
        status: "ok",
        service: "api",
        version: "0.1.0",
        time: "2026-10-16T12:00:00.000Z",
      }).success,
    ).toBe(true);
    expect(
      readinessResponseSchema.safeParse({
        status: "ready",
        service: "api",
        version: "0.1.0",
        time: "2026-10-16T12:00:00.000Z",
        dependencies: {
          postgres: { status: "up", latencyMs: 2 },
          redis: { status: "up", latencyMs: 1 },
        },
      }).success,
    ).toBe(true);
    expect(
      metaResponseSchema.safeParse({
        service: "api",
        version: "0.1.0",
        environment: "test",
        apiVersion: "v1",
      }).success,
    ).toBe(true);
  });

  it("rejects internal details and malformed request IDs", () => {
    expect(
      errorEnvelopeSchema.safeParse({
        code: "internal_error",
        message: "Request failed",
        requestId: "bad",
        stack: "sensitive stack",
      }).success,
    ).toBe(false);
  });
});
