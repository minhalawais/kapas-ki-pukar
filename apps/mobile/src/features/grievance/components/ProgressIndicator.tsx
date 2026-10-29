import { t, type MessageKey } from "@kapas/localization";
import { Text, View } from "react-native";

import { isRTL } from "../../../i18n/rtl";
import { useLocaleStore } from "../../../stores/localeStore";
import { fontFamily, mobileType, semanticColors } from "../../../theme/tokens";
import type { WorkflowSection } from "../types";

const sectionMessageKey: Record<WorkflowSection, MessageKey> = {
  intro: "grievance.section.intro",
  category: "grievance.section.category",
  details: "grievance.section.details",
  facts: "grievance.section.facts",
  safety: "grievance.section.safety",
  review: "grievance.section.review",
};

export function ProgressIndicator({
  ratio,
  section,
  stepIndex,
  stepTotal,
}: {
  ratio: number;
  section?: WorkflowSection;
  stepIndex?: number;
  stepTotal?: number;
}) {
  const locale = useLocaleStore((s) => s.locale);
  const rtl = isRTL(locale);
  const family = rtl ? fontFamily.urduUi : fontFamily.ui;
  const clamped = Math.min(1, Math.max(0.08, ratio));
  const activeSegments = Math.max(1, Math.ceil(clamped * 6));
  const sectionLabel = section ? t(locale, sectionMessageKey[section]) : null;

  return (
    <View style={{ gap: 6, width: "100%" }}>
      {sectionLabel || stepIndex !== undefined ? (
        <Text
          style={{
            color: semanticColors.textSecondary,
            fontSize: mobileType.caption.size,
            lineHeight: mobileType.caption.line,
            fontFamily: family,
            textAlign: rtl ? "right" : "left",
          }}
        >
          {stepIndex !== undefined && stepTotal !== undefined
            ? `${stepIndex + 1}/${stepTotal}`
            : null}
          {stepIndex !== undefined && sectionLabel ? " · " : null}
          {sectionLabel}
        </Text>
      ) : null}
      <View
        accessibilityRole="progressbar"
        accessibilityLabel={t(locale, "grievance.progress")}
        accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
        style={{ flexDirection: rtl ? "row-reverse" : "row", gap: 4, width: "100%" }}
      >
        {[0, 1, 2, 3, 4, 5].map((segment) => (
          <View
            key={segment}
            style={{
              flex: 1,
              height: 6,
              borderRadius: 3,
              backgroundColor:
                segment < activeSegments ? semanticColors.progressAccent : semanticColors.border,
            }}
          />
        ))}
      </View>
    </View>
  );
}
