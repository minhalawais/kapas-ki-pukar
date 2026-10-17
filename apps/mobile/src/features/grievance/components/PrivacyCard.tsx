import { Ionicons } from "@expo/vector-icons";
import { t, type MessageKey } from "@kapas/localization";
import { Pressable, Text, View } from "react-native";

import { isRTL } from "../../../i18n/rtl";
import { useLocaleStore } from "../../../stores/localeStore";
import { controlSize, fontFamily, mobileType, radiusUsage, semanticColors } from "../../../theme/tokens";

interface Props {
  labelKey: MessageKey;
  helperKey: MessageKey;
  selected: boolean;
  onPress: () => void;
}

export function PrivacyCard({ labelKey, helperKey, selected, onPress }: Props) {
  const locale = useLocaleStore((s) => s.locale);
  const family = isRTL(locale) ? fontFamily.urduUi : fontFamily.ui;
  const align = isRTL(locale) ? "right" : "left";
  const label = t(locale, labelKey);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={({ pressed }) => ({
        minHeight: controlSize.answerCardMinHeight,
        borderRadius: radiusUsage.mobileAnswerCard,
        backgroundColor: semanticColors.surface,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? semanticColors.actionPrimary : semanticColors.borderEssential,
        padding: 16,
        gap: 8,
        flexDirection: isRTL(locale) ? "row-reverse" : "row",
        alignItems: "center",
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View accessibilityElementsHidden importantForAccessibility="no" style={{ width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: selected ? semanticColors.actionPrimary : semanticColors.surfaceMuted }}>
        <Ionicons name={labelKey === "privacy.ANON" ? "eye-off" : labelKey === "privacy.CONF" ? "lock-closed" : "person"} size={22} color={selected ? semanticColors.onPrimary : semanticColors.actionPrimary} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text
          style={{
            color: semanticColors.textPrimary,
            fontSize: mobileType.answer.size,
            lineHeight: mobileType.answer.line,
            fontFamily: isRTL(locale) ? fontFamily.urduSemibold : fontFamily.uiSemibold,
            textAlign: align,
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            color: semanticColors.textSecondary,
            fontSize: mobileType.helper.size,
            lineHeight: mobileType.helper.line,
            fontFamily: family,
            textAlign: align,
          }}
        >
          {t(locale, helperKey)}
        </Text>
      </View>
      {selected ? <Ionicons name="checkmark-circle" size={24} color={semanticColors.actionPrimary} /> : null}
    </Pressable>
  );
}
