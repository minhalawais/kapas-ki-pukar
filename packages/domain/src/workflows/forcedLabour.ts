import type { QuestionNode } from "../workflow";

export const forcedLabourNodes: QuestionNode[] = [
  {
    id: "fol-forced",
    promptKey: "fol.forced.prompt",
    type: "single",
    section: "details",
    options: [
      { value: "yes", labelKey: "common.yes", subcategory: "FOL-FOR" },
      { value: "no", labelKey: "common.no", subcategory: "FOL-OTH" },
      { value: "unknown", labelKey: "fol.forced.unknown", subcategory: "FOL-OTH" },
    ],
    next: { type: "node", id: "fol-threats" },
  },
  {
    id: "fol-threats",
    promptKey: "fol.threats.prompt",
    type: "single",
    section: "details",
    options: [
      { value: "yes", labelKey: "common.yes", subcategory: "FOL-THR" },
      { value: "no", labelKey: "common.no" },
      { value: "unsafe", labelKey: "fol.threats.unsafe", subcategory: "FOL-THR" },
    ],
    next: { type: "node", id: "fol-debt" },
  },
  {
    id: "fol-debt",
    promptKey: "fol.debt.prompt",
    type: "single",
    section: "details",
    options: [
      { value: "debt", labelKey: "fol.debt.debt", subcategory: "FOL-DEB" },
      { value: "withheldPay", labelKey: "fol.debt.withheldPay", subcategory: "FOL-DEB" },
      { value: "documents", labelKey: "fol.debt.documents", subcategory: "FOL-DOC" },
      { value: "movement", labelKey: "fol.debt.movement", subcategory: "FOL-MOV" },
      { value: "no", labelKey: "common.no" },
    ],
    next: { type: "node", id: "fol-leave" },
  },
  {
    id: "fol-leave",
    promptKey: "fol.leave.prompt",
    type: "single",
    section: "details",
    options: [
      { value: "no", labelKey: "fol.leave.no", subcategory: "FOL-MOV" },
      { value: "yes", labelKey: "fol.leave.yes" },
      { value: "unsafe", labelKey: "fol.leave.unsafe" },
      { value: "unknown", labelKey: "common.unknown" },
    ],
    next: { type: "node", id: "voice" },
  },
];
