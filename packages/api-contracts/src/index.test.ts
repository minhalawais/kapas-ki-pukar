import { describe, expect, it } from "vitest";

import {
  errorEnvelopeSchema,
  livenessResponseSchema,
  metaResponseSchema,
  readinessResponseSchema,
  intakeSubmissionV3Schema,
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

describe("complaint pipeline V3 contracts", () => {
  const base = {
    clientSubmissionId: "019a0c80-7b01-7000-8000-000000000001",
    idempotencyKey: "019a0c80-7b01-7000-8000-000000000002",
    schemaVersion: 3 as const,
    revision: 1,
    privacyMode: "ANON" as const,
    complaint: {
      categoryCode: "WAG" as const,
      subcategoryCode: "WAG-UNP",
      priority: "Standard" as const,
      reporterType: "self" as const,
      contactPreference: "do-not-initiate" as const,
      incident: {
        whenLabel: "Today",
        currentDanger: false,
        immediateDanger: false,
        othersAffected: "individual" as const,
        structuredAnswers: {},
        schemaVersion: 3,
      },
      location: { province: "Punjab", district: "Lahore", source: "manual" as const },
    },
    attachments: [],
  };

  it("accepts an offline-capable anonymous complaint without evidence", () => {
    expect(intakeSubmissionV3Schema.safeParse(base).success).toBe(true);
  });

  it("enforces attachment type, count, and aggregate limits", () => {
    const oversized = {
      ...base,
      attachments: [
        {
          clientMediaId: "019a0c80-7b01-7000-8000-000000000003",
          kind: "document",
          displayName: "proof.pdf",
          declaredMimeType: "application/pdf",
          totalBytes: 16 * 1024 * 1024,
        },
      ],
    };
    expect(intakeSubmissionV3Schema.safeParse(oversized).success).toBe(false);
  });

  it("prohibits identity inside anonymous submissions", () => {
    expect(
      intakeSubmissionV3Schema.safeParse({
        ...base,
        privateReporter: { phone: "+923001234567" },
      }).success,
    ).toBe(false);
  });
});
