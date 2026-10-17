import type { QuestionNode } from "../workflow";

export const wagesNodes: QuestionNode[] = [
  {
    id: "wag-what",
    promptKey: "wag.what.prompt",
    type: "single",
    section: "details",
    options: [
      { value: "unpaid", labelKey: "wag.what.unpaid", subcategory: "WAG-UNP" },
      { value: "less", labelKey: "wag.what.less", subcategory: "WAG-UND" },
      { value: "late", labelKey: "wag.what.late", subcategory: "WAG-DEL" },
      { value: "deduction", labelKey: "wag.what.deduction", subcategory: "WAG-DED" },
      { value: "weight", labelKey: "wag.what.weight", subcategory: "WAG-PIE" },
      { value: "equal", labelKey: "wag.what.equal", subcategory: "WAG-UND" },
    ],
    next: { type: "node", id: "wag-pay" },
  },
  {
    id: "wag-pay",
    promptKey: "wag.pay.prompt",
    type: "single",
    section: "details",
    options: [
      { value: "daily", labelKey: "wag.pay.daily" },
      { value: "piece", labelKey: "wag.pay.piece", subcategory: "WAG-PIE" },
      { value: "acre", labelKey: "wag.pay.acre" },
      { value: "lump", labelKey: "wag.pay.lump" },
      { value: "verbal", labelKey: "wag.pay.verbal" },
      { value: "unknown", labelKey: "wag.pay.unknown" },
    ],
    next: { type: "node", id: "wag-who" },
  },
  {
    id: "wag-who",
    promptKey: "wag.who.prompt",
    type: "single",
    section: "details",
    options: [
      { value: "contractor", labelKey: "wag.who.contractor" },
      { value: "owner", labelKey: "wag.who.owner" },
      { value: "buyer", labelKey: "wag.who.buyer" },
      { value: "other", labelKey: "wag.who.other" },
      { value: "unknown", labelKey: "wag.who.unknown" },
    ],
    next: { type: "node", id: "wag-threat" },
  },
  {
    id: "wag-threat",
    promptKey: "wag.threat.prompt",
    type: "single",
    section: "details",
    options: [
      { value: "yes", labelKey: "wag.threat.yes" },
      { value: "no", labelKey: "wag.threat.no" },
      { value: "unsafe", labelKey: "wag.threat.unsafe" },
    ],
    next: { type: "node", id: "voice" },
  },
];
