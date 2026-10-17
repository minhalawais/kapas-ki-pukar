import { Ionicons } from "@expo/vector-icons";
import { t, type MessageKey } from "@kapas/localization";
import * as Haptics from "expo-haptics";
import { type ComponentProps } from "react";
import { ActivityIndicator, Pressable, Text, type GestureResponderEvent } from "react-native";

import { isRTL } from "../i18n/rtl";
import { useLocaleStore } from "../stores/localeStore";
import { controlSize, fontFamily, mobileType, radiusUsage, semanticColors } from "../theme/tokens";
import { localizedTextMetrics } from "../theme/urdu-text";

interface Props {
  labelKey: MessageKey;
  onPress: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  loading?: boolean;
  tone?: "primary" | "secondary" | "voice" | "danger";
  icon?: ComponentProps<typeof Ionicons>["name"];
  accessibilityHint?: string;
}

export function PrimaryCta({
  labelKey,
  onPress,
  disabled,
  loading,
  tone = "primary",
  icon,
  accessibilityHint,
}: Props) {
  const locale = useLocaleStore((s) => s.locale);
  const label = t(locale, labelKey);
  const isDisabled = Boolean(disabled || loading);
  const backgroundColor =
    tone === "danger"
      ? semanticColors.critical
      : tone === "voice"
      ? semanticColors.voiceActive
      : tone === "secondary"
        ? semanticColors.surface
        : semanticColors.actionPrimary;
  const color =
    tone === "secondary" ? semanticColors.textPrimary : semanticColors.onPrimary;
  const borderWidth = tone === "secondary" ? 1.5 : 0;
  const rtl = isRTL(locale);
  const family = rtl ? fontFamily.urduSemibold : fontFamily.uiSemibold;
  const labelMetrics = localizedTextMetrics(locale, mobileType.button.size, mobileType.button.line);

  return (
    <Pressable
      onPress={(event) => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress(event);
      }}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: Boolean(loading) }}
      style={({ pressed }) => ({
        minHeight: controlSize.mobileCtaHeight,
        backgroundColor,
        borderRadius: radiusUsage.mobileButton,
        borderWidth,
        borderColor: semanticColors.borderEssential,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        opacity: isDisabled ? 0.4 : pressed ? 0.85 : 1,
        flexDirection: rtl ? "row-reverse" : "row",
        gap: 8,
      })}
    >
      {loading ? <ActivityIndicator color={color} /> : null}
      {!loading && icon ? <Ionicons name={icon} size={22} color={color} /> : null}
      <Text
        style={{
          color,
          fontFamily: family,
          textAlign: "center",
          ...labelMetrics,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
