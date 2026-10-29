import type { ComplaintDraft } from "@kapas/domain";
import { categoryDetailNodeIds } from "@kapas/domain";
import { t, type MessageKey } from "@kapas/localization";

import { answersFromDraft } from "./mapDraft";
import type { AnswerValue } from "./types";
import { getWorkflowNode } from "./workflows";

const PROMOTED_ANSWER_IDS = new Set([
  "when",
  "others",
  "others-range",
  "where-province",
  "where-city",
  "where-place",
  "where-current",
  "danger",
  "privacy",
  "category",
  "category-more",
  "contact",
  "contactPreference",
  "representative-contact",
  "contact-language",
  "contact-window",
  "contact-voicemail",
  "subcategory",
  "pesticideSymptoms",
  "harassmentThreat",
  "priorityFloor",
  "_history",
  "_returnToReview",
]);

function formatAnswerValue(
  locale: "en" | "ur",
  nodeId: string,
  raw: AnswerValue | undefined,
): string | null {
  if (raw === undefined || raw === null) return null;
  const node = getWorkflowNode(nodeId);
  if (!node) return null;

  const values = Array.isArray(raw) ? raw : typeof raw === "string" ? [raw] : [];
  if (values.length === 0) return null;

  const labels = values.map((value) => {
    const option = node.options?.find((item) => item.value === value);
    return option ? t(locale, option.labelKey as MessageKey) : String(value);
  });
  return labels.join(locale === "ur" ? "، " : ", ");
}

export function structuredReviewLines(
  draft: ComplaintDraft,
  locale: "en" | "ur",
): { labelKey: MessageKey; value: string; editNodeId: string }[] {
  const answers = answersFromDraft(draft);
  const lines: { labelKey: MessageKey; value: string; editNodeId: string }[] = [];

  const orderedIds: string[] = [];
  if (draft.category) {
    orderedIds.push(...categoryDetailNodeIds(draft.category, answers));
  }
  for (const key of Object.keys(answers)) {
    if (PROMOTED_ANSWER_IDS.has(key) || orderedIds.includes(key)) continue;
    const node = getWorkflowNode(key);
    if (!node || !["details", "facts", "safety"].includes(node.section)) continue;
    orderedIds.push(key);
  }

  for (const key of orderedIds) {
    const node = getWorkflowNode(key);
    if (!node) continue;
    const value = formatAnswerValue(locale, key, answers[key]);
    if (!value) continue;
    lines.push({
      labelKey: node.promptKey as MessageKey,
      value,
      editNodeId: key,
    });
  }

  return lines;
}
