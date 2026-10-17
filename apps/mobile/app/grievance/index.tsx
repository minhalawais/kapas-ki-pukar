import { canSubmitDraft, workerCategoryCodes, type WorkerCategoryCode } from "@kapas/domain";
import { t, type MessageKey } from "@kapas/localization";
import { complaintService } from "@kapas/mock-services";
import { workflowPromptId } from "@kapas/speech";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView } from "react-native";

import { ActionDock } from "../../src/components/action-dock";
import { LightTopBar } from "../../src/components/navigation/light-top-bar";
import { PrimaryCta } from "../../src/components/primary-cta";
import { ScreenNotice } from "../../src/components/screen-notice";
import { ScreenShell } from "../../src/components/screen-shell";
import { QuestionRenderer } from "../../src/features/grievance/components/QuestionRenderer";
import { useGrievanceWizard } from "../../src/hooks/use-grievance-wizard";
import { useAutoPromptId } from "../../src/hooks/use-prompt-playback";
import { expoIdentityService } from "../../src/services/expoIdentityService";
import { imagePreloadService } from "../../src/services/imagePreloadService";
import { promptAudioService } from "../../src/services/promptAudioService";
import { useConnectivityStore } from "../../src/stores/connectivityStore";
import { useGrievanceDraftStore } from "../../src/stores/grievanceDraftStore";
import { useLocaleStore } from "../../src/stores/localeStore";
import { useVoiceGuidanceStore } from "../../src/stores/voiceGuidanceStore";
import { semanticColors } from "../../src/theme/tokens";



function othersLabel(locale: "ur" | "en", value?: string): string {
  if (value === "individual") {
    return t(locale, "others.no");
  }
  if (value === "2-5") {
    return t(locale, "range.2-5");
  }
  if (value === "6-20") {
    return t(locale, "range.6-20");
  }
  if (value === "more-than-20") {
    return t(locale, "range.20+");
  }
  if (value === "not-sure") {
    return t(locale, "range.unsure");
  }
  return t(locale, "common.notSure");
}

