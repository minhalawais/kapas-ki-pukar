import type { QuestionNode } from "../workflow";

export const otherNodes: QuestionNode[] = [
  {
    id: "oth-kind",
    promptKey: "oth.kind.prompt",
    type: "single",
    section: "details",
    options: [
      { value: "wages", labelKey: "oth.kind.wages" },
      { value: "safety", labelKey: "oth.kind.safety" },
      { value: "spray", labelKey: "oth.kind.spray" },
      { value: "harassment", labelKey: "oth.kind.harassment" },
      { value: "contractor", labelKey: "oth.kind.contractor" },
      { value: "other", labelKey: "oth.kind.other" },
    ],
    next: { type: "node", id: "oth-urgent" },
  },
  {
    id: "oth-urgent",
    promptKey: "oth.urgent.prompt",
    type: "single",
    section: "details",
    options: [
      { value: "yes", labelKey: "common.yes" },
      { value: "no", labelKey: "common.no" },
    ],
    next: { type: "node", id: "voice" },
  },
];
