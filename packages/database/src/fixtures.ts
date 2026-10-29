import type { CreateComplaintCommand } from "@kapas/domain";

export function assertSyntheticSeedAllowed(environment: string): void {
  const normalized = environment.toLowerCase();
  if (["production", "staging"].includes(normalized)) {
    throw new Error(`Synthetic seed is prohibited in ${normalized}.`);
  }
}

export function syntheticComplaint(
  overrides: Partial<CreateComplaintCommand> = {},
): CreateComplaintCommand {
  const suffix = overrides.requestId ?? "fixture-001";
  return {
    categoryCode: "WAG",
    subcategoryCode: "WAG-UND",
    priority: "Standard",
    privacyMode: "ANON",
    reporterType: "self",
    contactAllowed: false,
    affectedWorkerType: "seasonal-picker",
    gender: "Not Stated",
    submittedAt: "2026-10-17T12:00:00.000Z",
    dueAt: "2026-10-24T12:00:00.000Z",
    createdSource: "mobile",
    schemaVersion: 1,
    incident: {
      whenLabel: "today",
      occurredAt: "2026-10-17T08:00:00.000Z",
      description: "Synthetic fixture: agreed wage was not paid in full.",
      currentDanger: false,
      immediateDanger: false,
      othersAffected: "individual",
      structuredAnswers: { payBasis: "daily", synthetic: true },
      schemaVersion: 1,
    },
    location: {
      province: "Synthetic Punjab",
      district: "Synthetic District",
      descriptivePlace: "Synthetic cotton field",
      source: "manual",
      analyticsProvince: "Synthetic Punjab",
      analyticsDistrict: "Synthetic District",
    },
    requestId: suffix,
    idempotencyKeyHash: `synthetic-idempotency-${suffix}`,
    idempotencyScope: "local-seed",
    ...overrides,
  };
}
