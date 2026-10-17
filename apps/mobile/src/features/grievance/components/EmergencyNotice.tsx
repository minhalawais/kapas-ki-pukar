import { Ionicons } from "@expo/vector-icons";
import { t } from "@kapas/localization";
import { Text, View } from "react-native";

import { isRTL } from "../../../i18n/rtl";
import { useLocaleStore } from "../../../stores/localeStore";
import { fontFamily, mobileType, radiusUsage, semanticColors } from "../../../theme/tokens";

export function EmergencyNotice() {
  const locale = useLocaleStore((s) => s.locale);
  const family = isRTL(locale) ? fontFamily.urduUi : fontFamily.ui;
  const align = isRTL(locale) ? "right" : "left";

  return (
    <View
      accessibilityRole="alert"
      style={{
        backgroundColor: semanticColors.criticalSurface,
        borderWidth: 1,
        borderColor: semanticColors.critical,
        borderRadius: radiusUsage.mobileCard,
        padding: 16,
        gap: 8,
      }}
    >
      <Ionicons name="warning" size={34} color={semanticColors.critical} style={{ alignSelf: isRTL(locale) ? "flex-end" : "flex-start" }} />
      <Text
        style={{
          color: semanticColors.critical,
          fontSize: mobileType.caption.size,
          lineHeight: mobileType.caption.line,
          fontFamily: isRTL(locale) ? fontFamily.urduBold : fontFamily.uiBold,
          textAlign: align,
        }}
      >
        {t(locale, "grievance.danger.noticeTitle")}
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
        {t(locale, "grievance.danger.noticeBody")}
      </Text>
    </View>
  );
}
