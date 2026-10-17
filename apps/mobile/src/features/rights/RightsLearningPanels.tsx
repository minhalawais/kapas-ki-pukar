import { Ionicons } from "@expo/vector-icons";
import type { RightsTopic } from "@kapas/domain";
import { t, type MessageKey } from "@kapas/localization";
import * as Haptics from "expo-haptics";
import { Pressable, Text, View } from "react-native";

import { isRTL } from "../../i18n/rtl";
import { useLocaleStore } from "../../stores/localeStore";
import { fontFamily, mobileType, semanticColors } from "../../theme/tokens";

export function RightsEssentialFacts({ topic }: { topic: RightsTopic }) {
  const locale = useLocaleStore((state) => state.locale);
  const rtl = isRTL(locale);
  const family = rtl ? fontFamily.urduUi : fontFamily.ui;
  const strongFamily = rtl ? fontFamily.urduSemibold : fontFamily.uiSemibold;
  const align = rtl ? "right" : "left";

  return (
    <View style={{ backgroundColor: semanticColors.surfaceMuted, borderRadius: 8, padding: 14, gap: 9 }}>
      <Text style={{ color: semanticColors.textPrimary, fontSize: mobileType.answer.size, lineHeight: rtl ? 34 : mobileType.answer.line, fontFamily: strongFamily, textAlign: align }}>
        {t(locale, "rights.facts.title")}
      </Text>
      {topic.guidanceKeys.slice(0, 1).map((key, index) => (
        <View key={key} style={{ minHeight: 42, flexDirection: rtl ? "row-reverse" : "row", alignItems: "center", gap: 10 }}>
          <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: "#E2F0EA", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name={index === 0 ? "shield-checkmark" : "information-circle"} size={21} color={semanticColors.actionPrimary} />
          </View>
          <Text style={{ flex: 1, color: semanticColors.textPrimary, fontSize: mobileType.body.size, lineHeight: rtl ? 29 : mobileType.body.line, fontFamily: family, textAlign: align }}>
            {t(locale, key as MessageKey)}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function RightsLearningActions({ topic, onListen }: { topic: RightsTopic; onListen: () => void }) {
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
        {t(locale, topic.actionKeys[0] as MessageKey)}
      </Text>
      <View>
        <Pressable onPress={() => action(onListen)} accessibilityRole="button" accessibilityLabel={t(locale, "rights.actions.listen")} style={({ pressed }) => ({ width: "100%", minHeight: 52, borderRadius: 8, borderWidth: 1, borderColor: semanticColors.borderEssential, backgroundColor: semanticColors.surface, flexDirection: rtl ? "row-reverse" : "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 14, opacity: pressed ? 0.72 : 1 })}>
          <Ionicons name="volume-high" size={20} color={semanticColors.voiceActiveStrong} />
          <Text style={{ flexShrink: 1, color: semanticColors.voiceActiveStrong, fontSize: 14, lineHeight: rtl ? 24 : 19, fontFamily: strongFamily, textAlign: "center" }}>
            {t(locale, "rights.actions.listen")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
