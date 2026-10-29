import { Ionicons } from "@expo/vector-icons";
import { t, type MessageKey } from "@kapas/localization";
import { useRouter } from "expo-router";
import { type ComponentProps, type ReactNode } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { isRTL } from "../../i18n/rtl";
import { useLocaleStore } from "../../stores/localeStore";
import { fontFamily, layout, semanticColors } from "../../theme/tokens";
import { AudioWaveVisualizer } from "../audio-wave-visualizer";
import { KapasMark } from "../kapas-mark";

type IconName = ComponentProps<typeof Ionicons>["name"];

interface Props {
  titleKey?: MessageKey;
  title?: string;
  subtitleKey?: MessageKey;
  subtitle?: string;
  icon?: IconName;
  trailing?: ReactNode;
  progress?: number;
  showBack?: boolean;
  onBack?: () => void;
  speaking?: boolean;
  loadingAudio?: boolean;
  onToggleSpeech?: () => void;
  fullWidth?: boolean;
  showLogo?: boolean;
}

export function LightTopBar({
  titleKey,
  title,
  subtitleKey,
  subtitle,
  icon,
  trailing,
  progress,
  showBack = true,
  onBack,
  speaking,
  loadingAudio,
  onToggleSpeech,
  fullWidth = false,
  showLogo = true,
}: Props) {
  const router = useRouter();
  const locale = useLocaleStore((s) => s.locale);
  const rtl = isRTL(locale);
  const family = rtl ? fontFamily.urduBold : fontFamily.uiBold;
  const subtitleFamily = rtl ? fontFamily.urduUi : fontFamily.ui;
  const mainTitle = title ?? (titleKey ? t(locale, titleKey) : "");
  const subtitleText = subtitle ?? (subtitleKey ? t(locale, subtitleKey) : undefined);
  const progressPercent = typeof progress === "number" ? Math.max(0, Math.min(100, progress * 100)) : undefined;

  return (
    <View
      style={{
        minHeight: subtitleText ? 62 : 54,
        position: "relative",
        overflow: "hidden",
        borderRadius: fullWidth ? 0 : 10,
        borderWidth: fullWidth ? 0 : 1,
        borderBottomWidth: 1,
        borderColor: semanticColors.borderEssential,
        backgroundColor: "#FFFFFF",
        shadowColor: "#1E2923",
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      }}
    >
      <View
        style={{
          minHeight: 54,
          position: "relative",
          flexDirection: rtl ? "row-reverse" : "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: fullWidth ? layout.mobilePagePaddingX : 10,
          paddingTop: 6,
          paddingBottom: 6,
        }}
      >
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 72,
            right: 72,
            top: 0,
            bottom: 0,
            alignItems: "center",
            justifyContent: "center",
            zIndex: 0,
          }}
        >
          <View style={{ flexDirection: rtl ? "row-reverse" : "row", alignItems: "center", justifyContent: "center", gap: 6, maxWidth: "100%" }}>
            {showLogo ? <KapasMark size={24} /> : null}
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.82}
              style={{
                color: semanticColors.textPrimary,
                fontSize: 19,
                lineHeight: rtl ? 32 : 24,
                fontFamily: family,
              }}
            >
              {mainTitle}
            </Text>
          </View>
          {subtitleText ? (
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
              style={{
                width: "100%",
                color: semanticColors.actionPrimary,
                fontSize: 12,
                lineHeight: rtl ? 18 : 16,
                fontFamily: subtitleFamily,
                fontWeight: "600",
                textAlign: "center",
              }}
            >
              {subtitleText}
            </Text>
          ) : null}
        </View>
        {showBack ? (
          <Pressable
            onPress={() => {
              if (onBack) {
                onBack();
                return;
              }
              router.back();
            }}
            accessibilityRole="button"
            accessibilityLabel={t(locale, "common.back")}
            style={({ pressed }) => ({
              width: 42,
              height: 42,
              borderRadius: 21,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#F3EFE0",
              borderWidth: 1,
              borderColor: "#E5E0D0",
              opacity: pressed ? 0.72 : 1,
              zIndex: 1,
            })}
          >
            <Ionicons name={rtl ? "chevron-forward" : "chevron-back"} size={22} color="#1E2923" />
          </Pressable>
        ) : (
          <View style={{ width: 42, height: 42 }} />
        )}
        {trailing ?? (
          onToggleSpeech ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, zIndex: 1 }}>
              <Pressable
                onPress={onToggleSpeech}
                disabled={loadingAudio}
                accessibilityRole="button"
                accessibilityLabel={t(locale, "a11y.listen")}
                accessibilityState={{ busy: loadingAudio, selected: speaking }}
                style={({ pressed }) => ({
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  borderWidth: 1.5,
                  borderColor: speaking ? semanticColors.actionPrimary : semanticColors.navChevronBorder,
                  backgroundColor: speaking ? "#E8F5E9" : "#F3EFE0",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed || loadingAudio ? 0.72 : 1,
                })}
              >
                {loadingAudio ? (
                  <ActivityIndicator size="small" color={semanticColors.actionPrimary} />
                ) : (
                  <Ionicons
                    name={speaking ? "stop" : "volume-high"}
                    size={22}
                    color={semanticColors.actionPrimary}
                  />
                )}
              </Pressable>
              {speaking ? <AudioWaveVisualizer active={speaking} /> : null}
            </View>
          ) : icon ? (
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: semanticColors.aiSurface,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name={icon} size={22} color={semanticColors.voiceActiveStrong} />
            </View>
          ) : (
            <View style={{ width: 42, height: 42 }} />
          )
        )}
      </View>
      {typeof progressPercent === "number" ? (
        <View
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: 100, now: Math.round(progressPercent) }}
          style={{
            height: 3,
            backgroundColor: "#E2E8F0",
            flexDirection: rtl ? "row-reverse" : "row",
          }}
        >
          <View style={{ width: `${progressPercent}%`, height: "100%", backgroundColor: semanticColors.actionPrimary, borderRadius: 1.5 }} />
        </View>
      ) : null}
    </View>
  );
}
