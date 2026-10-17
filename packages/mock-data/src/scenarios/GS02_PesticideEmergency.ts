import type { Complaint } from "@kapas/domain";

import { buildComplaint } from "../factory";

export function createGs02(): Complaint {
  return buildComplaint({
    index: 102,
    categoryCode: "PES",
    subcategoryCode: "PES-SYM",
    status: "Submitted",
    priority: "Emergency",
    privacyMode: "CONF",
    reporterType: "self",
    gender: "Female",
    affectedWorkerType: "seasonal-picker",
    affectedRange: "individual",
    location: {
      province: "Punjab",
      district: "Rahim Yar Khan",
      tehsil: "Sadiqabad",
      villageLabel: "Basti Noor",
      exactCoordinates: null,
    },
    createdAt: "2026-08-19T07:40:00.000Z",
    currentDanger: true,
    description: "Spray was done in the nearby cotton rows early in the morning, but we were sent back into the field before the smell cleared. I have burning eyes, dizziness and difficulty breathing, and one other picker is also feeling sick.",
    descriptionUr: "صبح کپاس کی قریبی قطاروں میں سپرے ہوا مگر بو ختم ہونے سے پہلے ہمیں دوبارہ کھیت میں بھیج دیا گیا۔ میری آنکھوں میں جلن، چکر اور سانس لینے میں مشکل ہے، اور ایک اور چننے والی بھی بیمار محسوس کر رہی ہے۔",
    whenLabel: "Today",
    confidenceScore: 0.81,
    scenarioId: "GS-02",
    displayName: "Sara Bibi",
  });
}
