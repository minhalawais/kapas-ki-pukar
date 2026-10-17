import {
  getMinimumPriority,
  type ComplaintDraft,
  type GroupImpact,
  type Location,
  type PrivacyMode,
  type WorkerCategoryCode,
} from "@kapas/domain";

import { asString, asStringList } from "./engine";
import { HISTORY_KEY, INTRO_NODE_ID, type AnswerMap, type AnswerValue, type QuestionNode } from "./types";

export function emptyDraft(now: string): ComplaintDraft {
  return {
    id: `draft-${now}`,
    stepId: INTRO_NODE_ID,
    incident: {
      structuredAnswers: { [HISTORY_KEY]: [] },
    },
    location: {},
    evidence: [],
    voice: null,
    ai: null,
    updatedAt: now,
  };
}

export function answersFromDraft(draft: ComplaintDraft): AnswerMap {
  const raw = draft.incident.structuredAnswers ?? {};
  const answers: AnswerMap = {};
  for (const [key, value] of Object.entries(raw)) {
    if (key === HISTORY_KEY) {
      continue;
    }
    if (typeof value === "string" || Array.isArray(value)) {
      answers[key] = value as AnswerValue;
    }
  }
  return answers;
}

export function historyFromDraft(draft: ComplaintDraft): string[] {
  const raw = draft.incident.structuredAnswers?.[HISTORY_KEY];
  return Array.isArray(raw) ? raw.filter((id): id is string => typeof id === "string") : [];
}

function withAnswers(draft: ComplaintDraft, answers: AnswerMap, history: string[]): ComplaintDraft {
  return {
    ...draft,
    incident: {
      ...draft.incident,
      structuredAnswers: {
        ...answers,
        [HISTORY_KEY]: history,
      },
    },
  };
}

export function applyAnswer(
  draft: ComplaintDraft,
  node: QuestionNode,
  value: AnswerValue,
  location?: Partial<Location>,
): ComplaintDraft {
  const answers = { ...answersFromDraft(draft), [node.id]: value };
  const history = historyFromDraft(draft);
  let next = withAnswers(draft, answers, history);
  const selected = typeof value === "string" ? node.options?.find((option) => option.value === value) : undefined;
  const subcategory = selected?.subcategory;
  if (subcategory) {
    next = withAnswers(
      next,
      { ...answersFromDraft(next), subcategory },
      historyFromDraft(next),
    );
  }

  if (node.storeAs === "category" && typeof value === "string" && value !== "more") {
    next = { ...next, category: value as WorkerCategoryCode };
  }
  if (node.storeAs === "whenLabel" && typeof value === "string") {
    next = { ...next, incident: { ...next.incident, whenLabel: value } };
  }
  if (node.id === "others" && value === "no") {
    next = {
      ...next,
      incident: {
        ...next.incident,
        othersAffected: "individual",
        immediateDanger: next.incident.immediateDanger ?? false,
        currentDanger: next.incident.currentDanger ?? false,
      },
    };
  }
  if (node.storeAs === "othersAffected" && typeof value === "string") {
    next = {
      ...next,
      incident: {
        ...next.incident,
        othersAffected: value as GroupImpact,
        immediateDanger: next.incident.immediateDanger ?? false,
        currentDanger: next.incident.currentDanger ?? false,
      },
    };
  }
  if (node.storeAs === "immediateDanger" && typeof value === "string") {
    const danger = value === "yes";
    next = {
      ...next,
      incident: { ...next.incident, immediateDanger: danger, currentDanger: danger },
    };
  }
  if ((node.id === "har-present" || node.id === "chl-risk") && typeof value === "string") {
    const danger = value === "yes";
    next = {
      ...next,
      incident: { ...next.incident, immediateDanger: danger, currentDanger: danger },
    };
  }
  if (node.storeAs === "privacyMode" && typeof value === "string") {
    next = { ...next, privacyMode: value as PrivacyMode };
  }
  if (node.storeAs === "contactPreference" && typeof value === "string") {
    next = {
      ...next,
      incident: {
        ...next.incident,
        structuredAnswers: {
          ...answersFromDraft(next),
          [HISTORY_KEY]: historyFromDraft(next),
          contactPreference: value,
          alternateContact: value === "alternate" ? "Demo contact A" : undefined,
        },
      },
    };
  }
  if (node.storeAs === "province" && typeof value === "string") {
    next = {
      ...next,
      location: {
        province: value,
        source: "manual",
        district: undefined,
        placeLabel: undefined,
        villageLabel: undefined,
        exactCoordinates: null,
      },
    };
  }
  if (node.storeAs === "district" && typeof value === "string") {
    next = { ...next, location: { ...next.location, district: value.trim(), source: "manual" } };
  }
  if (node.storeAs === "placeLabel" && typeof value === "string") {
    next = {
      ...next,
      location: {
        ...next.location,
        placeLabel: value.trim(),
        villageLabel: value.trim(),
        source: "manual",
      },
    };
  }
  if (node.storeAs === "villageLabel" && location) {
    next = {
      ...next,
      location: {
        ...next.location,
        province: location.province,
        district: location.district,
        villageLabel: location.villageLabel,
      },
    };
  }

  const symptoms = asStringList(answers["pes-sym"]);
  const pesticideSymptoms = symptoms.length > 0 && !symptoms.includes("none");
  const harassmentThreat = asString(answers["har-present"]) === "yes";
  const priorityFloor = getMinimumPriority({
    category: next.category,
    immediateDanger: Boolean(next.incident.immediateDanger),
    pesticideSymptoms,
    harassmentThreat,
  });
  next = {
    ...next,
    incident: {
      ...next.incident,
      structuredAnswers: {
        ...answersFromDraft(next),
        [HISTORY_KEY]: historyFromDraft(next),
        pesticideSymptoms,
        harassmentThreat,
        priorityFloor,
      },
    },
  };
  return next;
}

export function pushHistory(draft: ComplaintDraft, nodeId: string): ComplaintDraft {
  const history = [...historyFromDraft(draft), nodeId];
  return withAnswers(draft, answersFromDraft(draft), history);
}

export function popHistory(draft: ComplaintDraft): { draft: ComplaintDraft; previousId: string | null } {
  const history = historyFromDraft(draft);
  const previousId = history.pop() ?? null;
  return { draft: withAnswers(draft, answersFromDraft(draft), history), previousId };
}
