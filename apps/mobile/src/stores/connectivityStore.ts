import type { ConnectivityState } from "@kapas/domain";
import { create } from "zustand";

import { bootLocalPersistence } from "../services/localPersistence";
import { getPersistenceNotice, type PersistenceNotice } from "../services/localPersistence";
import {
  productionSyncService,
  type SyncMediaReplacement,
  type SyncQueueItem,
} from "../services/productionSyncService";

import { useGrievanceDraftStore } from "./grievanceDraftStore";

interface MediaRecovery {
  itemId: string;
  mediaId: string;
  kind: SyncQueueItem["media"][number]["kind"];
  originalName: string;
  canDiscardComplaint: boolean;
  complaintAccepted: boolean;
}

let retryTimer: ReturnType<typeof setTimeout> | undefined;
let queueSubscription: (() => void) | undefined;

function scheduleNextAttempt(items: SyncQueueItem[]) {
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = undefined;
  const next = items
    .map((item) => item.nextAttemptAt)
    .filter((value): value is string => Boolean(value))
    .sort()[0];
  if (!next) return;
  retryTimer = setTimeout(
    () => {
      void useConnectivityStore.getState().processQueue();
    },
    Math.max(250, new Date(next).getTime() - Date.now()),
  );
}

function queueState(items: SyncQueueItem[]) {
  const recoveryItem = items.find(
    (item) =>
      item.status === "blocked" ||
      item.status === "retryable_failed" ||
      item.media.some((media) => media.state === "rejected"),
  );
  const recoveryMedia = recoveryItem
    ? (recoveryItem.media.find((media) => media.state === "rejected") ??
      recoveryItem.media.find((media) => media.id === recoveryItem.lastErrorMediaId) ??
      recoveryItem.media.find((media) => media.state === "pending"))
    : undefined;
  return {
    pendingCount: items.filter((item) =>
      ["local", "uploading", "ready", "submitting", "retryable_failed"].includes(item.status),
    ).length,
    failedCount: items.filter(
      (item) =>
        item.status === "retryable_failed" ||
        item.status === "blocked" ||
        item.media.some((media) => media.state === "rejected"),
    ).length,
    lastErrorCode:
      recoveryMedia?.lastErrorCode ??
      recoveryItem?.lastErrorCode ??
      items.find((item) => item.lastErrorCode)?.lastErrorCode ??
      null,
    mediaRecovery:
      recoveryItem && recoveryMedia
        ? {
            itemId: recoveryItem.clientSubmissionId,
            mediaId: recoveryMedia.id,
            kind: recoveryMedia.kind,
            originalName: recoveryMedia.originalName,
            canDiscardComplaint: recoveryItem.status !== "acknowledged",
            complaintAccepted: recoveryItem.status === "acknowledged",
          }
        : null,
  };
}

interface ConnectivityStore {
  state: ConnectivityState;
  hydrated: boolean;
  persistenceNotice: PersistenceNotice;
  pendingCount: number;
  failedCount: number;
  lastErrorCode: string | null;
  mediaRecovery: MediaRecovery | null;
  hydrate: () => Promise<void>;
  refreshQueue: () => Promise<void>;
  processQueue: () => Promise<void>;
  retryFailed: () => Promise<void>;
  replaceMissingMedia: (replacement: SyncMediaReplacement) => Promise<void>;
  omitMissingMedia: () => Promise<void>;
  discardFailedReport: () => Promise<void>;
  setNetworkAvailable: (available: boolean) => void;
}

export const useConnectivityStore = create<ConnectivityStore>((set, get) => ({
  state: "online",
  hydrated: false,
  persistenceNotice: null,
  pendingCount: 0,
  failedCount: 0,
  lastErrorCode: null,
  mediaRecovery: null,
  hydrate: async () => {
    if (get().hydrated) {
      return;
    }
    await bootLocalPersistence();
    const items = await productionSyncService.list();
    scheduleNextAttempt(items);
    set({
      state: "online",
      hydrated: true,
      persistenceNotice: getPersistenceNotice(),
      ...queueState(items),
    });
    queueSubscription ??= productionSyncService.subscribe(() => {
      void get().refreshQueue();
    });
    void get().processQueue();
  },
  refreshQueue: async () => {
    const items = await productionSyncService.list();
    scheduleNextAttempt(items);
    set({
      ...queueState(items),
      state: "online",
      persistenceNotice: getPersistenceNotice(),
    });
  },
  processQueue: async () => {
    await productionSyncService.process();
    await get().refreshQueue();
  },
  retryFailed: async () => {
    set({ state: "reconnecting" });
    try {
      await productionSyncService.retryFailed();
      await productionSyncService.process();
    } finally {
      await get().refreshQueue();
    }
  },
  replaceMissingMedia: async (replacement) => {
    const recovery = get().mediaRecovery;
    if (!recovery) return;
    set({ state: "reconnecting" });
    try {
      await productionSyncService.replaceMedia(recovery.itemId, recovery.mediaId, replacement);
      const result = await productionSyncService.process();
      if (
        result.acknowledged > 0 &&
        useGrievanceDraftStore.getState().draft?.id === recovery.itemId
      ) {
        useGrievanceDraftStore.getState().resetAfterSubmit();
      }
    } finally {
      await get().refreshQueue();
    }
  },
  omitMissingMedia: async () => {
    const recovery = get().mediaRecovery;
    if (!recovery) return;
    set({ state: "reconnecting" });
    try {
      await productionSyncService.omitMedia(recovery.itemId, recovery.mediaId);
      const result = await productionSyncService.process();
      if (
        result.acknowledged > 0 &&
        useGrievanceDraftStore.getState().draft?.id === recovery.itemId
      ) {
        useGrievanceDraftStore.getState().resetAfterSubmit();
      }
    } finally {
      await get().refreshQueue();
    }
  },
  discardFailedReport: async () => {
    const recovery = get().mediaRecovery;
    if (!recovery) return;
    await productionSyncService.discard(recovery.itemId);
    if (useGrievanceDraftStore.getState().draft?.id === recovery.itemId) {
      useGrievanceDraftStore.getState().resetAfterSubmit();
    }
    await get().refreshQueue();
  },
  setNetworkAvailable: (available) => {
    const previous = get().state;
    set({ state: available ? "online" : "offline-demo" });
    if (available && previous === "offline-demo") void get().processQueue();
  },
}));
