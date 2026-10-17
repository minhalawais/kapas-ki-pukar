import { Ionicons } from "@expo/vector-icons";
import type { Evidence } from "@kapas/domain";
import { t } from "@kapas/localization";
import { Pressable, Text, View } from "react-native";

import { isRTL } from "../../../i18n/rtl";
import { useLocaleStore } from "../../../stores/localeStore";
import { fontFamily, mobileType, radiusUsage, semanticColors } from "../../../theme/tokens";

interface Props {
  item: Evidence;
  onRemove: () => void;
}

export function EvidenceCard({ item, onRemove }: Props) {
  const locale = useLocaleStore((s) => s.locale);
  const family = isRTL(locale) ? fontFamily.urduUi : fontFamily.ui;
  const align = isRTL(locale) ? "right" : "left";

  return (
    <View
      style={{
        backgroundColor: semanticColors.surface,
        borderWidth: 1,
        borderColor: semanticColors.border,
        borderRadius: radiusUsage.mobileCard,
        padding: 16,
        gap: 8,
        flexDirection: isRTL(locale) ? "row-reverse" : "row",
        alignItems: "center",
      }}
    >
      <Ionicons name={item.kind === "photo" ? "image" : "document-text"} size={28} color={semanticColors.voiceActiveStrong} />
      <Text
        style={{
          flex: 1,
          color: semanticColors.textPrimary,
          fontSize: mobileType.body.size,
          lineHeight: mobileType.body.line,
          fontFamily: family,
          textAlign: align,
        }}
      >
        {item.fileName}
      </Text>
      <Pressable
        onPress={onRemove}
        accessibilityRole="button"
        accessibilityLabel={t(locale, "grievance.evidence.remove")}
        style={({ pressed }) => ({
          width: 48,
          height: 48,
          justifyContent: "center",
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Ionicons name="trash-outline" size={22} color={semanticColors.critical} />
      </Pressable>
    </View>
  );
}
