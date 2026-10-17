import { t } from "@kapas/localization";
import { Image, Text, View } from "react-native";

import ILO_LOCKUP from "../../assets/ilo_logo_display.png";
import { isRTL } from "../i18n/rtl";
import { useLocaleStore } from "../stores/localeStore";
import { fontFamily, semanticColors } from "../theme/tokens";
import { urduSafeText } from "../theme/urdu-text";

/**
 * Quiet institutional endorsement for home / splash.
 * Always shows the full ILO lockup (emblem + English wordmark).
 */
export function IloEndorsement({
  compact = false,
  align = "center",
}: {
  compact?: boolean;
  align?: "center" | "start";
}) {
  const locale = useLocaleStore((state) => state.locale);
  const rtl = isRTL(locale);
  const textAlign = align === "center" ? "center" : rtl ? "right" : "left";
  const lockupHeight = compact ? 48 : 64;
  const lockupWidth = Math.round(lockupHeight * (642 / 360));

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${t(locale, "ilo.supportedBy")}. ${t(locale, "ilo.name")}`}
      style={{
        alignItems: align === "center" ? "center" : rtl ? "flex-end" : "flex-start",
        gap: compact ? 8 : 10,
        paddingTop: compact ? 12 : 16,
        paddingBottom: compact ? 4 : 8,
      }}
    >
      <Image
        source={ILO_LOCKUP}
        accessible={false}
        accessibilityIgnoresInvertColors
        resizeMode="contain"
        style={{ width: lockupWidth, height: lockupHeight }}
      />
      <Text
        style={{
          color: semanticColors.textSecondary,
          fontFamily: rtl ? fontFamily.urduUi : fontFamily.ui,
          textAlign,
          maxWidth: 300,
          ...(rtl
            ? urduSafeText(compact ? 13 : 14, "ui")
            : { fontSize: compact ? 13 : 14, lineHeight: compact ? 18 : 20 }),
        }}
      >
        {t(locale, "ilo.supportedBy")}
      </Text>
    </View>
  );
}
