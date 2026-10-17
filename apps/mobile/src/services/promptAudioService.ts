import { PROMPT_FILES, isPromptId, type PromptId } from "@kapas/speech";
import type { AudioPlayer, AudioStatus } from "expo-audio";

import { BUNDLED_PROMPT_ASSETS } from "./generatedPromptAssets";

export { PROMPT_FILES, isPromptId, type PromptId };

export const SCREEN_PROMPT_ID = {
  "M-002": "SC-home",
  "M-003": "SC-home",
  "M-004": "SC-home",
} as const satisfies Record<string, PromptId>;

export type FoundationScreenId = keyof typeof SCREEN_PROMPT_ID;

/** MP3 decoder + Android audio buffer often finish before the last syllable is audible. */
const PLAYBACK_TAIL_PADDING_MS = 800;

let activeSound: AudioPlayer | null = null;
let activePlaybackCancel: (() => void) | null = null;
let playbackGeneration = 0;

async function stopActiveSound(): Promise<void> {
  const cancel = activePlaybackCancel;
  activePlaybackCancel = null;
  cancel?.();
  if (!activeSound) return;
  const sound = activeSound;
  activeSound = null;
  try {
    sound.pause();
  } catch {
    // Playback may already have ended.
  }
  sound.remove();
}

function hasBundledPrompt(promptId: PromptId): boolean {
  return BUNDLED_PROMPT_ASSETS[promptId] !== undefined;
}

function playbackReachedEnd(status: AudioStatus): boolean {
  if (status.didJustFinish) return true;
  if (!status.duration) return false;
  return status.currentTime >= status.duration - 0.08;
}

async function playOne(promptId: PromptId, generation: number): Promise<void> {
  if (generation !== playbackGeneration) return;
  const source = BUNDLED_PROMPT_ASSETS[promptId];
  if (source === undefined) return;
  const Audio = await import("expo-audio");
  await Audio.setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true, shouldPlayInBackground: false });
  const sound = Audio.createAudioPlayer(source, { updateInterval: 100 });
  if (generation !== playbackGeneration) {
    sound.remove();
    return;
  }
  activeSound = sound;
  try {
    await new Promise<void>((resolve, reject) => {
      let settled = false;
      let removeListener = () => {};
      const finish = () => {
        if (settled) return;
        settled = true;
        removeListener();
        if (activePlaybackCancel === finish) activePlaybackCancel = null;
        resolve();
      };
      const fail = (error: Error) => {
        if (settled) return;
        settled = true;
        removeListener();
        if (activePlaybackCancel === finish) activePlaybackCancel = null;
        reject(error);
      };
      activePlaybackCancel = finish;
      const subscription = sound.addListener("playbackStatusUpdate", (status) => {
        if (status.error) fail(new Error(status.error));
        else if (playbackReachedEnd(status)) finish();
      });
      removeListener = () => subscription.remove();
      try {
        sound.play();
      } catch (error) {
        fail(error instanceof Error ? error : new Error("Prompt playback failed."));
      }
    });
  } finally {
    if (activeSound === sound) activeSound = null;
    await new Promise<void>((resolve) =>
      setTimeout(() => resolve(), PLAYBACK_TAIL_PADDING_MS),
    );
    sound.remove();
  }
}

export const promptAudioService = {
  hasBundledPrompt,
  resolveFileName(promptId: PromptId): string {
    return PROMPT_FILES[promptId];
  },
  resolveScreenPrompt(screenId: FoundationScreenId): PromptId {
    return SCREEN_PROMPT_ID[screenId];
  },
  async stop(): Promise<void> {
    playbackGeneration += 1;
    await stopActiveSound();
  },
  async playPrompt(promptId: PromptId): Promise<void> {
    const generation = playbackGeneration + 1;
    playbackGeneration = generation;
    await stopActiveSound();
    await playOne(promptId, generation);
  },
  async playPrompts(promptIds: readonly PromptId[], onProgress?: (current: number, total: number) => void): Promise<void> {
    const generation = playbackGeneration + 1;
    playbackGeneration = generation;
    await stopActiveSound();
    for (let index = 0; index < promptIds.length; index += 1) {
      if (generation !== playbackGeneration) return;
      onProgress?.(index + 1, promptIds.length);
      await playOne(promptIds[index], generation);
    }
  },
  async playScreenPrompt(screenId: FoundationScreenId): Promise<void> {
    await this.playPrompt(this.resolveScreenPrompt(screenId));
  },
};
