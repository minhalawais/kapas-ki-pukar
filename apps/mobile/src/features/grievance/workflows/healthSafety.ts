import type { QuestionNode } from "../types";

export const healthSafetyNodes: QuestionNode[] = [
  {
    id: "hse-what",
    promptKey: "hse.what.prompt",
    type: "single",
    section: "details",
    options: [
      { value: "injury", labelKey: "hse.what.injury", subcategory: "HSE-INJ" },
      { value: "equipment", labelKey: "hse.what.equipment", subcategory: "HSE-EQP" },
      { value: "heat", labelKey: "hse.what.heat", subcategory: "HSE-HEA" },
      { value: "transport", labelKey: "hse.what.transport", subcategory: "HSE-TRN" },
      { value: "other", labelKey: "hse.what.other", subcategory: "HSE-OTH" },
    ],
    next: { type: "node", id: "hse-injured" },
  },
  {
    id: "hse-injured",
    promptKey: "hse.injured.prompt",
    type: "single",
    section: "details",
    options: [
      { value: "yes", labelKey: "common.yes" },
      { value: "no", labelKey: "common.no" },
    ],
    next: { type: "node", id: "hse-medical" },
  },
  {
    id: "hse-medical",
    promptKey: "hse.medical.prompt",
    type: "single",
    section: "details",
    options: [
      { value: "yes", labelKey: "common.yes", subcategory: "HSE-MED" },
      { value: "no", labelKey: "common.no" },
    ],
    next: { type: "node", id: "hse-still" },
  },
  {
    id: "hse-still",
    promptKey: "hse.still.prompt",
    type: "single",
    section: "details",
    options: [
      { value: "yes", labelKey: "common.yes" },
      { value: "no", labelKey: "common.no" },
    ],
    next: { type: "node", id: "voice" },
  },
];
