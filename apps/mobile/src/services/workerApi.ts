import type { WorkerComplaintDetail } from "@kapas/domain";
import * as FileSystem from "expo-file-system/legacy";
import * as SecureStore from "expo-secure-store";
import * as Sharing from "expo-sharing";

import { getApiUrl } from "./apiUrl";
import { productionSyncService } from "./productionSyncService";

const SECRET_PREFIX = "kapas.tracking-secret.";
const REFERENCE_PATTERN = /^KP-\d+-\d+$/iu;

export interface TrackedComplaint extends WorkerComplaintDetail {
  readonly draftId: string;
}

interface DraftLocator {
  readonly referenceNumber: string;
  readonly clientSubmissionId: string;
}

interface WorkerSessionCredentials {
  readonly sessionToken: string;
  readonly expiresAt?: string;
}

let historySessionCache: WorkerSessionCredentials | null = null;

async function createHistorySession(): Promise<WorkerSessionCredentials | null> {
  if (
    historySessionCache?.expiresAt &&
    new Date(historySessionCache.expiresAt).getTime() > Date.now() + 30_000
  )
    return historySessionCache;
  const items = [
    ...(await productionSyncService.listRegistry()),
    ...(await productionSyncService.list()),
  ].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  for (const item of items) {
    const identity = await (
      await import("./expoIdentityService")
    ).expoIdentityService.getIdentity(item.clientSubmissionId);
    if (!identity?.phone) continue;
    const response = await fetch(`${getApiUrl()}/api/v1/worker-history-sessions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(identity),
    });
    if (!response.ok) continue;
    const body = (await response.json()) as { sessionToken?: string; expiresAt?: string };
    if (body.sessionToken) {
      historySessionCache = { sessionToken: body.sessionToken, expiresAt: body.expiresAt };
      const registry = await productionSyncService.listRegistry();
      await Promise.allSettled(
        registry.map(async (entry) => {
          const secret = await SecureStore.getItemAsync(`${SECRET_PREFIX}${entry.referenceNumber}`);
          if (!secret) return;
          await fetch(
            `${getApiUrl()}/api/v1/worker/complaints/${encodeURIComponent(entry.referenceNumber)}/claim`,
            {
              method: "POST",
              headers: {
                "content-type": "application/json",
                authorization: `Bearer ${body.sessionToken}`,
              },
              body: JSON.stringify({ trackingSecret: secret }),
            },
          );
        }),
      );
      return historySessionCache;
    }
  }
  return null;
}

export interface WorkerEvidenceSource {
  readonly uri: string;
  readonly headers: { readonly Authorization: string };
}

async function listLocalComplaintEntries() {
  return [
    ...(await productionSyncService.listRegistry()),
    ...(await productionSyncService.list()),
  ];
}

async function resolveDraftLocator(draftId: string): Promise<DraftLocator | null> {
  const normalizedRef = draftId.replace(/^server:/u, "");
  const items = await listLocalComplaintEntries();
  const matched = items.find((entry) => {
    const row = entry as { clientSubmissionId: string; referenceNumber?: string };
    return (
      row.clientSubmissionId === draftId ||
      row.referenceNumber === normalizedRef ||
      (row.referenceNumber ? draftId === `server:${row.referenceNumber}` : false)
    );
  });
  if (matched?.referenceNumber) {
    return {
      referenceNumber: matched.referenceNumber,
      clientSubmissionId: matched.clientSubmissionId,
    };
  }
  if (process.env.EXPO_PUBLIC_COMPLAINT_PIPELINE_V3_ENABLED === "true") {
    const { complaintV3Database } = await import("./complaintV3Database");
    const draft = await complaintV3Database.getDraft(draftId);
    if (draft?.referenceNumber) {
      return { referenceNumber: draft.referenceNumber, clientSubmissionId: draft.id };
    }
  }
  if (REFERENCE_PATTERN.test(normalizedRef)) {
    return { referenceNumber: normalizedRef, clientSubmissionId: draftId };
  }
  return null;
}

async function workerSessionForReference(
  referenceNumber: string,
): Promise<WorkerSessionCredentials | null> {
  const history = await createHistorySession();
  if (history) return history;
  const secret = await SecureStore.getItemAsync(`${SECRET_PREFIX}${referenceNumber}`);
  if (!secret) return null;
  return createWorkerSession(referenceNumber, secret);
}

async function createWorkerSession(
  referenceNumber: string,
  secret: string,
): Promise<WorkerSessionCredentials> {
  const apiUrl = getApiUrl();
  const session = await fetch(`${apiUrl}/api/v1/worker-sessions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ referenceNumber, trackingSecret: secret }),
  });
  if (!session.ok) throw new Error("worker_authentication_failed");
  const body = (await session.json()) as { sessionToken?: string; expiresAt?: string };
  if (!body.sessionToken) throw new Error("worker_session_missing");
  return { sessionToken: body.sessionToken, expiresAt: body.expiresAt };
}

