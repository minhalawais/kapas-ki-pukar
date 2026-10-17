import { subcategoriesByCategory, type Complaint } from "@kapas/domain";

import { buildComplaint } from "./factory";
import { DEMO_LOCATIONS } from "./locations";
import { createRng } from "./rng";

export function extraDemoComplaints(count: number, startIndex: number): Complaint[] {
  const rng = createRng(20260819 + startIndex);
  const categories = ["WAG", "PES", "HSE", "HAR", "CHL", "FOL", "CON", "HRS"] as const;
  const statuses = ["Submitted", "Under Review", "Action in Progress", "Proposed Resolution", "Resolved", "Closed"] as const;

  return Array.from({ length: count }, (_, offset) => {
    const location = rng.pick(DEMO_LOCATIONS);
    const category = rng.pick(categories);
    const status = rng.pick(statuses);
    const priority = rng.pick(["Standard", "High", "Critical", "Emergency"] as const);
    const dailyRate = rng.pick([950, 1000, 1100, 1200]);
    const days = rng.pick([4, 6, 8, 10, 12]);
    const subs = subcategoriesByCategory[category];
    const subcategoryCode = subs && subs.length > 0 ? rng.pick(subs) : undefined;

    // Spread submittedAt dates realistically across 30 days up to 2026-08-28
    const dayOffset = Math.floor((offset * 29) / count);
    const hour = 8 + (offset % 10);
    const minute = (offset * 17) % 60;
    const dateObj = new Date(Date.UTC(2026, 7, 28 - dayOffset, hour, minute));
    const dateIso = dateObj.toISOString();

    return buildComplaint({
      index: startIndex + offset,
      categoryCode: category,
      subcategoryCode,
      status,
      priority,
      privacyMode: rng.pick(["CONF", "ANON", "IDEN"] as const),
      reporterType: "self",
      gender: rng.pick(["Female", "Male"] as const),
      affectedWorkerType: "seasonal-picker",
      affectedRange: rng.pick(["individual", "2-5", "6-20"] as const),
      location: { ...location, exactCoordinates: null },
      createdAt: dateIso,
      currentDanger: priority === "Emergency" || priority === "Critical",
      description: `Cotton sector grievance regarding ${category} near ${location.villageLabel}, ${location.district}. Daily wage rate: PKR ${dailyRate} for ${days} days.`,
      descriptionUr: `${location.villageLabel}، ${location.district} میں کپاس کے کام سے متعلق شکایت درج کروائی گئی۔`,
      whenLabel: "This month",
      confidenceScore: 0.88,
      displayName: rng.pick(["Amina", "Razia", "Shazia", "Aslam", "Yousaf", "Fatima", "Tariq", "Zainab", "Bilal", "Maryam"] as const),
    });
  });
}
