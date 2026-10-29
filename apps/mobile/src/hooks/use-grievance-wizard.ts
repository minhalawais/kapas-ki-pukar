import type { Evidence, VoiceEvidence } from "@kapas/domain";
import {
  fastForwardToReview,
  RETURN_TO_REVIEW_KEY,
  REVIEW_NODE_ID,
  workflowPathProgress,
} from "@kapas/domain";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { LocationCaptureStatus } from "../features/grievance/components/LocationCapture";
import {
  asString,
  asStringList,
  isAnswerValid,
  resolveNext,
} from "../features/grievance/engine";
import {
  applyAnswer,
  answersFromDraft,
  historyFromDraft,
  popHistory,
  pushHistory,
} from "../features/grievance/mapDraft";
import { HISTORY_KEY, INTRO_NODE_ID } from "../features/grievance/types";
import type { AnswerValue } from "../features/grievance/types";
import { getWorkflowNode } from "../features/grievance/workflows";
import { expoEvidenceService } from "../services/expoEvidenceService";
import { expoIdentityService } from "../services/expoIdentityService";
import { expoLocationService } from "../services/expoLocationService";
import { productionSyncService, type SyncQueueItem } from "../services/productionSyncService";
import { useGrievanceDraftStore } from "../stores/grievanceDraftStore";

function mergedAnswers(draft: NonNullable<ReturnType<typeof useGrievanceDraftStore.getState>["draft"]>) {
  const answers = answersFromDraft(draft);
  if (draft.category && !answers.category) {
    answers.category = draft.category;
  }
  if (draft.privacyMode && !answers.privacy) {
    answers.privacy = draft.privacyMode;
  }
  return answers;
}

