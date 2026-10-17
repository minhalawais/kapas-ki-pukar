import type { QuestionNode } from "../workflow";

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
      { value: "shade", labelKey: "san.what.shade", subcategory: "SAN-OTH" },
    ],
    next: { type: "node", id: "san-place" },
  },
  {
    id: "san-place",
    promptKey: "san.place.prompt",
    type: "single",
    section: "details",
    options: [
      { value: "field", labelKey: "san.place.field" },
      { value: "camp", labelKey: "san.place.camp" },
      { value: "transport", labelKey: "san.place.transport" },
      { value: "restArea", labelKey: "san.place.restArea" },
    ],
    next: { type: "node", id: "san-risk" },
  },
  {
    id: "san-risk",
    promptKey: "san.risk.prompt",
    type: "single",
    section: "details",
    options: [
      { value: "yes", labelKey: "common.yes" },
      { value: "no", labelKey: "common.no" },
      { value: "unknown", labelKey: "common.unknown" },
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
      { value: "unknown", labelKey: "san.howLong.unknown" },
    ],
    next: { type: "node", id: "voice" },
  },
];
