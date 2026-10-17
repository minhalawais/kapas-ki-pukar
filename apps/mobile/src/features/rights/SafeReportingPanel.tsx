import { Ionicons } from "@expo/vector-icons";
import { t } from "@kapas/localization";
import * as Haptics from "expo-haptics";
import { Pressable, Text, View } from "react-native";

import { isRTL } from "../../i18n/rtl";
import { useLocaleStore } from "../../stores/localeStore";
import { fontFamily, semanticColors } from "../../theme/tokens";

export function SafeReportingPanel({ onReport }: { onReport: () => void }) {
  const locale = useLocaleStore((state) => state.locale);
  const rtl = isRTL(locale);

  return (
    <Pressable
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onReport();
      }}
      accessibilityRole="button"
      accessibilityLabel={t(locale, "rights.reporting.cta")}
      style={({ pressed }) => ({
        minHeight: 72,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: semanticColors.actionPrimary,
        backgroundColor: semanticColors.surface,
        flexDirection: rtl ? "row-reverse" : "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        paddingHorizontal: 18,
        opacity: pressed ? 0.84 : 1,
      })}
    >
      <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: semanticColors.actionPrimary, alignItems: "center", justifyContent: "center" }}>
        <Ionicons name="mic" size={29} color={semanticColors.onPrimary} />
      </View>
      <Text style={{ color: semanticColors.actionPrimary, fontSize: 22, lineHeight: rtl ? 36 : 28, fontFamily: rtl ? fontFamily.urduBold : fontFamily.uiBold, textAlign: "center" }}>
        {t(locale, "rights.reporting.cta")}
      </Text>
    </Pressable>
  );
}
