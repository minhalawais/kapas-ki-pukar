import type { Complaint, ComplaintDraft } from "@kapas/domain";
import { persistenceKeys, SEED_VERSION } from "@kapas/domain";
import { dueAtFrom } from "@kapas/mock-data";

import { caseLifecycleService } from "./lifecycle/CaseLifecycleService";
import { getDemoFlags, getDraftStore, getMobileRepository } from "./runtime";

export const offlineQueueStatuses = ["queued", "sending", "submitted", "failed"] as const;
export type OfflineQueueStatus = (typeof offlineQueueStatuses)[number];

export interface OfflineQueueItem {
  id: string;
  draftId: string;
  complaintId: string;
  draftSnapshot: ComplaintDraft;
  mediaRefs: {
    voiceUri?: string;
    evidenceUris: string[];
  };
  createdAt: string;
  retryCount: number;
  status: OfflineQueueStatus;
}

interface OfflineQueueFile {
  schemaVersion: number;
  items: OfflineQueueItem[];
}

const emptyFile = (): OfflineQueueFile => ({
  schemaVersion: SEED_VERSION,
  items: [],
});

function sleep(ms: number): Promise<void> {
  if (ms <= 0) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function readQueue(): Promise<OfflineQueueFile> {
  const raw = await getDraftStore().getItem(persistenceKeys.offlineQueue);
  if (!raw) {
    return emptyFile();
  }
  try {
    const parsed = JSON.parse(raw) as OfflineQueueFile;
    if (!Array.isArray(parsed.items)) {
      throw new Error("invalid queue");
    }
    return {
      schemaVersion: SEED_VERSION,
      items: parsed.items,
    };
  } catch {
    await getDraftStore().removeItem(persistenceKeys.offlineQueue);
    return emptyFile();
  }
}

async function writeQueue(file: OfflineQueueFile): Promise<void> {
  await getDraftStore().setItem(persistenceKeys.offlineQueue, JSON.stringify(file));
}

function mediaRefsFrom(draft: ComplaintDraft): OfflineQueueItem["mediaRefs"] {
  return {
    voiceUri: draft.voice?.localUri,
    evidenceUris: draft.evidence.map((item) => item.localUri),
  };
}

export const offlineQueueService = {
  async list(): Promise<OfflineQueueItem[]> {
    const file = await readQueue();
    return file.items;
  },
  async pendingCount(): Promise<number> {
    const items = await this.list();
    return items.filter((item) => item.status === "queued" || item.status === "failed").length;
  },
  async findByDraftId(draftId: string): Promise<OfflineQueueItem | null> {
    const items = await this.list();
    return items.find((item) => item.draftId === draftId) ?? null;
  },
  async enqueueSavedComplaint(complaint: Complaint, draft: ComplaintDraft): Promise<OfflineQueueItem> {
    const existing = await this.findByDraftId(draft.id);
    if (existing) {
      return existing;
    }
    const createdAt = new Date().toISOString();
    const item: OfflineQueueItem = {
      id: `queue-${complaint.id}`,
      draftId: draft.id,
      complaintId: complaint.id,
      draftSnapshot: draft,
      mediaRefs: mediaRefsFrom(draft),
      createdAt,
      retryCount: 0,
      status: "queued",
    };
    const file = await readQueue();
    file.items.push(item);
    await writeQueue(file);
    return item;
  },
  async processQueue(): Promise<{ processed: number; failed: number }> {
    const file = await readQueue();
    const pending = file.items.filter((item) => item.status === "queued" || item.status === "failed");
    let processed = 0;
    let failed = 0;
    const delay = getDemoFlags().aiDelayMs;
    for (const item of pending) {
      item.status = "sending";
      await writeQueue(file);
      await sleep(delay);
      try {
        const repo = getMobileRepository();
        const current = await repo.get(item.complaintId);
        if (!current) {
          throw new Error("Queued complaint missing.");
        }
        if (current.status !== "Draft") {
          item.status = "submitted";
          processed += 1;
          await writeQueue(file);
          continue;
        }
        const at = new Date().toISOString();
        const submitted = caseLifecycleService.transition(current, "Submitted", {
          at,
          actorRole: "system",
          note: "Queued send completed",
        });
        const next: Complaint = {
          ...submitted,
          submittedAt: at,
          dueAt: dueAtFrom(at, submitted.priority),
        };
        await repo.save(next);
        item.status = "submitted";
        processed += 1;
      } catch {
        item.retryCount += 1;
        item.status = "failed";
        failed += 1;
      }
      await writeQueue(file);
    }
    return { processed, failed };
  },
  async clear(): Promise<void> {
    await getDraftStore().removeItem(persistenceKeys.offlineQueue);
  },
};
