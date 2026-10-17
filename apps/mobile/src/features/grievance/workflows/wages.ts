import type { QuestionNode } from "../types";

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
      { value: "lump", labelKey: "wag.pay.lump" },
      { value: "unsure", labelKey: "wag.pay.unsure" },
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
      { value: "other", labelKey: "wag.who.other" },
      { value: "unsure", labelKey: "wag.who.unsure" },
    ],
    next: { type: "node", id: "voice" },
  },
];
