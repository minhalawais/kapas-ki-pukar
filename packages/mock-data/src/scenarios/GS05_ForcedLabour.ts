import type { Complaint } from "@kapas/domain";

import { buildComplaint } from "../factory";

export function createGs05(): Complaint {
  return buildComplaint({
    index: 105,
    categoryCode: "FOL",
    subcategoryCode: "FOL-THR",
    status: "Under Review",
    priority: "Critical",
    privacyMode: "CONF",
    reporterType: "self",
    gender: "Male",
    affectedWorkerType: "contractor",
    affectedRange: "2-5",
    location: {
      province: "Sindh",
      district: "Ghotki",
      tehsil: "Mirpur Mathelo",
      villageLabel: "Kacha Track",
      exactCoordinates: null,
    },
    createdAt: "2026-08-08T10:15:00.000Z",
    currentDanger: false,
    description: "The labour contractor says our advance and transport cost must be cleared before we can leave the cotton camp. He has kept two weeks of wages and warned us not to go to another farm.",
    descriptionUr: "مزدور ٹھیکیدار کہتا ہے کہ ادھار اور سواری کا خرچ پورا کیے بغیر ہم کپاس کے کیمپ سے نہیں جا سکتے۔ اس نے دو ہفتوں کی اجرت روک لی ہے اور دوسرے فارم پر جانے سے منع کیا ہے۔",
    whenLabel: "This month",
    confidenceScore: 0.9,
    scenarioId: "GS-05",
    displayName: "Bilal",
  });
}