async function authenticatedRequest(
  referenceNumber: string,
  secret: string,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const apiUrl = getApiUrl();
  const session = await createWorkerSession(referenceNumber, secret);
  return fetch(`${apiUrl}${path}`, {
    ...init,
    headers: { ...(init?.headers ?? {}), authorization: `Bearer ${session.sessionToken}` },
  });
}

async function credentialsForDraft(draftId: string) {
  const locator = await resolveDraftLocator(draftId);
  if (!locator) throw new Error("worker_reference_missing");
  const secret = await SecureStore.getItemAsync(`${SECRET_PREFIX}${locator.referenceNumber}`);
  if (!secret) throw new Error("worker_secret_missing");
  return { referenceNumber: locator.referenceNumber, secret };
}

function evidenceCacheExtension(mimeType?: string, kind?: string) {
  const mime = mimeType?.toLowerCase() ?? "";
  if (mime.includes("jpeg") || mime.includes("jpg")) return ".jpg";
  if (mime.includes("png")) return ".png";
  if (mime.includes("webp")) return ".webp";
  if (mime.includes("pdf")) return ".pdf";
  if (mime.includes("mpeg") || mime.includes("mp4") || mime.includes("m4a")) return ".m4a";
  if (kind === "photo") return ".jpg";
  if (kind === "voice") return ".m4a";
  return ".bin";
}

function evidenceCachePath(evidenceId: string, mimeType?: string, kind?: string) {
  const safe = evidenceId.replace(/[^A-Za-z0-9-]/g, "_");
  return `${FileSystem.cacheDirectory}kapas-evidence-${safe}${evidenceCacheExtension(mimeType, kind)}`;
}

async function localAttachmentFileUri(
  draftId: string,
  evidenceId: string,
): Promise<string | null> {
  if (process.env.EXPO_PUBLIC_COMPLAINT_PIPELINE_V3_ENABLED !== "true") return null;
  const { complaintV3Database } = await import("./complaintV3Database");
  const locator = await resolveDraftLocator(draftId);
  let aggregateId = locator?.clientSubmissionId ?? draftId;
  if (locator?.referenceNumber) {
    const draft = (await complaintV3Database.listDrafts()).find(
      (row) => row.referenceNumber === locator.referenceNumber,
    );
    if (draft) aggregateId = draft.id;
  }
  const attachment =
    (await complaintV3Database.getAttachment(evidenceId)) ??
    (await complaintV3Database.listAttachments(aggregateId)).find(
      (row) => row.serverEvidenceId === evidenceId || row.id === evidenceId,
    ) ??
    null;
  if (!attachment?.localPath) return null;
  const info = await FileSystem.getInfoAsync(attachment.localPath);
  if (!info.exists) return null;
  return info.uri ?? attachment.localPath;
}

/** Authenticated evidence bytes saved locally — use for Image/audio (RN often ignores remote auth headers). */
export async function getWorkerEvidenceLocalUri(
  draftId: string,
  evidenceId: string,
  options?: { mimeType?: string; kind?: string },
): Promise<{ uri: string }> {
  const cachePath = evidenceCachePath(evidenceId, options?.mimeType, options?.kind);
  const cached = await FileSystem.getInfoAsync(cachePath);
  if (cached.exists && (cached.size ?? 0) > 0) {
    return { uri: cached.uri ?? cachePath };
  }
  const onDevice = await localAttachmentFileUri(draftId, evidenceId);
  if (onDevice) return { uri: onDevice };
  try {
    const source = await getWorkerEvidenceSource(draftId, evidenceId);
    const downloaded = await FileSystem.downloadAsync(source.uri, cachePath, {
      headers: source.headers,
    });
    if (downloaded.status < 200 || downloaded.status >= 300) {
      await FileSystem.deleteAsync(cachePath, { idempotent: true }).catch(() => undefined);
      throw new Error(`evidence_download_${downloaded.status}`);
    }
    return { uri: downloaded.uri };
  } catch (error) {
    const localUri = await localAttachmentFileUri(draftId, evidenceId);
    if (localUri) return { uri: localUri };
    throw error;
  }
}

export async function getWorkerEvidenceSource(
  draftId: string,
  evidenceId: string,
): Promise<WorkerEvidenceSource> {
  const locator = await resolveDraftLocator(draftId);
  if (!locator) throw new Error("worker_reference_missing");
  const session = await workerSessionForReference(locator.referenceNumber);
  if (!session) throw new Error("worker_authentication_failed");
  const apiUrl = getApiUrl();
  return {
    uri: `${apiUrl}/api/v1/worker/complaints/${encodeURIComponent(locator.referenceNumber)}/evidence/${encodeURIComponent(evidenceId)}/content`,
    headers: { Authorization: `Bearer ${session.sessionToken}` },
  };
}

