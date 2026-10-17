import { Ionicons } from "@expo/vector-icons";
import { t, type MessageKey } from "@kapas/localization";
import { Image, Text, View } from "react-native";

import WAGE_STORY from "../../../assets/field-guide/wage-rights-story-v2.png";
import { isRTL } from "../../i18n/rtl";
import { useLocaleStore } from "../../stores/localeStore";
import { fontFamily, mobileType, semanticColors } from "../../theme/tokens";
import { urduSafeText } from "../../theme/urdu-text";

const steps: { titleKey: MessageKey; bodyKey: MessageKey }[] = [
  { titleKey: "rights.wages.story.agree.title", bodyKey: "rights.wages.story.agree.body" },
  { titleKey: "rights.wages.story.compare.title", bodyKey: "rights.wages.story.compare.body" },
  { titleKey: "rights.wages.story.report.title", bodyKey: "rights.wages.story.report.body" },
];

export function WageRightsStory() {
  const locale = useLocaleStore((state) => state.locale);
  const rtl = isRTL(locale);
  const family = rtl ? fontFamily.urduUi : fontFamily.ui;
  const headingFamily = rtl ? fontFamily.urduBold : fontFamily.uiBold;
  const align = rtl ? "right" : "left";

  return (
    <View style={{ gap: 0 }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, gap: 8, overflow: "visible" }}>
        <Text
          style={{
            color: semanticColors.actionPrimary,
            fontFamily: headingFamily,
            textAlign: align,
            ...(rtl ? urduSafeText(32, "heading") : { fontSize: 34, lineHeight: 42 }),
          }}
        >
          {t(locale, "rights.wages.title")}
        </Text>
        <Text
          style={{
            color: semanticColors.textSecondary,
            fontFamily: family,
            textAlign: align,
            ...(rtl ? urduSafeText(mobileType.body.size, "ui") : { fontSize: mobileType.body.size, lineHeight: mobileType.body.line }),
          }}
        >
          {t(locale, "rights.wages.story.intro")}
        </Text>
      </View>

      <Image source={WAGE_STORY} resizeMode="contain" accessible={false} style={{ width: "100%", aspectRatio: 1023 / 1537 }} />

      <View style={{ marginHorizontal: 20, marginTop: 12, gap: 10 }}>
        {steps.map((step, index) => (
          <View key={step.titleKey} style={{ minHeight: 96, flexDirection: rtl ? "row-reverse" : "row", alignItems: "flex-start", gap: 12, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: "#D7D1BF", backgroundColor: semanticColors.surface }}>
            <View style={{ width: 30, height: 30, borderRadius: 5, backgroundColor: index === 0 ? semanticColors.actionPrimary : semanticColors.voiceActiveStrong, alignItems: "center", justifyContent: "center", marginTop: 2 }}>
              <Text style={{ color: semanticColors.onPrimary, fontSize: 17, lineHeight: 22, fontFamily: fontFamily.uiBold }}>{index + 1}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <Text style={{ color: semanticColors.actionPrimary, fontSize: 18, lineHeight: rtl ? 32 : 23, fontFamily: headingFamily, textAlign: align }}>
                {t(locale, step.titleKey)}
              </Text>
              <Text style={{ color: semanticColors.textSecondary, fontSize: 13, lineHeight: rtl ? 23 : 18, fontFamily: family, textAlign: align }}>
                {t(locale, step.bodyKey)}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={{ marginHorizontal: 20, marginTop: 14, padding: 14, minHeight: 70, flexDirection: rtl ? "row-reverse" : "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: "#BDD2C4", borderRadius: 8, backgroundColor: "#F3F7EF" }}>
        <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: semanticColors.actionPrimary, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="shield-checkmark" size={22} color={semanticColors.onPrimary} />
        </View>
        <View style={{ flex: 1, gap: 1 }}>
          <Text style={{ color: semanticColors.actionPrimary, fontSize: 15, lineHeight: rtl ? 27 : 20, fontFamily: headingFamily, textAlign: align }}>
            {t(locale, "rights.wages.story.noteLabel")}
          </Text>
          <Text style={{ color: semanticColors.textPrimary, fontSize: 14, lineHeight: rtl ? 25 : 20, fontFamily: family, textAlign: align }}>
            {t(locale, "rights.wages.story.proof")}
          </Text>
        </View>
      </View>
    </View>
  );
}
