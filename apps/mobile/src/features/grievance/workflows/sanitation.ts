import type { QuestionNode } from "../types";

export const sanitationNodes: QuestionNode[] = [
  {
    id: "san-what",
    promptKey: "san.what.prompt",
    type: "single",
    section: "details",
    options: [
      { value: "water", labelKey: "san.what.water", subcategory: "SAN-WAT" },
      { value: "toilet", labelKey: "san.what.toilet", subcategory: "SAN-TLT" },
      { value: "wash", labelKey: "san.what.wash", subcategory: "SAN-WAS" },
      { value: "women", labelKey: "san.what.women", subcategory: "SAN-WOM" },
    ],
    next: { type: "node", id: "san-howLong" },
  },
  {
    id: "san-howLong",
    promptKey: "san.howLong.prompt",
    type: "single",
    section: "details",
    options: [
      { value: "days", labelKey: "san.howLong.days" },
      { value: "weeks", labelKey: "san.howLong.weeks" },
      { value: "months", labelKey: "san.howLong.months" },
      { value: "unsure", labelKey: "san.howLong.unsure" },
    ],
    next: { type: "node", id: "voice" },
  },
];
