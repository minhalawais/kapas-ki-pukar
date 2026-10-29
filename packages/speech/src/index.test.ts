import { allWorkflowNodes } from "@kapas/domain";
import { describe, expect, it } from "vitest";

import { PROMPT_FILES, WORKFLOW_PROMPT_IDS, MemorySpeechService, rightsPromptIds } from "./index";

describe("speech package", () => {
  it("maps the complete generated Urdu prompt catalog", () => {
    expect(PROMPT_FILES["WF-voice"]).toBe("wf-voice.mp3");
    expect(WORKFLOW_PROMPT_IDS["wag-what"]).toBe("WF-wag-what");
    expect(rightsPromptIds("wages")).toHaveLength(4);
    expect(Object.keys(PROMPT_FILES)).toHaveLength(127);
  });

  it("covers every complaint workflow node with an Urdu prompt", () => {
    const workflowPromptNodes = Object.keys(WORKFLOW_PROMPT_IDS).sort();
    const complaintWorkflowNodes = allWorkflowNodes.map((node) => node.id).sort();
    expect(workflowPromptNodes).toEqual(expect.arrayContaining(complaintWorkflowNodes));
  });

  it("records, plays, and deletes without replacing the original URI", async () => {
    const speech = new MemorySpeechService();
    await expect(speech.requestPermission()).resolves.toBe("granted");
    await speech.startRecording();
    const voice = await speech.stopRecording();
    expect(voice.localUri.startsWith("memory://")).toBe(true);
    const originalUri = voice.localUri;
    await speech.play(voice.localUri);
    await speech.deleteRecording(voice.localUri);
    expect(speech.lastRecording).toBeNull();
    expect(originalUri).toBe(voice.localUri);
  });

  it("refuses recording when permission is denied", async () => {
    const speech = new MemorySpeechService();
    speech.permission = "denied";
    await expect(speech.startRecording()).rejects.toThrow(/permission/i);
  });
});