function clearReturnToReview<T extends { incident: { structuredAnswers?: Record<string, unknown> } }>(
  draft: T,
): T {
  const raw = { ...(draft.incident.structuredAnswers ?? {}) };
  delete raw[RETURN_TO_REVIEW_KEY];
  return {
    ...draft,
    incident: { ...draft.incident, structuredAnswers: raw },
  };
}

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
    const answers = mergedAnswers(current);
    const nextId = resolveNext(currentNode, answers);
    if (!nextId) {
      return "complete";
    }
    let advanced = pushHistory(current, current.stepId);
    let targetId = nextId;
    if (targetId === "privacy" && advanced.privacyMode) {
      advanced = pushHistory(advanced, "privacy");
      targetId = "evidence";
    }
    let nextDraft = { ...advanced, stepId: targetId };
    if (answers[RETURN_TO_REVIEW_KEY] === "true") {
      nextDraft = fastForwardToReview(nextDraft, mergedAnswers(nextDraft), pushHistory);
      nextDraft = clearReturnToReview(nextDraft);
    }
    if (nextDraft.stepId === REVIEW_NODE_ID) {
      nextDraft = clearReturnToReview(nextDraft);
    }
    await setDraft(nextDraft);
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
  const [evidenceError, setEvidenceError] = useState<string | null>(null);
  const [evidenceBusy, setEvidenceBusy] = useState(false);
  const [identityBusy, setIdentityBusy] = useState(false);
  const [identityError, setIdentityError] = useState(false);
  const [locationCaptureStatus, setLocationCaptureStatus] = useState<LocationCaptureStatus>("idle");
  const [syncItem, setSyncItem] = useState<SyncQueueItem | null>(null);

  useEffect(() => {
    if (!draft?.id) return;
    const refresh = () => {
      void productionSyncService.get(draft.id).then(setSyncItem);
    };
    refresh();
    return productionSyncService.subscribe(refresh);
  }, [draft?.id]);

  useEffect(() => {
    if (
      node?.id === "where-current" &&
      draft?.location.source === "device" &&
      draft.location.exactCoordinates
    ) {
      setLocationCaptureStatus("detected");
    }
  }, [draft?.location.exactCoordinates, draft?.location.source, node?.id]);

  const submitIdentity = useCallback(
    async ({
      phone,
      cnic,
      privacyMode,
    }: {
      phone: string;
      cnic?: string;
      privacyMode: "CONF" | "IDEN";
    }) => {
      const current = useGrievanceDraftStore.getState().draft;
      const currentNode = current ? getWorkflowNode(current.stepId) : undefined;
      if (!current || currentNode?.id !== "identity") return;
      setIdentityBusy(true);
      setIdentityError(false);
      try {
        const protectedIdentity = await expoIdentityService.saveIdentity(current.id, {
          phone,
          cnic,
        });
        let next = applyAnswer(current, currentNode, "provided");
        next = {
          ...next,
          reporterIdentity: cnic
            ? {
                mode: "cnic",
                cnicLast4: protectedIdentity.cnicLast4!,
                phoneLast4: protectedIdentity.phoneLast4,
                cnicVerified: false,
              }
            : { mode: "phone", phoneLast4: protectedIdentity.phoneLast4, cnicVerified: false },
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
    },
    [setDraft],
  );

  const submitAnonymous = useCallback(async () => {
    const current = useGrievanceDraftStore.getState().draft;
    const currentNode = current ? getWorkflowNode(current.stepId) : undefined;
    if (!current || currentNode?.id !== "identity") return;
    setIdentityBusy(true);
    setIdentityError(false);
    try {
      await expoIdentityService.removeIdentity(current.id);
      let next = applyAnswer(current, currentNode, "anonymous");
      next = pushHistory({
        ...next,
        privacyMode: "ANON",
        reporterIdentity: { mode: "anonymous", cnicVerified: false },
        incident: {
          ...next.incident,
          structuredAnswers: {
            ...next.incident.structuredAnswers,
            identity: "anonymous",
            contactPreference: undefined,
          },
        },
      }, currentNode.id);
      await setDraft({ ...next, stepId: "category" });
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
    if (!current || currentNode?.id !== "where-current" || !current.location.exactCoordinates)
      return;
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

  const setVoice = useCallback(
    async (voice: VoiceEvidence | null) => {
      const current = useGrievanceDraftStore.getState().draft;
      if (!current) {
        return;
      }
      const next = { ...current, voice };
      await setDraft(next);
    },
    [setDraft],
  );

  const addEvidence = useCallback(
    async (kind: "photo" | "document") => {
      const current = useGrievanceDraftStore.getState().draft;
      if (!current) {
        return;
      }
      if (current.evidence.length >= 5) {
        setEvidenceError("attachment_count_limit");
        return;
      }
      setEvidenceError(null);
      setEvidenceBusy(true);
      try {
        const item =
          kind === "photo"
            ? await expoEvidenceService.pickPhoto()
            : await expoEvidenceService.pickDocument();
        const latest = useGrievanceDraftStore.getState().draft;
        if (!item || !latest) {
          return;
        }
        if (latest.evidence.length >= 5) throw Object.assign(new Error("attachment_count_limit"), { code: "attachment_count_limit" });
        const next = { ...latest, evidence: [...latest.evidence, item] };
        await setDraft(next);
      } catch (error) {
        setEvidenceError((error as Error & { code?: string }).code ?? "local_storage_failure");
      } finally {
        setEvidenceBusy(false);
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
      const next = {
        ...current,
        evidence: current.evidence.filter((item: Evidence) => item.id !== id),
      };
      await setDraft(next);
    },
    [setDraft],
  );

  const goToStep = useCallback(
    async (stepId: string) => {
      const current = useGrievanceDraftStore.getState().draft;
      if (!current) {
        return;
      }
      const fromReview = current.stepId === REVIEW_NODE_ID;
      const structuredAnswers = {
        ...answersFromDraft(current),
        [HISTORY_KEY]: historyFromDraft(current),
        ...(fromReview ? { [RETURN_TO_REVIEW_KEY]: "true" } : {}),
      };
      await setDraft({
        ...current,
        stepId,
        incident: { ...current.incident, structuredAnswers },
      });
    },
    [setDraft],
  );

  const progress = useMemo(() => {
    if (!draft || !node) {
      return workflowPathProgress(INTRO_NODE_ID, {});
    }
    return workflowPathProgress(node.id, mergedAnswers(draft));
  }, [draft, node]);

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
    progress,
    voiceBusy,
    evidenceError,
    evidenceBusy,
    syncItem,
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
    submitAnonymous,
    requestCurrentLocation,
    confirmCurrentLocation,
    useManualLocation,
  };
}
