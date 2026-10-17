import type { Evidence, PrivacyMode, VoiceEvidence } from "@kapas/domain";
import { useCallback, useEffect, useState } from "react";

import type { LocationCaptureStatus } from "../features/grievance/components/LocationCapture";
import { asString, asStringList, isAnswerValid, resolveNext, sectionProgress } from "../features/grievance/engine";
import {
  applyAnswer,
  answersFromDraft,
  popHistory,
  pushHistory,
} from "../features/grievance/mapDraft";
import type { AnswerValue } from "../features/grievance/types";
import { getWorkflowNode } from "../features/grievance/workflows";
import { aiAnalysisService } from "../services/aiAnalysisService";
import { expoEvidenceService } from "../services/expoEvidenceService";
import { expoIdentityService } from "../services/expoIdentityService";
import { expoLocationService } from "../services/expoLocationService";
import { useGrievanceDraftStore } from "../stores/grievanceDraftStore";

export function useGrievanceWizard() {
  const draft = useGrievanceDraftStore((s) => s.draft);
  const hydrated = useGrievanceDraftStore((s) => s.hydrated);
  const error = useGrievanceDraftStore((s) => s.error);
  const hydrate = useGrievanceDraftStore((s) => s.hydrate);
  const setDraft = useGrievanceDraftStore((s) => s.setDraft);
  const startIfNeeded = useGrievanceDraftStore((s) => s.startIfNeeded);

  useEffect(() => {
    if (!hydrated) {
      void hydrate();
      return;
    }
    if (!draft) {
      void startIfNeeded();
    }
  }, [draft, hydrate, hydrated, startIfNeeded]);

  const node = draft ? getWorkflowNode(draft.stepId) : undefined;
  const answers = draft ? answersFromDraft(draft) : {};
  const select = useCallback(
    async (value: AnswerValue) => {
      const current = useGrievanceDraftStore.getState().draft;
      const currentNode = current ? getWorkflowNode(current.stepId) : undefined;
      if (!current || !currentNode) {
        return;
      }
      let next = applyAnswer(current, currentNode, value);
      if (currentNode.id === "privacy" && value === "ANON") {
        await expoIdentityService.removeCnic(current.id);
        next = {
          ...next,
          reporterIdentity: { mode: "anonymous", cnicVerified: false },
          incident: {
            ...next.incident,
            structuredAnswers: { ...next.incident.structuredAnswers, identity: "anonymous" },
          },
        };
      }
      await setDraft(next);
    },
    [setDraft],
  );

  const goNext = useCallback(async (): Promise<"step" | "complete" | "blocked"> => {
    const current = useGrievanceDraftStore.getState().draft;
    const currentNode = current ? getWorkflowNode(current.stepId) : undefined;
    if (!current || !currentNode) {
      return "blocked";
    }
    if (!isAnswerValid(currentNode, answersFromDraft(current))) {
      return "blocked";
    }
    const nextId = resolveNext(currentNode, answersFromDraft(current));
    if (!nextId) {
      return "complete";
    }
    let advanced = pushHistory(current, current.stepId);
    let targetId = nextId;
    if (targetId === "privacy" && advanced.privacyMode) {
      advanced = pushHistory(advanced, "privacy");
      targetId = advanced.privacyMode === "ANON" ? "evidence" : "contact";
    }
    await setDraft({ ...advanced, stepId: targetId });
    return "step";
  }, [setDraft]);

  const goBack = useCallback(async (): Promise<"exit" | "step"> => {
    const current = useGrievanceDraftStore.getState().draft;
    if (!current) {
      return "exit";
    }
    const popped = popHistory(current);
    if (!popped.previousId) {
      return "exit";
    }
    await setDraft({ ...popped.draft, stepId: popped.previousId });
    return "step";
  }, [setDraft]);

  const selected = node ? answers[node.id] : undefined;
  const [voiceBusy, setVoiceBusy] = useState(false);
  const [evidenceError, setEvidenceError] = useState(false);
  const [identityBusy, setIdentityBusy] = useState(false);
  const [identityError, setIdentityError] = useState(false);
  const [locationCaptureStatus, setLocationCaptureStatus] = useState<LocationCaptureStatus>("idle");

  useEffect(() => {
    if (node?.id === "where-current" && draft?.location.source === "device" && draft.location.exactCoordinates) {
      setLocationCaptureStatus("detected");
    }
  }, [draft?.location.exactCoordinates, draft?.location.source, node?.id]);

  const submitIdentity = useCallback(async ({
    kind,
    value,
    reveal,
  }: {
    kind: "cnic" | "phone";
    value: string;
    reveal: boolean;
  }) => {
    const current = useGrievanceDraftStore.getState().draft;
    const currentNode = current ? getWorkflowNode(current.stepId) : undefined;
    if (!current || currentNode?.id !== "identity") return;
    setIdentityBusy(true);
    setIdentityError(false);
    try {
      const identityValue = reveal ? "provided" : "anonymous";
      const last4 = reveal ? await expoIdentityService.saveCnic(current.id, value) : undefined;
      if (!reveal) await expoIdentityService.removeCnic(current.id);
      const privacyMode: PrivacyMode = reveal ? "IDEN" : "ANON";
      let next = applyAnswer(current, currentNode, identityValue);
      next = {
        ...next,
        reporterIdentity: reveal
          ? kind === "cnic"
            ? { mode: "cnic", cnicLast4: last4!, cnicVerified: false }
            : { mode: "phone", phoneLast4: last4!, cnicVerified: false }
          : { mode: "anonymous", cnicVerified: false },
        privacyMode,
      };
      next = pushHistory(next, currentNode.id);
      const nextStep = resolveNext(currentNode, answersFromDraft(next)) ?? "category";
      await setDraft({ ...next, stepId: nextStep });
    } catch {
      setIdentityError(true);
    } finally {
      setIdentityBusy(false);
    }
  }, [setDraft]);

  const requestCurrentLocation = useCallback(async () => {
    setLocationCaptureStatus("locating");
    const result = await expoLocationService.captureCurrent();
    if (result.status !== "granted") {
      setLocationCaptureStatus(result.status);
      return;
    }
    const current = useGrievanceDraftStore.getState().draft;
    if (!current || current.stepId !== "where-current") return;
    await setDraft({ ...current, location: result.location });
    setLocationCaptureStatus("detected");
  }, [setDraft]);

  const confirmCurrentLocation = useCallback(async () => {
    const current = useGrievanceDraftStore.getState().draft;
    const currentNode = current ? getWorkflowNode(current.stepId) : undefined;
    if (!current || currentNode?.id !== "where-current" || !current.location.exactCoordinates) return;
    let next = applyAnswer(current, currentNode, "confirmed");
    next = pushHistory(next, currentNode.id);
    await setDraft({ ...next, stepId: "others" });
  }, [setDraft]);

  const useManualLocation = useCallback(async () => {
    const current = useGrievanceDraftStore.getState().draft;
    if (!current) return;
    const next = pushHistory({ ...current, location: {} }, current.stepId);
    setLocationCaptureStatus("idle");
    await setDraft({ ...next, stepId: "where-province" });
  }, [setDraft]);

  useEffect(() => {
    const currentStep = useGrievanceDraftStore.getState().draft?.stepId;
    if (currentStep !== "ai-processing") {
      return;
    }
    let cancelled = false;
    void (async () => {
      const snapshot = useGrievanceDraftStore.getState().draft;
      if (!snapshot || snapshot.stepId !== "ai-processing") {
        return;
      }
      try {
        const analysis = await aiAnalysisService.analyzeDraft(snapshot);
        if (cancelled) {
          return;
        }
        const current = useGrievanceDraftStore.getState().draft;
        if (!current || current.stepId !== "ai-processing") {
          return;
        }
        await setDraft({ ...current, ai: analysis, voice: current.voice, stepId: "ai-understanding" });
      } catch {
        if (cancelled) {
          return;
        }
        const current = useGrievanceDraftStore.getState().draft;
        if (!current || current.stepId !== "ai-processing") {
          return;
        }
        await setDraft({
          ...current,
          voice: current.voice,
          ai: {
            confidenceScore: 0,
            confidence: "low",
            failed: true,
            humanReviewRequired: true,
          },
          stepId: "ai-understanding",
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [draft?.stepId, setDraft]);

  const setVoice = useCallback(
    async (voice: VoiceEvidence | null) => {
      const current = useGrievanceDraftStore.getState().draft;
      if (!current) {
        return;
      }
      await setDraft({ ...current, voice });
    },
    [setDraft],
  );

  const addEvidence = useCallback(
    async (kind: "photo" | "document") => {
      const current = useGrievanceDraftStore.getState().draft;
      if (!current) {
        return;
      }
      setEvidenceError(false);
      try {
        const item = kind === "photo" ? await expoEvidenceService.pickPhoto() : await expoEvidenceService.pickDocument();
        const latest = useGrievanceDraftStore.getState().draft;
        if (!item || !latest) {
          return;
        }
        await setDraft({ ...latest, evidence: [...latest.evidence, item] });
      } catch {
        setEvidenceError(true);
      }
    },
    [setDraft],
  );

  const removeEvidence = useCallback(
    async (id: string) => {
      const current = useGrievanceDraftStore.getState().draft;
      if (!current) {
        return;
      }
      await setDraft({ ...current, evidence: current.evidence.filter((item: Evidence) => item.id !== id) });
    },
    [setDraft],
  );

  const goToStep = useCallback(
    async (stepId: string) => {
      const current = useGrievanceDraftStore.getState().draft;
      if (!current) {
        return;
      }
      await setDraft({ ...current, stepId });
    },
    [setDraft],
  );

  return {
    draft,
    node,
    answers,
    selected,
    selectedText: asString(selected),
    selectedList: asStringList(selected),
    hydrated,
    error,
    valid: node ? isAnswerValid(node, answers) : false,
    progress: node ? sectionProgress(node.section) : sectionProgress("intro"),
    voiceBusy,
    evidenceError,
    identityBusy,
    identityError,
    locationCaptureStatus,
    detectedAddress: draft?.location.formattedAddress ?? draft?.location.placeLabel,
    select,
    goNext,
    goBack,
    goToStep,
    setVoice,
    setVoiceBusy,
    addEvidence,
    removeEvidence,
    submitIdentity,
    requestCurrentLocation,
    confirmCurrentLocation,
    useManualLocation,
  };
}
