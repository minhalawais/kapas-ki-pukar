import { Ionicons } from "@expo/vector-icons";
import { t } from "@kapas/localization";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { isRTL } from "../../i18n/rtl";
import { useLocaleStore } from "../../stores/localeStore";
import { fontFamily, layout, mobileType, semanticColors } from "../../theme/tokens";

export function ComplaintsPageHeader() {
  const router = useRouter();
  const locale = useLocaleStore((s) => s.locale);
  const rtl = isRTL(locale);
  const direction = rtl ? "rtl" : "ltr";
  const titleFamily = rtl ? fontFamily.urduBold : fontFamily.uiBold;
  const bodyFamily = rtl ? fontFamily.urduUi : fontFamily.ui;

  return (
    <View
      style={{
        backgroundColor: semanticColors.surface,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: semanticColors.border,
        paddingHorizontal: layout.mobilePagePaddingX,
        paddingTop: 10,
        paddingBottom: 14,
      }}
    >
      <View style={{ direction: "ltr", flexDirection: rtl ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t(locale, "common.back")}
          style={({ pressed }) => ({
            width: 40,
            height: 40,
            borderRadius: 8,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: semanticColors.surfaceMuted,
            borderWidth: 1,
            borderColor: semanticColors.border,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Ionicons name={rtl ? "chevron-forward" : "chevron-back"} size={22} color={semanticColors.textPrimary} />
        </Pressable>

        <View style={{ flex: 1, gap: 4, alignItems: rtl ? "flex-end" : "flex-start" }}>
          <View style={{ direction: "ltr", flexDirection: rtl ? "row-reverse" : "row", alignItems: "center", gap: 8, alignSelf: rtl ? "flex-end" : "flex-start" }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: semanticColors.chipCountSurface,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="shield-checkmark-outline" size={20} color={semanticColors.actionPrimary} />
            </View>
            <Text
              style={{
                color: semanticColors.textPrimary,
                fontSize: mobileType.answer.size,
                lineHeight: mobileType.answer.line,
                fontFamily: titleFamily,
                textAlign: rtl ? "right" : "left",
                writingDirection: direction,
              }}
            >
              {t(locale, "complaints.title")}
            </Text>
          </View>
          <Text
            style={{
              color: semanticColors.textSecondary,
              fontSize: mobileType.caption.size,
              lineHeight: mobileType.caption.line,
              fontFamily: bodyFamily,
              textAlign: rtl ? "right" : "left",
              writingDirection: direction,
              width: "100%",
            }}
          >
            {t(locale, "complaints.headerHelp")}
          </Text>
        </View>
      </View>
    </View>
  );
}
