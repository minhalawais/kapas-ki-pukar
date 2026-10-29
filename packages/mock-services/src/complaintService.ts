import type { Complaint, ComplaintDraft, GroupImpact, SubcategoryCode, WorkerFeedback } from "@kapas/domain";
import {
  canSubmitDraft,
  demoPinFromTrackingId,
  getMinimumPriority,
  nextComplaintTrackingId,
  persistenceKeys,
  reconcilePriority,
} from "@kapas/domain";
import { dueAtFrom, receivedAction } from "@kapas/mock-data";

import { offlineQueueService } from "./offlineQueue";
import { getDemoFlags, getDraftStore, getMobileRepository, setPersistenceNotice } from "./runtime";

function asSubcategory(value: unknown): SubcategoryCode | undefined {
  return typeof value === "string" && value.includes("-") ? (value as SubcategoryCode) : undefined;
}

function contactAllowed(draft: ComplaintDraft): boolean {
  if (draft.privacyMode === "ANON") {
    return false;
  }
  const preference = draft.incident.structuredAnswers?.contactPreference;
  return preference !== "none";
}

function privacySafeStructuredAnswers(draft: ComplaintDraft): Record<string, unknown> {
  const answers = { ...(draft.incident.structuredAnswers ?? {}) };
  if (draft.privacyMode === "ANON") {
    delete answers.alternateContact;
    delete answers.phone;
    delete answers.cnic;
    delete answers.identityValue;
  }
  return answers;
}

function buildComplaintFromDraft(
  draft: ComplaintDraft,
  trackingId: string,
  at: string,
  status: "Received",
): Complaint {
  const subcategory = asSubcategory(draft.incident.structuredAnswers?.subcategory);
  const floor = getMinimumPriority({
    category: draft.category,
    immediateDanger: Boolean(draft.incident.immediateDanger),
    pesticideSymptoms: Boolean(draft.incident.structuredAnswers?.pesticideSymptoms),
    harassmentThreat: Boolean(draft.incident.structuredAnswers?.harassmentThreat),
    privacyMode: draft.privacyMode,
  });
  const priority = reconcilePriority(draft.ai?.suggestedPriority ?? "Standard", floor);
  const range = (draft.incident.othersAffected ?? "not-sure") as GroupImpact;
  const structuredAnswers = {
    ...privacySafeStructuredAnswers(draft),
    ...(draft.privacyMode === "ANON" ? { demoPin: demoPinFromTrackingId(trackingId) } : {}),
  };
  return {
    id: trackingId,
    trackingId,
    referenceNumber: trackingId,
    createdAt: at,
    submittedAt: at,
    updatedAt: at,
    dueAt: dueAtFrom(at, priority),
    categoryCode: draft.category ?? "OTH",
    subcategoryCode: subcategory,
    category: draft.category ?? "OTH",
    subcategory,
    priority,
    status,
    privacyMode: draft.privacyMode ?? "ANON",
    reporterType: "self",
    reporter: {
      type: "self",
      displayName: draft.privacyMode === "ANON" ? undefined : "Demo Worker",
      contactAllowed: contactAllowed(draft),
    },
    reporterIdentity: draft.privacyMode === "ANON" ? undefined : draft.reporterIdentity,
    location: {
      province: draft.location.province ?? "GPS location",
      district: draft.location.district ?? "GPS location",
      villageLabel: draft.location.villageLabel,
      placeLabel: draft.location.placeLabel,
      formattedAddress: draft.location.formattedAddress,
      source: draft.location.source,
      accuracyMeters: draft.location.accuracyMeters,
      exactCoordinates: draft.location.exactCoordinates ?? null,
    },
    othersAffected: range !== "individual" && range !== "not-sure",
    affectedRange: range,
    incident: {
      whenLabel: draft.incident.whenLabel ?? "unsure",
      description: draft.incident.description ?? draft.ai?.summaryEn,
      currentDanger: Boolean(draft.incident.immediateDanger),
      immediateDanger: Boolean(draft.incident.immediateDanger),
      othersAffected: range,
      structuredAnswers,
    },
    evidence: draft.evidence,
    voice: draft.voice,
    ai: draft.ai ?? null,
    actions: [receivedAction(at)],
    resolution: null,
    workerFeedback: null,
    overdue: false,
  };
}

export const complaintService = {
  async listMine(): Promise<Complaint[]> {
    const rows = await getMobileRepository().list();
    return [...rows].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  },
  async getById(id: string): Promise<Complaint | null> {
    return getMobileRepository().get(id);
  },
  async createFromDraft(draft: ComplaintDraft): Promise<Complaint> {
    if (!canSubmitDraft(draft)) {
      throw new Error("Draft is missing required identity, complaint, location, or privacy details.");
    }
    const queued = await offlineQueueService.findByDraftId(draft.id);
    if (queued) {
      const existing = await getMobileRepository().get(queued.complaintId);
      if (existing) {
        await getDraftStore().removeItem(persistenceKeys.draft);
        return existing;
      }
    }
    const repo = getMobileRepository();
    const existing = await repo.list();
    const trackingId = nextComplaintTrackingId(existing.map((row) => row.trackingId));
    const at = new Date().toISOString();
    const offline = getDemoFlags().offline;
    const complaint = buildComplaintFromDraft(draft, trackingId, at, "Received");
    await repo.save(complaint);
    if (offline) {
      await offlineQueueService.enqueueSavedComplaint(complaint, draft);
    }
    await getDraftStore().removeItem(persistenceKeys.draft);
    return complaint;
  },
  async saveDraft(draft: ComplaintDraft): Promise<void> {
    await getDraftStore().setItem(persistenceKeys.draft, JSON.stringify(draft));
  },
  async getDraft(): Promise<ComplaintDraft | null> {
    const raw = await getDraftStore().getItem(persistenceKeys.draft);
    if (!raw) {
      return null;
    }
    try {
      const parsed = JSON.parse(raw) as ComplaintDraft;
      if (typeof parsed.id !== "string" || typeof parsed.stepId !== "string") {
        throw new Error("corrupt");
      }
      return parsed;
    } catch {
      await getDraftStore().removeItem(persistenceKeys.draft);
      setPersistenceNotice("corrupt-draft");
      return null;
    }
  },
  async discardDraft(): Promise<void> {
    await getDraftStore().removeItem(persistenceKeys.draft);
  },
  async submitWorkerFeedback(id: string, feedback: WorkerFeedback): Promise<void> {
    const repo = getMobileRepository();
    const current = await repo.get(id);
    if (!current) {
      return;
    }
    const next: Complaint = {
      ...current,
      workerFeedback: feedback,
      updatedAt: feedback.submittedAt,
      actions: [
        ...current.actions,
        {
          id: `${feedback.submittedAt}-feedback`,
          type: "Worker Feedback Recorded",
          at: feedback.submittedAt,
          actorRole: "worker",
          note: feedback.outcome,
        },
      ],
    };
    await repo.save(next);
  },
};
