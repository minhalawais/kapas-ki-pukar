import type { QuestionNode } from "../types";

export const contractorNodes: QuestionNode[] = [
  {
    id: "con-what",
    promptKey: "con.what.prompt",
    type: "single",
    section: "details",
    options: [
      { value: "pay", labelKey: "con.what.pay", subcategory: "CON-PAY" },
      { value: "abuse", labelKey: "con.what.abuse", subcategory: "CON-ABU" },
      { value: "fee", labelKey: "con.what.fee", subcategory: "CON-FEE" },
      { value: "promise", labelKey: "con.what.promise", subcategory: "CON-MIS" },
      { value: "condition", labelKey: "con.what.condition", subcategory: "CON-CON" },
      { value: "other", labelKey: "con.what.other", subcategory: "CON-OTH" },
    ],
    next: { type: "node", id: "voice" },
  },
];
