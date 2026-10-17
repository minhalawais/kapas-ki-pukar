import { Ionicons } from "@expo/vector-icons";
import { t, type MessageKey } from "@kapas/localization";
import * as Haptics from "expo-haptics";
import { Pressable, Text, View } from "react-native";

import { isRTL } from "../../i18n/rtl";
import { useLocaleStore } from "../../stores/localeStore";
import { fontFamily, mobileType, semanticColors } from "../../theme/tokens";

const facts: Array<{ icon: keyof typeof Ionicons.glyphMap; key: MessageKey }> = [
  { icon: "time-outline", key: "rights.wages.fact.full" },
  { icon: "scale-outline", key: "rights.wages.fact.weight" },
  { icon: "remove-circle-outline", key: "rights.wages.fact.deductions" },
];

export function WageRightsFacts() {
  const locale = useLocaleStore((state) => state.locale);
  const rtl = isRTL(locale);
  const family = rtl ? fontFamily.urduUi : fontFamily.ui;
  const strongFamily = rtl ? fontFamily.urduSemibold : fontFamily.uiSemibold;
  const align = rtl ? "right" : "left";

  return (
    <View style={{ backgroundColor: semanticColors.surfaceMuted, borderRadius: 8, padding: 14, gap: 9 }}>
      <Text style={{ color: semanticColors.textPrimary, fontSize: mobileType.answer.size, lineHeight: rtl ? 34 : mobileType.answer.line, fontFamily: strongFamily, textAlign: align }}>
        {t(locale, "rights.wages.facts.title")}
      </Text>
      {facts.map((fact) => (
        <View key={fact.key} style={{ minHeight: 40, flexDirection: rtl ? "row-reverse" : "row", alignItems: "center", gap: 10 }}>
          <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: "#E2F0EA", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name={fact.icon} size={21} color={semanticColors.actionPrimary} />
          </View>
          <Text style={{ flex: 1, color: semanticColors.textPrimary, fontSize: mobileType.body.size, lineHeight: rtl ? 29 : mobileType.body.line, fontFamily: family, textAlign: align }}>
            {t(locale, fact.key)}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function WageRightsActions({ onListenCalculation }: { onListenCalculation: () => void }) {
  const locale = useLocaleStore((state) => state.locale);
  const rtl = isRTL(locale);
  const family = rtl ? fontFamily.urduUi : fontFamily.ui;
  const strongFamily = rtl ? fontFamily.urduSemibold : fontFamily.uiSemibold;
  const align = rtl ? "right" : "left";

  const action = (handler: () => void) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handler();
  };

  return (
    <View style={{ backgroundColor: semanticColors.aiSurface, borderRadius: 8, padding: 14, gap: 10 }}>
        <Text style={{ color: semanticColors.textPrimary, fontSize: mobileType.answer.size, lineHeight: rtl ? 34 : mobileType.answer.line, fontFamily: strongFamily, textAlign: align }}>
          {t(locale, "rights.section.action")}
        </Text>
        <Text style={{ color: semanticColors.textPrimary, fontSize: mobileType.body.size, lineHeight: rtl ? 29 : mobileType.body.line, fontFamily: family, textAlign: align }}>
          {t(locale, "rights.wages.action.remember")}
        </Text>
        <View>
          <Pressable
            onPress={() => action(onListenCalculation)}
            accessibilityRole="button"
            accessibilityLabel={t(locale, "rights.wages.listenCalculation")}
            style={({ pressed }) => ({ width: "100%", minHeight: 52, borderRadius: 8, borderWidth: 1, borderColor: semanticColors.borderEssential, backgroundColor: semanticColors.surface, flexDirection: rtl ? "row-reverse" : "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 14, opacity: pressed ? 0.72 : 1 })}
          >
            <Ionicons name="volume-high" size={20} color={semanticColors.voiceActiveStrong} />
            <Text style={{ flexShrink: 1, color: semanticColors.voiceActiveStrong, fontSize: 14, lineHeight: rtl ? 24 : 19, fontFamily: strongFamily, textAlign: "center" }}>
              {t(locale, "rights.wages.listenCalculation")}
            </Text>
          </Pressable>
        </View>
    </View>
  );
}
