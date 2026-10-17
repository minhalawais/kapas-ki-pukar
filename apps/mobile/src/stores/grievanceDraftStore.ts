import type { ComplaintDraft, WorkerCategoryCode } from "@kapas/domain";
import { complaintService, getDemoFlags } from "@kapas/mock-services";
import { create } from "zustand";

import { emptyDraft } from "../features/grievance/mapDraft";

interface GrievanceDraftState {
  draft: ComplaintDraft | null;
  requestedCategory: WorkerCategoryCode | null;
  hydrated: boolean;
  error: boolean;
  hydrate: () => Promise<void>;
  setDraft: (draft: ComplaintDraft) => Promise<void>;
  startIfNeeded: () => Promise<ComplaintDraft>;
  setRequestedCategory: (category: WorkerCategoryCode | null) => void;
  resetAfterSubmit: () => void;
}

export const useGrievanceDraftStore = create<GrievanceDraftState>((set, get) => ({
  draft: null,
  requestedCategory: null,
  hydrated: false,
  error: false,
  hydrate: async () => {
    try {
      const existing = await complaintService.getDraft();
      set({ draft: existing, hydrated: true, error: false });
    } catch {
      set({ hydrated: true, error: true });
    }
  },
  setDraft: async (draft) => {
    const next = { ...draft, updatedAt: new Date().toISOString() };
    set({ draft: next, error: false });
    try {
      await complaintService.saveDraft(next);
    } catch {
      set({ error: true });
    }
  },
  startIfNeeded: async () => {
    const current = get().draft;
    if (current) {
      return current;
    }
    const created = emptyDraft(new Date().toISOString());
    const scenarioId = getDemoFlags().activeScenarioId;
    await get().setDraft(scenarioId ? { ...created, scenarioId } : created);
    return get().draft ?? created;
  },
  setRequestedCategory: (requestedCategory) => {
    set({ requestedCategory });
  },
  resetAfterSubmit: () => {
    set({ draft: null, requestedCategory: null, error: false });
  },
}));
