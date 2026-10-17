import { caseActionTypes, caseStatuses, priorities } from "@kapas/domain";
import { z } from "zod";

export const actionInputSchema = z.object({
  type: z.enum(caseActionTypes),
  note: z.string().min(1),
});

export const statusTransitionSchema = z.object({
  from: z.enum(caseStatuses),
  to: z.enum(caseStatuses),
});

export const priorityChangeSchema = z.object({
  priority: z.enum(priorities),
  reason: z.string().optional(),
});
