import type { WorkerCategoryCode } from "./taxonomy";
import {
  CATEGORY_ENTRY,
  INTRO_NODE_ID,
  REVIEW_NODE_ID,
  type AnswerMap,
  type QuestionNode,
} from "./workflow";
import { getWorkflowNode, workflowNodeMap } from "./workflows";

function asString(value: AnswerMap[string] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function resolveNext(node: QuestionNode, answers: AnswerMap): string | null {
  if (node.next.type === "end") {
    return null;
  }
  if (node.next.type === "node") {
    return node.next.id;
  }
  if (node.next.type === "conditional") {
    for (const item of node.next.cases) {
      const matches = Object.entries(item.when).every(([answerId, expected]) => {
        const actual = answers[answerId];
        const expectedValues = Array.isArray(expected) ? expected : [expected];
        if (Array.isArray(actual)) {
          return actual.some((value) => expectedValues.includes(value));
        }
        return typeof actual === "string" && expectedValues.includes(actual);
      });
      if (matches) {
        return item.id;
      }
    }
    return node.next.fallback;
  }
  const sourceId = node.next.by ?? node.id;
  const raw = asString(answers[sourceId]) ?? "";
  return node.next.cases[raw] ?? node.next.fallback;
}

export function walkWorkflowPath(
  startId: string,
  answers: AnswerMap,
  limit = 80,
  nodes: Map<string, QuestionNode> = workflowNodeMap,
): string[] {
  const path: string[] = [];
  let current = nodes.get(startId);
  let guard = 0;
  while (current && guard < limit) {
    path.push(current.id);
    const nextId = resolveNext(current, answers);
    if (!nextId || nextId === current.id) {
      break;
    }
    current = nodes.get(nextId);
    guard += 1;
  }
  return path;
}

/** Ordered category-specific node ids from category entry through the step before `voice`. */
export function categoryDetailNodeIds(
  category: WorkerCategoryCode,
  answers: AnswerMap,
): string[] {
  const startId = CATEGORY_ENTRY[category];
  const path = walkWorkflowPath(startId, { ...answers, category }, 30);
  const voiceIndex = path.indexOf("voice");
  if (voiceIndex <= 0) {
    return path.filter((id) => id !== "voice");
  }
  return path.slice(0, voiceIndex);
}

export function workflowPathProgress(
  currentStepId: string,
  answers: AnswerMap,
): { index: number; total: number; ratio: number } {
  const merged = { ...answers };
  const path = walkWorkflowPath(INTRO_NODE_ID, merged, 80);
  const reviewIndex = path.indexOf(REVIEW_NODE_ID);
  const effectivePath = reviewIndex >= 0 ? path.slice(0, reviewIndex + 1) : path;
  const currentIndex = effectivePath.indexOf(currentStepId);
  if (currentIndex < 0 || effectivePath.length === 0) {
    const node = getWorkflowNode(currentStepId);
    const section = node?.section ?? "intro";
    const sections = ["intro", "category", "details", "facts", "safety", "review"] as const;
    const index = sections.indexOf(section as (typeof sections)[number]);
    const total = sections.length;
    return { index: Math.max(0, index), total, ratio: (index + 1) / total };
  }
  return {
    index: currentIndex,
    total: effectivePath.length,
    ratio: (currentIndex + 1) / effectivePath.length,
  };
}

export function fastForwardToReview<T extends { stepId: string; incident: { structuredAnswers?: Record<string, unknown> } }>(
  draft: T,
  answers: AnswerMap,
  pushHistory: (d: T, nodeId: string) => T,
): T {
  let current = draft;
  let stepId = current.stepId;
  for (let guard = 0; guard < 60; guard += 1) {
    if (stepId === REVIEW_NODE_ID) {
      break;
    }
    const node = getWorkflowNode(stepId);
    if (!node) {
      break;
    }
    const nextId = resolveNext(node, answers);
    if (!nextId) {
      break;
    }
    current = pushHistory(current, stepId);
    stepId = nextId;
    current = { ...current, stepId };
    if (stepId === REVIEW_NODE_ID) {
      break;
    }
    const nextNode = getWorkflowNode(stepId);
    if (!nextNode) {
      break;
    }
    const needsInput =
      nextNode.type !== "notice" &&
      nextNode.type !== "voice" &&
      nextNode.type !== "evidence" &&
      nextNode.type !== "review" &&
      nextNode.type !== "current-location" &&
      nextNode.required !== false &&
      !answerPresent(answers, nextNode);
    if (needsInput) {
      break;
    }
  }
  return current;
}

function answerPresent(answers: AnswerMap, node: QuestionNode): boolean {
  const value = answers[node.id];
  if (node.type === "multi") {
    return Array.isArray(value) ? value.length > 0 : typeof value === "string" && value.length > 0;
  }
  return typeof value === "string" && value.length > 0;
}

export const RETURN_TO_REVIEW_KEY = "_returnToReview";
