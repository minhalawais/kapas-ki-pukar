import { z } from "zod";

export const resolutionInputSchema = z.object({
  summary: z.string().min(8),
});

export const closeCaseSchema = z.object({
  reason: z.string().min(3),
});

export const reopenCaseSchema = z.object({
  reason: z.string().min(3),
});
