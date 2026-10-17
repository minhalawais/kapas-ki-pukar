import {
  getMinimumPriority,
  reconcilePriority,
  type AIAnalysis,
  type ComplaintContext,
  type VoiceEvidence,
} from "@kapas/domain";

import type { AIService } from "./AIService";
import { lookupScenarioOutput } from "./MockAIService";

export const AI_SIMULATION_DELAY_MS = {
  min: 800,
  max: 3000,
  default: 1200,
} as const;

export interface AnalyzeComplaintInput {
  voice?: VoiceEvidence | null;
  context: ComplaintContext;
  delayMs?: number;
}

function clampDelay(ms: number): number {
  if (ms <= 0) {
    return 0;
  }
  return Math.min(AI_SIMULATION_DELAY_MS.max, Math.max(AI_SIMULATION_DELAY_MS.min, ms));
}

function sleep(ms: number): Promise<void> {
  if (ms <= 0) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function confidenceFromScore(score: number): AIAnalysis["confidence"] {
  if (score >= 0.8) {
    return "high";
  }
  if (score >= 0.65) {
    return "medium";
  }
  return "low";
}

export async function analyzeComplaint(
  service: AIService,
  input: AnalyzeComplaintInput,
): Promise<AIAnalysis> {
  await sleep(clampDelay(input.delayMs ?? AI_SIMULATION_DELAY_MS.default));
  const output = lookupScenarioOutput(input.context);
  const floor = getMinimumPriority(input.context);
  const suggested = await service.suggestPriority(input.context);
  const reconciled = reconcilePriority(suggested.suggested, floor);

  if (output.failed) {
    return {
      suggestedCategory: output.suggestedCategory,
      suggestedSubcategory: output.suggestedSubcategory,
      suggestedPriority: reconciled,
      confidenceScore: 0,
      confidence: "low",
      failed: true,
      humanReviewRequired: true,
      warnings: output.warnings,
    };
  }

  const transcript = input.voice
    ? await service.transcribe(input.voice, { scenarioId: input.context.scenarioId })
    : {
        textUr: output.transcriptUr,
        confidence: confidenceFromScore(output.confidenceScore),
        failed: false,
      };
  const translation = transcript.failed
    ? { text: "", failed: true }
    : await service.translate(transcript.textUr, "ur", "en");
  const classification = await service.classify(input.context);
  const summary = await service.summarize(input.context);
  await service.extractFacts(input.context);

  return {
    suggestedCategory: classification.suggestedCategory,
    suggestedSubcategory: classification.suggestedSubcategory,
    suggestedPriority: reconciled,
    summaryUr: summary.summaryUr,
    summaryEn: summary.summaryEn,
    transcriptUr: transcript.failed ? undefined : transcript.textUr,
    transcriptEn: translation.failed ? undefined : translation.text,
    confidenceScore: output.confidenceScore,
    confidence: confidenceFromScore(output.confidenceScore),
    failed: false,
    humanReviewRequired: output.humanReviewRequired || output.confidenceScore < 0.65,
    extractedFacts: output.extractedFacts,
    warnings: output.warnings,
  };
}
