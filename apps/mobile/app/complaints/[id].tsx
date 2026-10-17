import { Ionicons } from "@expo/vector-icons";
import { isWorkerVisibleAction, workerFacingActionLabelKey, type Complaint, type WorkerFeedback } from "@kapas/domain";
import { t, type MessageKey } from "@kapas/localization";
import { complaintService } from "@kapas/mock-services";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { type ComponentProps, type ReactNode } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { LightTopBar } from "../../src/components/navigation/light-top-bar";
import { PrimaryCta } from "../../src/components/primary-cta";
import { ScreenNotice } from "../../src/components/screen-notice";
import { ScreenShell } from "../../src/components/screen-shell";
import { StatusPill } from "../../src/components/ui-primitives";
import { getWorkflowNode } from "../../src/features/grievance/workflows";
import { CaseProgressStrip } from "../../src/features/tracking/CaseProgressStrip";
import {
  complaintLocation,
  complaintProgress,
  complaintStatusTone,
  complaintWorkerNextStepKey,
  complaintWorkerStatusKey,
  formatComplaintDate,
} from "../../src/features/tracking/complaintPresentation";
import { useAutoPromptId } from "../../src/hooks/use-prompt-playback";
import { isRTL } from "../../src/i18n/rtl";
import { expoSpeechService } from "../../src/services/expoSpeechService";
import { useLocaleStore } from "../../src/stores/localeStore";
import { fontFamily, mobileType, semanticColors } from "../../src/theme/tokens";

type IconName = ComponentProps<typeof Ionicons>["name"];

function affectedLabelKey(complaint: Complaint): MessageKey {
  const value = complaint.affectedRange ?? complaint.incident.othersAffected;
  if (value === "2-5") return "range.2-5";
  if (value === "6-20") return "range.6-20";
  if (value === "more-than-20") return "range.20+";
  if (value === "not-sure") return "range.unsure";
  return "complaints.affectedOnlyMe";
}

function answerRows(complaint: Complaint, locale: "en" | "ur") {
  return Object.entries(complaint.incident.structuredAnswers).flatMap(([key, raw]) => {
    const node = getWorkflowNode(key);
    if (!node || !["details", "facts", "safety"].includes(node.section)) return [];
    const values = Array.isArray(raw) ? raw : typeof raw === "string" ? [raw] : [];
    if (values.length === 0) return [];
    const labels = values.map((value) => {
      const option = node.options?.find((item) => item.value === value);
      return option ? t(locale, option.labelKey as MessageKey) : value;
    });
    return [{ key, prompt: t(locale, node.promptKey as MessageKey), answer: labels.join("، ") }];
  });
}

function SectionHeading({ icon, children, rtl, family }: { icon: IconName; children: ReactNode; rtl: boolean; family: string }) {
  return (
    <View style={{ flexDirection: rtl ? "row-reverse" : "row", alignItems: "center", gap: 9 }}>
      <Ionicons name={icon} size={21} color={semanticColors.actionPrimary} />
      <Text style={{ flex: 1, color: semanticColors.textPrimary, fontSize: mobileType.answer.size, lineHeight: mobileType.answer.line, fontFamily: family, textAlign: rtl ? "right" : "left" }}>{children}</Text>
    </View>
  );
}

function FactRow({ icon, label, value, rtl, family, last = false }: { icon: IconName; label: string; value: string; rtl: boolean; family: string; last?: boolean }) {
  return (
    <View style={{ flexDirection: rtl ? "row-reverse" : "row", alignItems: "center", gap: 11, minHeight: 56, borderBottomWidth: last ? 0 : 1, borderBottomColor: semanticColors.border }}>
      <View style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: semanticColors.aiSurface, alignItems: "center", justifyContent: "center" }}>
        <Ionicons name={icon} size={18} color={semanticColors.voiceActiveStrong} />
      </View>
      <View style={{ flex: 1, gap: 1 }}>
        <Text style={{ color: semanticColors.textSecondary, fontSize: mobileType.caption.size, lineHeight: mobileType.caption.line, fontFamily: family, textAlign: rtl ? "right" : "left" }}>{label}</Text>
        <Text style={{ color: semanticColors.textPrimary, fontSize: mobileType.helper.size, lineHeight: mobileType.helper.line, fontFamily: family, textAlign: rtl ? "right" : "left" }}>{value}</Text>
      </View>
    </View>
  );
}

