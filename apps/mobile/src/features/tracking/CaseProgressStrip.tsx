import { Ionicons } from "@expo/vector-icons";
import { t, type MessageKey } from "@kapas/localization";
import { Text, View, type DimensionValue } from "react-native";

import { isRTL } from "../../i18n/rtl";
import { useLocaleStore } from "../../stores/localeStore";
import { fontFamily, semanticColors } from "../../theme/tokens";

const stages = [
  { key: "complaints.progress.received", icon: "file-tray-full-outline" },
  { key: "complaints.progress.review", icon: "search-outline" },
  { key: "complaints.progress.action", icon: "construct-outline" },
  { key: "complaints.progress.outcome", icon: "checkmark-circle-outline" },
] as const;

export function CaseProgressStrip({ current }: { current: number }) {
  const locale = useLocaleStore((s) => s.locale);
  const rtl = isRTL(locale);
  const progressPercent: DimensionValue = `${Math.max(0, Math.min(75, (75 * current) / (stages.length - 1)))}%`;

  return (
    <View
      accessible
      accessibilityLabel={`${t(locale, "complaints.caseProgress")} ${current + 1} / ${stages.length}`}
      style={{ minHeight: 74, position: "relative", paddingTop: 2 }}
    >
      <View
        style={{
          position: "absolute",
          top: 17,
          left: "12.5%",
          right: "12.5%",
          height: 3,
          borderRadius: 2,
          backgroundColor: semanticColors.border,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 17,
          left: rtl ? undefined : "12.5%",
          right: rtl ? "12.5%" : undefined,
          width: progressPercent,
          height: 3,
          borderRadius: 2,
          backgroundColor: semanticColors.actionPrimary,
        }}
      />
      <View style={{ flexDirection: rtl ? "row-reverse" : "row", alignItems: "flex-start" }}>
        {stages.map((stage, stageIndex) => {
        const reached = stageIndex <= current;
        const active = stageIndex === current;
        return (
          <View key={stage.key} style={{ flex: 1, alignItems: "center", gap: 5 }}>
              <View
                style={{
                  width: active ? 34 : 28,
                  height: active ? 34 : 28,
                  borderRadius: active ? 17 : 14,
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 2,
                  backgroundColor: reached ? semanticColors.actionPrimary : semanticColors.surfaceMuted,
                  borderWidth: active ? 4 : 1,
                  borderColor: active ? semanticColors.progressAccent : reached ? semanticColors.actionPrimary : semanticColors.borderEssential,
                }}
              >
                <Ionicons name={stage.icon} size={active ? 16 : 14} color={reached ? semanticColors.onPrimary : semanticColors.textSecondary} />
            </View>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.82}
              style={{
                marginTop: 5,
                maxWidth: "100%",
                color: reached ? semanticColors.textPrimary : semanticColors.textSecondary,
                fontSize: 11,
                lineHeight: rtl ? 18 : 15,
                fontFamily: rtl ? fontFamily.urduSemibold : fontFamily.uiSemibold,
                textAlign: "center",
                writingDirection: rtl ? "rtl" : "ltr",
              }}
            >
              {t(locale, stage.key as MessageKey)}
            </Text>
          </View>
        );
        })}
      </View>
    </View>
  );
}
