import { Ionicons } from "@expo/vector-icons";
import { t } from "@kapas/localization";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { isRTL } from "../../i18n/rtl";
import { useLocaleStore } from "../../stores/localeStore";
import { fontFamily, layout, mobileType, semanticColors } from "../../theme/tokens";

import { ComplaintListFilters } from "./ComplaintListFilters";
import type { ComplaintFilter } from "./complaintPresentation";

export const complaintsListGutter = layout.mobilePagePaddingX;

export function ComplaintsListChrome({
  filter,
  onFilterChange,
  counts,
  visibleCount,
  refreshLabel,
  onReport,
}: {
  filter: ComplaintFilter;
  onFilterChange: (next: ComplaintFilter) => void;
  counts: { all: number; attention: number; active: number; complete: number };
  visibleCount: number;
  refreshLabel: string | null;
  onReport: () => void;
}) {
  const locale = useLocaleStore((s) => s.locale);
  const rtl = isRTL(locale);
  const family = rtl ? fontFamily.urduUi : fontFamily.ui;
  const strongFamily = rtl ? fontFamily.urduSemibold : fontFamily.uiSemibold;
  const direction = rtl ? "rtl" : "ltr";

  return (
    <View
      style={{
        paddingHorizontal: complaintsListGutter,
        paddingTop: 10,
        paddingBottom: 12,
        gap: 10,
        backgroundColor: semanticColors.pageWorker,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: semanticColors.border,
      }}
    >
      <ComplaintListFilters filter={filter} onFilterChange={onFilterChange} counts={counts} />

      <View style={{ direction, gap: 10 }}>
        <View
          style={{
            direction: "ltr",
            flexDirection: rtl ? "row-reverse" : "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <View style={{ flex: 1, gap: 4, alignItems: rtl ? "flex-end" : "flex-start" }}>
            <Text
              style={{
                color: semanticColors.textPrimary,
                fontSize: mobileType.helper.size,
                lineHeight: mobileType.helper.line,
                fontFamily: strongFamily,
                textAlign: rtl ? "right" : "left",
                writingDirection: direction,
                width: "100%",
              }}
            >
              {t(locale, "complaints.yourCases")}
              {counts.all > 0 ? ` (${visibleCount})` : ""}
            </Text>
            {refreshLabel ? (
              <Text
                style={{
                  color: semanticColors.textSecondary,
                  fontSize: mobileType.caption.size,
                  lineHeight: mobileType.caption.line,
                  fontFamily: family,
                  textAlign: rtl ? "right" : "left",
                  writingDirection: direction,
                  width: "100%",
                }}
              >
                {refreshLabel}
              </Text>
            ) : null}
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={onReport}
            style={({ pressed }) => ({
              direction: "ltr",
              flexDirection: rtl ? "row-reverse" : "row",
              alignItems: "center",
              gap: 6,
              paddingVertical: 8,
              paddingHorizontal: 12,
              minHeight: 42,
              borderRadius: 14,
              backgroundColor: semanticColors.actionPrimary,
              borderWidth: 1,
              borderColor: semanticColors.actionPrimary,
              opacity: pressed ? 0.88 : 1,
            })}
          >
            <Ionicons name="mic-outline" size={18} color={semanticColors.onPrimary} />
            <Text
              style={{
                color: semanticColors.onPrimary,
                fontSize: mobileType.caption.size,
                lineHeight: mobileType.caption.line,
                fontFamily: strongFamily,
                writingDirection: direction,
                textAlign: rtl ? "right" : "left",
              }}
            >
              {t(locale, "complaints.reportShort")}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
