import type { ConnectivityState } from "@kapas/domain";
import {
  demoService,
  getDemoFlags,
  getPersistenceNotice,
  persistDemoFlags,
  type PersistenceNotice,
} from "@kapas/mock-services";
import { create } from "zustand";

import { bootLocalPersistence } from "../services/localPersistence";
import { offlineQueueService } from "../services/offlineQueueService";

interface ConnectivityStore {
  state: ConnectivityState;
  hydrated: boolean;
  persistenceNotice: PersistenceNotice;
  pendingCount: number;
  failedCount: number;
  hydrate: () => Promise<void>;
  refreshQueue: () => Promise<void>;
  setOffline: (value: boolean) => Promise<void>;
  simulateReconnect: () => Promise<void>;
  queueOne: () => Promise<void>;
  processQueue: () => Promise<void>;
  resetDemo: () => Promise<void>;
}

export const useConnectivityStore = create<ConnectivityStore>((set, get) => ({
  state: "online",
  hydrated: false,
  persistenceNotice: null,
  pendingCount: 0,
  failedCount: 0,
  hydrate: async () => {
    if (get().hydrated) {
      return;
    }
    await bootLocalPersistence();
    const flags = getDemoFlags();
    const items = await offlineQueueService.list();
    const pendingCount = items.filter((item) => item.status === "queued" || item.status === "failed").length;
    const failedCount = items.filter((item) => item.status === "failed").length;
    set({
      state: flags.connectivity,
      hydrated: true,
      persistenceNotice: getPersistenceNotice(),
      pendingCount,
      failedCount,
    });
  },
  refreshQueue: async () => {
    const items = await offlineQueueService.list();
    set({
      pendingCount: items.filter((item) => item.status === "queued" || item.status === "failed").length,
      failedCount: items.filter((item) => item.status === "failed").length,
      state: getDemoFlags().connectivity,
      persistenceNotice: getPersistenceNotice(),
    });
  },
  setOffline: async (value) => {
    demoService.setOffline(value);
    await persistDemoFlags();
    await get().refreshQueue();
  },
  simulateReconnect: async () => {
    set({ state: "reconnecting" });
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 1000);
    });
    try {
      await demoService.simulateReconnect();
      await persistDemoFlags();
    } catch {
      await persistDemoFlags();
    }
    await get().refreshQueue();
  },
  queueOne: async () => {
    await demoService.queueOneComplaint();
    await persistDemoFlags();
    await get().refreshQueue();
  },
  processQueue: async () => {
    await demoService.processQueue();
    await persistDemoFlags();
    await get().refreshQueue();
  },
  resetDemo: async () => {
    await demoService.reset();
    await persistDemoFlags();
    await get().refreshQueue();
  },
}));