export async function openWorkerDocument(
  draftId: string,
  evidenceId: string,
  originalName: string,
): Promise<void> {
  const source = await getWorkerEvidenceSource(draftId, evidenceId);
  const safeName = originalName.replace(/[^A-Za-z0-9._-]/g, "_") || "evidence.pdf";
  const target = `${FileSystem.cacheDirectory}kapas-${Date.now()}-${safeName}`;
  try {
    const downloaded = await FileSystem.downloadAsync(source.uri, target, {
      headers: source.headers,
    });
    if (!(await Sharing.isAvailableAsync())) throw new Error("document_viewer_unavailable");
    await Sharing.shareAsync(downloaded.uri, {
      mimeType: "application/pdf",
      dialogTitle: originalName,
    });
  } finally {
    await FileSystem.deleteAsync(target, { idempotent: true }).catch(() => undefined);
  }
}

export async function getWorkerComplaintByDraftId(
  draftId: string,
): Promise<TrackedComplaint | null> {
  const locator = await resolveDraftLocator(draftId);
  if (!locator) return null;
  const session = await workerSessionForReference(locator.referenceNumber);
  if (!session) return null;
  const response = await fetch(
    `${getApiUrl()}/api/v1/worker/complaints/${encodeURIComponent(locator.referenceNumber)}`,
    { headers: { authorization: `Bearer ${session.sessionToken}` } },
  );
  if (!response.ok) {
    if (response.status === 401 || response.status === 404) return null;
    throw new Error(`worker_complaint_${response.status}`);
  }
  const resolvedDraftId =
    draftId === locator.clientSubmissionId ||
    draftId === `server:${locator.referenceNumber}` ||
    draftId === locator.referenceNumber
      ? draftId
      : locator.clientSubmissionId;
  return {
    ...((await response.json()) as WorkerComplaintDetail),
    draftId: resolvedDraftId,
  };
}

export async function listWorkerComplaints(): Promise<TrackedComplaint[]> {
  // Complaint history is auxiliary to the local queue. A damaged/migrating
  // local store or an unavailable API must not prevent the complaints screen
  // from rendering its empty/offline state.
  let items: Array<{
    clientSubmissionId: string;
    referenceNumber?: string;
    updatedAt: string;
  }> = [];
  try {
    items = [
      ...(await productionSyncService.listRegistry()),
      ...(await productionSyncService.list()),
    ];
  } catch {
    return [];
  }
  let history: WorkerSessionCredentials | null = null;
  try {
    history = await createHistorySession();
  } catch {
    historySessionCache = null;
  }
  if (history) {
    let response = await fetch(`${getApiUrl()}/api/v1/worker/complaints`, {
      headers: { authorization: `Bearer ${history.sessionToken}` },
    });
    if (response.status === 401) {
      historySessionCache = null;
      const refreshed = await createHistorySession();
      if (refreshed)
        response = await fetch(`${getApiUrl()}/api/v1/worker/complaints`, {
          headers: { authorization: `Bearer ${refreshed.sessionToken}` },
        });
    }
    if (!response.ok) throw new Error(`worker_complaints_${response.status}`);
    const payload = (await response.json()) as { items: WorkerComplaintDetail[] };
    const mapped = payload.items.map((complaint) => ({
      ...complaint,
      draftId:
        items.find((item) => item.referenceNumber === complaint.referenceNumber)
          ?.clientSubmissionId ?? `server:${complaint.referenceNumber}`,
    }));
    return Array.from(new Map(mapped.map((complaint) => [complaint.referenceNumber, complaint])).values());
  }
  const results = await Promise.allSettled(
    items
      .filter((item) => item.referenceNumber)
      .map((item) => getWorkerComplaintByDraftId(item.clientSubmissionId)),
  );
  return Array.from(new Map(results.flatMap((result) =>
    result.status === "fulfilled" && result.value ? [result.value] : [],
  ).map((complaint) => [complaint.referenceNumber, complaint])).values());
}

export async function submitWorkerFeedback(
  draftId: string,
  outcome: string,
  comment?: string,
): Promise<void> {
  const { referenceNumber, secret } = await credentialsForDraft(draftId);
  const current = await getWorkerComplaintByDraftId(draftId);
  if (!current) throw new Error("worker_complaint_missing");
  const response = await authenticatedRequest(
    referenceNumber,
    secret,
    `/api/v1/worker/complaints/${encodeURIComponent(referenceNumber)}/feedback`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        outcome,
        comment,
        expectedVersion: current.version,
        requestId: `mobile-feedback-${Date.now()}`,
      }),
    },
  );
  if (!response.ok) throw new Error(`worker_feedback_${response.status}`);
}
