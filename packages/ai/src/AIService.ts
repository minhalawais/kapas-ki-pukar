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

export interface AIService {
  transcribe(input: VoiceEvidence, context?: ScenarioContext): Promise<TranscriptResult>;
  translate(text: string, from: string, to: string): Promise<TranslationResult>;
  classify(input: ComplaintContext): Promise<ClassificationResult>;
  summarize(input: ComplaintContext): Promise<SummaryResult>;
  extractFacts(input: ComplaintContext): Promise<ExtractedFactsResult>;
  suggestPriority(input: ComplaintContext): Promise<PrioritySuggestion>;
}
