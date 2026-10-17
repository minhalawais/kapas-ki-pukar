import type { Complaint } from "@kapas/domain";

import { buildComplaint } from "../factory";

export function createGs06(): Complaint {
  return buildComplaint({
    index: 106,
    categoryCode: "WAG",
    subcategoryCode: "WAG-DEL",
    status: "Action in Progress",
    priority: "High",
    privacyMode: "CONF",
    reporterType: "community",
    gender: "Female",
    affectedWorkerType: "daily-wage",
    affectedRange: "more-than-20",
    location: {
      province: "Punjab",
      district: "Khanewal",
      tehsil: "Kabirwala",
      villageLabel: "Cotton Camp A",
      exactCoordinates: null,
    },
    createdAt: "2026-08-05T09:00:00.000Z",
    currentDanger: false,
    description: "I am reporting for our picking group. More than twenty workers have not received wages for the last two weeks, although cotton was weighed daily and the munshi wrote our names in his register.",
    descriptionUr: "میں اپنے چنائی والے گروپ کی طرف سے بتا رہی ہوں۔ بیس سے زیادہ مزدوروں کو پچھلے دو ہفتوں کی اجرت نہیں ملی، حالانکہ روز کپاس کا وزن ہوا اور منشی نے ہمارے نام رجسٹر میں لکھے۔",
    whenLabel: "This month",
    confidenceScore: 0.91,
    scenarioId: "GS-06",
    displayName: "Nida",
  });
}
