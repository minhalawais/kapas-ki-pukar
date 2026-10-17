import { workerCategoryCodes } from "@kapas/domain";
import { dictionaries } from "@kapas/localization";
import { rightsContentService } from "@kapas/mock-services";
import { describe, expect, it } from "vitest";

describe("rights content library", () => {
  it("contains the complete essential and additional rights set", async () => {
    const topics = await rightsContentService.list();
    expect(topics).toHaveLength(13);
    expect(topics.filter((topic) => topic.tier === "core")).toHaveLength(8);
    expect(topics.filter((topic) => topic.tier === "more")).toHaveLength(5);
    expect(topics.some((topic) => topic.id === "forced-labour")).toBe(true);
    expect(topics.some((topic) => topic.id === "facilities")).toBe(true);
  });

  it("provides structured, bilingual and province-aware guidance", async () => {
    const topics = await rightsContentService.list();
    const english = new Set(Object.keys(dictionaries.en));
    const urdu = new Set(Object.keys(dictionaries.ur));

    for (const topic of topics) {
      const keys = [
        topic.titleKey,
        topic.bodyKey,
        ...topic.guidanceKeys,
        ...topic.warningKeys,
        ...topic.actionKeys,
        ...topic.provinceNotes.flatMap((note) => [note.bodyKey, note.sourceLabelKey]),
      ];
      expect(topic.guidanceKeys).toHaveLength(2);
      expect(topic.warningKeys).toHaveLength(2);
      expect(topic.actionKeys).toHaveLength(2);
      expect(topic.provinceNotes.map((note) => note.province).sort()).toEqual(["Punjab", "Sindh"]);
      expect(keys.every((key) => english.has(key))).toBe(true);
      expect(keys.every((key) => urdu.has(key))).toBe(true);
      expect(topic.lastReviewedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      if (topic.categoryCode) {
        expect(workerCategoryCodes).toContain(topic.categoryCode);
      }
    }
  });

  it("does not attach unrelated legacy recordings to rights topics", async () => {
    const topics = await rightsContentService.list();
    for (const topic of topics) {
      expect("audioPromptId" in topic).toBe(false);
    }
  });
});
