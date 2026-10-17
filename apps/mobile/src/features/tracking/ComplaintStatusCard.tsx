import { Ionicons } from "@expo/vector-icons";
import type { Complaint } from "@kapas/domain";
import { t, type MessageKey } from "@kapas/localization";
import { Pressable, Text, View } from "react-native";

import { StatusPill } from "../../components/ui-primitives";
import { isolateComplaintId, isRTL } from "../../i18n/rtl";
import { useLocaleStore } from "../../stores/localeStore";
import { fontFamily, mobileType, radiusUsage, semanticColors } from "../../theme/tokens";

import { CaseProgressStrip } from "./CaseProgressStrip";
import {
  complaintLocation,
  complaintProgress,
  complaintStatusTone,
  complaintWorkerStatusKey,
  formatComplaintDate,
  latestComplaintDate,
} from "./complaintPresentation";

interface Props {
  complaint: Complaint;
  onPress: () => void;
}

export function ComplaintStatusCard({ complaint, onPress }: Props) {
  const locale = useLocaleStore((s) => s.locale);
  const family = isRTL(locale) ? fontFamily.urduUi : fontFamily.ui;
  const strongFamily = isRTL(locale) ? fontFamily.urduSemibold : fontFamily.uiSemibold;
  const align = isRTL(locale) ? "right" : "left";
  const location = complaintLocation(complaint);
  const locationIsLtr = /[A-Za-z]/.test(location);
  const updatedLabel = `${t(locale, "complaints.updated")} · ${formatComplaintDate(latestComplaintDate(complaint), locale)}`;
  const tone = complaintStatusTone(complaint);
  const isDanger = complaint.incident?.currentDanger;
  const accentColor = isDanger
    ? semanticColors.critical
    : tone === "success"
      ? semanticColors.success
      : tone === "offline"
        ? semanticColors.textSecondary
        : semanticColors.actionPrimary;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${t(locale, `category.${complaint.categoryCode}` as MessageKey)}, ${t(locale, complaintWorkerStatusKey(complaint) as MessageKey)}, ${complaint.trackingId}`}
      style={({ pressed }) => ({
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: isDanger ? "#FCA5A5" : semanticColors.borderEssential,
        borderRadius: radiusUsage.mobileCard,
        padding: 14,
        gap: 12,
        shadowColor: "#1E2923",
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View style={{ flexDirection: isRTL(locale) ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <View style={{ flexDirection: isRTL(locale) ? "row-reverse" : "row", alignItems: "center", gap: 10, flex: 1 }}>
          <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: isDanger ? "#FEE2E2" : "#EBF5F0", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="document-text" size={22} color={isDanger ? semanticColors.critical : "#0E6847"} />
          </View>
          <View style={{ flex: 1, gap: 2, alignItems: isRTL(locale) ? "flex-end" : "flex-start" }}>
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.88} style={{ color: semanticColors.textPrimary, fontSize: 17, lineHeight: isRTL(locale) ? 29 : 24, fontFamily: strongFamily, textAlign: align, writingDirection: isRTL(locale) ? "rtl" : "ltr" }}>{t(locale, `category.${complaint.categoryCode}` as MessageKey)}</Text>
            <View style={{ backgroundColor: "#F1F5F9", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: isRTL(locale) ? "flex-end" : "flex-start" }}>
              <Text style={{ color: semanticColors.textSecondary, fontSize: 12, lineHeight: 16, fontFamily: fontFamily.uiSemibold, writingDirection: "ltr" }}>{isolateComplaintId(complaint.trackingId)}</Text>
            </View>
          </View>
        </View>
        <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: "#F3EFE0", borderWidth: 1, borderColor: "#E5E0D0", alignItems: "center", justifyContent: "center" }}>
          <Ionicons name={isRTL(locale) ? "chevron-back" : "chevron-forward"} size={18} color="#1E2923" />
        </View>
      </View>

      <View style={{ flexDirection: isRTL(locale) ? "row-reverse" : "row", alignItems: "center" }}>
        <StatusPill label={complaint.overdue ? t(locale, "complaints.overdue") : t(locale, complaintWorkerStatusKey(complaint) as MessageKey)} tone={tone} />
      </View>

      <View style={{ backgroundColor: "#F8FAFC", borderRadius: 10, borderWidth: 1, borderColor: "#E2E8F0", paddingHorizontal: 8, paddingTop: 10, paddingBottom: 4 }}>
        <CaseProgressStrip current={complaintProgress(complaint.status)} />
      </View>

      <View style={{ borderTopWidth: 1, borderTopColor: semanticColors.border, paddingTop: 10, gap: 7 }}>
        {location ? (
          <View style={{ flexDirection: isRTL(locale) ? "row-reverse" : "row", alignItems: "center", gap: 7 }}>
            <Ionicons name="location-outline" size={17} color={accentColor} />
            <Text numberOfLines={1} ellipsizeMode="tail" style={{ flex: 1, color: semanticColors.textPrimary, fontSize: mobileType.caption.size, lineHeight: mobileType.caption.line, fontFamily: locationIsLtr ? fontFamily.ui : family, textAlign: locationIsLtr ? "left" : align, writingDirection: locationIsLtr ? "ltr" : isRTL(locale) ? "rtl" : "ltr" }}>{location}</Text>
          </View>
        ) : null}
        <View style={{ flexDirection: isRTL(locale) ? "row-reverse" : "row", alignItems: "center", gap: 7 }}>
          <Ionicons name="time-outline" size={17} color={semanticColors.textSecondary} />
          <Text numberOfLines={1} ellipsizeMode="tail" style={{ flex: 1, color: semanticColors.textSecondary, fontSize: mobileType.caption.size, lineHeight: mobileType.caption.line, fontFamily: family, textAlign: align, writingDirection: isRTL(locale) ? "rtl" : "ltr" }}>{updatedLabel}</Text>
        </View>
      </View>
    </Pressable>
  );
}
