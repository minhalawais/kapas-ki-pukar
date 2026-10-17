import { goldenScenarioIds } from "@kapas/domain";
import { describe, expect, it } from "vitest";

import { GOLDEN_AI_OUTPUTS, MockAIService, aiService, analyzeComplaint } from "./index";

const sampleVoice = {
  id: "voice-1",
  localUri: "memory://voice-1",
  durationMs: 1200,
  recordedAt: "2026-08-19T12:00:00.000Z",
  locale: "ur" as const,
};

describe("MockAIService", () => {
  it("returns ten distinct golden scenario outputs", async () => {
    const summaries = new Set<string>();
    for (const id of goldenScenarioIds) {
      const result = await analyzeComplaint(aiService, {
        voice: sampleVoice,
        context: { immediateDanger: false, scenarioId: id },
        delayMs: 0,
      });
      summaries.add(result.failed ? `failed-${id}` : `${result.summaryEn}|${result.transcriptEn}`);
    }
    expect(summaries.size).toBe(10);
    expect(GOLDEN_AI_OUTPUTS["GS-01"].suggestedCategory).toBe("WAG");
    expect(GOLDEN_AI_OUTPUTS["GS-08"].confidenceScore).toBe(0.55);
  });

  it("keeps original audio URI out of the AI payload", async () => {
    const result = await analyzeComplaint(aiService, {
      voice: sampleVoice,
      context: { immediateDanger: false, scenarioId: "GS-01" },
      delayMs: 0,
    });
    expect(JSON.stringify(result)).not.toContain(sampleVoice.localUri);
    expect(result.transcriptUr).toBe(GOLDEN_AI_OUTPUTS["GS-01"].transcriptUr);
  });

  it("does not block on AI failure and leaves transcripts empty", async () => {
    const result = await analyzeComplaint(aiService, {
      voice: sampleVoice,
      context: { immediateDanger: false, scenarioId: "GS-09", category: "HSE" },
      delayMs: 0,
    });
    expect(result.failed).toBe(true);
    expect(result.transcriptUr).toBeUndefined();
    expect(result.humanReviewRequired).toBe(true);
  });

  it("flags low confidence for human review", async () => {
    const result = await analyzeComplaint(aiService, {
      voice: sampleVoice,
      context: { immediateDanger: false, scenarioId: "GS-08" },
      delayMs: 0,
    });
    expect(result.confidenceScore).toBe(0.55);
    expect(result.confidence).toBe("low");
    expect(result.humanReviewRequired).toBe(true);
  });

  it("does not let a lower AI suggestion beat the child-labour floor", async () => {
    const result = await analyzeComplaint(aiService, {
      voice: sampleVoice,
      context: { immediateDanger: false, category: "CHL", scenarioId: "GS-04" },
      delayMs: 0,
    });
    expect(GOLDEN_AI_OUTPUTS["GS-04"].suggestedPriority).toBe("Standard");
    expect(result.suggestedPriority).toBe("Critical");
  });

  it("raises pesticide danger to Emergency after AI suggestion", async () => {
    const result = await analyzeComplaint(aiService, {
      voice: sampleVoice,
      context: {
        immediateDanger: true,
        pesticideSymptoms: true,
        category: "PES",
        scenarioId: "GS-02",
      },
      delayMs: 0,
    });
    expect(result.suggestedPriority).toBe("Emergency");
  });

  it("exposes the six replaceable AI methods", async () => {
    const service = new MockAIService();
    await expect(service.classify({ immediateDanger: false, scenarioId: "GS-01" })).resolves.toMatchObject({
      suggestedCategory: "WAG",
    });
  });
});
