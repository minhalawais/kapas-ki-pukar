import type { QuestionNode } from "../types";

export const discriminationNodes: QuestionNode[] = [
  {
    id: "dis-what",
    promptKey: "dis.what.prompt",
    type: "single",
    section: "details",
    options: [
      { value: "gender", labelKey: "dis.what.gender", subcategory: "DIS-GEN" },
      { value: "ethnic", labelKey: "dis.what.ethnic", subcategory: "DIS-ETH" },
      { value: "migrant", labelKey: "dis.what.migrant", subcategory: "DIS-MIG" },
      { value: "age", labelKey: "dis.what.age", subcategory: "DIS-AGE" },
      { value: "other", labelKey: "dis.what.other", subcategory: "DIS-OTH" },
    ],
    next: { type: "node", id: "voice" },
  },
];
