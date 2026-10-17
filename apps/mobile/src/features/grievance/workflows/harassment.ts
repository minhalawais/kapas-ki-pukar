import type { QuestionNode } from "../types";

export const harassmentNodes: QuestionNode[] = [
  {
    id: "har-private",
    promptKey: "har.private.prompt",
    type: "single",
    section: "details",
    options: [
      { value: "yes", labelKey: "common.yes" },
      { value: "no", labelKey: "common.no" },
    ],
    next: { type: "node", id: "har-about" },
  },
  {
    id: "har-about",
    promptKey: "har.aboutYou.prompt",
    type: "single",
    section: "details",
    options: [
      { value: "yes", labelKey: "common.yes", subcategory: "HAR-OTH" },
      { value: "no", labelKey: "common.no", subcategory: "HAR-OTH" },
    ],
    next: { type: "node", id: "har-present" },
  },
  {
    id: "har-present",
    promptKey: "har.present.prompt",
    type: "single",
    section: "details",
    options: [
      { value: "yes", labelKey: "common.yes", subcategory: "HAR-INT" },
      { value: "no", labelKey: "common.no" },
    ],
    next: { type: "node", id: "har-female" },
  },
  {
    id: "har-female",
    promptKey: "har.female.prompt",
    type: "single",
    required: false,
    section: "details",
    options: [
      { value: "yes", labelKey: "common.yes" },
      { value: "no", labelKey: "common.no" },
    ],
    next: { type: "node", id: "voice" },
  },
];
