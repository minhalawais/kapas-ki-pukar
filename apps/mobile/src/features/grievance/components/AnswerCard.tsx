import { Ionicons } from "@expo/vector-icons";
import { t, type MessageKey } from "@kapas/localization";
import * as Haptics from "expo-haptics";
import { type ComponentProps, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { isRTL } from "../../../i18n/rtl";
import { useLocaleStore } from "../../../stores/localeStore";
import { controlSize, fontFamily, mobileType, radiusUsage, semanticColors } from "../../../theme/tokens";

interface Props {
  labelKey?: MessageKey;
  label?: string;
  selected: boolean;
  onPress: () => void;
  icon?: ComponentProps<typeof Ionicons>["name"];
  tile?: boolean;
}

export function AnswerCard({ labelKey, label, selected, onPress, icon, tile = false }: Props) {
  const locale = useLocaleStore((s) => s.locale);
  const family = isRTL(locale) ? fontFamily.urduUi : fontFamily.ui;
  const resolved = label ?? (labelKey ? t(locale, labelKey) : "");

  return (
    <Pressable
      onPress={() => { void Haptics.selectionAsync(); onPress(); }}
      accessibilityRole="button"
      accessibilityLabel={resolved}
      accessibilityState={{ selected }}
      style={({ pressed }) => ({
        minHeight: tile ? 104 : controlSize.answerCardMinHeight,
        width: tile ? "48%" : "100%",
        borderRadius: radiusUsage.mobileAnswerCard,
        backgroundColor: semanticColors.surface,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? semanticColors.actionPrimary : semanticColors.borderEssential,
        padding: tile ? 14 : 16,
        justifyContent: "center",
        alignItems: tile ? "center" : undefined,
        gap: tile ? 8 : 0,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      {icon ? <Ionicons name={icon} size={tile ? 30 : 22} color={selected ? semanticColors.actionPrimary : semanticColors.voiceActiveStrong} /> : null}
      <Text
        style={{
          color: semanticColors.textPrimary,
          fontSize: mobileType.answer.size,
          lineHeight: mobileType.answer.line,
          fontFamily: isRTL(locale) ? fontFamily.urduSemibold : fontFamily.uiSemibold,
          textAlign: tile ? "center" : isRTL(locale) ? "right" : "left",
        }}
      >
        {resolved}
      </Text>
      {selected ? (
        <Text
          style={{
            marginTop: 8,
            color: semanticColors.actionPrimary,
            fontSize: mobileType.caption.size,
            lineHeight: mobileType.caption.line,
            fontFamily: family,
            textAlign: isRTL(locale) ? "right" : "left",
          }}
        >
          {t(locale, "a11y.selected")}
        </Text>
      ) : null}
    </Pressable>
  );
}

export function AnswerCardList({ children, grid = false }: { children: ReactNode; grid?: boolean }) {
  return <View style={{ gap: 12, flexDirection: grid ? "row" : undefined, flexWrap: grid ? "wrap" : undefined, justifyContent: grid ? "space-between" : undefined }}>{children}</View>;
}
