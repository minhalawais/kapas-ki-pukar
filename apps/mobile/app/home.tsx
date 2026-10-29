import { Ionicons } from "@expo/vector-icons";
import { t } from "@kapas/localization";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { type ComponentProps, useEffect, useState } from "react";
import { ActivityIndicator, Image, ImageBackground, Linking, Pressable, Text, useWindowDimensions, View } from "react-native";

import HOME_WORKER from "../assets/field-guide/home-worker-voice.png";
import PUWF_LOGO from "../assets/puwf_logo.png";
import { AudioWaveVisualizer } from "../src/components/audio-wave-visualizer";
import { KapasBrandLockup } from "../src/components/kapas-brand-lockup";
import { PartnerLogoStrip } from "../src/components/partner-logo-strip";
import { ScreenNotice } from "../src/components/screen-notice";
import { ScreenShell } from "../src/components/screen-shell";
import { useDraftRecovery } from "../src/hooks/use-draft-recovery";
import { useAutoScreenPrompt } from "../src/hooks/use-prompt-playback";
import { isRTL } from "../src/i18n/rtl";
import { promptAudioService } from "../src/services/promptAudioService";
import { useConnectivityStore } from "../src/stores/connectivityStore";
import { useLocaleStore } from "../src/stores/localeStore";
import { useVoiceGuidanceStore } from "../src/stores/voiceGuidanceStore";
import { fontFamily, mobileType, semanticColors } from "../src/theme/tokens";
import { urduBrandText, urduSafeText } from "../src/theme/urdu-text";

type IconName = ComponentProps<typeof Ionicons>["name"];