export default function ComplaintDetailScreen() {
  const locale = useLocaleStore((s) => s.locale);
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === "string" ? params.id : "";
  const query = useQuery({ queryKey: ["complaint", id], queryFn: () => complaintService.getById(id), enabled: id.length > 0 });
  const feedback = useMutation({
    mutationFn: (outcome: WorkerFeedback["outcome"]) => complaintService.submitWorkerFeedback(id, { outcome, submittedAt: new Date().toISOString() }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["complaint", id] });
      await queryClient.invalidateQueries({ queryKey: ["my-complaints"] });
    },
  });
  const complaint = query.data;
  const rtl = isRTL(locale);
  const family = rtl ? fontFamily.urduUi : fontFamily.ui;
  const strongFamily = rtl ? fontFamily.urduSemibold : fontFamily.uiSemibold;
  const headingFamily = rtl ? fontFamily.urduBold : fontFamily.uiBold;
  const align = rtl ? "right" : "left";
  const canFeedback = complaint && !complaint.workerFeedback && ["Proposed Resolution", "Resolved", "Closed"].includes(complaint.status);
  const summary = locale === "ur" ? (complaint?.ai?.summaryUr ?? complaint?.incident.description) : (complaint?.ai?.summaryEn ?? complaint?.incident.description);
  const summaryIsLtr = Boolean(summary && /[A-Za-z]/.test(summary));
  const details = complaint ? answerRows(complaint, locale) : [];
  const workerActions = complaint?.actions.filter(isWorkerVisibleAction) ?? [];
  useAutoPromptId("SC-complaint-detail");

  return (
    <ScreenShell
      header={<LightTopBar titleKey="complaints.detail" subtitle={id} icon="document-text-outline" />}
      scroll
      contentStyle={{ gap: 18 }}
    >
      {query.isLoading ? <ActivityIndicator color={semanticColors.actionPrimary} accessibilityLabel={t(locale, "common.loading")} /> : null}
      {query.isError ? <ScreenNotice messageKey="common.error" tone="error" /> : null}
      {query.isSuccess && !complaint ? <ScreenNotice messageKey="complaints.empty" /> : null}
      {complaint ? (
        <>
          <View style={{ padding: 17, gap: 14, backgroundColor: semanticColors.surface, borderWidth: 1, borderColor: semanticColors.borderEssential, borderRadius: 8 }}>
            <View style={{ flexDirection: rtl ? "row-reverse" : "row", alignItems: "flex-start", gap: 12 }}>
              <View style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: semanticColors.progressSurface, alignItems: "center", justifyContent: "center" }}><Ionicons name="document-text-outline" size={25} color={semanticColors.warningText} /></View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={{ color: semanticColors.textPrimary, fontSize: mobileType.answer.size, lineHeight: mobileType.answer.line, fontFamily: headingFamily, textAlign: align }}>{t(locale, `category.${complaint.categoryCode}` as MessageKey)}</Text>
                <Text style={{ color: semanticColors.textSecondary, fontSize: mobileType.reference.size, lineHeight: mobileType.reference.line, fontFamily: fontFamily.uiSemibold, textAlign: align, writingDirection: "ltr" }}>{complaint.trackingId}</Text>
              </View>
            </View>
            <View style={{ alignItems: rtl ? "flex-end" : "flex-start" }}><StatusPill label={complaint.overdue ? t(locale, "complaints.overdue") : t(locale, complaintWorkerStatusKey(complaint) as MessageKey)} tone={complaintStatusTone(complaint)} icon={complaint.overdue ? "alert-circle" : "time-outline"} /></View>
            <CaseProgressStrip current={complaintProgress(complaint.status)} />
          </View>

          <View style={{ flexDirection: rtl ? "row-reverse" : "row", gap: 12, padding: 15, borderRadius: 8, backgroundColor: complaintStatusTone(complaint) === "critical" ? semanticColors.criticalSurface : semanticColors.aiSurface }}>
            <Ionicons name={complaintStatusTone(complaint) === "critical" ? "alert-circle" : "navigate-circle"} size={25} color={complaintStatusTone(complaint) === "critical" ? semanticColors.critical : semanticColors.voiceActiveStrong} />
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={{ color: semanticColors.textPrimary, fontSize: mobileType.caption.size, lineHeight: mobileType.caption.line, fontFamily: strongFamily, textAlign: align }}>{t(locale, "complaints.nextAction")}</Text>
              <Text style={{ color: semanticColors.textPrimary, fontSize: mobileType.body.size, lineHeight: mobileType.body.line, fontFamily: family, textAlign: align }}>{t(locale, (complaint.overdue ? "complaints.next.overdue" : complaintWorkerNextStepKey(complaint)) as MessageKey)}</Text>
            </View>
          </View>

          <View style={{ gap: 10 }}>
            <SectionHeading icon="information-circle-outline" rtl={rtl} family={headingFamily}>{t(locale, "complaints.caseFacts")}</SectionHeading>
            <View style={{ paddingHorizontal: 14, backgroundColor: semanticColors.surface, borderWidth: 1, borderColor: semanticColors.border, borderRadius: 8 }}>
              <FactRow icon="calendar-outline" label={t(locale, "complaints.reportedOn")} value={formatComplaintDate(complaint.submittedAt, locale)} rtl={rtl} family={family} />
              <FactRow icon="location-outline" label={t(locale, "complaints.location")} value={complaintLocation(complaint) || t(locale, "complaints.notAvailable")} rtl={rtl} family={family} />
              <FactRow icon="people-outline" label={t(locale, "complaints.affected")} value={t(locale, affectedLabelKey(complaint))} rtl={rtl} family={family} />
              <FactRow icon="lock-closed-outline" label={t(locale, "complaints.privacy")} value={t(locale, `privacy.${complaint.privacyMode}` as MessageKey)} rtl={rtl} family={family} />
              <FactRow icon="flag-outline" label={t(locale, "complaints.expectedBy")} value={`${formatComplaintDate(complaint.dueAt, locale)}${complaint.overdue ? ` · ${t(locale, "complaints.overdue")}` : ""}`} rtl={rtl} family={family} last />
            </View>
          </View>

          <View style={{ gap: 10 }}>
            <SectionHeading icon="chatbox-ellipses-outline" rtl={rtl} family={headingFamily}>{t(locale, "complaints.whatYouToldUs")}</SectionHeading>
            <View style={{ ...(rtl ? { borderRightWidth: 4, paddingRight: 13 } : { borderLeftWidth: 4, paddingLeft: 13 }), borderColor: semanticColors.progressAccent, gap: 6 }}>
              <Text style={{ color: semanticColors.textSecondary, fontSize: mobileType.caption.size, lineHeight: mobileType.caption.line, fontFamily: strongFamily, textAlign: align }}>{t(locale, "complaints.summary")}</Text>
              <Text style={{ color: semanticColors.textPrimary, fontSize: mobileType.body.size, lineHeight: mobileType.body.line, fontFamily: summaryIsLtr ? fontFamily.ui : family, textAlign: summaryIsLtr ? "left" : align, writingDirection: summaryIsLtr ? "ltr" : rtl ? "rtl" : "ltr" }}>{summary ?? t(locale, `category.${complaint.categoryCode}` as MessageKey)}</Text>
            </View>
            {complaint.voice ? <PrimaryCta labelKey="complaints.voiceStatement" tone="voice" icon="play" onPress={() => { void expoSpeechService.play(complaint.voice!.localUri); }} /> : null}
          </View>

          {details.length > 0 ? (
            <View style={{ gap: 10 }}>
              <SectionHeading icon="list-outline" rtl={rtl} family={headingFamily}>{t(locale, "complaints.details")}</SectionHeading>
              <View style={{ backgroundColor: semanticColors.surface, borderRadius: 8, paddingHorizontal: 14, borderWidth: 1, borderColor: semanticColors.border }}>
                {details.map((item, index) => <View key={item.key} style={{ gap: 3, paddingVertical: 12, borderBottomWidth: index === details.length - 1 ? 0 : 1, borderBottomColor: semanticColors.border }}><Text style={{ color: semanticColors.textSecondary, fontSize: mobileType.caption.size, lineHeight: mobileType.caption.line, fontFamily: family, textAlign: align }}>{item.prompt}</Text><Text style={{ color: semanticColors.textPrimary, fontSize: mobileType.body.size, lineHeight: mobileType.body.line, fontFamily: strongFamily, textAlign: align }}>{item.answer}</Text></View>)}
              </View>
            </View>
          ) : null}

          <View style={{ gap: 10 }}>
            <SectionHeading icon="attach-outline" rtl={rtl} family={headingFamily}>{t(locale, "complaints.attachments")}</SectionHeading>
            {complaint.evidence.length > 0 ? complaint.evidence.map((item) => <View key={item.id} style={{ flexDirection: rtl ? "row-reverse" : "row", alignItems: "center", gap: 11, minHeight: 56, paddingHorizontal: 13, backgroundColor: semanticColors.surface, borderWidth: 1, borderColor: semanticColors.border, borderRadius: 8 }}><Ionicons name={item.kind === "photo" ? "image-outline" : "document-text-outline"} size={23} color={semanticColors.voiceActiveStrong} /><Text numberOfLines={2} style={{ flex: 1, color: semanticColors.textPrimary, fontSize: mobileType.helper.size, lineHeight: mobileType.helper.line, fontFamily: fontFamily.ui, textAlign: "left", writingDirection: "ltr" }}>{item.fileName}</Text><Ionicons name="checkmark-circle" size={20} color={semanticColors.success} /></View>) : <Text style={{ color: semanticColors.textSecondary, fontSize: mobileType.helper.size, lineHeight: mobileType.helper.line, fontFamily: family, textAlign: align }}>{t(locale, "grievance.evidence.none")}</Text>}
          </View>

          <View style={{ gap: 10 }}>
            <SectionHeading icon="git-branch-outline" rtl={rtl} family={headingFamily}>{t(locale, "complaints.timeline")}</SectionHeading>
            {workerActions.map((action, index) => <View key={action.id} style={{ flexDirection: rtl ? "row-reverse" : "row", gap: 12, minHeight: 68 }}><View style={{ width: 26, alignItems: "center" }}><View style={{ width: 16, height: 16, borderRadius: 8, marginTop: 6, backgroundColor: index === workerActions.length - 1 ? semanticColors.actionPrimary : semanticColors.progressAccent, borderWidth: 3, borderColor: semanticColors.pageWorker }} />{index < workerActions.length - 1 ? <View style={{ width: 2, flex: 1, backgroundColor: semanticColors.borderEssential }} /> : null}</View><View style={{ flex: 1, gap: 2, paddingBottom: 12 }}><Text style={{ color: semanticColors.textPrimary, fontSize: mobileType.body.size, lineHeight: mobileType.body.line, fontFamily: strongFamily, textAlign: align }}>{t(locale, workerFacingActionLabelKey(action.type) as MessageKey)}</Text><Text style={{ color: semanticColors.textSecondary, fontSize: mobileType.caption.size, lineHeight: mobileType.caption.line, fontFamily: fontFamily.ui, textAlign: align }}>{formatComplaintDate(action.at, locale)}</Text></View></View>)}
          </View>

          {complaint.resolution ? <View style={{ gap: 9, padding: 15, borderRadius: 8, backgroundColor: "#E5F4EB", borderWidth: 1, borderColor: semanticColors.success }}><SectionHeading icon="checkmark-done-circle-outline" rtl={rtl} family={headingFamily}>{t(locale, "complaints.resolution")}</SectionHeading><Text style={{ color: semanticColors.textPrimary, fontSize: mobileType.body.size, lineHeight: mobileType.body.line, fontFamily: family, textAlign: align }}>{complaint.resolution.summary}</Text></View> : null}
          {canFeedback ? <View style={{ gap: 10 }}><SectionHeading icon="chatbubble-ellipses-outline" rtl={rtl} family={headingFamily}>{t(locale, "complaints.feedback")}</SectionHeading><PrimaryCta labelKey="complaints.feedback.satisfied" icon="happy-outline" onPress={() => feedback.mutate("satisfied")} /><PrimaryCta labelKey="complaints.feedback.partial" tone="secondary" icon="remove-circle-outline" onPress={() => feedback.mutate("partial")} /><PrimaryCta labelKey="complaints.feedback.unresolved" tone="secondary" icon="sad-outline" onPress={() => feedback.mutate("unresolved")} /></View> : null}
          {complaint.workerFeedback ? <ScreenNotice messageKey="complaints.feedback.saved" /> : null}
        </>
      ) : null}
    </ScreenShell>
  );
}
