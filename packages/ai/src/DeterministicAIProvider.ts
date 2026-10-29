import type { ComplaintContext, ScenarioContext, VoiceEvidence } from "@kapas/domain";

import type { AIService } from "./AIService";
import { MockAIService } from "./MockAIService";
import { boundedAIInput, type AIProvider, type AIProviderResult, withMetadata } from "./provider";

export class DeterministicAIProvider implements AIProvider {
  public readonly metadata = {
    provider: "deterministic-test",
    model: "golden-fixtures-v1",
    promptVersion: "kapas-ai-v1",
  } as const;
  private readonly service: AIService = new MockAIService();

  async transcribe(input: VoiceEvidence, context?: ScenarioContext): Promise<AIProviderResult<Awaited<ReturnType<AIService["transcribe"]>>>> {
    const started = Date.now();
    return await withMetadata(await this.service.transcribe(input, context), this.metadata, { context }, started);
  }
  async classify(input: ComplaintContext): Promise<AIProviderResult<Awaited<ReturnType<AIService["classify"]>>>> {
    const safe = boundedAIInput(input);
    const started = Date.now();
    return await withMetadata(await this.service.classify(safe), this.metadata, safe, started);
  }
  async summarize(input: ComplaintContext): Promise<AIProviderResult<Awaited<ReturnType<AIService["summarize"]>>>> {
    const safe = boundedAIInput(input);
    const started = Date.now();
    return await withMetadata(await this.service.summarize(safe), this.metadata, safe, started);
  }
  async extractFacts(input: ComplaintContext): Promise<AIProviderResult<Awaited<ReturnType<AIService["extractFacts"]>>>> {
    const safe = boundedAIInput(input);
    const started = Date.now();
    return await withMetadata(await this.service.extractFacts(safe), this.metadata, safe, started);
  }
  async suggestPriority(input: ComplaintContext): Promise<AIProviderResult<Awaited<ReturnType<AIService["suggestPriority"]>>>> {
    const safe = boundedAIInput(input);
    const started = Date.now();
    return await withMetadata(await this.service.suggestPriority(safe), this.metadata, safe, started);
  }
}
