import {
  isConnectivityState,
  persistenceKeys,
  SEED_VERSION,
  type ConnectivityState,
} from "@kapas/domain";

import {
  createMobileComplaintRepository,
  createPortalComplaintRepository,
  type ComplaintRepositoryContract,
} from "./repositories/ComplaintRepository";
import { createMemoryStore, type KeyValueStore } from "./storage/KeyValueStore";

export interface DemoFlags {
  offline: boolean;
  connectivity: ConnectivityState;
  aiFailure: boolean;
  aiDelayMs: number;
  aiConfidenceOverride: "high" | "medium" | "low" | null;
  activeScenarioId: string | null;
  portalInjected: boolean;
  workerTrackingStep: string | null;
}

export type PersistenceNotice = "schema-reset" | "corrupt-draft" | null;

const defaultFlags = (): DemoFlags => ({
  offline: false,
  connectivity: "online",
  aiFailure: false,
  aiDelayMs: 0,
  aiConfidenceOverride: null,
  activeScenarioId: null,
  portalInjected: false,
  workerTrackingStep: null,
});

let portalRepo = createPortalComplaintRepository(createMemoryStore());
let mobileRepo = createMobileComplaintRepository(createMemoryStore());
let flags = defaultFlags();
let demoStore: KeyValueStore = createMemoryStore();
let draftStore: KeyValueStore = createMemoryStore();
let persistenceNotice: PersistenceNotice = null;

function syncOfflineFlag(next: DemoFlags): DemoFlags {
  return {
    ...next,
    offline: next.connectivity !== "online",
  };
}

async function persistFlags(): Promise<void> {
  await demoStore.setItem(persistenceKeys.demo, JSON.stringify(flags));
  await demoStore.setItem(
    persistenceKeys.connectivity,
    JSON.stringify({ schemaVersion: SEED_VERSION, state: flags.connectivity }),
  );
}

export async function persistDemoFlags(): Promise<void> {
  await persistFlags();
}

export function configureMockRuntime(input?: {
  portalStore?: KeyValueStore;
  mobileStore?: KeyValueStore;
  demoStore?: KeyValueStore;
}): void {
  portalRepo = createPortalComplaintRepository(input?.portalStore ?? createMemoryStore());
  mobileRepo = createMobileComplaintRepository(input?.mobileStore ?? createMemoryStore());
  demoStore = input?.demoStore ?? input?.mobileStore ?? input?.portalStore ?? createMemoryStore();
  draftStore = input?.mobileStore ?? createMemoryStore();
  flags = defaultFlags();
  persistenceNotice = null;
}

export function getPortalRepository(): ComplaintRepositoryContract {
  return portalRepo;
}

export function getMobileRepository(): ComplaintRepositoryContract {
  return mobileRepo;
}

export function getDraftStore(): KeyValueStore {
  return draftStore;
}

export function getDemoStore(): KeyValueStore {
  return demoStore;
}

export function getDemoFlags(): DemoFlags {
  return { ...flags };
}

export function getPersistenceNotice(): PersistenceNotice {
  return persistenceNotice;
}

export function setPersistenceNotice(value: PersistenceNotice): void {
  persistenceNotice = value;
}

export function patchDemoFlags(partial: Partial<DemoFlags>): void {
  const merged = { ...flags, ...partial };
  if (partial.connectivity) {
    flags = syncOfflineFlag(merged);
  } else if (partial.offline === true) {
    flags = syncOfflineFlag({
      ...merged,
      connectivity: flags.connectivity === "reconnecting" ? "reconnecting" : "offline-demo",
    });
  } else if (partial.offline === false) {
    flags = syncOfflineFlag({ ...merged, connectivity: "online" });
  } else {
    flags = syncOfflineFlag(merged);
  }
  void persistFlags();
}

export async function resetDemoFlags(): Promise<void> {
  flags = defaultFlags();
  persistenceNotice = null;
  await demoStore.removeItem(persistenceKeys.demo);
  await demoStore.removeItem(persistenceKeys.filters);
  await demoStore.removeItem(persistenceKeys.analyticsFilters);
  await demoStore.removeItem(persistenceKeys.connectivity);
  await draftStore.removeItem(persistenceKeys.draft);
  await draftStore.removeItem(persistenceKeys.draftRecoveryDismissed);
  await draftStore.removeItem(persistenceKeys.offlineQueue);
}

export async function hydrateDemoRuntime(): Promise<void> {
  const [demoRaw, connectivityRaw] = await Promise.all([
    demoStore.getItem(persistenceKeys.demo),
    demoStore.getItem(persistenceKeys.connectivity),
  ]);
  let next = defaultFlags();
  if (demoRaw) {
    try {
      const parsed = JSON.parse(demoRaw) as Partial<DemoFlags>;
      next = {
        ...next,
        ...parsed,
        connectivity: isConnectivityState(parsed.connectivity) ? parsed.connectivity : next.connectivity,
      };
    } catch {
      next = defaultFlags();
    }
  }
  if (connectivityRaw) {
    try {
      const parsed = JSON.parse(connectivityRaw) as { state?: unknown };
      if (isConnectivityState(parsed.state)) {
        next = { ...next, connectivity: parsed.state };
      }
    } catch {
      /* keep demo flags */
    }
  }
  flags = syncOfflineFlag(next);
}

export async function ensurePersistenceSchema(): Promise<{ reset: boolean }> {
  const raw = await demoStore.getItem(persistenceKeys.schema);
  if (!raw) {
    await portalRepo.reset();
    await demoStore.setItem(persistenceKeys.schema, String(SEED_VERSION));
    return { reset: false };
  }
  const version = Number.parseInt(raw, 10);
  if (version === SEED_VERSION) {
    return { reset: false };
  }
  await draftStore.removeItem(persistenceKeys.draft);
  await draftStore.removeItem(persistenceKeys.draftRecoveryDismissed);
  await draftStore.removeItem(persistenceKeys.offlineQueue);
  await demoStore.removeItem(persistenceKeys.demo);
  await demoStore.removeItem(persistenceKeys.connectivity);
  await demoStore.removeItem(persistenceKeys.filters);
  await demoStore.removeItem(persistenceKeys.analyticsFilters);
  await portalRepo.reset();
  const repo = getMobileRepository();
  const rows = await repo.list();
  await Promise.all(rows.filter((row) => row.status === "Draft").map((row) => repo.remove(row.id)));
  flags = defaultFlags();
  persistenceNotice = "schema-reset";
  await demoStore.setItem(persistenceKeys.schema, String(SEED_VERSION));
  return { reset: true };
}
