import type { QuestionNode } from "../types";

export const forcedLabourNodes: QuestionNode[] = [
  {
    id: "fol-forced",
    promptKey: "fol.forced.prompt",
    type: "single",
    section: "details",
    options: [
      { value: "yes", labelKey: "common.yes", subcategory: "FOL-FOR" },
      { value: "no", labelKey: "common.no", subcategory: "FOL-OTH" },
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
    ],
    next: { type: "node", id: "fol-debt" },
  },
  {
    id: "fol-debt",
    promptKey: "fol.debt.prompt",
    type: "single",
    section: "details",
    options: [
      { value: "yes", labelKey: "common.yes", subcategory: "FOL-DEB" },
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
      { value: "unsure", labelKey: "common.notSure" },
    ],
    next: { type: "node", id: "voice" },
  },
];
