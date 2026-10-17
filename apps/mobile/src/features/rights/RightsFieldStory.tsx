import { Ionicons } from "@expo/vector-icons";
import type { RightsTopic } from "@kapas/domain";
import { t, type MessageKey } from "@kapas/localization";
import { Image, Text, View, type ImageSourcePropType } from "react-native";

import CHILD_STORY from "../../../assets/field-guide/child-labour-rights-story.png";
import COMPENSATION_STORY from "../../../assets/field-guide/compensation-rights-story.png";
import CONTRACT_STORY from "../../../assets/field-guide/contractor-terms-rights-story.png";
import FACILITIES_STORY from "../../../assets/field-guide/facilities-rights-story.png";
import FORCED_STORY from "../../../assets/field-guide/forced-labour-rights-story.png";
import EQUALITY_STORY from "../../../assets/field-guide/harassment-equality-rights-story.png";
import HEAT_STORY from "../../../assets/field-guide/heat-hours-rights-story.png";
import INJURY_STORY from "../../../assets/field-guide/injury-safety-rights-story.png";
import MIGRANT_STORY from "../../../assets/field-guide/migrant-tenant-rights-story.png";
import PESTICIDE_STORY from "../../../assets/field-guide/pesticide-rights-story.png";
import MATERNITY_STORY from "../../../assets/field-guide/women-maternity-rights-story.png";
import VOICE_STORY from "../../../assets/field-guide/worker-voice-rights-story.png";
import { isRTL } from "../../i18n/rtl";
import { useLocaleStore } from "../../stores/localeStore";
import { fontFamily, mobileType, semanticColors } from "../../theme/tokens";
import { urduSafeText } from "../../theme/urdu-text";

const storySources: Record<string, ImageSourcePropType> = {
  pesticide: PESTICIDE_STORY,
  "heat-hours": HEAT_STORY,
  "injury-safety": INJURY_STORY,
  "harassment-equality": EQUALITY_STORY,
  "child-labour": CHILD_STORY,
  "forced-labour": FORCED_STORY,
  facilities: FACILITIES_STORY,
  "contractor-terms": CONTRACT_STORY,
  "women-maternity": MATERNITY_STORY,
  "worker-voice": VOICE_STORY,
  compensation: COMPENSATION_STORY,
  "migrant-tenant": MIGRANT_STORY,
};

const storyKeyPrefixes: Record<string, string> = {
  pesticide: "pesticide",
  "heat-hours": "heat",
  "injury-safety": "injury",
  "harassment-equality": "equality",
  "child-labour": "child",
  "forced-labour": "forced",
  facilities: "facilities",
  "contractor-terms": "contract",
  "women-maternity": "maternity",
  "worker-voice": "voice",
  compensation: "compensation",
  "migrant-tenant": "migrant",
};

export function hasFieldStory(topicId: string): boolean {
  return Boolean(storySources[topicId]);
}

export function RightsFieldStory({ topic }: { topic: RightsTopic }) {
  const locale = useLocaleStore((state) => state.locale);
  const rtl = isRTL(locale);
  const source = storySources[topic.id];
  const prefix = storyKeyPrefixes[topic.id];
  const family = rtl ? fontFamily.urduUi : fontFamily.ui;
  const headingFamily = rtl ? fontFamily.urduBold : fontFamily.uiBold;
  const align = rtl ? "right" : "left";

  if (!source || !prefix) {
    return null;
  }

  return (
    <View>
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, gap: 8, overflow: "visible" }}>
        <Text
          style={{
            color: semanticColors.actionPrimary,
            fontFamily: headingFamily,
            textAlign: align,
            ...(rtl ? urduSafeText(30, "heading") : { fontSize: 31, lineHeight: 39 }),
          }}
        >
          {t(locale, topic.titleKey as MessageKey)}
        </Text>
        <Text
          style={{
            color: semanticColors.textSecondary,
            fontFamily: family,
            textAlign: align,
            ...(rtl ? urduSafeText(mobileType.body.size, "ui") : { fontSize: mobileType.body.size, lineHeight: mobileType.body.line }),
          }}
        >
          {t(locale, topic.bodyKey as MessageKey)}
        </Text>
      </View>

      <Image source={source} resizeMode="contain" accessible={false} style={{ width: "100%", aspectRatio: 2 / 3 }} />

      <View style={{ marginHorizontal: 20, marginTop: 12, gap: 10 }}>
        {[1, 2, 3].map((step, index) => (
          <View key={step} style={{ minHeight: 96, flexDirection: rtl ? "row-reverse" : "row", alignItems: "flex-start", gap: 12, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: "#D7D1BF", backgroundColor: semanticColors.surface }}>
            <View style={{ width: 30, height: 30, borderRadius: 5, backgroundColor: index === 0 ? semanticColors.actionPrimary : semanticColors.voiceActiveStrong, alignItems: "center", justifyContent: "center", marginTop: 2 }}>
              <Text style={{ color: semanticColors.onPrimary, fontSize: 17, lineHeight: 22, fontFamily: fontFamily.uiBold }}>{step}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <Text style={{ color: semanticColors.actionPrimary, fontSize: 17, lineHeight: rtl ? 31 : 22, fontFamily: headingFamily, textAlign: align }}>
                {t(locale, `rights.${prefix}.story.${step}.title` as MessageKey)}
              </Text>
              <Text style={{ color: semanticColors.textSecondary, fontSize: 13, lineHeight: rtl ? 23 : 18, fontFamily: family, textAlign: align }}>
                {t(locale, `rights.${prefix}.story.${step}.body` as MessageKey)}
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
            {t(locale, "rights.story.remember")}
          </Text>
          <Text style={{ color: semanticColors.textPrimary, fontSize: 14, lineHeight: rtl ? 25 : 20, fontFamily: family, textAlign: align }}>
            {t(locale, topic.guidanceKeys[1] as MessageKey)}
          </Text>
        </View>
      </View>
    </View>
  );
}
