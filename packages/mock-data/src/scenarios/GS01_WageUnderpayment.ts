import type { Complaint } from "@kapas/domain";

import { buildComplaint } from "../factory";

const southPunjab = {
  province: "Punjab",
  district: "Bahawalpur",
  tehsil: "Yazman",
  villageLabel: "Chak 12/BC",
  exactCoordinates: null,
};

export function createGs01(): Complaint {
  return buildComplaint({
    index: 101,
    categoryCode: "WAG",
    subcategoryCode: "WAG-UND",
    status: "Under Review",
    priority: "High",
    privacyMode: "CONF",
    reporterType: "self",
    gender: "Female",
    affectedWorkerType: "seasonal-picker",
    affectedRange: "2-5",
    location: southPunjab,
    createdAt: "2026-08-12T09:10:00.000Z",
    currentDanger: false,
    description: "In Yazman, the contractor agreed to pay PKR 1,200 per day for cotton picking, but after three full days he paid only PKR 800 per day and said the rest would be adjusted later. Four women pickers in our group received the same lower amount.",
    descriptionUr: "یزمان میں ٹھیکیدار نے کپاس چننے کی روزانہ اجرت 1200 روپے طے کی تھی، مگر تین پورے دن کے کام کے بعد صرف 800 روپے روزانہ دیے اور کہا باقی بعد میں دیکھیں گے۔ ہمارے گروپ کی چار خواتین کو بھی یہی کم رقم ملی۔",
    whenLabel: "This week",
    confidenceScore: 0.94,
    scenarioId: "GS-01",
    displayName: "Amina Bibi",
  });
}
