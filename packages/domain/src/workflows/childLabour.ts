import type { QuestionNode } from "../workflow";

export const childLabourNodes: QuestionNode[] = [
  {
    id: "chl-who",
    promptKey: "chl.who.prompt",
    type: "single",
    section: "details",
    options: [
      { value: "self", labelKey: "chl.who.self" },
      { value: "ownChild", labelKey: "chl.who.ownChild" },
      { value: "family", labelKey: "chl.who.family" },
      { value: "other", labelKey: "chl.who.other" },
      { value: "unsafe", labelKey: "chl.who.unsafe" },
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
      { value: "12-13", labelKey: "chl.age.12-13" },
      { value: "14-15", labelKey: "chl.age.14-15" },
      { value: "16-17", labelKey: "chl.age.16-17" },
      { value: "unknown", labelKey: "chl.age.unknown" },
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
      { value: "tools", labelKey: "chl.work.tools", subcategory: "CHL-HAZ" },
      { value: "longHours", labelKey: "chl.work.longHours", subcategory: "CHL-HRS" },
      { value: "other", labelKey: "chl.work.other", subcategory: "CHL-OTH" },
    ],
    next: { type: "node", id: "chl-school" },
  },
  {
    id: "chl-school",
    promptKey: "chl.school.prompt",
    type: "single",
    section: "details",
    options: [
      { value: "yes", labelKey: "common.yes" },
      { value: "no", labelKey: "common.no" },
      { value: "sometimes", labelKey: "chl.school.sometimes" },
      { value: "unknown", labelKey: "chl.school.unknown" },
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
