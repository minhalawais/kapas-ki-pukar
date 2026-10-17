import { z } from "zod";

export const requestIdSchema = z.string().regex(/^[A-Za-z0-9._:-]{8,128}$/);
export const utcTimestampSchema = z.iso.datetime({ offset: true });

export const fieldErrorSchema = z.object({
  field: z.string().min(1).max(200),
  code: z.string().min(1).max(100),
  message: z.string().min(1).max(500),
});

export const errorEnvelopeSchema = z.object({
  code: z.string().min(1).max(100),
  message: z.string().min(1).max(500),
  requestId: requestIdSchema,
  fieldErrors: z.array(fieldErrorSchema).max(100).optional(),
});

export const dependencyStatusSchema = z.object({
  status: z.enum(["up", "down"]),
  latencyMs: z.number().nonnegative(),
});

export const livenessResponseSchema = z.object({
  status: z.literal("ok"),
  service: z.literal("api"),
  version: z.string().min(1),
  time: utcTimestampSchema,
});

export const readinessResponseSchema = z.object({
  status: z.enum(["ready", "not_ready"]),
  service: z.literal("api"),
  version: z.string().min(1),
  time: utcTimestampSchema,
  dependencies: z.object({
    postgres: dependencyStatusSchema,
    redis: dependencyStatusSchema,
  }),
});

export const metaResponseSchema = z.object({
  service: z.literal("api"),
  version: z.string().min(1),
  environment: z.enum(["development", "test", "production"]),
  apiVersion: z.literal("v1"),
});

export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>;
export type LivenessResponse = z.infer<typeof livenessResponseSchema>;
export type ReadinessResponse = z.infer<typeof readinessResponseSchema>;
export type MetaResponse = z.infer<typeof metaResponseSchema>;

export const contractJsonSchemas = Object.freeze({
  ErrorEnvelope: z.toJSONSchema(errorEnvelopeSchema, { target: "draft-7" }),
  LivenessResponse: z.toJSONSchema(livenessResponseSchema, { target: "draft-7" }),
  ReadinessResponse: z.toJSONSchema(readinessResponseSchema, { target: "draft-7" }),
  MetaResponse: z.toJSONSchema(metaResponseSchema, { target: "draft-7" }),
});
