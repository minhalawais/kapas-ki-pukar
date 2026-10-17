import { t } from "@kapas/localization";
import { Pressable, Text } from "react-native";

import { isRTL } from "../i18n/rtl";
import { useLocaleStore } from "../stores/localeStore";
import { controlSize, fontFamily, mobileType, radiusUsage, semanticColors } from "../theme/tokens";

interface Props {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  playing?: boolean;
  labelKey?: "welcome.playAudio" | "home.listenToScreen" | "a11y.listen";
}

export function AudioReplayButton({
  onPress,
  disabled,
  loading,
  playing,
  labelKey = "a11y.listen",
}: Props) {
  const locale = useLocaleStore((s) => s.locale);
  const label = playing ? t(locale, "audio.playing") : t(locale, labelKey);
  const isDisabled = Boolean(disabled || loading);
  const family = isRTL(locale) ? fontFamily.urduUi : fontFamily.ui;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={t(locale, "a11y.listen")}
      accessibilityState={{ disabled: isDisabled, busy: Boolean(loading || playing) }}
      style={({ pressed }) => ({
        minHeight: controlSize.mobileTouchMin,
        minWidth: controlSize.mobileTouchMin,
        borderRadius: radiusUsage.mobileButton,
        backgroundColor: semanticColors.aiSurface,
        borderWidth: 1,
        borderColor: semanticColors.voiceActive,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        opacity: isDisabled ? 0.4 : pressed ? 0.85 : 1,
      })}
    >
      <Text
        style={{
          color: semanticColors.voiceActiveStrong,
          fontSize: mobileType.button.size,
          lineHeight: mobileType.button.line,
          fontWeight: "600",
          fontFamily: family,
          textAlign: "center",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
