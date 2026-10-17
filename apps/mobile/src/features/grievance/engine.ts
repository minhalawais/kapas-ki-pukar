import type { AnswerMap, AnswerValue, QuestionNode, WorkflowSection } from "./types";
import { SECTIONS } from "./types";

export function asString(value: AnswerValue | undefined): string | undefined {
  if (typeof value === "string") {
    return value;
  }
  return undefined;
}

export function asStringList(value: AnswerValue | undefined): string[] {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === "string" && value.length > 0) {
    return [value];
  }
  return [];
}

export function isAnswerValid(node: QuestionNode, answers: AnswerMap): boolean {
  if (
    node.type === "voice" ||
    node.type === "notice" ||
    node.type === "review" ||
    node.type === "ai-processing" ||
    node.type === "ai-understanding" ||
    node.type === "evidence"
  ) {
    return true;
  }
  if (node.required === false) {
    return true;
  }
  const value = answers[node.id];
  if (node.type === "multi") {
    return asStringList(value).length > 0;
  }
  return typeof value === "string" && value.length > 0;
}

export function resolveNext(node: QuestionNode, answers: AnswerMap): string | null {
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

export function sectionIndex(section: WorkflowSection): number {
  return SECTIONS.indexOf(section);
}

export function sectionProgress(section: WorkflowSection): { index: number; total: number; ratio: number } {
  const index = sectionIndex(section);
  const total = SECTIONS.length;
  return { index, total, ratio: (index + 1) / total };
}

export function walkPath(
  nodes: Map<string, QuestionNode>,
  startId: string,
  answers: AnswerMap,
  limit = 40,
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
