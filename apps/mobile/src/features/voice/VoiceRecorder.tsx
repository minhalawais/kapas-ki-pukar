import { Ionicons } from "@expo/vector-icons";
import type { VoiceEvidence } from "@kapas/domain";
import { t } from "@kapas/localization";
import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";

import { PrimaryCta } from "../../components/primary-cta";
import { ScreenNotice } from "../../components/screen-notice";
import { useReducedMotion } from "../../hooks/use-reduced-motion";
import { isRTL } from "../../i18n/rtl";
import { expoSpeechService } from "../../services/expoSpeechService";
import { useLocaleStore } from "../../stores/localeStore";
import { controlSize, fontFamily, mobileType, motion, radiusUsage, semanticColors } from "../../theme/tokens";

import { RecordingTimer } from "./RecordingTimer";
import { WaveformPlaceholder } from "./WaveformPlaceholder";

export type VoiceRecorderState = "idle" | "requesting" | "recording" | "stopped" | "playing" | "error";
export type VoiceRecorderError = "permission" | "recording" | "playback" | "no-audio";

interface Props {
  voice: VoiceEvidence | null;
  onVoiceChange: (voice: VoiceEvidence | null) => void;
  onBusyChange?: (busy: boolean) => void;
}

export function VoiceRecorder({ voice, onVoiceChange, onBusyChange }: Props) {
  const locale = useLocaleStore((s) => s.locale);
  const reduceMotion = useReducedMotion();
  const family = isRTL(locale) ? fontFamily.urduUi : fontFamily.ui;
  const [state, setState] = useState<VoiceRecorderState>(voice ? "stopped" : "idle");
  const [errorKind, setErrorKind] = useState<VoiceRecorderError | null>(null);
  const [elapsedMs, setElapsedMs] = useState(voice?.durationMs ?? 0);
  const pulse = useRef(new Animated.Value(1)).current;
  const startedAt = useRef(0);
  const micSize = (controlSize.microphoneMin + controlSize.microphoneMax) / 2;

  useEffect(() => {
    onBusyChange?.(state === "recording" || state === "requesting");
  }, [onBusyChange, state]);

  useEffect(() => {
    if (state !== "recording" || reduceMotion) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: motion.panel, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: motion.panel, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, reduceMotion, state]);

  useEffect(() => {
    if (state !== "recording") {
      return;
    }
    const tick = setInterval(() => {
      setElapsedMs(Date.now() - startedAt.current);
    }, 250);
    return () => clearInterval(tick);
  }, [state]);

  const recording = state === "recording";
  const hasVoice = Boolean(voice);
  const fill = recording ? semanticColors.voiceActive : semanticColors.aiSurface;
  const border = semanticColors.voiceActive;
  const labelKey =
    state === "recording"
      ? "voice.stop"
      : state === "playing"
        ? "voice.stop"
        : hasVoice
          ? "voice.play"
          : "voice.record";

  async function start(): Promise<void> {
    setErrorKind(null);
    setState("requesting");
    expoSpeechService.recordingLocale = locale;
    try {
      const permission = await expoSpeechService.requestPermission();
      if (permission !== "granted") {
        setErrorKind("permission");
        setState("error");
        return;
      }
      await expoSpeechService.startRecording();
      startedAt.current = Date.now();
      setElapsedMs(0);
      setState("recording");
    } catch {
      setErrorKind("recording");
      setState("error");
    }
  }

  async function stop(): Promise<void> {
    try {
      const next = await expoSpeechService.stopRecording();
      onVoiceChange(next);
      setElapsedMs(next.durationMs);
      setState("stopped");
    } catch {
      setErrorKind("recording");
      setState("error");
    }
  }

  async function play(): Promise<void> {
    if (!voice) {
      setErrorKind("no-audio");
      setState("error");
      return;
    }
    setState("playing");
    try {
      await expoSpeechService.play(voice.localUri);
      setState("stopped");
    } catch {
      setErrorKind("playback");
      setState("error");
    }
  }

  async function remove(): Promise<void> {
    if (voice) {
      await expoSpeechService.deleteRecording(voice.localUri);
    }
    onVoiceChange(null);
    setElapsedMs(0);
    setErrorKind(null);
    setState("idle");
  }

  return (
    <View style={{ gap: 16, alignItems: "center", padding: 18, borderRadius: radiusUsage.mobileCard, backgroundColor: semanticColors.aiSurface, borderWidth: 1, borderColor: semanticColors.voiceActive }}>
      <Text
        style={{
          color: semanticColors.textPrimary,
          fontSize: mobileType.body.size,
          lineHeight: mobileType.body.line,
          fontFamily: family,
          textAlign: "center",
        }}
      >
        {t(locale, "grievance.voice.body")}
      </Text>
      <Animated.View style={{ transform: [{ scale: pulse }] }}>
        <Pressable
          onPress={() => {
            void Haptics.impactAsync(recording ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
            if (state === "recording") {
              void stop();
              return;
            }
            if (state === "playing") {
              void expoSpeechService.stopPlayback().then(() => setState("stopped"));
              return;
            }
            if (hasVoice) {
              void play();
              return;
            }
            void start();
          }}
          disabled={state === "requesting"}
          accessibilityRole="button"
          accessibilityLabel={t(locale, labelKey)}
          accessibilityState={{ busy: recording || state === "playing" || state === "requesting" }}
          style={({ pressed }) => ({
            width: micSize,
            height: micSize,
            borderRadius: radiusUsage.microphone,
            backgroundColor: fill,
            borderWidth: 2,
            borderColor: border,
            alignItems: "center",
            justifyContent: "center",
            opacity: state === "requesting" ? 0.5 : pressed ? 0.85 : 1,
          })}
        >
          <Ionicons name={recording ? "stop" : state === "playing" ? "pause" : hasVoice ? "play" : "mic"} size={32} color={recording ? semanticColors.onPrimary : semanticColors.voiceActiveStrong} />
        </Pressable>
      </Animated.View>
      {state === "recording" || hasVoice ? <RecordingTimer elapsedMs={elapsedMs} /> : null}
      <WaveformPlaceholder active={recording || state === "playing"} reduceMotion={reduceMotion} />
      {hasVoice && state !== "recording" ? (
        <View style={{ width: "100%", gap: 8 }}>
          <PrimaryCta
            labelKey="voice.delete"
            tone="secondary"
            icon="trash-outline"
            onPress={() => {
              void remove();
            }}
          />
        </View>
      ) : null}
      {errorKind === "permission" ? <ScreenNotice messageKey="voice.permissionDenied" tone="error" /> : null}
      {errorKind === "recording" ? <ScreenNotice messageKey="voice.recordingFailed" tone="error" /> : null}
      {errorKind === "playback" ? <ScreenNotice messageKey="voice.playbackFailed" tone="error" /> : null}
      {errorKind === "no-audio" ? <ScreenNotice messageKey="voice.noAudio" /> : null}
      {errorKind === "permission" ? (
        <PrimaryCta
          labelKey="voice.retryPermission"
          tone="secondary"
          onPress={() => {
            void start();
          }}
        />
      ) : null}
    </View>
  );
}
