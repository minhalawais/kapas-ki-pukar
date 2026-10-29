import { CATEGORY_ENTRY, REVIEW_NODE_ID, walkWorkflowPath, workerCategoryCodes } from "@kapas/domain";
import { describe, expect, it } from "vitest";

import { isAnswerValid, resolveNext, sectionProgress, walkPath } from "./engine";
import {
  applyAnswer,
  answersFromDraft,
  emptyDraft,
  historyFromDraft,
  popHistory,
  pushHistory,
} from "./mapDraft";
import { INTRO_NODE_ID } from "./types";
import { getWorkflowNode, workflowNodeMap } from "./workflows";

function answer(draft: ReturnType<typeof emptyDraft>, nodeId: string, value: string) {
  const node = getWorkflowNode(nodeId);
  if (!node) {
    throw new Error(nodeId);
  }
  return applyAnswer({ ...draft, stepId: nodeId }, node, value);
}

describe("grievance conversation engine", () => {
  it("walks the wage branch into the common tail", () => {
    const answers = {
      category: "WAG",
      "wag-what": "unpaid",
      "wag-pay": "piece",
      "wag-who": "contractor",
      "wag-threat": "no",
    };
    const path = walkPath(workflowNodeMap, "category", answers);
    expect(path.slice(0, 6)).toEqual([
      "category",
      "wag-what",
      "wag-pay",
      "wag-who",
      "wag-threat",
      "voice",
    ]);
  });

  it.each(["WAG", "CON", "HRS", "SAN", "PES", "HSE", "HAR", "DIS", "CHL", "FOL", "OTH"])(
    "routes %s through voice and evidence exactly once",
    (category) => {
      const path = walkPath(workflowNodeMap, "category", { category });
      expect(path.filter((id) => id === "voice")).toHaveLength(1);
      expect(path.filter((id) => id === "evidence")).toHaveLength(1);
      expect(path.indexOf("voice")).toBeLessThan(path.indexOf("evidence"));
    },
  );

  it.each(workerCategoryCodes)("maps %s from category picker to its first question", (category) => {
    expect(resolveNext(getWorkflowNode("category")!, { category })).toBe(CATEGORY_ENTRY[category]);
  });

  it("walks wage answers through voice to review without AI", () => {
    const answers = {
      category: "WAG",
      "wag-what": "unpaid",
      "wag-pay": "piece",
      "wag-who": "contractor",
      "wag-threat": "no",
      when: "today",
      "where-current": "confirmed",
      others: "no",
      privacy: "ANON",
    };
    const path = walkWorkflowPath("category", answers);
    expect(path).toContain("voice");
    expect(path).toContain("evidence");
    expect(path).toContain(REVIEW_NODE_ID);
    expect(path).not.toContain("ai-understanding");
    expect(path.filter((id) => id === REVIEW_NODE_ID)).toHaveLength(1);
  });

  it("routes anonymous evidence upload directly to final review", () => {
    expect(walkWorkflowPath("evidence", { privacy: "ANON" })).toEqual(["evidence", REVIEW_NODE_ID]);
  });

  it("starts with identity before complaint categories", () => {
    const draft = emptyDraft("2026-08-19T12:00:00.000Z");
    expect(draft.stepId).toBe("identity");
    expect(resolveNext(getWorkflowNode("identity")!, { identity: "provided" })).toBe("category");
  });

  it("offers GPS confirmation and nationwide manual location entry", () => {
    expect(resolveNext(getWorkflowNode("when")!, { when: "today" })).toBe("where-current");
    expect(resolveNext(getWorkflowNode("where-current")!, { "where-current": "confirmed" })).toBe(
      "others",
    );
    const provinces = getWorkflowNode("where-province")!.options?.map((option) => option.value);
    expect(provinces).toEqual([
      "Punjab",
      "Sindh",
      "Khyber Pakhtunkhwa",
      "Balochistan",
      "Islamabad Capital Territory",
      "Gilgit-Baltistan",
      "Azad Jammu and Kashmir",
    ]);
    expect(
      resolveNext(getWorkflowNode("where-province")!, { "where-province": "Balochistan" }),
    ).toBe("where-city");
    expect(resolveNext(getWorkflowNode("where-city")!, { "where-city": "Quetta" })).toBe(
      "where-place",
    );
  });

  it("opens extra categories from More", () => {
    expect(resolveNext(getWorkflowNode("category")!, { category: "more" })).toBe("category-more");
    expect(resolveNext(getWorkflowNode("category-more")!, { "category-more": "SAN" })).toBe(
      "san-what",
    );
  });

  it("asks group range only when others are affected", () => {
    const others = getWorkflowNode("others")!;
    expect(resolveNext(others, { others: "yes" })).toBe("others-range");
    expect(resolveNext(others, { others: "no", category: "WAG", "wag-threat": "no" })).toBe(
      "privacy",
    );
    expect(resolveNext(others, { others: "no", category: "PES" })).toBe("danger");
    expect(resolveNext(others, { others: "no", category: "WAG", "wag-threat": "yes" })).toBe(
      "danger",
    );
  });

  it("routes harassment to danger when category is HAR", () => {
    const others = getWorkflowNode("others")!;
    expect(resolveNext(others, { others: "no", category: "HAR", "har-present": "no" })).toBe(
      "danger",
    );
  });

  it("skips danger for non-safety wage complaints after counting others", () => {
    const range = getWorkflowNode("others-range")!;
    expect(resolveNext(range, { category: "WAG", "wag-threat": "no", "others-range": "2-5" })).toBe(
      "privacy",
    );
    expect(resolveNext(range, { category: "HSE", "others-range": "2-5" })).toBe("danger");
  });

  it("routes evidence to review for anonymous reporters", () => {
    expect(resolveNext(getWorkflowNode("evidence")!, { privacy: "ANON" })).toBe("review");
    expect(resolveNext(getWorkflowNode("evidence")!, { privacy: "CONF" })).toBe("contact");
    expect(resolveNext(getWorkflowNode("contact")!, { contact: "either" })).toBe("contact-language");
    expect(resolveNext(getWorkflowNode("contact")!, { contact: "do-not-initiate" })).toBe(
      "contact-emergency-notice",
    );
    expect(getWorkflowNode("contact")!.required).toBe(true);
    expect(resolveNext(getWorkflowNode("contact-voicemail")!, {})).toBe("review");
  });

  it("tags evidence and contact as safety section, review only on final screen", () => {
    expect(getWorkflowNode("evidence")!.section).toBe("safety");
    expect(getWorkflowNode("contact")!.section).toBe("safety");
    expect(getWorkflowNode("review")!.section).toBe("review");
  });

  it("keeps optional screens valid without an answer", () => {
    expect(isAnswerValid(getWorkflowNode("voice")!, {})).toBe(true);
    expect(isAnswerValid(getWorkflowNode("evidence")!, {})).toBe(true);
    expect(isAnswerValid(getWorkflowNode("har-female")!, {})).toBe(true);
    expect(isAnswerValid(getWorkflowNode("category")!, {})).toBe(false);
  });

  it("uses section progress with six workflow sections", () => {
    expect(sectionProgress("intro").total).toBe(6);
    expect(sectionProgress("review").ratio).toBe(1);
  });

  it("persists answers on back without dropping them", () => {
    let draft = emptyDraft("2026-08-19T12:00:00.000Z");
    expect(draft.stepId).toBe(INTRO_NODE_ID);
    draft = answer(draft, "category", "CHL");
    draft = pushHistory(draft, "category");
    draft = { ...draft, stepId: "chl-who" };
    const back = popHistory(draft);
    expect(back.previousId).toBe("category");
    expect(answersFromDraft(back.draft).category).toBe("CHL");
    expect(historyFromDraft(back.draft)).toEqual([]);
  });

  it("maps pesticide symptoms and child-labour category onto the draft", () => {
    let draft = emptyDraft("2026-08-19T12:00:00.000Z");
    draft = answer(draft, "category", "PES");
    draft = applyAnswer(draft, getWorkflowNode("pes-sym")!, ["breath", "vomit"]);
    expect(draft.category).toBe("PES");
    expect(draft.incident.structuredAnswers?.pesticideSymptoms).toBe(true);
    draft = applyAnswer(draft, getWorkflowNode("danger")!, "yes");
    expect(draft.incident.structuredAnswers?.priorityFloor).toBe("Emergency");
  });

  it("maps manual province, city and place onto a structured location", () => {
    let draft = emptyDraft("2026-08-19T12:00:00.000Z");
    draft = answer(draft, "where-province", "Gilgit-Baltistan");
    draft = answer(draft, "where-city", "Skardu");
    draft = answer(draft, "where-place", "Shigar farm");
    expect(draft.location).toMatchObject({
      province: "Gilgit-Baltistan",
      district: "Skardu",
      placeLabel: "Shigar farm",
      source: "manual",
      exactCoordinates: null,
    });
  });

  it("keeps unique node ids for every workflow file", () => {
    const ids = [...workflowNodeMap.keys()];
    expect(ids).toHaveLength(new Set(ids).size);
    expect(workflowNodeMap.has("wag-what")).toBe(true);
    expect(workflowNodeMap.has("dis-what")).toBe(true);
    expect(workflowNodeMap.has("ai-understanding")).toBe(false);
  });
});
