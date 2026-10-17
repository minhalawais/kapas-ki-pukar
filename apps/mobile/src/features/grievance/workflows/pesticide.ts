import type { QuestionNode } from "../types";

export const pesticideNodes: QuestionNode[] = [
  {
    id: "pes-what",
    promptKey: "pes.what.prompt",
    type: "single",
    section: "details",
    options: [
      { value: "spray", labelKey: "pes.what.spray", subcategory: "PES-EXP" },
      { value: "reentry", labelKey: "pes.what.reentry", subcategory: "PES-REI" },
      { value: "ppe", labelKey: "pes.what.ppe", subcategory: "PES-PPE" },
      { value: "skin", labelKey: "pes.what.skin", subcategory: "PES-EXP" },
      { value: "other", labelKey: "pes.what.other", subcategory: "PES-OTH" },
    ],
    next: { type: "node", id: "pes-sym" },
  },
  {
    id: "pes-sym",
    promptKey: "pes.sym.prompt",
    type: "multi",
    section: "details",
    options: [
      { value: "breath", labelKey: "pes.sym.breath", subcategory: "PES-SYM" },
      { value: "dizzy", labelKey: "pes.sym.dizzy", subcategory: "PES-SYM" },
      { value: "vomit", labelKey: "pes.sym.vomit", subcategory: "PES-SYM" },
      { value: "burn", labelKey: "pes.sym.burn", subcategory: "PES-SYM" },
      { value: "other", labelKey: "pes.sym.other", subcategory: "PES-SYM" },
      { value: "none", labelKey: "pes.sym.none" },
    ],
    next: { type: "node", id: "pes-med" },
  },
  {
    id: "pes-med",
    promptKey: "pes.med.prompt",
    type: "single",
    section: "details",
    options: [
      { value: "yes", labelKey: "common.yes", subcategory: "PES-INF" },
      { value: "no", labelKey: "common.no" },
    ],
    next: { type: "node", id: "voice" },
  },
];
