import type {
  ClassificationResult,
  ComplaintContext,
  ExtractedFactsResult,
  PrioritySuggestion,
  ScenarioContext,
  SummaryResult,
  TranscriptResult,
  TranslationResult,
  VoiceEvidence,
} from "@kapas/domain";

import type { AIService } from "./AIService";
import { resolveScenarioId } from "./resolveScenario";
import {
  CATEGORY_FALLBACK_OUTPUTS,
  GOLDEN_AI_OUTPUTS,
  type ScenarioAiOutput,
} from "./scenarioOutputs";

function confidenceFromScore(score: number): "high" | "medium" | "low" {
  if (score >= 0.8) {
    return "high";
  }
  if (score >= 0.65) {
    return "medium";
  }
  return "low";
}

export function lookupScenarioOutput(
  context: ComplaintContext | ScenarioContext,
): ScenarioAiOutput {
  const key = resolveScenarioId(context);
  if (key && key in GOLDEN_AI_OUTPUTS) {
    return GOLDEN_AI_OUTPUTS[key as keyof typeof GOLDEN_AI_OUTPUTS];
  }
  if (key && key in CATEGORY_FALLBACK_OUTPUTS) {
    return CATEGORY_FALLBACK_OUTPUTS[key] as ScenarioAiOutput;
  }
  return GOLDEN_AI_OUTPUTS["GS-08"];
}

export class MockAIService implements AIService {
  async transcribe(input: VoiceEvidence, context?: ScenarioContext): Promise<TranscriptResult> {
    void input;
    const output = lookupScenarioOutput(context ?? {});
    if (output.failed) {
      return { textUr: "", confidence: "low", failed: true };
    }
    return {
      textUr: output.transcriptUr,
      confidence: confidenceFromScore(output.confidenceScore),
      failed: false,
    };
  }

  async translate(text: string, from: string, to: string): Promise<TranslationResult> {
    void from;
    void to;
    if (!text) {
      return { text: "", failed: true };
    }
    const match = Object.values(GOLDEN_AI_OUTPUTS).find((row) => row.transcriptUr === text);
    if (match?.failed) {
      return { text: "", failed: true };
    }
    if (match) {
      return { text: match.transcriptEn, failed: false };
    }
    const fallback = Object.values(CATEGORY_FALLBACK_OUTPUTS).find((row) => row?.transcriptUr === text);
    return { text: fallback?.transcriptEn ?? text, failed: false };
  }

  async classify(input: ComplaintContext): Promise<ClassificationResult> {
    const output = lookupScenarioOutput(input);
    return {
      suggestedCategory: output.suggestedCategory,
      suggestedSubcategory: output.suggestedSubcategory,
      confidence: confidenceFromScore(output.confidenceScore),
    };
  }

  async summarize(input: ComplaintContext): Promise<SummaryResult> {
    const output = lookupScenarioOutput(input);
    return {
      summaryUr: output.summaryUr,
      summaryEn: output.summaryEn,
      confidence: confidenceFromScore(output.confidenceScore),
    };
  }

  async extractFacts(input: ComplaintContext): Promise<ExtractedFactsResult> {
    return { facts: lookupScenarioOutput(input).facts };
  }

  async suggestPriority(input: ComplaintContext): Promise<PrioritySuggestion> {
    const output = lookupScenarioOutput(input);
    return {
      suggested: output.suggestedPriority,
      confidence: confidenceFromScore(output.confidenceScore),
    };
  }
}

export const aiService: AIService = new MockAIService();
