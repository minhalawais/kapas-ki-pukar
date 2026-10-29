import { Ionicons } from "@expo/vector-icons";
import { simplifiedProgressStages, simplifiedStageIndex } from "@kapas/domain";
import { t } from "@kapas/localization";
import { Text, View, type DimensionValue } from "react-native";

import { isRTL } from "../../i18n/rtl";
import type { TrackedComplaint } from "../../services/workerApi";
import { useLocaleStore } from "../../stores/localeStore";
import { fontFamily, mobileType, semanticColors } from "../../theme/tokens";

import { caseStagePresentation } from "./caseProgressPresentation";

type Variant = "card" | "detail";

const nodeSize: Record<Variant, { idle: number; reached: number; active: number; iconIdle: number; iconActive: number }> = {
  card: { idle: 24, reached: 26, active: 32, iconIdle: 12, iconActive: 15 },
  detail: { idle: 28, reached: 30, active: 38, iconIdle: 14, iconActive: 17 },
};

export function CaseProgressStrip({
  complaint,
  variant = "detail",
}: {
  complaint: TrackedComplaint;
  variant?: Variant;
}) {
  const locale = useLocaleStore((s) => s.locale);
  const rtl = isRTL(locale);
  const family = rtl ? fontFamily.urduUi : fontFamily.ui;
  const strongFamily = rtl ? fontFamily.urduSemibold : fontFamily.uiSemibold;
  const stages = simplifiedProgressStages(complaint.actions);
  const current = simplifiedStageIndex(complaint.actions ?? [], complaint.status);
  const closed = complaint.status === "Closed";
  const sizes = nodeSize[variant];
  const trackInset = 6;
  const trackSpan = 100 - trackInset * 2;
  const fillRatio = current / Math.max(stages.length - 1, 1);
  const progressWidth: DimensionValue = `${Math.max(0, Math.min(trackSpan, fillRatio * trackSpan))}%`;
  const trackTop = sizes.active / 2 - 2;
  const activeKind = stages[current]?.kind;
  const activePresentation = activeKind ? caseStagePresentation[activeKind] : null;
  const showStepLabels = variant === "detail";
  const labelKeyForStage = (kind: keyof typeof caseStagePresentation) =>
    showStepLabels
      ? caseStagePresentation[kind].shortLabelKey
      : caseStagePresentation[kind].labelKey;

  return (
    <View
      accessible
      accessibilityLabel={`${t(locale, "complaints.caseProgress")} ${current + 1} / ${stages.length}`}
      style={{
        gap: variant === "card" ? 8 : 9,
        paddingVertical: variant === "card" ? 8 : 10,
        paddingHorizontal: variant === "card" ? 8 : 9,
        borderRadius: variant === "card" ? 12 : 14,
        backgroundColor: variant === "card" ? semanticColors.surfaceMuted : semanticColors.surface,
        borderWidth: 1,
        borderColor: semanticColors.border,
      }}
    >
      <View style={{ position: "relative", minHeight: sizes.active + (showStepLabels ? 36 : 0) }}>
        <View
          style={{
            position: "absolute",
            top: trackTop,
            left: `${trackInset}%`,
            right: `${trackInset}%`,
            height: 4,
            borderRadius: 2,
            backgroundColor: semanticColors.border,
          }}
        />
        <View
          style={{
            position: "absolute",
            top: trackTop,
            left: rtl ? undefined : `${trackInset}%`,
            right: rtl ? `${trackInset}%` : undefined,
            width: progressWidth,
            height: 4,
            borderRadius: 2,
            backgroundColor: semanticColors.actionPrimary,
          }}
        />
        <View style={{ flexDirection: rtl ? "row-reverse" : "row", alignItems: "flex-start" }}>
          {stages.map((stage, stageIndex) => {
            const presentation = caseStagePresentation[stage.kind];
            const reached = closed ? stageIndex <= current : stageIndex < current;
            const active = !closed && stageIndex === current;
            const upcoming = !reached && !active;
            const diameter = active ? sizes.active : reached ? sizes.reached : sizes.idle;
            const iconName = reached ? "checkmark" : presentation.icon;
            const iconSize = active ? sizes.iconActive : sizes.iconIdle;

            return (
              <View key={`${stage.kind}-${stageIndex}`} style={{ flex: 1, alignItems: "center", gap: 6 }}>
                <View
                  style={{
                    width: sizes.active,
                    height: sizes.active,
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 2,
                  }}
                >
                  <View
                    style={{
                      width: diameter,
                      height: diameter,
                      borderRadius: diameter / 2,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: reached
                        ? semanticColors.success
                        : active
                          ? semanticColors.actionPrimary
                          : semanticColors.surface,
                      borderWidth: active ? 3 : upcoming ? 2 : 0,
                      borderColor: active
                        ? semanticColors.progressAccent
                        : upcoming
                          ? semanticColors.borderEssential
                          : semanticColors.success,
                      shadowColor: active ? semanticColors.actionPrimary : "transparent",
                      shadowOpacity: active ? 0.22 : 0,
                      shadowRadius: active ? 6 : 0,
                      shadowOffset: { width: 0, height: 2 },
                      elevation: active ? 3 : 0,
                    }}
                  >
                    <Ionicons
                      name={iconName}
                      size={iconSize}
                      color={
                        reached || active ? semanticColors.onPrimary : semanticColors.textSecondary
                      }
                    />
                  </View>
                </View>
                {showStepLabels ? (
                  <Text
                    numberOfLines={2}
                    style={{
                      maxWidth: "100%",
                      paddingHorizontal: 1,
                      color: active
                        ? semanticColors.textPrimary
                        : reached
                          ? semanticColors.textSecondary
                          : semanticColors.textSecondary,
                      fontSize: mobileType.caption.size,
                      lineHeight: mobileType.caption.line,
                      fontFamily: active ? strongFamily : family,
                      textAlign: "center",
                      writingDirection: rtl ? "rtl" : "ltr",
                      opacity: upcoming ? 0.72 : 1,
                    }}
                  >
                    {t(locale, labelKeyForStage(stage.kind))}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </View>
      </View>

      {variant === "card" && activePresentation ? (
        <View
          style={{
            paddingTop: 2,
            borderTopWidth: 1,
            borderTopColor: semanticColors.border,
          }}
        >
          <Text
            numberOfLines={2}
            style={{
              color: semanticColors.textPrimary,
              fontSize: mobileType.helper.size,
              lineHeight: mobileType.helper.line,
              fontFamily: strongFamily,
              textAlign: rtl ? "right" : "left",
              writingDirection: rtl ? "rtl" : "ltr",
            }}
          >
            {t(locale, activePresentation.labelKey)}
          </Text>
        </View>
      ) : null}

      {variant === "detail" && activePresentation && !closed ? (
        <View
          style={{
            flexDirection: rtl ? "row-reverse" : "row",
            alignItems: "center",
            gap: 8,
            paddingHorizontal: 2,
            paddingTop: 2,
          }}
        >
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: semanticColors.chipCountSurface,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name={activePresentation.icon} size={15} color={semanticColors.actionPrimary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: semanticColors.textPrimary,
                fontSize: mobileType.helper.size,
                lineHeight: mobileType.helper.line,
                fontFamily: strongFamily,
                textAlign: rtl ? "right" : "left",
                writingDirection: rtl ? "rtl" : "ltr",
              }}
            >
              {t(locale, activePresentation.labelKey)}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

/** @deprecated Use CaseProgressStrip with variant="card" */
export function CaseStatusStrip({ complaint }: { complaint: TrackedComplaint }) {
  return <CaseProgressStrip complaint={complaint} variant="card" />;
}
