import { Ionicons } from "@expo/vector-icons";
import { formatComplaintReferenceDisplay } from "@kapas/domain";
import { t, type MessageKey } from "@kapas/localization";
import { Pressable, Text, View } from "react-native";

import { StatusPill } from "../../components/ui-primitives";
import { isRTL } from "../../i18n/rtl";
import type { TrackedComplaint } from "../../services/workerApi";
import { useLocaleStore } from "../../stores/localeStore";
import { fontFamily, mobileType, radiusUsage, semanticColors } from "../../theme/tokens";

import { CaseListProgressBar } from "./CaseListProgressBar";
import { categoryIconFor } from "./categoryPresentation";
import {
  complaintLocation,
  complaintNeedsAttention,
  complaintStatusTone,
  complaintWorkerStatusKey,
  formatComplaintDate,
  latestComplaintDate,
} from "./complaintPresentation";

interface Props {
  complaint: TrackedComplaint;
  onPress: () => void;
}

export function ComplaintStatusCard({ complaint, onPress }: Props) {
  const locale = useLocaleStore((s) => s.locale);
  const rtl = isRTL(locale);
  const family = rtl ? fontFamily.urduUi : fontFamily.ui;
  const strongFamily = rtl ? fontFamily.urduSemibold : fontFamily.uiSemibold;
  const align = rtl ? "right" : "left";
  const direction = rtl ? "rtl" : "ltr";
  const location = complaintLocation(complaint);
  const locationIsLtr = /[A-Za-z]/.test(location);
  const updatedShort = formatComplaintDate(latestComplaintDate(complaint), locale);
  const tone = complaintStatusTone(complaint);
  const needsAttention = complaintNeedsAttention(complaint);
  const reference = formatComplaintReferenceDisplay(complaint.referenceNumber);
  const categoryIcon = categoryIconFor(complaint.categoryCode);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${t(locale, `category.${complaint.categoryCode}` as MessageKey)}, ${t(locale, complaintWorkerStatusKey(complaint) as MessageKey)}, ${reference}`}
      style={({ pressed }) => ({
        backgroundColor: semanticColors.surface,
        borderWidth: 1,
        borderStartWidth: needsAttention ? 4 : 1,
        borderColor: needsAttention ? semanticColors.warning : semanticColors.border,
        borderStartColor: needsAttention ? semanticColors.critical : semanticColors.border,
        borderRadius: radiusUsage.mobileCard,
        padding: 14,
        gap: 10,
        opacity: pressed ? 0.92 : 1,
        shadowColor: "#17231E",
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      })}
    >
      <View style={{ direction: "ltr", gap: 10 }}>
        <View style={{ direction: "ltr", flexDirection: rtl ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 13,
              backgroundColor: semanticColors.chipCountSurface,
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Ionicons name={categoryIcon} size={22} color={semanticColors.actionPrimary} />
          </View>

          <View style={{ flex: 1, gap: 4, minWidth: 0 }}>
            <Text
              numberOfLines={2}
              style={{
                color: semanticColors.textPrimary,
                fontSize: mobileType.body.size,
                lineHeight: mobileType.body.line,
                fontFamily: strongFamily,
                textAlign: align,
                writingDirection: direction,
              }}
            >
              {t(locale, `category.${complaint.categoryCode}` as MessageKey)}
            </Text>
            <Text
              numberOfLines={1}
              accessibilityLabel={reference.replace(/-/g, " ")}
              style={{
                color: semanticColors.textSecondary,
                fontSize: mobileType.caption.size,
                lineHeight: mobileType.caption.line,
                fontFamily: fontFamily.reference,
                writingDirection: "ltr",
                textAlign: rtl ? "right" : "left",
              }}
            >
              {reference}
            </Text>
          </View>

          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              backgroundColor: semanticColors.surfaceMuted,
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Ionicons name={rtl ? "chevron-back" : "chevron-forward"} size={17} color={semanticColors.actionPrimary} />
          </View>
        </View>

        <View
          style={{
            direction: "ltr",
            flexDirection: rtl ? "row-reverse" : "row",
            alignItems: "center",
            justifyContent: "flex-start",
            gap: 8,
          }}
        >
          <StatusPill
            label={
              complaint.overdue
                ? t(locale, "complaints.overdue")
                : t(locale, complaintWorkerStatusKey(complaint) as MessageKey)
            }
            tone={tone}
          />
          <View style={{ direction: "ltr", flexDirection: rtl ? "row-reverse" : "row", alignItems: "center", gap: 5, flexShrink: 1 }}>
            <Ionicons name="time-outline" size={14} color={semanticColors.textSecondary} />
            <Text
              numberOfLines={1}
              style={{
                color: semanticColors.textSecondary,
                fontSize: mobileType.caption.size,
                lineHeight: mobileType.caption.line,
                fontFamily: family,
                textAlign: align,
                writingDirection: direction,
              }}
            >
              {updatedShort}
            </Text>
          </View>
        </View>

        <CaseListProgressBar complaint={complaint} />

        {location ? (
          <View style={{ direction: "ltr", flexDirection: rtl ? "row-reverse" : "row", alignItems: "center", gap: 6 }}>
            <Ionicons name="location-outline" size={14} color={semanticColors.textSecondary} />
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{
                flex: 1,
                color: semanticColors.textSecondary,
                fontSize: mobileType.caption.size,
                lineHeight: mobileType.caption.line,
                fontFamily: locationIsLtr ? fontFamily.ui : family,
                textAlign: align,
                writingDirection: locationIsLtr ? "ltr" : direction,
              }}
            >
              {location}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
