import type { QuestionNode } from "../types";

export const childLabourNodes: QuestionNode[] = [
  {
    id: "chl-who",
    promptKey: "chl.who.prompt",
    type: "single",
    section: "details",
    options: [
      { value: "self", labelKey: "chl.who.self" },
      { value: "other", labelKey: "chl.who.other" },
    ],
    next: { type: "node", id: "chl-age" },
  },
  {
    id: "chl-age",
    promptKey: "chl.age.prompt",
    type: "single",
    section: "details",
    options: [
      { value: "under12", labelKey: "chl.age.under12" },
      { value: "12-14", labelKey: "chl.age.12-14" },
      { value: "15-17", labelKey: "chl.age.15-17" },
      { value: "unsure", labelKey: "chl.age.unsure" },
    ],
    next: { type: "node", id: "chl-work" },
  },
  {
    id: "chl-work",
    promptKey: "chl.work.prompt",
    type: "single",
    section: "details",
    options: [
      { value: "pick", labelKey: "chl.work.pick", subcategory: "CHL-WRK" },
      { value: "carry", labelKey: "chl.work.carry", subcategory: "CHL-WRK" },
      { value: "spray", labelKey: "chl.work.spray", subcategory: "CHL-HAZ" },
      { value: "other", labelKey: "chl.work.other", subcategory: "CHL-OTH" },
    ],
    next: { type: "node", id: "chl-hazard" },
  },
  {
    id: "chl-hazard",
    promptKey: "chl.hazard.prompt",
    type: "single",
    section: "details",
    options: [
      { value: "yes", labelKey: "common.yes", subcategory: "CHL-HAZ" },
      { value: "no", labelKey: "common.no" },
    ],
    next: { type: "node", id: "chl-risk" },
  },
  {
    id: "chl-risk",
    promptKey: "chl.risk.prompt",
    type: "single",
    section: "details",
    options: [
      { value: "yes", labelKey: "common.yes" },
      { value: "no", labelKey: "common.no" },
    ],
    next: { type: "node", id: "voice" },
  },
];
