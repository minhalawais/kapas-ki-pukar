import type { QuestionNode } from "../workflow";

export const workingHoursNodes: QuestionNode[] = [
  {
    id: "hrs-what",
    promptKey: "hrs.what.prompt",
    type: "single",
    section: "details",
    options: [
      { value: "hours", labelKey: "hrs.what.hours", subcategory: "HRS-EXC" },
      { value: "rest", labelKey: "hrs.what.rest", subcategory: "HRS-RST" },
      { value: "overtime", labelKey: "hrs.what.overtime", subcategory: "HRS-FOT" },
      { value: "heat", labelKey: "hrs.what.heat", subcategory: "HRS-EXC" },
      { value: "night", labelKey: "hrs.what.night", subcategory: "HRS-OTH" },
      { value: "weeklyRest", labelKey: "hrs.what.weeklyRest", subcategory: "HRS-RST" },
    ],
    next: { type: "node", id: "hrs-length" },
  },
  {
    id: "hrs-length",
    promptKey: "hrs.length.prompt",
    type: "single",
    section: "details",
    options: [
      { value: "upTo8", labelKey: "hrs.length.upTo8" }, // gitleaks:allow -- UI label
      { value: "8to10", labelKey: "hrs.length.8to10" }, // gitleaks:allow -- UI label
      { value: "10to12", labelKey: "hrs.length.10to12" }, // gitleaks:allow -- UI label
      { value: "over12", labelKey: "hrs.length.over12", subcategory: "HRS-EXC" },
      { value: "forgot", labelKey: "hrs.length.forgot" },
    ],
    next: { type: "node", id: "hrs-often" },
  },
  {
    id: "hrs-often",
    promptKey: "hrs.often.prompt",
    type: "single",
    section: "details",
    options: [
      { value: "daily", labelKey: "hrs.often.daily" },
      { value: "week", labelKey: "hrs.often.week" },
      { value: "sometimes", labelKey: "hrs.often.sometimes" },
    ],
    next: { type: "node", id: "hrs-water" },
  },
  {
    id: "hrs-water",
    promptKey: "hrs.water.prompt",
    type: "single",
    section: "details",
    options: [
      { value: "yes", labelKey: "common.yes" },
      { value: "no", labelKey: "common.no" },
      { value: "sometimes", labelKey: "hrs.water.sometimes" },
    ],
    next: { type: "node", id: "hrs-health" },
  },
  {
    id: "hrs-health",
    promptKey: "hrs.health.prompt",
    type: "single",
    section: "details",
    options: [
      { value: "yes", labelKey: "common.yes" },
      { value: "no", labelKey: "common.no" },
    ],
    next: { type: "node", id: "voice" },
  },
];
