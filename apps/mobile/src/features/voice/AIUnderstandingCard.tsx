import type { AIAnalysis } from "@kapas/domain";
import { t } from "@kapas/localization";
import { Text, View } from "react-native";

import { isRTL } from "../../i18n/rtl";
import { useLocaleStore } from "../../stores/localeStore";
import { fontFamily, mobileType, radiusUsage, semanticColors } from "../../theme/tokens";

export function AIUnderstandingCard({ analysis }: { analysis: AIAnalysis | null | undefined }) {
  const locale = useLocaleStore((s) => s.locale);
  const family = isRTL(locale) ? fontFamily.urduUi : fontFamily.ui;
  const align = isRTL(locale) ? "right" : "left";
  const failed = Boolean(analysis?.failed);
  const summary = locale === "ur" ? analysis?.summaryUr : analysis?.summaryEn;

  return (
    <View
      style={{
        backgroundColor: semanticColors.aiSurface,
        borderRadius: radiusUsage.mobileCard,
        padding: 16,
        gap: 8,
        borderWidth: 1,
        borderColor: semanticColors.voiceActive,
      }}
    >
      <Text
        style={{
          color: semanticColors.voiceActiveStrong,
          fontSize: mobileType.caption.size,
          lineHeight: mobileType.caption.line,
          fontFamily: family,
          textAlign: align,
          fontWeight: "600",
        }}
      >
        {t(locale, "grievance.ai.summaryLabel")}
      </Text>
      <Text
        style={{
          color: semanticColors.textPrimary,
          fontSize: mobileType.body.size,
          lineHeight: mobileType.body.line,
          fontFamily: family,
          textAlign: align,
        }}
      >
        {failed || !summary ? t(locale, "grievance.ai.unavailable") : summary}
      </Text>
    </View>
  );
}
