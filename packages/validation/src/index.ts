import { caseStatuses, genders, priorities, privacyModes, workerCategoryCodes } from "@kapas/domain";
import { z } from "zod";

export const analyticsFiltersSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  category: z.array(z.enum(workerCategoryCodes)).optional(),
  priority: z.array(z.enum(priorities)).optional(),
  status: z.array(z.enum(caseStatuses)).optional(),
  privacyMode: z.array(z.enum(privacyModes)).optional(),
  province: z.array(z.string()).optional(),
  gender: z.array(z.enum(genders)).optional(),
  search: z.string().optional(),
});

export const demoScenarioConfigSchema = z.object({
  id: z.string().min(1),
  complaintIds: z.array(z.string()),
});

export * from "./complaint.schema";
export * from "./action.schema";
export * from "./resolution.schema";
