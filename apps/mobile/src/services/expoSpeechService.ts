import type { Locale, PermissionState, VoiceEvidence } from "@kapas/domain";
import { isPromptId, type SpeechService } from "@kapas/speech";
import type { AudioPlayer, AudioRecorder } from "expo-audio";

import { promptAudioService } from "./promptAudioService";

export class ExpoSpeechService implements SpeechService {
  recordingLocale: Locale = "ur";
  private recording: AudioRecorder | null = null;
  private sound: AudioPlayer | null = null;
  private startedAt = 0;

  async requestPermission(): Promise<PermissionState> {
    try {
      const Audio = await import("expo-audio");
      const current = await Audio.getRecordingPermissionsAsync();
      if (current.granted) {
        return "granted";
      }
      const next = await Audio.requestRecordingPermissionsAsync();
      if (next.granted) {
        return "granted";
      }
      return "denied";
    } catch {
      return "undetermined";
    }
  }

  async startRecording(): Promise<void> {
    const permission = await this.requestPermission();
    if (permission !== "granted") {
      throw new Error("Microphone permission is not granted.");
    }
    await this.stopPlayback();
    await promptAudioService.stop();
    const [Audio, { default: AudioModule }] = await Promise.all([
      import("expo-audio"),
      import("expo-audio/build/AudioModule"),
    ]);
    await Audio.setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
      shouldPlayInBackground: false,
    });
    const recording = new AudioModule.AudioRecorder(Audio.RecordingPresets.HIGH_QUALITY);
    await recording.prepareToRecordAsync();
    recording.record();
    this.recording = recording;
    this.startedAt = Date.now();
  }

  async stopRecording(): Promise<VoiceEvidence> {
    const recording = this.recording;
    if (!recording) {
      throw new Error("No active recording.");
    }
    this.recording = null;
    let durationMs = Math.max(1, Date.now() - this.startedAt);
    try {
      const status = recording.getStatus();
      await recording.stop();
      if (status.durationMillis > 0) {
        durationMs = status.durationMillis;
      }
    } catch {
      throw new Error("Recording failed.");
    }
    const localUri = recording.uri;
    if (!localUri) {
      throw new Error("No audio.");
    }
    const Audio = await import("expo-audio");
    await Audio.setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
      shouldPlayInBackground: false,
    });
    return {
      id: `voice-${this.startedAt}`,
      localUri,
      durationMs,
      recordedAt: new Date(this.startedAt).toISOString(),
      locale: this.recordingLocale,
    };
  }

  async play(uri: string): Promise<void> {
    if (!uri) {
      throw new Error("Playback failed.");
    }
    await this.stopPlayback();
    await promptAudioService.stop();
    const Audio = await import("expo-audio");
    await Audio.setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
      shouldPlayInBackground: false,
    });
    const sound = Audio.createAudioPlayer({ uri }, { updateInterval: 100 });
    this.sound = sound;
    await new Promise<void>((resolve, reject) => {
      const subscription = sound.addListener("playbackStatusUpdate", (status) => {
        if (status.error) {
          subscription.remove();
          reject(new Error(status.error));
          return;
        }
        if (status.didJustFinish) {
          subscription.remove();
          resolve();
        }
      });
      try {
        sound.play();
      } catch (error) {
        subscription.remove();
        reject(error);
      }
    }).finally(() => {
      void this.stopPlayback();
    });
  }

  async stopPlayback(): Promise<void> {
    if (!this.sound) {
      return;
    }
    const sound = this.sound;
    this.sound = null;
    try {
      sound.pause();
    } catch {
      // Playback may already have ended.
    }
    sound.remove();
  }

  async playPrompt(promptId: string, _locale: string): Promise<void> {
    if (!isPromptId(promptId)) {
      throw new Error(`Unknown prompt ${promptId}`);
    }
    await this.stopPlayback();
    await promptAudioService.playPrompt(promptId);
  }

  async deleteRecording(_uri: string): Promise<void> {
    await this.stopPlayback();
  }
}

export const expoSpeechService = new ExpoSpeechService();
