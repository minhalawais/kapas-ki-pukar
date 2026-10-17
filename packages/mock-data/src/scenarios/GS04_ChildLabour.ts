import type { Complaint } from "@kapas/domain";

import { buildComplaint } from "../factory";

export function createGs04(): Complaint {
  return buildComplaint({
    index: 104,
    categoryCode: "CHL",
    subcategoryCode: "CHL-HAZ",
    status: "Submitted",
    priority: "Critical",
    privacyMode: "ANON",
    reporterType: "coworker",
    gender: "Not Stated",
    affectedWorkerType: "seasonal-picker",
    affectedRange: "individual",
    location: {
      province: "Sindh",
      district: "Sanghar",
      tehsil: "Tando Adam",
      villageLabel: "Pickers Camp 2",
      exactCoordinates: null,
    },
    createdAt: "2026-08-14T08:20:00.000Z",
    currentDanger: false,
    description: "A boy who looks about twelve is picking cotton with adults from morning until late afternoon. He was also near the field after pesticide spray. I am reporting anonymously because the family depends on the contractor for work.",
    descriptionUr: "ایک بچہ جو تقریباً بارہ سال کا لگتا ہے صبح سے دیر دوپہر تک بڑوں کے ساتھ کپاس چن رہا ہے۔ سپرے کے بعد بھی وہ اسی کھیت کے قریب تھا۔ میں گمنام اطلاع دے رہا/رہی ہوں کیونکہ اس کے گھر والے کام کے لیے ٹھیکیدار پر انحصار کرتے ہیں۔",
    whenLabel: "This month",
    confidenceScore: 0.88,
    scenarioId: "GS-04",
  });
}
