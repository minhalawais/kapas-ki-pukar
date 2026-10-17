import type { RightsProvince } from "@kapas/domain";
import { t, type MessageKey } from "@kapas/localization";
import { Pressable, Text, View } from "react-native";

import { isRTL } from "../../i18n/rtl";
import { useLocaleStore } from "../../stores/localeStore";
import { fontFamily, mobileType, semanticColors } from "../../theme/tokens";

const allChoices: Array<RightsProvince | null> = [null, "Punjab", "Sindh"];

export function RightsProvinceSelector({ value, onChange, includeGeneral = true }: { value: RightsProvince | null; onChange: (value: RightsProvince | null) => void; includeGeneral?: boolean }) {
  const locale = useLocaleStore((state) => state.locale);
  const rtl = isRTL(locale);
  const choices = includeGeneral ? allChoices : allChoices.slice(1);

  return (
    <View accessibilityRole="radiogroup" style={{ flexDirection: rtl ? "row-reverse" : "row", borderWidth: 1, borderColor: semanticColors.borderEssential, borderRadius: 8, padding: 3, backgroundColor: semanticColors.surface }}>
      {choices.map((choice) => {
        const selected = choice === value;
        const key = choice ?? "general";
        const label = t(locale, `rights.area.${key}` as MessageKey);
        return (
          <Pressable
            key={key}
            onPress={() => onChange(choice)}
            accessibilityRole="radio"
            accessibilityLabel={label}
            accessibilityState={{ selected }}
            style={({ pressed }) => ({ flex: 1, minHeight: 44, borderRadius: 6, alignItems: "center", justifyContent: "center", paddingHorizontal: 6, backgroundColor: selected ? semanticColors.actionPrimary : "transparent", opacity: pressed ? 0.75 : 1 })}
          >
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={{ color: selected ? semanticColors.onPrimary : semanticColors.textPrimary, fontSize: mobileType.caption.size, lineHeight: rtl ? 23 : mobileType.caption.line, fontFamily: rtl ? fontFamily.urduSemibold : fontFamily.uiSemibold, textAlign: "center" }}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
