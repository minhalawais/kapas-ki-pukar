import type { QuestionNode } from "../workflow";

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
      { value: "waterRest", labelKey: "hse.what.waterRest", subcategory: "HSE-HEA" },
      { value: "firstAid", labelKey: "hse.what.firstAid", subcategory: "HSE-MED" },
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
      { value: "needed", labelKey: "hse.medical.needed", subcategory: "HSE-MED" },
      { value: "received", labelKey: "hse.medical.received", subcategory: "HSE-MED" },
      { value: "refused", labelKey: "hse.medical.refused", subcategory: "HSE-MED" },
      { value: "notNeeded", labelKey: "hse.medical.notNeeded" },
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
      { value: "left", labelKey: "hse.still.left" },
    ],
    next: { type: "node", id: "voice" },
  },
];
