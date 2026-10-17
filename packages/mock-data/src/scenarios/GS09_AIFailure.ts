import type { Complaint } from "@kapas/domain";

import { buildComplaint } from "../factory";

export function createGs09(): Complaint {
  return buildComplaint({
    index: 109,
    categoryCode: "HSE",
    subcategoryCode: "HSE-INJ",
    status: "Submitted",
    priority: "High",
    privacyMode: "CONF",
    reporterType: "self",
    gender: "Male",
    affectedWorkerType: "piece-rate",
    affectedRange: "individual",
    location: {
      province: "Punjab",
      district: "Lodhran",
      tehsil: "Dunyapur",
      villageLabel: "Canal Side",
      exactCoordinates: null,
    },
    createdAt: "2026-08-18T16:10:00.000Z",
    currentDanger: false,
    description: "The worker reported a hand injury while lifting cotton sacks, but the audio could not be transcribed clearly. The original recording remains available for manual review.",
    descriptionUr: "مزدور نے کپاس کی بوریاں اٹھاتے ہوئے ہاتھ زخمی ہونے کی اطلاع دی، مگر آواز صاف نقل نہیں ہو سکی۔ اصل ریکارڈنگ دستی جائزے کے لیے موجود ہے۔",
    whenLabel: "Today",
    confidenceScore: 0,
    aiFailed: true,
    scenarioId: "GS-09",
    displayName: "Usman",
  });
}
