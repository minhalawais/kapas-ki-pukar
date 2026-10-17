import { Ionicons } from "@expo/vector-icons";
import { t, type MessageKey } from "@kapas/localization";
import * as Haptics from "expo-haptics";
import { ImageBackground, Pressable, Text, View } from "react-native";

import CATEGORY_ATLAS from "../../../../assets/field-guide/issue-category-atlas.png";
import { isRTL } from "../../../i18n/rtl";
import { useLocaleStore } from "../../../stores/localeStore";
import { fontFamily, mobileType, semanticColors } from "../../../theme/tokens";
import type { QuestionNode } from "../types";

type Option = NonNullable<QuestionNode["options"]>[number];

const visualValues = ["WAG", "PES", "HSE", "HAR", "CHL", "FOL"];

export function CategoryFieldMap({ promptKey, options, selected, onSelect }: { promptKey: MessageKey; options: Option[]; selected?: string; onSelect: (value: string) => void }) {
  const locale = useLocaleStore((state) => state.locale);
  const rtl = isRTL(locale);
  const family = rtl ? fontFamily.urduUi : fontFamily.ui;
  const headingFamily = rtl ? fontFamily.urduBold : fontFamily.uiBold;
  const illustrated = visualValues.map((value) => options.find((option) => option.value === value)).filter((option): option is Option => Boolean(option));
  const supplemental = options.filter((option) => !visualValues.includes(option.value));

  const choose = (value: string) => {
    void Haptics.selectionAsync();
    onSelect(value);
  };

  return (
    <View style={{ gap: 14 }}>
      <Text style={{ color: semanticColors.textPrimary, fontSize: mobileType.question.size, lineHeight: mobileType.question.line, fontFamily: headingFamily, textAlign: rtl ? "right" : "left" }}>
        {t(locale, promptKey)}
      </Text>
      <Text style={{ color: semanticColors.textSecondary, fontSize: mobileType.caption.size, lineHeight: mobileType.caption.line, fontFamily: family, textAlign: rtl ? "right" : "left" }}>
        {t(locale, "grievance.category.visualHint")}
      </Text>

      <ImageBackground source={CATEGORY_ATLAS} resizeMode="stretch" accessible={false} style={{ width: "100%", aspectRatio: 932 / 1400, position: "relative" }}>
        {illustrated.map((option, index) => {
          const active = selected === option.value;
          const row = Math.floor(index / 2);
          const column = index % 2;
          return (
            <Pressable
              key={option.value}
              onPress={() => choose(option.value)}
              accessibilityRole="button"
              accessibilityLabel={t(locale, option.labelKey as MessageKey)}
              accessibilityState={{ selected: active }}
              style={({ pressed }) => ({
                position: "absolute",
                left: `${column * 50}%`,
                top: `${row * 33.333}%`,
                width: "50%",
                height: "33.333%",
                padding: 9,
                justifyContent: "flex-end",
                borderWidth: active ? 3 : 0,
                borderColor: semanticColors.actionPrimary,
                borderRadius: 8,
                opacity: pressed ? 0.82 : 1,
              })}
            >
              {active ? (
                <View style={{ position: "absolute", top: 10, ...(rtl ? { right: 10 } : { left: 10 }), width: 32, height: 32, borderRadius: 16, backgroundColor: semanticColors.actionPrimary, alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="checkmark" size={21} color={semanticColors.onPrimary} />
                </View>
              ) : null}
              <View style={{ minHeight: 42, flexDirection: rtl ? "row-reverse" : "row", alignItems: "center", gap: 6, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 6, backgroundColor: "rgba(247,243,232,0.94)" }}>
                <Text numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.78} style={{ flex: 1, color: semanticColors.textPrimary, fontSize: 18, lineHeight: 27, fontFamily: headingFamily, textAlign: rtl ? "right" : "left" }}>
                  {t(locale, option.labelKey as MessageKey)}
                </Text>
                <View style={{ width: 27, height: 27, borderRadius: 14, backgroundColor: semanticColors.actionPrimary, alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name={rtl ? "chevron-back" : "chevron-forward"} size={17} color={semanticColors.onPrimary} />
                </View>
              </View>
            </Pressable>
          );
        })}
      </ImageBackground>

      <View style={{ flexDirection: rtl ? "row-reverse" : "row", gap: 10 }}>
        {supplemental.map((option) => {
          const active = selected === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => choose(option.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={({ pressed }) => ({
                minHeight: 52,
                flex: 1,
                flexDirection: rtl ? "row-reverse" : "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                borderRadius: 8,
                borderWidth: active ? 2 : 1,
                borderColor: active ? semanticColors.actionPrimary : semanticColors.borderEssential,
                backgroundColor: active ? semanticColors.progressSurface : semanticColors.surface,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Ionicons name={option.value === "more" ? "grid-outline" : "ellipsis-horizontal"} size={20} color={semanticColors.actionPrimary} />
              <Text style={{ color: semanticColors.textPrimary, fontSize: mobileType.body.size, lineHeight: mobileType.body.line, fontFamily: headingFamily, textAlign: "center" }}>
                {t(locale, option.labelKey as MessageKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