function SupportingAction({ title, hint, icon, tone, onPress }: { title: string; hint: string; icon: IconName; tone: "teal" | "gold"; onPress: () => void }) {
  const locale = useLocaleStore((state) => state.locale);
  const rtl = isRTL(locale);
  const accent = tone === "gold" ? "#B47A05" : semanticColors.voiceActiveStrong;
  const wash = tone === "gold" ? "#FBF2D9" : semanticColors.aiSurface;

  return (
    <Pressable
      onPress={() => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${hint}`}
      style={({ pressed }) => ({
        minHeight: 82,
        flexDirection: rtl ? "row-reverse" : "row",
        alignItems: "center",
        gap: 14,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: semanticColors.surface,
        borderWidth: 1,
        borderColor: semanticColors.borderEssential,
        borderRadius: 8,
        opacity: pressed ? 0.82 : 1,
        transform: [{ scale: pressed ? 0.99 : 1 }],
      })}
    >
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: wash, alignItems: "center", justifyContent: "center" }}>
        <Ionicons name={icon} size={23} color={accent} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.76}
          style={{
            color: semanticColors.textPrimary,
            fontFamily: rtl ? fontFamily.urduBold : fontFamily.uiBold,
            textAlign: rtl ? "right" : "left",
            ...(rtl ? urduSafeText(19, "heading") : { fontSize: 19, lineHeight: 25 }),
          }}
        >
          {title}
        </Text>
        <Text
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.82}
          style={{
            color: semanticColors.textSecondary,
            fontFamily: rtl ? fontFamily.urduUi : fontFamily.ui,
            textAlign: rtl ? "right" : "left",
            ...(rtl ? urduSafeText(mobileType.caption.size, "ui") : { fontSize: mobileType.caption.size, lineHeight: mobileType.caption.line }),
          }}
        >
          {hint}
        </Text>
      </View>
      <Ionicons name={rtl ? "chevron-back" : "chevron-forward"} size={22} color={accent} />
    </Pressable>
  );
}

function HelplineBar() {
  const locale = useLocaleStore((state) => state.locale);
  const rtl = isRTL(locale);
  const family = rtl ? fontFamily.urduSemibold : fontFamily.uiSemibold;

  const handleCall = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    void Linking.openURL("tel:+9204236304281");
  };

  return (
    <Pressable
      onPress={handleCall}
      accessibilityRole="button"
      accessibilityLabel={`${t(locale, "home.helplineTitle")}. +92 42 36304281`}
      style={({ pressed }) => ({
        minHeight: 48,
        flexDirection: rtl ? "row-reverse" : "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: "#EBF5F0",
        borderWidth: 1,
        borderColor: semanticColors.actionPrimary,
        borderRadius: 8,
        opacity: pressed ? 0.82 : 1,
      })}
    >
      <View style={{ flexDirection: rtl ? "row-reverse" : "row", alignItems: "center", gap: 8, flex: 1 }}>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: semanticColors.surface,
            borderWidth: 1,
            borderColor: semanticColors.border,
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            padding: 3,
          }}
        >
          <Image
            source={PUWF_LOGO}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
            style={{ width: "100%", height: "100%" }}
          />
        </View>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
          style={{
            color: semanticColors.actionPrimary,
            fontSize: 14,
            fontFamily: family,
          }}
        >
          {t(locale, "home.helplineTitle")}
        </Text>
      </View>

      <View style={{ flexDirection: rtl ? "row-reverse" : "row", alignItems: "center", gap: 6 }}>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.82}
          style={{
            color: semanticColors.textPrimary,
            fontSize: 14,
            fontFamily: fontFamily.uiBold,
            writingDirection: "ltr",
          }}
        >
          +92 42 36304281
        </Text>
        <Ionicons name={rtl ? "chevron-back" : "chevron-forward"} size={18} color={semanticColors.actionPrimary} />
      </View>
    </Pressable>
  );
}

let hasPlayedHomeAudioThisSession = false;

export default function HomeScreen() {
  const router = useRouter();
  const { width: viewportWidth } = useWindowDimensions();
  const locale = useLocaleStore((state) => state.locale);
  const [shouldAutoPlay] = useState(() => {
    if (!hasPlayedHomeAudioThisSession) {
      hasPlayedHomeAudioThisSession = true;
      return true;
    }
    return false;
  });
  const autoPlayback = useAutoScreenPrompt(shouldAutoPlay ? "M-004" : null);
  const [manualSpeaking, setManualSpeaking] = useState(false);
  const draft = useDraftRecovery();
  const persistenceNotice = useConnectivityStore((state) => state.persistenceNotice);
  const setVoiceGuidanceEnabled = useVoiceGuidanceStore((state) => state.setEnabled);
  const rtl = isRTL(locale);
  const family = rtl ? fontFamily.urduUi : fontFamily.ui;
  const headingFamily = rtl ? fontFamily.urduHeading : fontFamily.uiBold;
  const align = rtl ? "right" : "left";
  const narrowViewport = viewportWidth < 360;
  const heroTextWidth = Math.max(118, Math.min(184, viewportWidth * (narrowViewport ? 0.42 : 0.46)));
  const heroInset = narrowViewport ? 12 : 18;
  const greetingSize = narrowViewport ? 24 : 28;
  const trustLineSize = narrowViewport ? 14 : 15;

  const speaking = manualSpeaking || autoPlayback.state === "loading" || autoPlayback.state === "playing";
  const loading = autoPlayback.state === "loading";

  useEffect(() => () => { void promptAudioService.stop(); }, []);

  const toggleSpeech = () => {
    if (speaking) {
      void setVoiceGuidanceEnabled(false);
      void promptAudioService.stop().finally(() => setManualSpeaking(false));
      return;
    }
    if (locale !== "ur") return;
    void setVoiceGuidanceEnabled(true);
    setManualSpeaking(true);
    void promptAudioService.playScreenPrompt("M-004").finally(() => setManualSpeaking(false));
  };

  return (
    <ScreenShell scroll attributionMarginTop={8} contentStyle={{ paddingHorizontal: 0, paddingTop: 0, paddingBottom: 12, gap: 0 }}>
      <View
        style={{
          minHeight: 44,
          paddingHorizontal: 20,
          paddingTop: 0,
          paddingBottom: 0,
          flexDirection: rtl ? "row-reverse" : "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          overflow: "visible",
        }}
      >
        <Pressable
          delayLongPress={800}
          onLongPress={undefined}
          accessibilityRole="button"
          accessibilityLabel={t(locale, "app.name")}
          style={({ pressed }) => ({
            flex: 1,
            alignItems: rtl ? "flex-end" : "flex-start",
            justifyContent: "center",
            opacity: pressed ? 0.78 : 1,
            overflow: "visible",
          })}
        >
          <KapasBrandLockup markSize={34} textSize={rtl ? 18 : 19} textWidth={rtl ? 142 : 158} gap={8} />
        </Pressable>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Pressable
            onPress={toggleSpeech}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel={t(locale, "a11y.listen")}
            accessibilityState={{ busy: loading, selected: speaking }}
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              borderRadius: 22,
              borderWidth: 1.5,
              borderColor: speaking ? semanticColors.voiceActiveStrong : semanticColors.borderEssential,
              backgroundColor: speaking ? semanticColors.aiSurface : semanticColors.surface,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed || loading ? 0.72 : 1,
            })}
          >
            {loading ? (
              <ActivityIndicator size="small" color={semanticColors.voiceActiveStrong} />
            ) : (
              <Ionicons
                name={speaking ? "stop" : "volume-high"}
                size={23}
                color={semanticColors.voiceActiveStrong}
              />
            )}
          </Pressable>

          {speaking ? <AudioWaveVisualizer active={speaking} /> : null}
        </View>
      </View>

      <ImageBackground
        source={HOME_WORKER}
        resizeMode="cover"
        accessible={false}
        style={{ width: "100%", aspectRatio: 1.38, position: "relative", overflow: "hidden" }}
        imageStyle={{ backgroundColor: semanticColors.pageWorker }}
      >
        <View
          style={{
            position: "absolute",
            top: 12,
            ...(rtl
              ? { right: heroInset, left: undefined, width: heroTextWidth, alignItems: "flex-end" }
              : { left: heroInset, right: undefined, width: heroTextWidth, alignItems: "flex-start" }),
            gap: 2,
            paddingBottom: 8,
            overflow: "visible",
          }}
        >
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.68}
            style={{
              maxWidth: "100%",
              alignSelf: rtl ? "flex-end" : "flex-start",
              color: semanticColors.textPrimary,
              fontFamily: rtl ? fontFamily.urduBrand : headingFamily,
              textAlign: align,
              ...(rtl ? urduBrandText(greetingSize) : { fontSize: greetingSize, lineHeight: narrowViewport ? 31 : 36 }),
            }}
          >
            {t(locale, "home.greeting")}
          </Text>
          <Text
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.78}
            style={{
              maxWidth: "100%",
              alignSelf: rtl ? "flex-end" : "flex-start",
              color: semanticColors.textSecondary,
              fontFamily: rtl ? fontFamily.urduBold : fontFamily.uiBold,
              textAlign: align,
              ...(rtl ? urduSafeText(trustLineSize, "ui") : { fontSize: trustLineSize, lineHeight: narrowViewport ? 19 : 21 }),
            }}
          >
            {t(locale, "home.trustLine")}
          </Text>
        </View>
      </ImageBackground>

      <View style={{ marginTop: -16, paddingHorizontal: 20, gap: 10 }}>
        <Pressable
          onPress={() => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/grievance"); }}
          accessibilityRole="button"
          accessibilityLabel={`${t(locale, "home.reportProblem")}. ${t(locale, "home.reportHint")}`}
          style={({ pressed }) => ({
            minHeight: 110,
            flexDirection: rtl ? "row-reverse" : "row",
            alignItems: "center",
            gap: 16,
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderRadius: 8,
            backgroundColor: semanticColors.actionPrimary,
            opacity: pressed ? 0.9 : 1,
            transform: [{ scale: pressed ? 0.99 : 1 }],
            shadowColor: "#052C1C",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.18,
            shadowRadius: 11,
            elevation: 5,
          })}
        >
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="mic" size={30} color={semanticColors.onPrimary} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.76}
              style={{
                color: semanticColors.onPrimary,
                fontFamily: rtl ? fontFamily.urduBold : fontFamily.uiBold,
                textAlign: align,
                ...(rtl ? urduSafeText(23, "heading") : { fontSize: 24, lineHeight: 31 }),
              }}
            >
              {t(locale, "home.reportProblem")}
            </Text>
            <Text
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.82}
              style={{
                color: "#D9EEE4",
                fontFamily: family,
                textAlign: align,
                ...(rtl ? urduSafeText(14, "ui") : { fontSize: 14, lineHeight: 20 }),
              }}
            >
              {t(locale, "home.reportHint")}
            </Text>
          </View>
        </Pressable>

        <SupportingAction title={t(locale, "home.trackComplaint")} hint={t(locale, "home.trackHint")} icon="time" tone="teal" onPress={() => router.push("/complaints")} />
        <SupportingAction title={t(locale, "home.knowYourRights")} hint={t(locale, "home.rightsHint")} icon="shield-checkmark" tone="gold" onPress={() => router.push("/rights")} />

        {draft.isError ? <ScreenNotice messageKey="common.error" tone="error" /> : null}
        {persistenceNotice === "schema-reset" ? <ScreenNotice messageKey="persistence.schemaReset" tone="warning" /> : null}
        {persistenceNotice === "corrupt-draft" ? <ScreenNotice messageKey="persistence.corruptDraft" tone="warning" /> : null}
      </View>

      <View
        style={{
          marginTop: 14,
          marginHorizontal: 20,
          gap: 10,
        }}
      >
        <HelplineBar />
        <PartnerLogoStrip compact />
      </View>
    </ScreenShell>
  );
}
