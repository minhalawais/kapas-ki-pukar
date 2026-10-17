import { Ionicons } from "@expo/vector-icons";
import { t, type MessageKey } from "@kapas/localization";
import { Text, View } from "react-native";

import { isRTL } from "../i18n/rtl";
import { useLocaleStore } from "../stores/localeStore";
import { fontFamily, mobileType, radiusUsage, semanticColors } from "../theme/tokens";

export function ScreenNotice({
  messageKey,
  tone = "info",
}: {
  messageKey: MessageKey;
  tone?: "info" | "error" | "warning";
}) {
  const locale = useLocaleStore((s) => s.locale);
  const family = isRTL(locale) ? fontFamily.urduUi : fontFamily.ui;
  const borderColor = tone === "error" ? semanticColors.critical : tone === "warning" ? semanticColors.warning : semanticColors.borderEssential;
  const backgroundColor = tone === "error" ? semanticColors.criticalSurface : tone === "warning" ? semanticColors.warningSurface : semanticColors.surfaceMuted;
  const icon = tone === "error" ? "alert-circle" : tone === "warning" ? "warning" : "information-circle";

  return (
    <View
      accessibilityRole={tone === "error" ? "alert" : "none"}
      style={{
        backgroundColor,
        borderColor,
        borderWidth: 1,
        borderRadius: radiusUsage.mobileCard,
        padding: 14,
        flexDirection: isRTL(locale) ? "row-reverse" : "row",
        alignItems: "flex-start",
        gap: 10,
      }}
    >
      <Ionicons name={icon} size={22} color={tone === "error" ? semanticColors.critical : tone === "warning" ? semanticColors.warningText : semanticColors.actionPrimary} />
      <Text
        style={{
          flex: 1,
          color: semanticColors.textPrimary,
          fontSize: mobileType.body.size,
          lineHeight: mobileType.body.line,
          fontFamily: family,
          textAlign: isRTL(locale) ? "right" : "left",
        }}
      >
        {t(locale, messageKey)}
      </Text>
    </View>
  );
}
