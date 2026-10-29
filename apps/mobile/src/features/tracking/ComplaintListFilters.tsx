import { t, type MessageKey } from "@kapas/localization";
import { Pressable, ScrollView, Text, View } from "react-native";

import { isRTL } from "../../i18n/rtl";
import { useLocaleStore } from "../../stores/localeStore";
import { fontFamily, mobileType, semanticColors } from "../../theme/tokens";

import type { ComplaintFilter } from "./complaintPresentation";

function filterLabel(locale: "en" | "ur", id: ComplaintFilter, count: number): string {
  const base = t(locale, `complaints.filter.${id}` as MessageKey);
  if (id === "attention" && count > 0) {
    return base;
  }
  return count > 0 ? `${base} (${count})` : base;
}

export function ComplaintListFilters({
  filter,
  onFilterChange,
  counts,
}: {
  filter: ComplaintFilter;
  onFilterChange: (next: ComplaintFilter) => void;
  counts: { all: number; attention: number; active: number; complete: number };
}) {
  const locale = useLocaleStore((s) => s.locale);
  const rtl = isRTL(locale);
  const strongFamily = rtl ? fontFamily.urduSemibold : fontFamily.uiSemibold;
  const items: { id: ComplaintFilter; count: number }[] = [
    { id: "all", count: counts.all },
    { id: "attention", count: counts.attention },
    { id: "active", count: counts.active },
    { id: "complete", count: counts.complete },
  ];

  const direction = rtl ? "rtl" : "ltr";

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="tablist"
      style={{ direction, marginHorizontal: -2 }}
      contentContainerStyle={{
        direction: "ltr",
        flexDirection: rtl ? "row-reverse" : "row",
        gap: 8,
        paddingVertical: 2,
        alignItems: "center",
        justifyContent: rtl ? "flex-start" : "flex-start",
      }}
    >
      {items.map((item) => {
        const selected = filter === item.id;
        const showAttentionDot = item.id === "attention" && item.count > 0 && !selected;
        return (
          <Pressable
            key={item.id}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onFilterChange(item.id)}
            style={({ pressed }) => ({
              flexGrow: 0,
              flexShrink: 0,
              alignSelf: "flex-start",
              minHeight: 40,
              paddingHorizontal: item.id === "attention" && item.count === 0 ? 10 : 15,
              borderRadius: 999,
              flexDirection: rtl ? "row-reverse" : "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: selected ? semanticColors.actionPrimary : semanticColors.surface,
              borderWidth: 1,
              borderColor: selected ? semanticColors.actionPrimary : semanticColors.borderEssential,
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <Text
              numberOfLines={1}
              style={{
                flexShrink: 0,
                color: selected ? semanticColors.onPrimary : semanticColors.textPrimary,
                fontSize: mobileType.caption.size,
                lineHeight: mobileType.caption.line,
                fontFamily: strongFamily,
                textAlign: rtl ? "right" : "left",
                writingDirection: direction,
              }}
            >
              {filterLabel(locale, item.id, item.count)}
            </Text>
            {showAttentionDot ? (
              <View
                style={{
                  minWidth: 18,
                  height: 18,
                  borderRadius: 9,
                  paddingHorizontal: 4,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: semanticColors.critical,
                }}
              >
                <Text
                  style={{
                    color: semanticColors.onPrimary,
                    fontSize: 11,
                    fontFamily: fontFamily.uiBold,
                    textAlign: "center",
                    writingDirection: "ltr",
                  }}
                >
                  {item.count}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
