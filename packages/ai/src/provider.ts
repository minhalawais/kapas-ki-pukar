import type { ComplaintContext, ScenarioContext, VoiceEvidence } from "@kapas/domain";

import type { AIService } from "./AIService";

export interface AIProviderMetadata {
  readonly provider: string;
  readonly model: string;
  readonly region?: string;
  readonly promptVersion: string;
}

export interface AIProviderResult<T> {
  readonly value: T;
  readonly metadata: AIProviderMetadata & {
    readonly inputHash: string;
    readonly latencyMs: number;
    readonly tokenCount?: number;
    readonly costMinorUnits?: number;
    readonly warnings: readonly string[];
  };
}

export interface AIProvider {
  readonly metadata: AIProviderMetadata;
  transcribe(input: VoiceEvidence, context?: ScenarioContext): Promise<AIProviderResult<Awaited<ReturnType<AIService["transcribe"]>>>>;
  classify(input: ComplaintContext): Promise<AIProviderResult<Awaited<ReturnType<AIService["classify"]>>>>;
  summarize(input: ComplaintContext): Promise<AIProviderResult<Awaited<ReturnType<AIService["summarize"]>>>>;
  extractFacts(input: ComplaintContext): Promise<AIProviderResult<Awaited<ReturnType<AIService["extractFacts"]>>>>;
  suggestPriority(input: ComplaintContext): Promise<AIProviderResult<Awaited<ReturnType<AIService["suggestPriority"]>>>>;
}

export function boundedAIInput(input: ComplaintContext): ComplaintContext {
  return { ...input };
}

export async function inputHash(value: unknown): Promise<string> {
  const serialized = JSON.stringify(value);
  const cryptoApi = (globalThis as typeof globalThis & { crypto?: { subtle?: { digest: (algorithm: string, data: Uint8Array) => Promise<ArrayBuffer> } } }).crypto;
  if (cryptoApi?.subtle) {
    const bytes = Uint8Array.from(unescape(encodeURIComponent(serialized)), (character) => character.charCodeAt(0));
    const digest = await cryptoApi.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  let first = 0x811c9dc5;
  for (let index = 0; index < serialized.length; index += 1) {
    first ^= serialized.charCodeAt(index);
    first = Math.imul(first, 0x01000193);
  }
  return `${(first >>> 0).toString(16).padStart(8, "0")}${serialized.length.toString(16).padStart(56, "0")}`;
}

export async function withMetadata<T>(
  value: T,
  metadata: AIProviderMetadata,
  input: unknown,
  startedAt: number,
  warnings: readonly string[] = [],
): Promise<AIProviderResult<T>> {
  return {
    value,
    metadata: {
      ...metadata,
      inputHash: await inputHash(input),
      latencyMs: Math.max(0, Date.now() - startedAt),
      warnings,
    },
  };
}
