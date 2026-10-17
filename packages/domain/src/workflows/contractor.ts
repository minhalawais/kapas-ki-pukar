import type { QuestionNode } from "../workflow";

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
      { value: "documents", labelKey: "con.what.documents", subcategory: "FOL-DOC" },
      { value: "movement", labelKey: "con.what.movement", subcategory: "FOL-MOV" },
      { value: "other", labelKey: "con.what.other", subcategory: "CON-OTH" },
    ],
    next: { type: "node", id: "con-proof" },
  },
  {
    id: "con-proof",
    promptKey: "con.proof.prompt",
    type: "single",
    section: "details",
    options: [
      { value: "yes", labelKey: "common.yes" },
      { value: "no", labelKey: "common.no" },
      { value: "later", labelKey: "con.proof.later" },
    ],
    next: { type: "node", id: "voice" },
  },
];
