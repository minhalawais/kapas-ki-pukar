import {
  simplifiedProgressStages,
  simplifiedStageIndex,
} from "@kapas/domain";
import { t } from "@kapas/localization";
import { Text, View, type DimensionValue } from "react-native";

import { isRTL } from "../../i18n/rtl";
import type { TrackedComplaint } from "../../services/workerApi";
import { useLocaleStore } from "../../stores/localeStore";
import { fontFamily, mobileType, semanticColors } from "../../theme/tokens";

import { caseStagePresentation } from "./caseProgressPresentation";
import { isComplaintComplete } from "./complaintPresentation";

export function CaseListProgressBar({ complaint }: { complaint: TrackedComplaint }) {
  const locale = useLocaleStore((s) => s.locale);
  const rtl = isRTL(locale);
  const family = rtl ? fontFamily.urduUi : fontFamily.ui;
  const stages = simplifiedProgressStages(complaint.actions);
  const current = simplifiedStageIndex(complaint.actions ?? [], complaint.status);
  const complete = isComplaintComplete(complaint);
  const fillRatio = complete ? 1 : (current + 0.35) / Math.max(stages.length, 1);
  const width: DimensionValue = `${Math.round(Math.min(1, fillRatio) * 100)}%`;
  const activeKind = stages[current]?.kind;
  const stageLabel =
    complete && activeKind
      ? t(locale, caseStagePresentation[activeKind].labelKey)
      : activeKind
        ? t(locale, caseStagePresentation[activeKind].labelKey)
        : null;

  return (
    <View
      accessible
      accessibilityLabel={t(locale, "complaints.caseProgress")}
      style={{ direction: "ltr", gap: 8, alignSelf: "stretch" }}
    >
      <View
        style={{
          height: 6,
          borderRadius: 3,
          backgroundColor: semanticColors.surfaceMuted,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            height: 6,
            width,
            borderRadius: 3,
            backgroundColor: complete ? semanticColors.success : semanticColors.actionPrimary,
            alignSelf: rtl ? "flex-end" : "flex-start",
          }}
        />
      </View>
      {stageLabel && !complete ? (
        <Text
          numberOfLines={1}
          style={{
            color: semanticColors.textSecondary,
            fontSize: mobileType.caption.size,
            lineHeight: mobileType.caption.line,
            fontFamily: family,
            textAlign: rtl ? "right" : "left",
            writingDirection: rtl ? "rtl" : "ltr",
            alignSelf: rtl ? "flex-end" : "flex-start",
          }}
        >
          {stageLabel}
        </Text>
      ) : null}
    </View>
  );
}
