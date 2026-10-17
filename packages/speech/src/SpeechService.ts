import type { PermissionState, VoiceEvidence } from "@kapas/domain";

export interface SpeechService {
  requestPermission(): Promise<PermissionState>;
  startRecording(): Promise<void>;
  stopRecording(): Promise<VoiceEvidence>;
  play(uri: string): Promise<void>;
  stopPlayback(): Promise<void>;
  playPrompt(promptId: string, locale: string): Promise<void>;
  deleteRecording(uri: string): Promise<void>;
}

export class UnimplementedSpeechService implements SpeechService {
  async requestPermission(): Promise<PermissionState> {
    throw new Error("SpeechService requires a runtime adapter (ExpoSpeechService).");
  }

  async startRecording(): Promise<void> {
    throw new Error("SpeechService requires a runtime adapter (ExpoSpeechService).");
  }

  async stopRecording(): Promise<VoiceEvidence> {
    throw new Error("SpeechService requires a runtime adapter (ExpoSpeechService).");
  }

  async play(): Promise<void> {
    throw new Error("SpeechService requires a runtime adapter (ExpoSpeechService).");
  }

  async stopPlayback(): Promise<void> {
    throw new Error("SpeechService requires a runtime adapter (ExpoSpeechService).");
  }

  async playPrompt(): Promise<void> {
    throw new Error("SpeechService requires a runtime adapter (ExpoSpeechService).");
  }

  async deleteRecording(): Promise<void> {
    throw new Error("SpeechService requires a runtime adapter (ExpoSpeechService).");
  }
}

export class MemorySpeechService implements SpeechService {
  permission: PermissionState = "granted";
  recording = false;
  lastRecording: VoiceEvidence | null = null;
  playingUri: string | null = null;
  lastPromptId: string | null = null;
  private startedAt = 0;

  async requestPermission(): Promise<PermissionState> {
    return this.permission;
  }

  async startRecording(): Promise<void> {
    if (this.permission !== "granted") {
      throw new Error("Microphone permission is not granted.");
    }
    this.recording = true;
    this.startedAt = Date.now();
  }

  async stopRecording(): Promise<VoiceEvidence> {
    if (!this.recording) {
      throw new Error("No active recording.");
    }
    this.recording = false;
    const durationMs = Math.max(1, Date.now() - this.startedAt);
    this.lastRecording = {
      id: `voice-memory-${this.startedAt}`,
      localUri: `memory://recording-${this.startedAt}`,
      durationMs,
      recordedAt: new Date(this.startedAt).toISOString(),
      locale: "ur",
    };
    return this.lastRecording;
  }

  async play(uri: string): Promise<void> {
    if (!uri) {
      throw new Error("Playback failed.");
    }
    this.playingUri = uri;
    this.playingUri = null;
  }

  async stopPlayback(): Promise<void> {
    this.playingUri = null;
  }

  async playPrompt(promptId: string, _locale?: string): Promise<void> {
    this.lastPromptId = promptId;
  }

  async deleteRecording(uri: string): Promise<void> {
    if (this.lastRecording?.localUri === uri) {
      this.lastRecording = null;
    }
  }
}
