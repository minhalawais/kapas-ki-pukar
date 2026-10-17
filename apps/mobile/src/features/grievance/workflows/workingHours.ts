import type { QuestionNode } from "../types";

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
