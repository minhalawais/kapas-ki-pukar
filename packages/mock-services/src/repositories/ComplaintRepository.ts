import type { CaseAction, CaseStatus, Complaint } from "@kapas/domain";
import { persistenceKeys, withDerivedFields } from "@kapas/domain";
import { generateComplaints, mobileDemoComplaints } from "@kapas/mock-data";

import type { KeyValueStore } from "../storage/KeyValueStore";

export interface ComplaintRepositoryContract {
  list(): Promise<Complaint[]>;
  get(id: string): Promise<Complaint | null>;
  save(complaint: Complaint): Promise<void>;
  remove(id: string): Promise<void>;
  reset(): Promise<void>;
}

function legacyAction(complaint: Complaint, type: CaseAction["type"], note: string): CaseAction {
  return {
    id: `legacy-${complaint.id}-${type.toLowerCase().replaceAll(" ", "-")}`,
    type,
    note,
    at: complaint.updatedAt,
    actorRole: "system",
    visibility: "worker-visible",
  };
}

function normalizeLegacyComplaint(row: Complaint): Complaint {
  const legacyStatus = row.status as string;
  let status = row.status as CaseStatus;
  const actions = [...row.actions];

  if (legacyStatus === "New") {
    status = "Submitted";
  }

  if (legacyStatus === "Awaiting Worker") {
    status = "Under Review";
    if (!actions.some((action) => action.type === "More Information Requested")) {
      actions.push(legacyAction(row, "More Information Requested", "More information requested from worker."));
    }
  }

  if (legacyStatus === "Escalated") {
    status = "Under Review";
    if (!actions.some((action) => action.type === "Escalated")) {
      actions.push(legacyAction(row, "Escalated", "Case escalated for urgent handling."));
    }
  }

  return withDerivedFields({ ...row, status, actions });
}

export class PersistedComplaintRepository implements ComplaintRepositoryContract {
  private cache: Complaint[] | null = null;

  constructor(
    private readonly store: KeyValueStore,
    private readonly key: string,
    private readonly seed: () => Complaint[],
    private readonly seedWhenStoredEmpty = false,
  ) {}

  async list(): Promise<Complaint[]> {
    const rows = await this.load();
    return rows.map((row) => withDerivedFields(row));
  }

  async get(id: string): Promise<Complaint | null> {
    const rows = await this.list();
    return rows.find((row) => row.id === id || row.trackingId === id) ?? null;
  }

  async save(complaint: Complaint): Promise<void> {
    const rows = await this.load();
    const next = rows.filter((row) => row.id !== complaint.id);
    next.push(withDerivedFields(complaint));
    next.sort((a, b) => a.trackingId.localeCompare(b.trackingId));
    this.cache = next;
    await this.store.setItem(this.key, JSON.stringify(next));
  }

  async remove(id: string): Promise<void> {
    const rows = await this.load();
    this.cache = rows.filter((row) => row.id !== id && row.trackingId !== id);
    await this.store.setItem(this.key, JSON.stringify(this.cache));
  }

  async reset(): Promise<void> {
    this.cache = this.seed().map((row) => withDerivedFields(row));
    await this.store.setItem(this.key, JSON.stringify(this.cache));
  }

  private async load(): Promise<Complaint[]> {
    if (this.cache) {
      return this.cache;
    }
    const raw = await this.store.getItem(this.key);
    if (!raw) {
      await this.reset();
      return this.cache ?? [];
    }
    try {
      this.cache = (JSON.parse(raw) as Complaint[]).map((row) => normalizeLegacyComplaint(row));
      if (this.seedWhenStoredEmpty && this.cache.length === 0) {
        await this.reset();
      }
    } catch {
      await this.reset();
    }
    return this.cache ?? [];
  }
}

export function createPortalComplaintRepository(store: KeyValueStore): ComplaintRepositoryContract {
  return new PersistedComplaintRepository(store, persistenceKeys.webComplaints, () =>
    generateComplaints(),
  );
}

export function createMobileComplaintRepository(store: KeyValueStore): ComplaintRepositoryContract {
  return new PersistedComplaintRepository(
    store,
    persistenceKeys.mobileComplaints,
    () => mobileDemoComplaints(),
    true,
  );
}
