import type { QuestionNode } from "../workflow";

export const harassmentNodes: QuestionNode[] = [
  {
    id: "har-about",
    promptKey: "har.type.prompt",
    type: "single",
    section: "details",
    options: [
      { value: "verbal", labelKey: "har.type.verbal", subcategory: "HAR-VER" },
      { value: "sexualWords", labelKey: "har.type.sexualWords", subcategory: "HAR-SEX" },
      { value: "touch", labelKey: "har.type.touch", subcategory: "HAR-SEX" },
      { value: "stalking", labelKey: "har.type.stalking", subcategory: "HAR-INT" },
      { value: "retaliation", labelKey: "har.type.retaliation", subcategory: "HAR-RET" },
      { value: "other", labelKey: "har.type.other", subcategory: "HAR-OTH" },
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
      { value: "unsafe", labelKey: "har.present.unsafe" },
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
