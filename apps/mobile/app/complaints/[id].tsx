import { Ionicons } from "@expo/vector-icons";
import {
  actionDetailText,
  filterWorkerComplaintTimelineActions,
  formatComplaintReferenceDisplay,
  workerFacingActionLabelKey,
  type WorkerFeedback,
} from "@kapas/domain";
import { t, type MessageKey } from "@kapas/localization";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useLocalSearchParams } from "expo-router";
import { type ComponentProps, type ReactNode, useState } from "react";
import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";

import { LightTopBar } from "../../src/components/navigation/light-top-bar";
import { ScreenNotice } from "../../src/components/screen-notice";
import { ScreenShell } from "../../src/components/screen-shell";
import { ErrorState, ScreenLoadingState } from "../../src/components/screen-states";
import { StatusPill } from "../../src/components/ui-primitives";
import { getWorkflowNode } from "../../src/features/grievance/workflows";
import { CaseProgressStrip } from "../../src/features/tracking/CaseProgressStrip";
import {
  complaintLocation,
  complaintStatusTone,
  complaintWorkerNextStepKey,
  complaintWorkerStatusKey,
  formatComplaintDate,
} from "../../src/features/tracking/complaintPresentation";
import { EvidenceGrid } from "../../src/features/tracking/EvidenceGrid";
import { useAutoPromptId } from "../../src/hooks/use-prompt-playback";
import { isRTL } from "../../src/i18n/rtl";
import {
  getWorkerComplaintByDraftId,
  getWorkerEvidenceLocalUri,
  submitWorkerFeedback,
  type TrackedComplaint,
} from "../../src/services/workerApi";
import { useLocaleStore } from "../../src/stores/localeStore";
import { fontFamily, mobileType, semanticColors } from "../../src/theme/tokens";

type IconName = ComponentProps<typeof Ionicons>["name"];

function affectedLabelKey(complaint: TrackedComplaint): MessageKey {
  const value = complaint.incident.othersAffected;
  if (value === "2-5") return "range.2-5";
  if (value === "6-20") return "range.6-20";
  if (value === "more-than-20") return "range.20+";
  if (value === "not-sure") return "range.unsure";
  return "complaints.affectedOnlyMe";
}

const PROMOTED_ANSWER_IDS = new Set([
  "when",
  "others",
  "others-range",
  "where-province",
  "where-city",
  "where-place",
  "where-current",
  "danger",
  "privacy",
  "category",
  "category-more",
  "contact",
  "contactPreference",
  "representative-contact",
  "contact-language",
  "contact-window",
  "contact-voicemail",
  "subcategory",
  "pesticideSymptoms",
  "harassmentThreat",
  "priorityFloor",
  "_history",
]);

