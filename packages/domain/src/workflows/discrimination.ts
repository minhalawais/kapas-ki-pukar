import type { QuestionNode } from "../workflow";

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
      { value: "disability", labelKey: "dis.what.disability", subcategory: "DIS-OTH" },
      { value: "pregnancy", labelKey: "dis.what.pregnancy", subcategory: "DIS-GEN" },
      { value: "retaliation", labelKey: "dis.what.retaliation", subcategory: "DIS-OTH" },
      { value: "other", labelKey: "dis.what.other", subcategory: "DIS-OTH" },
    ],
    next: { type: "node", id: "dis-impact" },
  },
  {
    id: "dis-impact",
    promptKey: "dis.impact.prompt",
    type: "single",
    section: "details",
    options: [
      { value: "lessPay", labelKey: "dis.impact.lessPay" },
      { value: "noWork", labelKey: "dis.impact.noWork" },
      { value: "abuse", labelKey: "dis.impact.abuse" },
      { value: "deniedFacility", labelKey: "dis.impact.deniedFacility" },
      { value: "threat", labelKey: "dis.impact.threat" },
      { value: "other", labelKey: "dis.impact.other" },
    ],
    next: { type: "node", id: "dis-repeat" },
  },
  {
    id: "dis-repeat",
    promptKey: "dis.repeat.prompt",
    type: "single",
    section: "details",
    options: [
      { value: "once", labelKey: "dis.repeat.once" },
      { value: "repeated", labelKey: "dis.repeat.repeated" },
      { value: "ongoing", labelKey: "dis.repeat.ongoing" },
    ],
    next: { type: "node", id: "voice" },
  },
];
