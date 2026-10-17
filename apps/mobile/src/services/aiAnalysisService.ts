import { aiService, analyzeComplaint } from "@kapas/ai";
import type { AIAnalysis, ComplaintDraft, SubcategoryCode } from "@kapas/domain";
import { getDemoFlags } from "@kapas/mock-services";

import { asString } from "../features/grievance/engine";
import { answersFromDraft } from "../features/grievance/mapDraft";

export const aiAnalysisService = {
  async analyzeDraft(draft: ComplaintDraft): Promise<AIAnalysis> {
    const flags = getDemoFlags();
    const answers = answersFromDraft(draft);
    const subcategory = asString(answers.subcategory) as SubcategoryCode | undefined;
    const context = {
      category: draft.category,
      subcategory,
      immediateDanger: Boolean(draft.incident.immediateDanger),
      pesticideSymptoms: Boolean(draft.incident.structuredAnswers?.pesticideSymptoms),
      harassmentThreat: Boolean(draft.incident.structuredAnswers?.harassmentThreat),
      privacyMode: draft.privacyMode,
      scenarioId: draft.scenarioId ?? flags.activeScenarioId ?? undefined,
      othersAffected: draft.incident.othersAffected,
    };

    if (flags.aiFailure) {
      return {
        suggestedCategory: draft.category,
        suggestedSubcategory: subcategory,
        confidenceScore: 0,
        confidence: "low",
        failed: true,
        humanReviewRequired: true,
      };
    }

    const analysis = await analyzeComplaint(aiService, {
      voice: draft.voice,
      context,
      delayMs: flags.aiDelayMs,
    });

    if (flags.aiConfidenceOverride === "low") {
      return {
        ...analysis,
        confidenceScore: 0.55,
        confidence: "low",
        humanReviewRequired: true,
      };
    }
    if (flags.aiConfidenceOverride === "high") {
      return {
        ...analysis,
        confidenceScore: Math.max(analysis.confidenceScore, 0.9),
        confidence: "high",
      };
    }
    if (flags.aiConfidenceOverride === "medium") {
      return {
        ...analysis,
        confidenceScore: 0.7,
        confidence: "medium",
      };
    }
    return analysis;
  },
};
