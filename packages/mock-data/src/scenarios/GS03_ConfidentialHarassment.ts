import type { Complaint } from "@kapas/domain";

import { buildComplaint } from "../factory";

export function createGs03(): Complaint {
  return buildComplaint({
    index: 103,
    categoryCode: "HAR",
    subcategoryCode: "HAR-INT",
    status: "Under Review",
    priority: "Critical",
    privacyMode: "CONF",
    reporterType: "self",
    gender: "Female",
    affectedWorkerType: "seasonal-picker",
    affectedRange: "individual",
    location: {
      province: "Punjab",
      district: "Vehari",
      tehsil: "Burewala",
      villageLabel: "Field Block 4",
      exactCoordinates: null,
    },
    createdAt: "2026-08-10T11:00:00.000Z",
    currentDanger: false,
    description: "The field supervisor shouts at me in front of other workers and said he will remove my family from work if I complain. Please do not send a message to my phone; I can only speak safely in the afternoon when I am away from the field.",
    descriptionUr: "کھیت کا نگران سب کے سامنے مجھ پر چلاتا ہے اور کہتا ہے کہ شکایت کی تو میرے گھر والوں کا کام بند کر دے گا۔ براہ کرم میرے فون پر پیغام نہ بھیجیں؛ میں صرف دوپہر کو کھیت سے دور محفوظ طریقے سے بات کر سکتی ہوں۔",
    whenLabel: "This week",
    confidenceScore: 0.72,
    scenarioId: "GS-03",
    displayName: "Hina",
    hasEvidence: false,
  });
}
