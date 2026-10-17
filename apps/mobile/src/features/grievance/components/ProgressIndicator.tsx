import { t } from "@kapas/localization";
import { View } from "react-native";

import { isRTL } from "../../../i18n/rtl";
import { useLocaleStore } from "../../../stores/localeStore";
import { semanticColors } from "../../../theme/tokens";

export function ProgressIndicator({ ratio }: { ratio: number }) {
  const locale = useLocaleStore((s) => s.locale);
  const clamped = Math.min(1, Math.max(0.08, ratio));

  const activeSegments = Math.max(1, Math.ceil(clamped * 5));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={t(locale, "grievance.progress")}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      style={{ flexDirection: isRTL(locale) ? "row-reverse" : "row", gap: 6, width: "100%" }}
    >
      {[0, 1, 2, 3, 4].map((segment) => (
        <View key={segment} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: segment < activeSegments ? semanticColors.progressAccent : semanticColors.border }} />
      ))}
    </View>
  );
}
