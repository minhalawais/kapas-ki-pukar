import { aiService, analyzeComplaint } from "@kapas/ai";
import type { AIAnalysis, ComplaintDraft, SubcategoryCode } from "@kapas/domain";

import { asString } from "../features/grievance/engine";
import { answersFromDraft } from "../features/grievance/mapDraft";

export const aiAnalysisService = {
  async analyzeDraft(draft: ComplaintDraft): Promise<AIAnalysis> {
    const answers = answersFromDraft(draft);
    const subcategory = asString(answers.subcategory) as SubcategoryCode | undefined;
    const context = {
      category: draft.category,
      subcategory,
      immediateDanger: Boolean(draft.incident.immediateDanger),
      pesticideSymptoms: Boolean(draft.incident.structuredAnswers?.pesticideSymptoms),
      harassmentThreat: Boolean(draft.incident.structuredAnswers?.harassmentThreat),
      privacyMode: draft.privacyMode,
      scenarioId: draft.scenarioId ?? undefined,
      othersAffected: draft.incident.othersAffected,
    };

    const analysis = await analyzeComplaint(aiService, {
      voice: draft.voice,
      context,
      delayMs: 0,
    });
    return analysis;
  },
};
