import { describe, expect, it, vi } from "vitest";

vi.mock("./generatedPromptAssets", () => ({
  BUNDLED_PROMPT_ASSETS: {},
}));

import { PROMPT_FILES, SCREEN_PROMPT_ID, promptAudioService } from "./promptAudioService";

describe("promptAudioService catalog", () => {
  it("maps generated prompt IDs to bundled Urdu filenames", () => {
    expect(PROMPT_FILES["WF-voice"]).toBe("wf-voice.mp3");
    expect(promptAudioService.resolveFileName("SC-success")).toBe("sc-success.mp3");
    expect(Object.keys(PROMPT_FILES)).toHaveLength(122);
  });

  it("maps foundation screens to approved prompt IDs", () => {
    expect(SCREEN_PROMPT_ID["M-003"]).toBe("SC-home");
    expect(promptAudioService.resolveScreenPrompt("M-004")).toBe("SC-home");
  });

  it("skips playback when a prompt is not yet bundled", async () => {
    expect(promptAudioService.hasBundledPrompt("SC-success")).toBe(false);
    await expect(promptAudioService.playPrompt("SC-success")).resolves.toBeUndefined();
  });
});
