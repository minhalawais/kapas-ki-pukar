import type { ComplaintDraft, WorkerCategoryCode } from "@kapas/domain";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

import { emptyDraft } from "../features/grievance/mapDraft";
import { complaintPipelineV3Service } from "../services/complaintPipelineV3Service";
import { complaintV3Database } from "../services/complaintV3Database";
import { expoIdentityService } from "../services/expoIdentityService";

const DRAFT_KEY = "kapas.worker.draft.v1";
const DRAFT_MIGRATION_MARKER = "kapas.worker.draft-v3-migration.v1";
const V3_ENABLED = process.env.EXPO_PUBLIC_COMPLAINT_PIPELINE_V3_ENABLED === "true";
const EDITING_DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
let draftPersistenceQueue: Promise<unknown> = Promise.resolve();

/** Wait until the latest in-memory draft snapshot has finished persisting to V3 storage. */
export function awaitDraftPersisted(): Promise<void> {
  return draftPersistenceQueue.then(() => undefined);
}

interface GrievanceDraftState {
  draft: ComplaintDraft | null;
  requestedCategory: WorkerCategoryCode | null;
  hydrated: boolean;
  error: boolean;
  hydrate: () => Promise<void>;
  setDraft: (draft: ComplaintDraft) => Promise<void>;
  startIfNeeded: () => Promise<ComplaintDraft>;
  setRequestedCategory: (category: WorkerCategoryCode | null) => void;
  discardDraft: () => Promise<void>;
  resetAfterSubmit: () => void;
}

export const useGrievanceDraftStore = create<GrievanceDraftState>((set, get) => ({
  draft: null,
  requestedCategory: null,
  hydrated: false,
  error: false,
  hydrate: async () => {
    try {
      if (V3_ENABLED) {
        await complaintV3Database.initialize();
        const preparedDraftId = await SecureStore.getItemAsync(DRAFT_MIGRATION_MARKER);
        if (preparedDraftId && await complaintV3Database.getDraft(preparedDraftId)) {
          await AsyncStorage.removeItem(DRAFT_KEY);
          await SecureStore.deleteItemAsync(DRAFT_MIGRATION_MARKER);
        }
        const current = (await complaintV3Database.listDrafts()).find((item) => item.lifecycle === "editing");
        if (current) {
          if (Date.now() - Date.parse(current.updatedAt) > EDITING_DRAFT_MAX_AGE_MS) {
            await complaintPipelineV3Service.discard(current.id).catch(() => undefined);
            set({ draft: null, hydrated: true, error: false });
            return;
          }
          set({ draft: JSON.parse(current.answersJson) as ComplaintDraft, hydrated: true, error: false });
          return;
        }
        const legacyRaw = await AsyncStorage.getItem(DRAFT_KEY);
        if (legacyRaw) {
          const legacy = JSON.parse(legacyRaw) as ComplaintDraft;
          await complaintPipelineV3Service.stageDraft(legacy);
          await SecureStore.setItemAsync(DRAFT_MIGRATION_MARKER, legacy.id, {
            keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
          });
          set({ draft: legacy, hydrated: true, error: false });
          return;
        }
        set({ draft: null, hydrated: true, error: false });
        return;
      }
      const raw = await AsyncStorage.getItem(DRAFT_KEY);
      const existing = raw ? (JSON.parse(raw) as ComplaintDraft) : null;
      if (existing && Date.now() - Date.parse(existing.updatedAt) > EDITING_DRAFT_MAX_AGE_MS) {
        await AsyncStorage.removeItem(DRAFT_KEY);
        set({ draft: null, hydrated: true, error: false });
        return;
      }
      set({ draft: existing, hydrated: true, error: false });
    } catch (error) {
      console.error("[complaint-draft] hydration failed", {
        name: error instanceof Error ? error.name : "UnknownError",
        message: error instanceof Error ? error.message : "unknown_error",
      });
      set({ hydrated: true, error: true });
    }
  },
  setDraft: async (draft) => {
    const next = { ...draft, updatedAt: new Date().toISOString() };
    // Reflect input immediately so controlled text fields and subsequent
    // answers are based on the newest in-memory draft. Persist each snapshot
    // sequentially: V3 optimistic revisions cannot safely be read and written
    // by concurrent onChangeText events.
    set({ draft: next, error: false });
    const persist = draftPersistenceQueue.then(async () => {
      if (V3_ENABLED) await complaintPipelineV3Service.stageDraft(next);
      else await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(next));
    });
    draftPersistenceQueue = persist.then(
      () => undefined,
      () => undefined,
    );
    try {
      await persist;
    } catch (error) {
      console.error("[complaint-draft] persistence failed", {
        name: error instanceof Error ? error.name : "UnknownError",
        message: error instanceof Error ? error.message : "unknown_error",
      });
      set({ error: true });
    }
  },
  startIfNeeded: async () => {
    const current = get().draft;
    if (current) {
      return current;
    }
    const created = emptyDraft(new Date().toISOString());
    await get().setDraft(created);
    return get().draft ?? created;
  },
  setRequestedCategory: (requestedCategory) => {
    set({ requestedCategory });
  },
  discardDraft: async () => {
    const current = get().draft;
    if (current) {
      if (V3_ENABLED) {
        await complaintPipelineV3Service.discard(current.id).catch(() => undefined);
      } else {
        await AsyncStorage.removeItem(DRAFT_KEY);
        await expoIdentityService.removeIdentity(current.id).catch(() => undefined);
      }
    } else if (!V3_ENABLED) {
      await AsyncStorage.removeItem(DRAFT_KEY);
    }
    set({ draft: null, requestedCategory: null, error: false });
  },
  resetAfterSubmit: () => {
    set({ draft: null, requestedCategory: null, error: false });
    if (!V3_ENABLED) void AsyncStorage.removeItem(DRAFT_KEY);
  },
}));
