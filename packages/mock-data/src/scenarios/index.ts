import type { Complaint } from "@kapas/domain";
import { goldenScenarioIds, goldenScenarioTrackingIds, type GoldenScenarioId } from "@kapas/domain";

import { createGs01 } from "./GS01_WageUnderpayment";
import { createGs02 } from "./GS02_PesticideEmergency";
import { createGs03 } from "./GS03_ConfidentialHarassment";
import { createGs04 } from "./GS04_ChildLabour";
import { createGs05 } from "./GS05_ForcedLabour";
import { createGs06 } from "./GS06_GroupWageComplaint";
import { createGs07 } from "./GS07_Sanitation";
import { createGs08 } from "./GS08_AILowConfidence";
import { createGs09 } from "./GS09_AIFailure";
import { createGs10 } from "./GS10_ReopenedCase";

const factories: Record<GoldenScenarioId, () => Complaint> = {
  "GS-01": createGs01,
  "GS-02": createGs02,
  "GS-03": createGs03,
  "GS-04": createGs04,
  "GS-05": createGs05,
  "GS-06": createGs06,
  "GS-07": createGs07,
  "GS-08": createGs08,
  "GS-09": createGs09,
  "GS-10": createGs10,
};

export function goldenComplaints(): Complaint[] {
  return goldenScenarioIds.map((id) => factories[id]());
}

export function mobileDemoComplaints(): Complaint[] {
  return ["GS-01", "GS-02", "GS-06", "GS-10"].map((id) => factories[id as GoldenScenarioId]());
}

export function getGoldenComplaint(id: GoldenScenarioId): Complaint {
  return factories[id]();
}

export function goldenTrackingId(id: GoldenScenarioId): string {
  return goldenScenarioTrackingIds[id];
}
