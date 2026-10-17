import type { Complaint } from "@kapas/domain";

import { buildComplaint } from "../factory";

export function createGs10(): Complaint {
  return buildComplaint({
    index: 110,
    categoryCode: "CON",
    subcategoryCode: "CON-PAY",
    status: "Reopened",
    priority: "High",
    privacyMode: "IDEN",
    reporterType: "self",
    gender: "Female",
    affectedWorkerType: "contractor",
    affectedRange: "individual",
    location: {
      province: "Sindh",
      district: "Khairpur",
      tehsil: "Kingri",
      villageLabel: "Pir Jo Goth Road",
      exactCoordinates: null,
    },
    createdAt: "2026-07-20T10:00:00.000Z",
    currentDanger: false,
    description: "The contractor promised to release the pending payment after the first review, but I still have not received the money. He now says deductions for transport and food will be taken first, so I am not satisfied with the earlier result.",
    descriptionUr: "پہلے جائزے کے بعد ٹھیکیدار نے بقایا رقم دینے کا وعدہ کیا تھا، مگر مجھے ابھی تک پیسے نہیں ملے۔ اب وہ کہتا ہے کہ پہلے سواری اور کھانے کی کٹوتی ہوگی، اس لیے میں پہلے نتیجے سے مطمئن نہیں ہوں۔",
    whenLabel: "This month",
    confidenceScore: 0.89,
    scenarioId: "GS-10",
    displayName: "Zainab",
    resolutionSummary: "Contractor promised partial payment after reconciliation. Worker reports the payment was not received and deductions were added.",
    feedback: { outcome: "unresolved", submittedAt: "2026-08-15T09:00:00.000Z" },
  });
}