export default function GrievanceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const queryClient = useQueryClient();
  const locale = useLocaleStore((s) => s.locale);
  const categoryIntent = useGrievanceDraftStore((s) => s.requestedCategory);
  const setCategoryIntent = useGrievanceDraftStore((s) => s.setRequestedCategory);
  const wizard = useGrievanceWizard();
  const node = wizard.node;
  const draft = wizard.draft;
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [manualSpeaking, setManualSpeaking] = useState(false);
  const setVoiceGuidanceEnabled = useVoiceGuidanceStore((state) => state.setEnabled);

  const currentPromptId = node?.id ? workflowPromptId(node.id) : undefined;
  const autoPlayback = useAutoPromptId(currentPromptId);
  const speaking = manualSpeaking || autoPlayback.state === "loading" || autoPlayback.state === "playing";
  const loadingAudio = autoPlayback.state === "loading";

  const routeCategory = typeof params.category === "string" && workerCategoryCodes.includes(params.category as WorkerCategoryCode)
    ? params.category as WorkerCategoryCode
    : undefined;
  const requestedCategory = routeCategory ?? categoryIntent ?? undefined;

  useEffect(() => {
    void imagePreloadService.preloadGrievance();
  }, []);

  useEffect(() => {
    if (node?.id !== "category" || wizard.selected || !requestedCategory) {
      return;
    }
    void wizard.select(requestedCategory).then(() => setCategoryIntent(null));
  }, [node?.id, requestedCategory, setCategoryIntent, wizard.select, wizard.selected]);

  useEffect(() => () => setCategoryIntent(null), [setCategoryIntent]);
  useEffect(() => () => { void promptAudioService.stop(); }, []);

  const toggleSpeech = () => {
    if (speaking) {
      void setVoiceGuidanceEnabled(false);
      void promptAudioService.stop().finally(() => setManualSpeaking(false));
      return;
    }
    if (locale !== "ur" || !currentPromptId) return;
    void setVoiceGuidanceEnabled(true);
    setManualSpeaking(true);
    void promptAudioService.playPrompt(currentPromptId).finally(() => setManualSpeaking(false));
  };

  const handleBack = () => {
    void wizard.goBack().then((result) => {
      if (result === "exit") {
        router.replace("/home");
      }
    });
  };

  const reviewLines =
    node?.type === "review" && draft
      ? [
          {
            labelKey: "grievance.review.identity" as const,
            value: draft.reporterIdentity?.mode === "cnic"
              ? `${t(locale, "grievance.review.cnicEnding")} ${draft.reporterIdentity.cnicLast4 ?? ""}`
              : draft.reporterIdentity?.mode === "phone"
                ? `${t(locale, "grievance.review.phoneEnding")} ${draft.reporterIdentity.phoneLast4 ?? ""}`
              : t(locale, "privacy.ANON"),
            editNodeId: "identity",
          },
          {
            labelKey: "grievance.review.category" as const,
            value: draft.category ? t(locale, `category.${draft.category}` as MessageKey) : t(locale, "common.notSure"),
            editNodeId: "category",
          },
          {
            labelKey: "grievance.review.when" as const,
            value: draft.incident.whenLabel ? t(locale, `when.${draft.incident.whenLabel}` as MessageKey) : t(locale, "common.notSure"),
            editNodeId: "when",
          },
          {
            labelKey: "grievance.review.where" as const,
            value: draft.location.source === "device"
              ? (draft.location.formattedAddress ?? draft.location.placeLabel ?? t(locale, "common.notSure"))
              : (draft.location.placeLabel ?? draft.location.villageLabel ?? t(locale, "common.notSure")),
            editNodeId: "where-current",
          },
          {
            labelKey: "grievance.review.others" as const,
            value: othersLabel(locale, draft.incident.othersAffected),
            editNodeId: "others",
          },
          {
            labelKey: "grievance.review.danger" as const,
            value: draft.incident.immediateDanger ? t(locale, `danger.${draft.incident.immediateDanger}` as MessageKey) : t(locale, "common.notSure"),
            editNodeId: "danger",
          },
          {
            labelKey: "grievance.review.privacy" as const,
            value: draft.privacyMode
              ? t(locale, `privacy.${draft.privacyMode}` as MessageKey)
              : t(locale, "common.notSure"),
            editNodeId: "privacy",
          },
          {
            labelKey: "grievance.review.voice" as const,
            value: draft.voice ? t(locale, "grievance.voice.attached") : t(locale, "grievance.voice.none"),
            editNodeId: "voice",
          },
          {
            labelKey: "grievance.review.evidence" as const,
            value:
              draft.evidence.length > 0
                ? String(draft.evidence.length)
                : t(locale, "grievance.evidence.none"),
            editNodeId: "evidence",
          },
          {
            labelKey: "grievance.ai.summaryLabel" as const,
            value:
              draft.ai?.failed || !draft.ai
                ? t(locale, "grievance.ai.unavailable")
                : locale === "ur"
                  ? (draft.ai.summaryUr ?? t(locale, "grievance.ai.unavailable"))
                  : (draft.ai.summaryEn ?? t(locale, "grievance.ai.unavailable")),
          },
        ]
      : undefined;

  const getHeaderTitle = (): string => {
    if (!node) return t(locale, "grievance.title");
    if (node.id === "identity") {
      return locale === "ur" ? "شناخت کا طریقہ" : "Identity Method";
    }
    if (node.id === "category") {
      return locale === "ur" ? "مسئلے کی قسم" : "Problem Category";
    }
    if (draft?.category) {
      return t(locale, `category.${draft.category}` as MessageKey);
    }
    if (node.section === "facts") {
      return locale === "ur" ? "واقعہ کی تفصیلات" : "Incident Details";
    }
    if (node.section === "safety") {
      return locale === "ur" ? "حفاظت اور رازداری" : "Safety & Privacy";
    }
    if (node.section === "review") {
      return locale === "ur" ? "شکایت کا جائزہ" : "Review Grievance";
    }
    return t(locale, "grievance.title");
  };

  return (
    <ScreenShell
      fullWidthHeader
      header={
        <LightTopBar
          fullWidth
          title={getHeaderTitle()}
          showBack
          onBack={handleBack}
          speaking={speaking}
          loadingAudio={loadingAudio}
          onToggleSpeech={toggleSpeech}
        />
      }
      footer={node && node.type !== "ai-processing" && node.type !== "cnic" && node.type !== "current-location" ? (
        <ActionDock>
          <PrimaryCta
            labelKey={node.type === "review" ? "grievance.review.submit" : node.type === "ai-understanding" ? "grievance.ai.confirm" : "common.continue"}
            icon={node.type === "review" ? "send" : "arrow-forward-circle"}
            disabled={!wizard.valid || wizard.voiceBusy || submitting}
            loading={submitting}
            onPress={() => {
              if (node.type === "review") {
                const current = wizard.draft;
                if (!current || !canSubmitDraft(current)) { setSubmitError(true); return; }
                setSubmitError(false);
                setSubmitting(true);
                void (async () => {
                  await new Promise<void>((resolve) => {
                    setTimeout(() => resolve(), 1000);
                  });
                  try {
                    const created = await complaintService.createFromDraft(current);
                    await expoIdentityService.removeCnic(current.id);
                    useGrievanceDraftStore.getState().resetAfterSubmit();
                    await useConnectivityStore.getState().refreshQueue();
                    await queryClient.invalidateQueries({ queryKey: ["my-complaints"] });
                    await queryClient.invalidateQueries({ queryKey: ["complaint", created.trackingId] });
                    router.replace(created.status === "Draft" ? `/grievance/offline-saved?id=${created.trackingId}` : `/grievance/success?id=${created.trackingId}`);
                  } catch { setSubmitError(true); setSubmitting(false); }
                })();
                return;
              }
              void wizard.goNext();
            }}
          />
        </ActionDock>
      ) : undefined}
    >
      {!wizard.hydrated || !node ? (
        <ActivityIndicator
          color={semanticColors.actionPrimary}
          accessibilityLabel={t(locale, "common.loading")}
        />
      ) : null}
      {wizard.error ? <ScreenNotice messageKey="common.error" tone="error" /> : null}
      {submitError ? <ScreenNotice messageKey="grievance.review.missing" tone="error" /> : null}
      {submitting ? <ScreenNotice messageKey="grievance.submit.processing" /> : null}
      {node ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 16, paddingBottom: 16 }} keyboardShouldPersistTaps="handled">
          <QuestionRenderer
            node={node}
            selected={wizard.selected}
            reviewLines={reviewLines}
            voice={draft?.voice ?? null}
            analysis={draft?.ai}
            evidence={draft?.evidence}
            evidenceError={wizard.evidenceError}
            identityBusy={wizard.identityBusy}
            identityError={wizard.identityError}
            locationCaptureStatus={wizard.locationCaptureStatus}
            detectedAddress={wizard.detectedAddress}
            onSelect={(value) => {
              void wizard.select(value);
            }}
            onVoiceChange={(next) => {
              void wizard.setVoice(next);
            }}
            onVoiceBusyChange={wizard.setVoiceBusy}
            onAddPhoto={() => {
              void wizard.addEvidence("photo");
            }}
            onAddDocument={() => {
              void wizard.addEvidence("document");
            }}
            onRemoveEvidence={(id) => {
              void wizard.removeEvidence(id);
            }}
            onEditSection={(id) => {
              void wizard.goToStep(id);
            }}
            onSubmitIdentity={(identity) => { void wizard.submitIdentity(identity); }}
            onRequestCurrentLocation={() => { void wizard.requestCurrentLocation(); }}
            onConfirmCurrentLocation={() => { void wizard.confirmCurrentLocation(); }}
            onManualLocation={() => { void wizard.useManualLocation(); }}
          />
        </ScrollView>
      ) : null}
    </ScreenShell>
  );
}