function answerRows(complaint: TrackedComplaint, locale: "en" | "ur") {
  return Object.entries(complaint.incident.structuredAnswers).flatMap(([key, raw]) => {
    if (PROMOTED_ANSWER_IDS.has(key)) return [];
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

function SectionHeading({
  icon,
  children,
  rtl,
  family,
}: {
  icon: IconName;
  children: ReactNode;
  rtl: boolean;
  family: string;
}) {
  return (
    <View style={{ flexDirection: rtl ? "row-reverse" : "row", alignItems: "center", gap: 9 }}>
      <Ionicons name={icon} size={21} color={semanticColors.actionPrimary} />
      <Text
        style={{
          flex: 1,
          color: semanticColors.textPrimary,
          fontSize: mobileType.answer.size,
          lineHeight: mobileType.answer.line,
          fontFamily: family,
          textAlign: rtl ? "right" : "left",
        }}
      >
        {children}
      </Text>
    </View>
  );
}

function FactRow({
  icon,
  label,
  value,
  rtl,
  family,
  last = false,
}: {
  icon: IconName;
  label: string;
  value: string;
  rtl: boolean;
  family: string;
  last?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: rtl ? "row-reverse" : "row",
        alignItems: "center",
        gap: 11,
        minHeight: 52,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: semanticColors.border,
      }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 11,
          backgroundColor: semanticColors.aiSurface,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={18} color={semanticColors.voiceActiveStrong} />
      </View>
      <View style={{ flex: 1, gap: 1 }}>
        <Text
          style={{
            color: semanticColors.textSecondary,
            fontSize: mobileType.caption.size,
            lineHeight: mobileType.caption.line,
            fontFamily: family,
            textAlign: rtl ? "right" : "left",
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            color: semanticColors.textPrimary,
            fontSize: mobileType.helper.size,
            lineHeight: mobileType.helper.line,
            fontFamily: family,
            textAlign: rtl ? "right" : "left",
          }}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function VoicePlaybackControls({
  fileUri,
  voice,
  rtl,
  loading,
  errored,
}: {
  fileUri?: string;
  voice: NonNullable<TrackedComplaint["voice"]>;
  rtl: boolean;
  loading: boolean;
  errored: boolean;
}) {
  const player = useAudioPlayer(fileUri ? { uri: fileUri } : null);
  const status = useAudioPlayerStatus(player);
  const seconds = Math.round(status.duration || voice.durationMs / 1000);
  return (
    <View
      style={{
        flexDirection: rtl ? "row-reverse" : "row",
        alignItems: "center",
        gap: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: semanticColors.border,
        borderRadius: 14,
        backgroundColor: semanticColors.surface,
      }}
    >
      <Pressable
        disabled={!fileUri || errored}
        accessibilityRole="button"
        onPress={() => {
          void (async () => {
            if (!fileUri) return;
            await setAudioModeAsync({
              allowsRecording: false,
              playsInSilentMode: true,
              shouldPlayInBackground: false,
            });
            if (status.playing) player.pause();
            else player.play();
          })();
        }}
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: semanticColors.aiSurface,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {loading ? (
          <ActivityIndicator color={semanticColors.actionPrimary} />
        ) : (
          <Ionicons
            name={status.playing ? "pause" : "play"}
            size={25}
            color={semanticColors.actionPrimary}
          />
        )}
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text style={{ color: semanticColors.textPrimary, fontFamily: fontFamily.uiSemibold }}>
          {voice.originalName}
        </Text>
        <Text style={{ color: semanticColors.textSecondary, fontFamily: fontFamily.ui }}>
          {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
        </Text>
      </View>
      {errored ? <Ionicons name="alert-circle" size={22} color={semanticColors.critical} /> : null}
    </View>
  );
}

function VoiceItem({
  draftId,
  voice,
  rtl,
}: {
  draftId: string;
  voice: NonNullable<TrackedComplaint["voice"]>;
  rtl: boolean;
}) {
  const source = useQuery({
    queryKey: ["worker-voice", draftId, voice.id],
    queryFn: () =>
      getWorkerEvidenceLocalUri(draftId, voice.id, { mimeType: voice.mimeType, kind: "voice" }),
    staleTime: 5 * 60 * 1000,
  });
  return (
    <VoicePlaybackControls
      key={source.data?.uri ?? "loading"}
      fileUri={source.data?.uri}
      voice={voice}
      rtl={rtl}
      loading={source.isLoading}
      errored={source.isError}
    />
  );
}

export default function ComplaintDetailScreen() {
  const locale = useLocaleStore((s) => s.locale);
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === "string" ? params.id : "";
  const query = useQuery({
    queryKey: ["complaint", id],
    queryFn: () => getWorkerComplaintByDraftId(id),
    enabled: id.length > 0,
  });
  const feedback = useMutation({
    mutationFn: (outcome: WorkerFeedback["outcome"]) => submitWorkerFeedback(id, outcome),
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
  const canFeedback =
    complaint &&
    !complaint.feedbackOutcome &&
    ["Outcome Verification", "Closed"].includes(complaint.status);
  const summary = complaint?.incident.description;
  const summaryIsLtr = Boolean(summary && /[A-Za-z]/.test(summary));
  const details = complaint ? answerRows(complaint, locale) : [];
  const workerEvidence =
    complaint?.evidence.filter((item) => (item.source ?? "worker") !== "office") ?? [];
  const officeEvidence =
    complaint?.evidence.filter((item) => item.source === "office") ?? [];
  const workerActions = complaint ? filterWorkerComplaintTimelineActions(complaint.actions) : [];
  const [timelineEntry, setTimelineEntry] = useState<(typeof workerActions)[number] | null>(null);
  const timelineDetail = timelineEntry ? actionDetailText(timelineEntry as Parameters<typeof actionDetailText>[0]) : undefined;
  useAutoPromptId("SC-complaint-detail");

  return (
    <ScreenShell
      header={
        <LightTopBar
          titleKey="complaints.detail"
          subtitle={
            complaint?.referenceNumber
              ? formatComplaintReferenceDisplay(complaint.referenceNumber)
              : undefined
          }
          icon="document-text-outline"
        />
      }
      scroll
      contentStyle={{ gap: 14 }}
      refreshing={query.isFetching && !query.isLoading}
      onRefresh={() => {
        void query.refetch();
      }}
    >
      {query.isLoading ? <ScreenLoadingState variant="detail-hero" /> : null}
      {query.isError ? <ErrorState onRetry={() => void query.refetch()} /> : null}
      {query.isSuccess && !complaint ? <ScreenNotice messageKey="complaints.empty" /> : null}
      {complaint ? (
        <>
          <View
            style={{
              padding: 16,
              gap: 11,
              backgroundColor: semanticColors.surface,
              borderWidth: 1,
              borderColor: semanticColors.border,
              borderRadius: 18,
            }}
          >
            <View
              style={{
                flexDirection: rtl ? "row-reverse" : "row",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: semanticColors.chipCountSurface,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name="document-text-outline"
                  size={25}
                  color={semanticColors.actionPrimary}
                />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text
                  style={{
                    color: semanticColors.textPrimary,
                    fontSize: mobileType.answer.size,
                    lineHeight: mobileType.answer.line,
                    fontFamily: headingFamily,
                    textAlign: align,
                  }}
                >
                  {t(locale, `category.${complaint.categoryCode}` as MessageKey)}
                </Text>
                <Text
                  style={{
                    color: semanticColors.textSecondary,
                    fontSize: mobileType.reference.size,
                    lineHeight: mobileType.reference.line,
                    fontFamily: fontFamily.reference,
                    textAlign: align,
                    writingDirection: "ltr",
                  }}
                >
                  {formatComplaintReferenceDisplay(complaint.referenceNumber)}
                </Text>
              </View>
            </View>
            <View style={{ alignItems: rtl ? "flex-end" : "flex-start" }}>
              <StatusPill
                label={
                  complaint.overdue
                    ? t(locale, "complaints.overdue")
                    : t(locale, complaintWorkerStatusKey(complaint) as MessageKey)
                }
                tone={complaintStatusTone(complaint)}
                icon={complaint.overdue ? "alert-circle" : "time-outline"}
              />
            </View>
            <CaseProgressStrip complaint={complaint} variant="detail" />
          </View>

          <View
            style={{
              flexDirection: rtl ? "row-reverse" : "row",
              gap: 12,
              padding: 14,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: semanticColors.border,
              backgroundColor:
                complaintStatusTone(complaint) === "critical"
                  ? semanticColors.criticalSurface
                  : complaintStatusTone(complaint) === "success"
                    ? semanticColors.surfaceMuted
                    : semanticColors.aiSurface,
            }}
          >
            <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: complaintStatusTone(complaint) === "critical" ? semanticColors.criticalSurface : semanticColors.surface, alignItems: "center", justifyContent: "center" }}>
              <Ionicons
                name={complaintStatusTone(complaint) === "critical" ? "alert-circle" : "navigate-circle"}
                size={22}
                color={complaintStatusTone(complaint) === "critical" ? semanticColors.critical : semanticColors.voiceActiveStrong}
              />
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Text
                style={{
                  color: semanticColors.textPrimary,
                  fontSize: mobileType.caption.size,
                  lineHeight: mobileType.caption.line,
                  fontFamily: strongFamily,
                  textAlign: align,
                }}
              >
                {t(locale, "complaints.nextAction")}
              </Text>
              <Text
                style={{
                  color: semanticColors.textPrimary,
                  fontSize: mobileType.body.size,
                  lineHeight: mobileType.body.line,
                  fontFamily: family,
                  textAlign: align,
                }}
              >
                {t(
                  locale,
                  (complaint.overdue
                    ? "complaints.next.overdue"
                    : complaintWorkerNextStepKey(complaint)) as MessageKey,
                )}
              </Text>
            </View>
          </View>

          <View style={{ gap: 8 }}>
            <SectionHeading icon="information-circle-outline" rtl={rtl} family={headingFamily}>
              {t(locale, "complaints.caseFacts")}
            </SectionHeading>
            <View
              style={{
                paddingHorizontal: 14,
                backgroundColor: semanticColors.surface,
                borderWidth: 1,
                borderColor: semanticColors.border,
                borderRadius: 16,
              }}
            >
              <FactRow
                icon="calendar-outline"
                label={t(locale, "complaints.reportedOn")}
                value={formatComplaintDate(complaint.submittedAt, locale)}
                rtl={rtl}
                family={family}
              />
              <FactRow
                icon="location-outline"
                label={t(locale, "complaints.location")}
                value={complaintLocation(complaint) || t(locale, "complaints.notAvailable")}
                rtl={rtl}
                family={family}
              />
              <FactRow
                icon="people-outline"
                label={t(locale, "complaints.affected")}
                value={t(locale, affectedLabelKey(complaint))}
                rtl={rtl}
                family={family}
              />
              <FactRow
                icon="lock-closed-outline"
                label={t(locale, "complaints.privacy")}
                value={t(locale, `privacy.${complaint.privacyMode}` as MessageKey)}
                rtl={rtl}
                family={family}
              />
              <FactRow
                icon="flag-outline"
                label={t(locale, "complaints.expectedBy")}
                value={`${formatComplaintDate(complaint.dueAt, locale)}${complaint.overdue ? ` · ${t(locale, "complaints.overdue")}` : ""}`}
                rtl={rtl}
                family={family}
                last
              />
            </View>
          </View>

          <View style={{ gap: 8 }}>
            <SectionHeading icon="chatbox-ellipses-outline" rtl={rtl} family={headingFamily}>
              {t(locale, "complaints.yourReport")}
            </SectionHeading>
            <View
              style={{
                backgroundColor: semanticColors.surface,
                borderRadius: 16,
                paddingHorizontal: 14,
                borderWidth: 1,
                borderColor: semanticColors.border,
                gap: 0,
              }}
            >
              <View style={{ paddingVertical: 12, borderBottomWidth: details.length > 0 ? 1 : 0, borderBottomColor: semanticColors.border, gap: 4 }}>
                <Text
                  style={{
                    color: semanticColors.textSecondary,
                    fontSize: mobileType.caption.size,
                    lineHeight: mobileType.caption.line,
                    fontFamily: strongFamily,
                    textAlign: align,
                  }}
                >
                  {t(locale, "complaints.summary")}
                </Text>
                <Text
                  style={{
                    color: semanticColors.textPrimary,
                    fontSize: mobileType.body.size,
                    lineHeight: mobileType.body.line,
                    fontFamily: summaryIsLtr ? fontFamily.ui : family,
                    textAlign: summaryIsLtr ? "left" : align,
                    writingDirection: summaryIsLtr ? "ltr" : rtl ? "rtl" : "ltr",
                  }}
                >
                  {summary ?? t(locale, `category.${complaint.categoryCode}` as MessageKey)}
                </Text>
              </View>
              {details.map((item, index) => (
                <View
                  key={item.key}
                  style={{
                    gap: 3,
                    paddingVertical: 12,
                    borderBottomWidth: index === details.length - 1 ? 0 : 1,
                    borderBottomColor: semanticColors.border,
                  }}
                >
                  <Text
                    style={{
                      color: semanticColors.textSecondary,
                      fontSize: mobileType.caption.size,
                      lineHeight: mobileType.caption.line,
                      fontFamily: family,
                      textAlign: align,
                    }}
                  >
                    {item.prompt}
                  </Text>
                  <Text
                    style={{
                      color: semanticColors.textPrimary,
                      fontSize: mobileType.body.size,
                      lineHeight: mobileType.body.line,
                      fontFamily: strongFamily,
                      textAlign: align,
                    }}
                  >
                    {item.answer}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={{ gap: 8 }}>
            <SectionHeading icon="attach-outline" rtl={rtl} family={headingFamily}>
              {t(locale, "complaints.attachments")}
            </SectionHeading>
            {complaint.voice ? (
              <VoiceItem draftId={complaint.draftId} voice={complaint.voice} rtl={rtl} />
            ) : null}
            {workerEvidence.length > 0 ? (
              <EvidenceGrid draftId={complaint.draftId} items={workerEvidence} />
            ) : !complaint.voice ? (
              <Text
                style={{
                  color: semanticColors.textSecondary,
                  fontSize: mobileType.helper.size,
                  lineHeight: mobileType.helper.line,
                  fontFamily: family,
                  textAlign: align,
                }}
              >
                {t(locale, "grievance.evidence.none")}
              </Text>
            ) : null}
          </View>
          {officeEvidence.length > 0 ? (
            <View style={{ gap: 8 }}>
              <SectionHeading icon="folder-open-outline" rtl={rtl} family={headingFamily}>
                {t(locale, "complaints.officeAttachments")}
              </SectionHeading>
              <EvidenceGrid draftId={complaint.draftId} items={officeEvidence} />
            </View>
          ) : null}

          <View style={{ gap: 10 }}>
            <SectionHeading icon="git-branch-outline" rtl={rtl} family={headingFamily}>
              {t(locale, "complaints.timeline")}
            </SectionHeading>
            {workerActions.map((action, index) => (
              <Pressable
                key={action.id ?? `${action.type}-${action.at}`}
                onPress={() => setTimelineEntry(action)}
                style={{ flexDirection: rtl ? "row-reverse" : "row", gap: 10, minHeight: 64, padding: 10, borderRadius: 14, backgroundColor: semanticColors.surface, borderWidth: 1, borderColor: semanticColors.border }}
              >
                <View style={{ width: 26, alignItems: "center" }}>
                  <View
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 8,
                      marginTop: 6,
                      backgroundColor:
                        index === workerActions.length - 1
                          ? semanticColors.actionPrimary
                          : semanticColors.progressAccent,
                      borderWidth: 3,
                      borderColor: semanticColors.pageWorker,
                    }}
                  />
                  {index < workerActions.length - 1 ? (
                    <View
                      style={{ width: 2, flex: 1, backgroundColor: semanticColors.borderEssential }}
                    />
                  ) : null}
                </View>
                <View style={{ flex: 1, gap: 2, paddingBottom: 12 }}>
                  <Text
                    style={{
                      color: semanticColors.textPrimary,
                      fontSize: mobileType.body.size,
                      lineHeight: mobileType.body.line,
                      fontFamily: strongFamily,
                      textAlign: align,
                    }}
                  >
                    {t(locale, workerFacingActionLabelKey(action.type) as MessageKey)}
                  </Text>
                  <Text
                    style={{
                      color: semanticColors.textSecondary,
                      fontSize: mobileType.caption.size,
                      lineHeight: mobileType.caption.line,
                      fontFamily: fontFamily.ui,
                      textAlign: align,
                    }}
                  >
                    {formatComplaintDate(action.at, locale)}
                  </Text>
                  {actionDetailText(action as Parameters<typeof actionDetailText>[0]) ? (
                    <Text
                      numberOfLines={2}
                      style={{
                        color: semanticColors.textPrimary,
                        fontSize: mobileType.helper.size,
                        lineHeight: mobileType.helper.line,
                        fontFamily: family,
                        textAlign: align,
                      }}
                    >
                      {actionDetailText(action as Parameters<typeof actionDetailText>[0])}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            ))}
          </View>
          <Modal visible={timelineEntry !== null} transparent animationType="fade" onRequestClose={() => setTimelineEntry(null)}>
            <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", padding: 20 }} onPress={() => setTimelineEntry(null)}>
              <Pressable style={{ backgroundColor: semanticColors.surface, borderRadius: 18, padding: 18, gap: 10, borderWidth: 1, borderColor: semanticColors.border }} onPress={(event) => event.stopPropagation()}>
                {timelineEntry ? (
                  <>
                    <Text style={{ fontFamily: strongFamily, fontSize: mobileType.body.size, color: semanticColors.textPrimary, textAlign: align }}>
                      {t(locale, workerFacingActionLabelKey(timelineEntry.type) as MessageKey)}
                    </Text>
                    <Text style={{ fontFamily: fontFamily.ui, fontSize: mobileType.caption.size, color: semanticColors.textSecondary, textAlign: align }}>
                      {formatComplaintDate(timelineEntry.at, locale)}
                    </Text>
                    <Text style={{ fontFamily: family, fontSize: mobileType.body.size, color: semanticColors.textPrimary, textAlign: align }}>
                      {timelineDetail ?? t(locale, "complaints.timeline.noDetail")}
                    </Text>
                  </>
                ) : null}
              </Pressable>
            </Pressable>
          </Modal>

          {complaint.resolutionSummary ? (
            <View
              style={{
                gap: 9,
                padding: 15,
                borderRadius: 16,
                backgroundColor: semanticColors.chipCountSurface,
                borderWidth: 1,
                borderColor: semanticColors.success,
              }}
            >
              <SectionHeading icon="checkmark-done-circle-outline" rtl={rtl} family={headingFamily}>
                {t(locale, "complaints.resolution")}
              </SectionHeading>
              <Text
                style={{
                  color: semanticColors.textPrimary,
                  fontSize: mobileType.body.size,
                  lineHeight: mobileType.body.line,
                  fontFamily: family,
                  textAlign: align,
                }}
              >
                {complaint.resolutionSummary}
              </Text>
            </View>
          ) : null}
          {canFeedback ? (
            <View style={{ gap: 10 }}>
              <SectionHeading icon="chatbubble-ellipses-outline" rtl={rtl} family={headingFamily}>
                {t(locale, "complaints.feedback")}
              </SectionHeading>
              <View style={{ flexDirection: rtl ? "row-reverse" : "row", gap: 8 }}>
                {(
                  [
                    { outcome: "satisfied" as const, key: "complaints.feedback.satisfied", icon: "happy-outline" },
                    { outcome: "partial" as const, key: "complaints.feedback.partial", icon: "remove-circle-outline" },
                    { outcome: "unresolved" as const, key: "complaints.feedback.unresolved", icon: "sad-outline" },
                  ] as const
                ).map((item) => (
                  <Pressable
                    key={item.outcome}
                    accessibilityRole="button"
                    onPress={() => feedback.mutate(item.outcome)}
                    style={({ pressed }) => ({
                      flex: 1,
                      minHeight: 72,
                      padding: 10,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: semanticColors.borderEssential,
                      backgroundColor: semanticColors.surface,
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      opacity: pressed ? 0.85 : 1,
                    })}
                  >
                    <Ionicons name={item.icon} size={22} color={semanticColors.actionPrimary} />
                    <Text
                      style={{
                        color: semanticColors.textPrimary,
                        fontSize: mobileType.caption.size,
                        lineHeight: mobileType.caption.line,
                        fontFamily: strongFamily,
                        textAlign: "center",
                      }}
                    >
                      {t(locale, item.key)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
        </>
      ) : null}
    </ScreenShell>
  );
}
