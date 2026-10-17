import type { Complaint } from "@kapas/domain";

import { buildComplaint } from "../factory";

export function createGs07(): Complaint {
  return buildComplaint({
    index: 107,
    categoryCode: "SAN",
    subcategoryCode: "SAN-WAT",
    status: "Submitted",
    priority: "Standard",
    privacyMode: "IDEN",
    reporterType: "self",
    gender: "Female",
    affectedWorkerType: "seasonal-picker",
    affectedRange: "6-20",
    location: {
      province: "Sindh",
      district: "Umerkot",
      tehsil: "Kunri",
      villageLabel: "Chili-Cotton Mix",
      exactCoordinates: null,
    },
    createdAt: "2026-08-16T13:00:00.000Z",
    currentDanger: false,
    description: "There is no clean drinking water or separate toilet near the cotton picking area. Women workers walk far from the field, and several people have stomach pain after drinking canal water.",
    descriptionUr: "کپاس چننے والی جگہ کے قریب صاف پینے کا پانی یا الگ بیت الخلا نہیں ہے۔ خواتین مزدوروں کو کھیت سے دور جانا پڑتا ہے، اور نہری پانی پینے کے بعد کئی لوگوں کے پیٹ میں درد ہوا ہے۔",
    whenLabel: "This week",
    confidenceScore: 0.86,
    scenarioId: "GS-07",
    displayName: "Farah",
  });
}
