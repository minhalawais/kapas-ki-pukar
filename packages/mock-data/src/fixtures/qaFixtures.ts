import type { Complaint } from "@kapas/domain";
import { caseStatuses, priorities, privacyModes, workerCategoryCodes } from "@kapas/domain";

import { generateComplaints } from "../generateComplaints";
import { getGoldenComplaint } from "../scenarios";

export function qaFixtures(): Complaint[] {
  const seed = generateComplaints();
  const byCategory = workerCategoryCodes.map(
    (code) => seed.find((row) => row.categoryCode === code) ?? seed[0]!,
  );
  const byStatus = caseStatuses
    .filter((status) => status !== "Draft" && status !== "Submitted")
    .map((status) => seed.find((row) => row.status === status) ?? seed[0]!);
  const byPriority = priorities.map((priority) => seed.find((row) => row.priority === priority) ?? seed[0]!);
  const byPrivacy = privacyModes.map((mode) => seed.find((row) => row.privacyMode === mode) ?? seed[0]!);
  return [
    ...byCategory,
    ...byStatus,
    ...byPriority,
    ...byPrivacy,
    seed.find((row) => row.voice === null) ?? getGoldenComplaint("GS-04"),
    seed.find((row) => row.evidence.length === 0) ?? getGoldenComplaint("GS-03"),
    getGoldenComplaint("GS-09"),
    getGoldenComplaint("GS-10"),
  ];
}
