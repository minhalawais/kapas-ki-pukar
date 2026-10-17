import {
  goldenScenarioIds,
  type ComplaintContext,
  type GoldenScenarioId,
  type ScenarioContext,
} from "@kapas/domain";

export function isGoldenScenarioId(value: string | undefined): value is GoldenScenarioId {
  return Boolean(value && (goldenScenarioIds as readonly string[]).includes(value));
}

export function resolveScenarioId(
  context: ComplaintContext | ScenarioContext,
  extras?: { othersAffected?: string },
): GoldenScenarioId | "HSE" | "HRS" | "DIS" | undefined {
  const scenarioId = "scenarioId" in context ? context.scenarioId : undefined;
  if (isGoldenScenarioId(scenarioId)) {
    return scenarioId;
  }

  const category = "category" in context ? context.category : undefined;
  const others = extras?.othersAffected ?? ("othersAffected" in context ? context.othersAffected : undefined);

  if (category === "CHL") {
    return "GS-04";
  }
  if (category === "FOL") {
    return "GS-05";
  }
  if (category === "PES") {
    return "GS-02";
  }
  if (category === "HAR") {
    return "GS-03";
  }
  if (category === "SAN") {
    return "GS-07";
  }
  if (category === "CON") {
    return "GS-10";
  }
  if (category === "OTH") {
    return "GS-08";
  }
  if (category === "WAG") {
    if (others === "6-20" || others === "more-than-20") {
      return "GS-06";
    }
    return "GS-01";
  }
  if (category === "HSE" || category === "HRS" || category === "DIS") {
    return category;
  }
  return undefined;
}
