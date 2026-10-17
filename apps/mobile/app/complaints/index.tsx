import { Ionicons } from "@expo/vector-icons";
import { t } from "@kapas/localization";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { LightTopBar } from "../../src/components/navigation/light-top-bar";
import { PrimaryCta } from "../../src/components/primary-cta";
import { ScreenNotice } from "../../src/components/screen-notice";
import { ScreenShell } from "../../src/components/screen-shell";
import { IconBadge } from "../../src/components/ui-primitives";
import {
  complaintNeedsAttention,
  filterComplaints,
  isComplaintComplete,
  type ComplaintFilter,
} from "../../src/features/tracking/complaintPresentation";
import { ComplaintStatusCard } from "../../src/features/tracking/ComplaintStatusCard";
import { useMyComplaints } from "../../src/hooks/use-my-complaints";
import { useAutoPromptId } from "../../src/hooks/use-prompt-playback";
import { isRTL } from "../../src/i18n/rtl";
import { useLocaleStore } from "../../src/stores/localeStore";
import { fontFamily, mobileType, semanticColors } from "../../src/theme/tokens";

export default function ComplaintsScreen() {
  const router = useRouter();
  const locale = useLocaleStore((s) => s.locale);
  const query = useMyComplaints();
  const family = isRTL(locale) ? fontFamily.urduUi : fontFamily.ui;
  const strongFamily = isRTL(locale) ? fontFamily.urduSemibold : fontFamily.uiSemibold;
  const headingFamily = isRTL(locale) ? fontFamily.urduBold : fontFamily.uiBold;
  const rtl = isRTL(locale);
  const [filter, setFilter] = useState<ComplaintFilter>("all");
  useAutoPromptId("SC-complaints");
  const complaints = query.data ?? [];
  const counts = useMemo(() => ({
    active: complaints.filter((item) => !isComplaintComplete(item)).length,
    attention: complaints.filter(complaintNeedsAttention).length,
    complete: complaints.filter(isComplaintComplete).length,
  }), [complaints]);
  const visibleComplaints = useMemo(() => {
    const list = filterComplaints(complaints, filter);
    return [...list].sort((a, b) => {
      const aAttention = complaintNeedsAttention(a) ? 1 : 0;
      const bAttention = complaintNeedsAttention(b) ? 1 : 0;
      if (aAttention !== bAttention) return bAttention - aAttention;
      return b.submittedAt.localeCompare(a.submittedAt);
    });
  }, [complaints, filter]);
  const filters: { id: ComplaintFilter; label: string }[] = [
    { id: "all", label: t(locale, "complaints.filter.all") },
    { id: "attention", label: t(locale, "complaints.filter.attention") },
    { id: "active", label: t(locale, "complaints.filter.active") },
    { id: "complete", label: t(locale, "complaints.filter.complete") },
  ];
  const dashboardStats = [
    { value: counts.active, label: t(locale, "complaints.activeCount") },
    { value: counts.attention, label: t(locale, "complaints.needsAttention") },
    { value: counts.complete, label: t(locale, "complaints.completed") },
  ];

  return (
    <ScreenShell header={<LightTopBar titleKey="complaints.title" subtitleKey="complaints.headerHelp" icon="shield-checkmark-outline" />} scroll>
      {query.isLoading ? (
        <ActivityIndicator
          color={semanticColors.actionPrimary}
          accessibilityLabel={t(locale, "common.loading")}
        />
      ) : null}
      {query.isError ? <ScreenNotice messageKey="common.error" tone="error" /> : null}
      {query.isSuccess && complaints.length === 0 ? (
        <View style={{ gap: 16, alignItems: "center", paddingTop: 28 }}>
          <IconBadge icon="file-tray-outline" tone="teal" size={80} />
          <ScreenNotice messageKey="complaints.empty" />
          <Text
            style={{
              color: semanticColors.textSecondary,
              fontSize: mobileType.helper.size,
              lineHeight: mobileType.helper.line,
              fontFamily: family,
              textAlign: isRTL(locale) ? "right" : "left",
            }}
          >
            {t(locale, "complaints.nextStep")}
          </Text>
          <View style={{ width: "100%" }}><PrimaryCta labelKey="home.reportProblem" icon="mic" onPress={() => router.push("/grievance")} /></View>
        </View>
      ) : null}
      {complaints.length > 0 ? (
        <>
          <View style={{ overflow: "hidden", borderRadius: 8, backgroundColor: semanticColors.institutionalAnchor }}>
            <View style={{ padding: 18, gap: 7 }}>
              <View style={{ flexDirection: rtl ? "row-reverse" : "row", alignItems: "center", gap: 10 }}>
                <View style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.14)", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="shield-checkmark-outline" size={25} color={semanticColors.onInstitutional} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: semanticColors.onInstitutional, fontSize: mobileType.answer.size, lineHeight: mobileType.answer.line, fontFamily: headingFamily, textAlign: rtl ? "right" : "left" }}>{t(locale, "complaints.overview")}</Text>
                  <Text style={{ color: "#D8E8DF", fontSize: mobileType.caption.size, lineHeight: mobileType.caption.line, fontFamily: family, textAlign: rtl ? "right" : "left" }}>{t(locale, "complaints.overviewHelp")}</Text>
                </View>
              </View>
            </View>
            <View style={{ flexDirection: rtl ? "row-reverse" : "row", backgroundColor: "rgba(255,255,255,0.09)", paddingVertical: 12 }}>
              {dashboardStats.map((item, index) => (
                <View key={item.label} style={{ flex: 1, alignItems: "center", borderStartWidth: index > 0 ? 1 : 0, borderStartColor: "rgba(255,255,255,0.2)", paddingHorizontal: 4 }}>
                  <Text style={{ color: semanticColors.onInstitutional, fontSize: 22, lineHeight: 28, fontFamily: fontFamily.uiBold }}>{item.value}</Text>
                  <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.76} style={{ color: "#D8E8DF", fontSize: 12, lineHeight: 17, fontFamily: family, textAlign: "center" }}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View accessibilityRole="tablist" style={{ flexDirection: rtl ? "row-reverse" : "row", borderWidth: 1, borderColor: semanticColors.borderEssential, borderRadius: 8, overflow: "hidden", backgroundColor: semanticColors.surface }}>
            {filters.map((item) => {
              const selected = filter === item.id;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  onPress={() => setFilter(item.id)}
                  style={({ pressed }) => ({ flex: 1, minHeight: 48, alignItems: "center", justifyContent: "center", paddingHorizontal: 3, backgroundColor: selected ? semanticColors.actionPrimary : semanticColors.surface, opacity: pressed ? 0.82 : 1 })}
                >
                  <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={{ color: selected ? semanticColors.onPrimary : semanticColors.textPrimary, fontSize: mobileType.caption.size, lineHeight: mobileType.caption.line, fontFamily: strongFamily, textAlign: "center" }}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={{ flexDirection: rtl ? "row-reverse" : "row", alignItems: "center", gap: 8, marginTop: 4, marginBottom: 2 }}>
            <Text style={{ color: semanticColors.textPrimary, fontSize: mobileType.answer.size, lineHeight: mobileType.answer.line, fontFamily: headingFamily, textAlign: rtl ? "right" : "left" }}>
              {t(locale, "complaints.yourCases")}
            </Text>
            <View style={{ backgroundColor: "#EBF5F0", paddingHorizontal: 10, paddingVertical: 2, borderRadius: 12 }}>
              <Text style={{ color: "#0E6847", fontSize: 13, fontFamily: fontFamily.uiBold }}>
                {visibleComplaints.length}
              </Text>
            </View>
          </View>
        </>
      ) : null}
      <View style={{ gap: 12 }}>
        {visibleComplaints.map((complaint) => (
          <ComplaintStatusCard
            key={complaint.trackingId}
            complaint={complaint}
            onPress={() => router.push(`/complaints/${complaint.trackingId}`)}
          />
        ))}
        {complaints.length > 0 && visibleComplaints.length === 0 ? (
          <View style={{ alignItems: "center", gap: 10, paddingVertical: 28 }}>
            <IconBadge icon="checkmark-done-outline" tone="green" size={64} />
            <Text style={{ color: semanticColors.textSecondary, fontSize: mobileType.helper.size, lineHeight: mobileType.helper.line, fontFamily: family, textAlign: "center" }}>{t(locale, "complaints.filteredEmpty")}</Text>
          </View>
        ) : null}
      </View>
    </ScreenShell>
  );
}
