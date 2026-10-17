import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";

import {
  isPromptId,
  promptAudioService,
  type FoundationScreenId,
  type PromptId,
} from "../services/promptAudioService";
import { useLocaleStore } from "../stores/localeStore";
import { useVoiceGuidanceStore } from "../stores/voiceGuidanceStore";

type PlaybackState = "idle" | "loading" | "playing" | "error";

type AutoPromptTarget =
  | { kind: "screen"; id: FoundationScreenId }
  | { kind: "prompt"; id: PromptId }
  | null;

/**
 * Voice-first playback: speak the current screen/step automatically on focus.
 * Stops when the user leaves or the prompt target changes.
 */
export function useAutoPromptPlayback(target: AutoPromptTarget) {
  const [state, setState] = useState<PlaybackState>("idle");
  const generationRef = useRef(0);
  const locale = useLocaleStore((current) => current.locale);
  const voiceGuidanceEnabled = useVoiceGuidanceStore((current) => current.enabled);

  useFocusEffect(
    useCallback(() => {
      if (!target || locale !== "ur" || !voiceGuidanceEnabled) {
        void promptAudioService.stop();
        setState("idle");
        return;
      }

      const generation = ++generationRef.current;
      let cancelled = false;

      const run = async () => {
        setState("loading");
        try {
          setState("playing");
          if (target.kind === "screen") {
            await promptAudioService.playScreenPrompt(target.id);
          } else {
            await promptAudioService.playPrompt(target.id);
          }
          if (!cancelled && generationRef.current === generation) {
            setState("idle");
          }
        } catch {
          if (!cancelled && generationRef.current === generation) {
            setState("error");
          }
        }
      };

      void run();

      return () => {
        cancelled = true;
        generationRef.current += 1;
        void promptAudioService.stop();
        setState("idle");
      };
    }, [locale, target?.kind, target && "id" in target ? target.id : null, voiceGuidanceEnabled]),
  );

  return { state };
}

export function useAutoScreenPrompt(screenId: FoundationScreenId | null) {
  const target: AutoPromptTarget = screenId ? { kind: "screen", id: screenId } : null;
  return useAutoPromptPlayback(target);
}

export function useAutoPromptId(promptId: string | undefined) {
  const target: AutoPromptTarget = isPromptId(promptId)
    ? { kind: "prompt", id: promptId }
    : null;
  return useAutoPromptPlayback(target);
}

/** @deprecated Prefer useAutoScreenPrompt — kept for any remaining manual callers */
export function usePromptPlayback(screenId: FoundationScreenId) {
  return useAutoScreenPrompt(screenId);
}
