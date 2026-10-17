import type { Complaint } from "@kapas/domain";

import { buildComplaint } from "../factory";

export function createGs08(): Complaint {
  return buildComplaint({
    index: 108,
    categoryCode: "OTH",
    status: "Submitted",
    priority: "Standard",
    privacyMode: "CONF",
    reporterType: "self",
    gender: "Male",
    affectedWorkerType: "daily-wage",
    affectedRange: "individual",
    location: {
      province: "Punjab",
      district: "Sahiwal",
      tehsil: "Chichawatni",
      villageLabel: "Jholan Wala",
      exactCoordinates: null,
    },
    createdAt: "2026-08-17T15:30:00.000Z",
    currentDanger: false,
    description: "The recording is noisy because it was made near the road. The worker mentions cotton work, deductions and a contractor, but the exact issue needs a follow-up call before classification.",
    descriptionUr: "ریکارڈنگ سڑک کے قریب ہونے کی وجہ سے شور والی ہے۔ مزدور کپاس کے کام، کٹوتی اور ٹھیکیدار کا ذکر کرتا ہے، مگر درست مسئلہ سمجھنے کے لیے دوبارہ رابطہ ضروری ہے۔",
    whenLabel: "Today",
    confidenceScore: 0.55,
    scenarioId: "GS-08",
    displayName: "Asif",
  });
}
