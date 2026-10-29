import type { ComplaintDraft } from "@kapas/domain";
import { xchacha20poly1305 } from "@noble/ciphers/chacha.js";
import { bytesToUtf8 } from "@noble/ciphers/utils.js";
import { utf8ToBytes } from "@noble/ciphers/utils.js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getRandomBytes } from "expo-crypto";
import { File, FileMode } from "expo-file-system";
import * as FileSystem from "expo-file-system/legacy";
import * as SecureStore from "expo-secure-store";
import { Upload } from "tus-js-client";

import { getApiUrl } from "./apiUrl";
import { complaintCompletionStatus, type ComplaintCompletionStatus } from "./complaintCompletion";
import { complaintPipelineV3Service } from "./complaintPipelineV3Service";
import { expoIdentityService } from "./expoIdentityService";
import { expoTusFileReader } from "./expoTusFileReader";
import { type MediaRecord, type MediaState, type SubmissionRecord, syncDatabase } from "./syncDatabase";

const REGISTRY_KEY = "kapas.complaint.registry.v1";
const LEGACY_QUEUE_KEY = "kapas.production.outbox.v1";
const MIGRATION_KEY = "kapas.production.outbox.sqlcipher-migrated.v1";
const LEGACY_LOCAL_KEY = "kapas.local-persistence-key.v1";
const LEGACY_QUARANTINE_KEY = "kapas.production.outbox.quarantine";
const TRACKING_SECRET_PREFIX = "kapas.tracking-secret.";
const MEDIA_FOLDER = "kapas-outbox-v2";
const CHUNK_SIZE = 1024 * 1024;
const LEASE_MS = 10 * 60_000;
const MAX_MEDIA_BYTES = 50 * 1024 * 1024;
const UPLOAD_PROTOCOL_V2_ENABLED = process.env.EXPO_PUBLIC_UPLOAD_PROTOCOL_V2_ENABLED !== "false";
const COMPLAINT_PIPELINE_V3_ENABLED = process.env.EXPO_PUBLIC_COMPLAINT_PIPELINE_V3_ENABLED === "true";
const RETRY_DELAYS = [2, 5, 15, 30, 60, 120, 300, 900].map((seconds) => seconds * 1000);

export const syncStatuses = ["local", "uploading", "ready", "submitting", "acknowledged", "retryable_failed", "blocked"] as const;
export type SyncStatus = (typeof syncStatuses)[number];

export interface SyncMediaItem {
  id: string;
  uri: string;
  kind: "voice" | "photo" | "document";
  originalName: string;
  mimeType: string;
  totalBytes: number;
  uploadedBytes: number;
  capturedAt?: string;
  recordedAt?: string;
  durationMs?: number;
  state: "pending" | "uploading" | "processing" | "uploaded" | "rejected" | "missing";
  uploadId?: string;
  uploadToken?: string;
  lastErrorCode?: string;
  managed?: boolean;
}

export interface SyncQueueItem {
  clientSubmissionId: string;
  schemaVersion: number;
  draft: ComplaintDraft;
  media: SyncMediaItem[];
  status: SyncStatus;
  submitRequested: boolean;
  attempts: number;
  nextAttemptAt: string | null;
  lastErrorCode?: string;
  lastErrorMediaId?: string;
  createdAt: string;
  updatedAt: string;
  referenceNumber?: string;
  completionStatus: ComplaintCompletionStatus;
}

export interface SyncMediaReplacement {
  uri: string;
  originalName: string;
  mimeType: string;
  capturedAt?: string;
  recordedAt?: string;
  durationMs?: number;
  byteLength?: number;
}

export interface ComplaintRegistryItem { clientSubmissionId: string; referenceNumber: string; updatedAt: string }
interface RegistryFile { schemaVersion: 1; items: ComplaintRegistryItem[] }
interface LegacyEnvelope { schemaVersion: 2; nonce: string; ciphertext: string }
interface LegacyQueue { schemaVersion: 1; items: Array<{
  clientSubmissionId: string; schemaVersion: number; draft: ComplaintDraft;
  media: Array<{ id: string; uri: string; kind: MediaRecord["kind"]; originalName: string;
    mimeType: string; capturedAt?: string; recordedAt?: string; durationMs?: number;
    state: "pending" | "uploaded"; uploadId?: string; uploadToken?: string; managed?: boolean }>;
  status: SyncStatus; attempts: number; nextAttemptAt?: string | null; lastErrorCode?: string;
  createdAt: string; updatedAt: string; referenceNumber?: string;
}> }
type ProcessResult = { acknowledged: number; retryableFailed: number; blocked: number };
type Listener = () => void;

const listeners = new Set<Listener>();
const activeUploads = new Map<string, Upload>();
let activeProcess: Promise<ProcessResult> | null = null;
let processRequested = false;
let lastEmitAt = 0;
let pendingEmit: ReturnType<typeof setTimeout> | undefined;
const now = () => new Date().toISOString();
const emit = () => {
  const remaining = 250 - (Date.now() - lastEmitAt);
  if (remaining <= 0) {
    if (pendingEmit) clearTimeout(pendingEmit);
    pendingEmit = undefined;
    lastEmitAt = Date.now();
    listeners.forEach((listener) => listener());
    return;
  }
  if (!pendingEmit) pendingEmit = setTimeout(() => {
    pendingEmit = undefined;
    lastEmitAt = Date.now();
    listeners.forEach((listener) => listener());
  }, remaining);
};
const safe = (value: string) => value.replace(/[^A-Za-z0-9._-]/gu, "-");
const extension = (value: string) => value.match(/\.[A-Za-z0-9]{1,10}$/u)?.[0]?.toLowerCase() ?? "";
const uploadIdFromUrl = (url?: string) => url?.split("/").filter(Boolean).at(-1);

function codedError(code: string, mediaId?: string): Error & { code: string; mediaId?: string } {
  return Object.assign(new Error(code), { code, mediaId });
}

function mediaDirectory(id: string) {
  if (!FileSystem.documentDirectory) throw codedError("local_storage_failure");
  return `${FileSystem.documentDirectory}${MEDIA_FOLDER}/${safe(id)}/`;
}

function retryAt(attempts: number, retryAfterMs?: number) {
  const base = retryAfterMs ?? RETRY_DELAYS[Math.min(attempts - 1, RETRY_DELAYS.length - 1)]!;
  const jitter = Math.round(base * (Math.random() * 0.3 - 0.15));
  return new Date(Date.now() + Math.max(1_000, base + jitter)).toISOString();
}

function toStatus(record: SubmissionRecord): SyncStatus {
  if (record.state === "acknowledged") return "acknowledged";
  if (record.state === "submitting") return "submitting";
  if (record.state === "ready") return "ready";
  if (record.state === "retryable_failed") return "retryable_failed";
  if (record.state === "blocked") return "blocked";
  if (["uploading", "processing"].includes(record.state)) return "uploading";
  return "local";
}

function toMediaState(state: MediaState): SyncMediaItem["state"] {
  if (state === "uploaded") return "uploaded";
  if (state === "processing") return "processing";
  if (state === "uploading" || state === "creating") return "uploading";
  if (state === "rejected") return "rejected";
  if (state === "missing") return "missing";
  return "pending";
}

async function queueItem(record: SubmissionRecord): Promise<SyncQueueItem> {
  const media = await syncDatabase.listMedia(record.clientSubmissionId);
  const projectedMedia = media.filter((entry) => entry.state !== "cancelled").map((entry) => ({
    id: entry.id, uri: entry.localUri, kind: entry.kind, originalName: entry.originalName,
    mimeType: entry.mimeType, totalBytes: entry.totalBytes, uploadedBytes: entry.uploadedBytes,
    capturedAt: entry.capturedAt, recordedAt: entry.recordedAt, durationMs: entry.durationMs,
    state: toMediaState(entry.state), uploadId: uploadIdFromUrl(entry.uploadUrl),
    uploadToken: entry.uploadToken, lastErrorCode: entry.lastErrorCode, managed: entry.managed,
  }));
  const status = toStatus(record);
  return {
    clientSubmissionId: record.clientSubmissionId,
    schemaVersion: record.schemaVersion,
    draft: JSON.parse(record.draftJson) as ComplaintDraft,
    media: projectedMedia,
    status, submitRequested: record.submitRequested, attempts: record.attempts,
    nextAttemptAt: record.nextAttemptAt ?? null, lastErrorCode: record.lastErrorCode,
    lastErrorMediaId: media.find((entry) => ["missing", "rejected"].includes(entry.state))?.id,
    createdAt: record.createdAt, updatedAt: record.updatedAt, referenceNumber: record.referenceNumber,
    completionStatus: complaintCompletionStatus(
      record.referenceNumber,
      status === "blocked" || status === "retryable_failed",
      projectedMedia,
    ),
  };
}

async function persistMedia(submissionId: string, mediaId: string, sourceUri: string, name: string) {
  const directory = mediaDirectory(submissionId);
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  const destination = `${directory}${safe(mediaId)}${extension(name)}`;
  try {
    await FileSystem.copyAsync({ from: sourceUri, to: destination });
  } catch (copyError) {
    const source = new File(sourceUri);
    const target = new File(destination);
    try {
      target.create({ intermediates: true, overwrite: true });
      const reader = source.open(FileMode.ReadOnly);
      const writer = target.open(FileMode.WriteOnly);
      try {
        let offset = 0;
        while (offset < source.size) {
          const bytes = reader.readBytes(Math.min(CHUNK_SIZE, source.size - offset));
          if (bytes.byteLength === 0) throw codedError("local_storage_failure", mediaId);
          writer.writeBytes(bytes);
          offset += bytes.byteLength;
        }
      } finally {
        reader.close();
        writer.close();
      }
    } catch (streamError) {
      await FileSystem.deleteAsync(destination, { idempotent: true }).catch(() => undefined);
      throw Object.assign(codedError("local_storage_failure", mediaId), { cause: streamError ?? copyError });
    }
  }
  const file = new File(destination);
  if (!file.exists || file.size <= 0) {
    await FileSystem.deleteAsync(destination, { idempotent: true }).catch(() => undefined);
    throw codedError("empty_file", mediaId);
  }
  return { uri: destination, size: file.size };
}

function validate(kind: MediaRecord["kind"], mimeType: string, size: number) {
  if (size <= 0) throw codedError("empty_file");
  if (kind === "document" && mimeType !== "application/pdf") throw codedError("unsupported_type");
  if (kind === "photo" && !["image/jpeg", "image/png"].includes(mimeType)) throw codedError("unsupported_type");
  const limit = kind === "document" ? 15 : kind === "photo" ? 10 : 25;
  if (size > limit * 1024 * 1024) throw codedError("file_too_large");
}

type StageSource = Pick<MediaRecord, "id" | "kind" | "originalName" | "mimeType" | "capturedAt" | "recordedAt" | "durationMs"> & { uri: string };
async function stageOne(submissionId: string, source: StageSource) {
  const existing = (await syncDatabase.listMedia(submissionId)).find((entry) => entry.id === source.id);
  if (existing) return;
  const sourceFile = new File(source.uri);
  const sourceSize = sourceFile.exists ? sourceFile.size : 0;
  validate(source.kind, source.mimeType, sourceSize);
  const current = await syncDatabase.listMedia(submissionId);
  if (current.filter((entry) => entry.kind !== "voice" && entry.state !== "cancelled").length >= 5 && source.kind !== "voice") throw codedError("attachment_count_limit");
  if (current.reduce((sum, entry) => sum + entry.totalBytes, 0) + sourceSize > MAX_MEDIA_BYTES) throw codedError("aggregate_limit");
  const staged = await persistMedia(submissionId, source.id, source.uri, source.originalName);
  await syncDatabase.putMedia({ ...source, clientSubmissionId: submissionId, localUri: staged.uri,
    totalBytes: staged.size, uploadedBytes: 0, state: "queued", attempts: 0, managed: true });
  emit();
}

async function stageDraft(draft: ComplaintDraft): Promise<SyncQueueItem> {
  await syncDatabase.initialize();
  const existing = await syncDatabase.getSubmission(draft.id);
  const timestamp = now();
  const submission: SubmissionRecord = {
    clientSubmissionId: draft.id, schemaVersion: 3, state: existing?.state ?? "drafting",
    submitRequested: existing?.submitRequested ?? false, draftJson: JSON.stringify(draft),
    referenceNumber: existing?.referenceNumber, attempts: existing?.attempts ?? 0,
    nextAttemptAt: existing?.nextAttemptAt, lastErrorCode: existing?.lastErrorCode,
    leaseOwner: existing?.leaseOwner, leaseExpiresAt: existing?.leaseExpiresAt,
    createdAt: existing?.createdAt ?? timestamp, updatedAt: timestamp,
  };
  await syncDatabase.putSubmission(submission);
  const wanted = new Set<string>();
  if (draft.voice) {
    wanted.add(draft.voice.id);
    await stageOne(draft.id, { id: draft.voice.id, uri: draft.voice.localUri, kind: "voice",
      originalName: "voice-statement.m4a", mimeType: "audio/mp4", recordedAt: draft.voice.recordedAt,
      durationMs: draft.voice.durationMs });
  }
  for (const evidence of draft.evidence) {
    wanted.add(evidence.id);
    await stageOne(draft.id, { id: evidence.id, uri: evidence.localUri, kind: evidence.kind,
      originalName: evidence.fileName, mimeType: evidence.mimeType, capturedAt: evidence.capturedAt });
  }
  for (const media of await syncDatabase.listMedia(draft.id)) {
    if (!wanted.has(media.id) && media.state !== "cancelled") await removeMedia(submission, media);
  }
  emit();
  return queueItem(submission);
}

function encodeMetadata(value: string) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const bytes = utf8ToBytes(value);
  let output = "";
  for (let index = 0; index < bytes.length; index += 3) {
    const a = bytes[index] ?? 0;
    const b = bytes[index + 1];
    const c = bytes[index + 2];
    output += alphabet[a >> 2];
    output += alphabet[((a & 3) << 4) | ((b ?? 0) >> 4)];
    output += b === undefined ? "=" : alphabet[((b & 15) << 2) | ((c ?? 0) >> 6)];
    output += c === undefined ? "=" : alphabet[c & 63];
  }
  return output;
}

function decodeBase64(value: string) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const clean = value.replace(/[^A-Za-z0-9+/=]/gu, "");
  const result: number[] = [];
  for (let index = 0; index < clean.length; index += 4) {
    const a = alphabet.indexOf(clean[index] ?? "A");
    const b = alphabet.indexOf(clean[index + 1] ?? "A");
    const c = alphabet.indexOf(clean[index + 2] ?? "=");
    const d = alphabet.indexOf(clean[index + 3] ?? "=");
    result.push((a << 2) | (b >> 4));
    if (clean[index + 2] !== "=") result.push(((b & 15) << 4) | (c >> 2));
    if (clean[index + 3] !== "=") result.push(((c & 3) << 6) | d);
  }
  return Uint8Array.from(result);
}

async function decryptLegacy<T>(raw: string): Promise<T> {
  const parsed = JSON.parse(raw) as LegacyEnvelope | T;
  if (typeof parsed === "object" && parsed !== null && "nonce" in parsed && "ciphertext" in parsed) {
    const key = await SecureStore.getItemAsync(LEGACY_LOCAL_KEY);
    if (!key) throw codedError("legacy_key_missing");
    const plaintext = xchacha20poly1305(decodeBase64(key), decodeBase64(parsed.nonce)).decrypt(decodeBase64(parsed.ciphertext));
    return JSON.parse(bytesToUtf8(plaintext)) as T;
  }
  return parsed as T;
}

async function createGrant(media: MediaRecord): Promise<MediaRecord> {
  const metadata = { kind: media.kind, clientSubmissionId: media.clientSubmissionId, mediaId: media.id,
    fileName: media.originalName, mimeType: media.mimeType };
  const encoded = Object.entries(metadata).map(([key, value]) => `${key} ${encodeMetadata(value)}`).join(",");
  media.state = "creating";
  await syncDatabase.putMedia(media);
  const response = await fetch(`${getApiUrl()}/api/v1/uploads`, UPLOAD_PROTOCOL_V2_ENABLED
    ? { method: "POST", headers: { "Tus-Resumable": "1.0.0", "Upload-Length": String(media.totalBytes), "Upload-Metadata": encoded } }
    : { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
      kind: media.kind, clientSubmissionId: media.clientSubmissionId, mediaId: media.id, fileName: media.originalName,
      mimeType: media.mimeType, size: media.totalBytes,
    }) });
  if (!response.ok) {
    let code = response.status >= 500 ? "network_unavailable" : "server_rejected";
    try {
      const envelope = await response.json() as { code?: string; message?: string };
      if (envelope.code === "upload_count_limit" || envelope.message?.includes("count exceeds")) code = "attachment_count_limit";
      else if (envelope.code === "upload_aggregate_limit" || envelope.message?.includes("Aggregate upload size")) code = "aggregate_limit";
      else if (envelope.code === "upload_size_limit" || envelope.message?.includes("size exceeds")) code = "file_too_large";
      else if (envelope.code === "unsupported_media_type" || envelope.message?.includes("media type")) code = "unsupported_type";
      else if (envelope.code === "upload_media_conflict") code = "media_action_required";
    } catch { /* The status-derived code remains authoritative. */ }
    throw codedError(code, media.id);
  }
  const legacy = UPLOAD_PROTOCOL_V2_ENABLED ? undefined : await response.json() as {
    uploadUrl?: string; uploadId?: string; uploadToken?: string; expiresAt?: string;
    offset?: number; status?: string;
  };
  const location = response.headers.get("location") ?? legacy?.uploadUrl ?? (legacy?.uploadId ? `/api/v1/uploads/${legacy.uploadId}` : null);
  const token = response.headers.get("upload-token") ?? legacy?.uploadToken ?? null;
  if (!location || !token) throw codedError("invalid_upload_grant", media.id);
  media.uploadUrl = new URL(location, getApiUrl()).toString();
  media.uploadToken = token;
  media.uploadExpiresAt = response.headers.get("upload-expires") ?? legacy?.expiresAt ?? undefined;
  const grantedOffset = Number(response.headers.get("upload-offset") ?? legacy?.offset ?? 0);
  if (!Number.isSafeInteger(grantedOffset) || grantedOffset < 0 || grantedOffset > media.totalBytes)
    throw codedError("invalid_server_offset", media.id);
  const serverState = response.headers.get("upload-status") ?? legacy?.status;
  media.uploadedBytes = grantedOffset;
  media.state = serverState === "complete" || serverState === "attached" ? "uploaded"
    : serverState === "processing" ? "processing" : "uploading";
  await syncDatabase.putMedia(media);
  return media;
}

async function reconcileMedia(media: MediaRecord): Promise<MediaRecord> {
  const file = new File(media.localUri);
  if (!file.exists) {
    media.state = "missing"; media.lastErrorCode = "media_unavailable";
    await syncDatabase.putMedia(media); return media;
  }
  if (media.state === "staging" || (media.state === "creating" && !media.uploadUrl)) media.state = "queued";
  if (["uploading", "processing", "uploaded"].includes(media.state) && media.uploadUrl && media.uploadToken) {
    const response = await fetch(media.uploadUrl, { method: "HEAD", headers: {
      "Tus-Resumable": "1.0.0", "Upload-Token": media.uploadToken,
    }});
    if ([401, 403, 404, 409, 410].includes(response.status)) {
      media = { ...media, state: "queued", uploadedBytes: 0, uploadUrl: undefined,
        uploadToken: undefined, uploadExpiresAt: undefined };
    } else if (response.ok) {
      const offset = Number(response.headers.get("upload-offset") ?? 0);
      if (!Number.isSafeInteger(offset) || offset < 0 || offset > media.totalBytes) {
        media.state = "rejected"; media.lastErrorCode = "invalid_server_offset";
      } else {
        media.uploadedBytes = offset;
        const serverState = response.headers.get("upload-status");
        const validStates = ["created", "uploading", "processing", "complete", "rejected", "expired", "attached"];
        if (serverState && !validStates.includes(serverState)) {
          media.state = "rejected";
          media.lastErrorCode = "unexpected_server_state";
        } else if (serverState === "expired") {
          media = { ...media, state: "queued", uploadedBytes: 0, uploadUrl: undefined,
            uploadToken: undefined, uploadExpiresAt: undefined };
        } else {
          media.state = serverState === "complete" || serverState === "attached" ? "uploaded"
            : serverState === "processing" ? "processing" : serverState === "rejected" ? "rejected" : "uploading";
          if (serverState === "rejected") media.lastErrorCode = "server_rejected";
        }
      }
    } else if (response.status >= 500) throw codedError("network_unavailable", media.id);
  }
  await syncDatabase.putMedia(media);
  return media;
}

function encodeBytes(bytes: Uint8Array) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let output = "";
  for (let index = 0; index < bytes.length; index += 3) {
    const a = bytes[index] ?? 0; const b = bytes[index + 1]; const c = bytes[index + 2];
    output += alphabet[a >> 2];
    output += alphabet[((a & 3) << 4) | ((b ?? 0) >> 4)];
    output += b === undefined ? "=" : alphabet[((b & 15) << 2) | ((c ?? 0) >> 6)];
    output += c === undefined ? "=" : alphabet[c & 63];
  }
  return output;
}

async function uploadLegacy(media: MediaRecord) {
  const file = new File(media.localUri);
  const handle = file.open(FileMode.ReadOnly);
  try {
    let offset = media.uploadedBytes;
    handle.offset = offset;
    while (offset < media.totalBytes) {
      const bytes = handle.readBytes(Math.min(512 * 1024, media.totalBytes - offset));
      const response = await fetch(media.uploadUrl!, { method: "PATCH", headers: {
        "content-type": "application/json", "x-upload-token": media.uploadToken!,
      }, body: JSON.stringify({ offset, chunkBase64: encodeBytes(bytes), complete: offset + bytes.byteLength === media.totalBytes }) });
      if (!response.ok) throw codedError(response.status >= 500 ? "network_unavailable" : "server_rejected", media.id);
      const result = await response.json() as { offset: number; status?: string };
      offset = result.offset;
      media.uploadedBytes = offset;
      await syncDatabase.putMedia({ ...media });
      emit();
    }
  } finally { handle.close(); }
  media.state = "uploaded";
  await syncDatabase.putMedia(media);
}

async function uploadMedia(media: MediaRecord, heartbeat: () => Promise<void>) {
  media = await reconcileMedia(media);
  if (media.state === "uploaded" || media.state === "processing") return;
  if (["missing", "rejected", "cancelled"].includes(media.state)) throw codedError(media.lastErrorCode ?? media.state, media.id);
  if (!media.uploadUrl || !media.uploadToken) media = await createGrant(media);
  if (media.state === "uploaded" || media.state === "processing") return;
  media.state = "uploading";
  await syncDatabase.putMedia(media);
  if (!UPLOAD_PROTOCOL_V2_ENABLED) {
    await uploadLegacy(media);
    return;
  }
  await new Promise<void>((resolve, reject) => {
    let pendingDurableWrite = Promise.resolve();
    const upload = new Upload({ uri: media.localUri } as unknown as File, {
      uploadUrl: media.uploadUrl, uploadSize: media.totalBytes, chunkSize: CHUNK_SIZE,
      retryDelays: null, storeFingerprintForResuming: false, removeFingerprintOnSuccess: false,
      headers: { "Upload-Token": media.uploadToken!, "Tus-Resumable": "1.0.0" }, fileReader: expoTusFileReader,
      onBeforeRequest: async () => pendingDurableWrite,
      onChunkComplete: (_size, accepted) => {
        media.uploadedBytes = accepted; media.attempts = 0; media.lastErrorCode = undefined;
        pendingDurableWrite = syncDatabase.putMedia({ ...media }).then(heartbeat).then(emit);
        void pendingDurableWrite.catch((error: unknown) => {
          void upload.abort();
          reject(error);
        });
      },
      onError: (error) => reject(Object.assign(codedError("network_unavailable", media.id), { cause: error })),
      onSuccess: () => { void pendingDurableWrite.then(resolve, reject); },
    });
    activeUploads.set(media.id, upload);
    upload.start();
  }).finally(() => activeUploads.delete(media.id));
  media.uploadedBytes = media.totalBytes; media.state = "processing";
  await syncDatabase.putMedia(media); emit();
}

async function pollProcessing(media: MediaRecord) {
  if (!media.uploadUrl || !media.uploadToken) return false;
  const response = await fetch(`${media.uploadUrl}/status`, { headers: { "Upload-Token": media.uploadToken } });
  if (response.status === 404 || response.status === 410) {
    await syncDatabase.putMedia({ ...media, state: "queued", uploadedBytes: 0, uploadUrl: undefined,
      uploadToken: undefined, uploadExpiresAt: undefined });
    return false;
  }
  if (!response.ok) throw codedError("network_unavailable", media.id);
  const status = (await response.json()) as { status: string; reasonCode?: string; errorCode?: string };
  if (status.status === "complete" || status.status === "attached") {
    await syncDatabase.putMedia({ ...media, state: "uploaded", uploadedBytes: media.totalBytes,
      attempts: 0, lastErrorCode: undefined });
    return true;
  }
  if (status.status === "rejected") {
    const code = status.reasonCode ?? status.errorCode ?? "server_rejected";
    await syncDatabase.putMedia({ ...media, state: "rejected", lastErrorCode: code });
    throw codedError(code, media.id);
  }
  return false;
}

async function complaintBody(submission: SubmissionRecord, media: MediaRecord[]) {
  const draft = JSON.parse(submission.draftJson) as ComplaintDraft;
  let privateReporter: { phone: string; cnic?: string } | undefined;
  if (draft.privacyMode === "CONF" || draft.privacyMode === "IDEN") {
    privateReporter = (await expoIdentityService.getIdentity(draft.id)) ?? undefined;
    if (!privateReporter?.phone) throw codedError("identity_unavailable");
  }
  const selected = draft.incident.structuredAnswers?.subcategory;
  return { clientSubmissionId: submission.clientSubmissionId, idempotencyKey: submission.clientSubmissionId,
    schemaVersion: submission.schemaVersion, privacyMode: draft.privacyMode, categoryCode: draft.category,
    subcategoryCode: typeof selected === "string" ? selected : draft.ai?.suggestedSubcategory,
    reporterType: "self", contactPreference: draft.incident.structuredAnswers?.contactPreference,
    safeContactWindow: draft.incident.structuredAnswers?.["contact-window"],
    preferredLanguage: draft.incident.structuredAnswers?.["contact-language"],
    safeVoicemail: draft.incident.structuredAnswers?.["contact-voicemail"] === "yes",
    representativeContact: draft.incident.structuredAnswers?.["representative-contact"],
    privateReporter, incident: draft.incident, location: draft.location,
    uploads: media.map((entry) => ({ id: uploadIdFromUrl(entry.uploadUrl), token: entry.uploadToken,
      capturedAt: entry.capturedAt, recordedAt: entry.recordedAt, durationMs: entry.durationMs })),
  };
}

async function readRegistry(): Promise<RegistryFile> {
  const raw = await AsyncStorage.getItem(REGISTRY_KEY);
  if (!raw) return { schemaVersion: 1, items: [] };
  try {
    const parsed = await decryptLegacy<RegistryFile>(raw);
    return Array.isArray(parsed.items) ? parsed : { schemaVersion: 1, items: [] };
  } catch { return { schemaVersion: 1, items: [] }; }
}

async function acknowledge(submission: SubmissionRecord, result: { referenceNumber?: string; trackingSecret?: string }) {
  if (!result.referenceNumber || !result.trackingSecret) throw codedError("invalid_acknowledgement");
  await SecureStore.setItemAsync(`${TRACKING_SECRET_PREFIX}${result.referenceNumber}`, result.trackingSecret, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  submission.referenceNumber = result.referenceNumber; submission.state = "acknowledged"; submission.updatedAt = now();
  await syncDatabase.putSubmission(submission);
  const registry = await readRegistry();
  registry.items = registry.items.filter((entry) => entry.clientSubmissionId !== submission.clientSubmissionId);
  registry.items.push({ clientSubmissionId: submission.clientSubmissionId, referenceNumber: result.referenceNumber,
    updatedAt: submission.updatedAt });
  await AsyncStorage.setItem(REGISTRY_KEY, JSON.stringify(registry));
  for (const media of await syncDatabase.listMedia(submission.clientSubmissionId)) {
    if (media.managed) await FileSystem.deleteAsync(media.localUri, { idempotent: true }).catch(() => undefined);
  }
  emit();
  const referenceNumber = result.referenceNumber;
  void import("./pushRegistrationService")
    .then(({ registerPushForReference }) => registerPushForReference(referenceNumber))
    .catch(() => undefined);
}

async function submitComplaint(submission: SubmissionRecord, media: MediaRecord[]) {
  submission.state = "submitting";
  await syncDatabase.putSubmission(submission);
  const response = await fetch(`${getApiUrl()}/api/v1/complaints`, { method: "POST", headers: {
    "content-type": "application/json", "x-idempotency-key": submission.clientSubmissionId,
  }, body: JSON.stringify(await complaintBody(submission, media)) });
  if (response.ok) return acknowledge(submission, await response.json());
  if (response.status === 409 || response.status >= 500) {
    const lookup = await fetch(`${getApiUrl()}/api/v1/complaints/submissions/${encodeURIComponent(submission.clientSubmissionId)}`);
    if (lookup.ok) return acknowledge(submission, await lookup.json());
  }
  throw codedError(response.status >= 500 ? "network_unavailable" : "validation_failed");
}

async function reconcileSubmitting(submission: SubmissionRecord): Promise<boolean> {
  const lookup = await fetch(`${getApiUrl()}/api/v1/complaints/submissions/${encodeURIComponent(submission.clientSubmissionId)}`);
  if (lookup.ok) {
    await acknowledge(submission, await lookup.json());
    return true;
  }
  if (lookup.status >= 500) throw codedError("network_unavailable");
  submission.state = "ready";
  submission.updatedAt = now();
  await syncDatabase.putSubmission(submission);
  return false;
}

async function removeMedia(submission: SubmissionRecord, media: MediaRecord) {
  if (submission.state === "submitting") throw codedError("submission_in_progress", media.id);
  const active = activeUploads.get(media.id);
  if (active) await active.abort(true).catch(() => undefined);
  else if (media.uploadUrl && media.uploadToken) await Upload.terminate(media.uploadUrl, {
    headers: { "Upload-Token": media.uploadToken },
  }).catch(() => undefined);
  if (media.managed) await FileSystem.deleteAsync(media.localUri, { idempotent: true }).catch(() => undefined);
  await syncDatabase.deleteMedia(media.id); emit();
}

async function processSubmission(submission: SubmissionRecord, owner: string): Promise<"acknowledged" | "retryable" | "blocked" | "pending"> {
  if (!(await syncDatabase.acquireLease(submission.clientSubmissionId, owner, LEASE_MS))) return "pending";
  try {
    submission = (await syncDatabase.getSubmission(submission.clientSubmissionId))!;
    // Draft edits (including a newly recorded voice note) are local-only.
    // Do not upload or mark them failed until the user explicitly submits
    // the complaint from the review screen.
    if (!submission.submitRequested) return "pending";
    const heartbeat = async () => {
      submission.attempts = 0;
      submission.lastErrorCode = undefined;
      submission.nextAttemptAt = undefined;
      const [submissionLease, coordinatorLease] = await Promise.all([
        syncDatabase.renewLease(submission.clientSubmissionId, owner, LEASE_MS),
        syncDatabase.renewCoordinatorLease(owner, LEASE_MS),
      ]);
      if (!submissionLease || !coordinatorLease) throw codedError("sync_lease_lost");
    };
    if (submission.state === "submitting" && await reconcileSubmitting(submission)) return "acknowledged";
    const media = await syncDatabase.listMedia(submission.clientSubmissionId);
    submission.state = "uploading"; submission.updatedAt = now();
    await syncDatabase.putSubmission(submission);
    for (let entry of media) {
      await heartbeat();
      entry = await reconcileMedia(entry);
      if (entry.state === "processing") await pollProcessing(entry);
      else if (entry.state !== "uploaded") await uploadMedia(entry, heartbeat);
    }
    const refreshed = await syncDatabase.listMedia(submission.clientSubmissionId);
    if (refreshed.some((entry) => entry.state === "processing")) {
      submission.state = "processing"; submission.nextAttemptAt = retryAt(1);
      await syncDatabase.putSubmission(submission); return "pending";
    }
    if (refreshed.some((entry) => entry.state === "missing" || entry.state === "rejected")) throw codedError("media_action_required");
    submission.state = "ready"; submission.attempts = 0; submission.nextAttemptAt = undefined;
    await syncDatabase.putSubmission(submission);
    if (!submission.submitRequested) return "pending";
    await submitComplaint(submission, refreshed);
    return "acknowledged";
  } catch (error) {
    const typed = error as Error & { code?: string; retryAfterMs?: number };
    submission.attempts += 1; submission.lastErrorCode = typed.code ?? "network_unavailable";
    const blocked = [
      "identity_unavailable", "validation_failed", "media_action_required", "media_unavailable",
      "invalid_server_offset", "unexpected_server_state", "server_rejected",
      "attachment_count_limit", "aggregate_limit", "file_too_large", "unsupported_type",
    ].includes(submission.lastErrorCode);
    submission.state = blocked ? "blocked" : "retryable_failed";
    submission.nextAttemptAt = blocked ? undefined : retryAt(submission.attempts, typed.retryAfterMs);
    submission.updatedAt = now(); await syncDatabase.putSubmission(submission); emit();
    return blocked ? "blocked" : "retryable";
  } finally { await syncDatabase.releaseLease(submission.clientSubmissionId, owner); }
}

async function initialize() {
  await syncDatabase.initialize();
  if (!syncDatabase.durable && process.env.NODE_ENV !== "test") return;
  if (await AsyncStorage.getItem(MIGRATION_KEY)) return;
  const raw = await AsyncStorage.getItem(LEGACY_QUEUE_KEY);
  if (!raw) {
    await AsyncStorage.setItem(MIGRATION_KEY, "empty");
    return;
  }
  try {
    const legacy = await decryptLegacy<LegacyQueue>(raw);
    if (legacy.schemaVersion !== 1 || !Array.isArray(legacy.items)) throw codedError("legacy_queue_invalid");
    const submissions: SubmissionRecord[] = [];
    const mediaRecords: MediaRecord[] = [];
    for (const item of legacy.items) {
      const state: SubmissionRecord["state"] = item.status === "acknowledged" ? "acknowledged"
        : item.status === "blocked" ? "blocked" : item.status === "retryable_failed" ? "retryable_failed"
          : item.status === "submitting" ? "ready" : "queued";
      submissions.push({
        clientSubmissionId: item.clientSubmissionId, schemaVersion: Math.max(3, item.schemaVersion),
        state, submitRequested: true, draftJson: JSON.stringify(item.draft), referenceNumber: item.referenceNumber,
        attempts: item.attempts ?? 0, nextAttemptAt: item.nextAttemptAt ?? undefined,
        lastErrorCode: item.lastErrorCode, createdAt: item.createdAt, updatedAt: item.updatedAt,
      });
      for (const oldMedia of item.media) {
        const file = new File(oldMedia.uri);
        const exists = file.exists;
        mediaRecords.push({
          id: oldMedia.id, clientSubmissionId: item.clientSubmissionId, kind: oldMedia.kind,
          localUri: oldMedia.uri, originalName: oldMedia.originalName, mimeType: oldMedia.mimeType,
          totalBytes: exists ? file.size : 0, uploadedBytes: 0,
          state: exists ? (oldMedia.state === "uploaded" && oldMedia.uploadId ? "processing" : "queued") : "missing",
          uploadUrl: oldMedia.uploadId ? `${getApiUrl()}/api/v1/uploads/${oldMedia.uploadId}` : undefined,
          uploadToken: oldMedia.uploadToken, attempts: 0,
          lastErrorCode: exists ? undefined : "media_unavailable", capturedAt: oldMedia.capturedAt,
          recordedAt: oldMedia.recordedAt, durationMs: oldMedia.durationMs, managed: oldMedia.managed ?? true,
        });
      }
    }
    await syncDatabase.importLegacy(submissions, mediaRecords);
    const migrated = await syncDatabase.listSubmissions();
    if (!legacy.items.every((item) => migrated.some((row) => row.clientSubmissionId === item.clientSubmissionId))) {
      throw codedError("legacy_migration_verification_failed");
    }
    await AsyncStorage.setItem(MIGRATION_KEY, now());
    await AsyncStorage.removeItem(LEGACY_QUEUE_KEY);
  } catch (error) {
    await AsyncStorage.setItem(LEGACY_QUARANTINE_KEY, raw);
    await AsyncStorage.setItem(MIGRATION_KEY, "corrupt");
    throw Object.assign(codedError("legacy_queue_recovery_required"), { cause: error });
  }
}

const legacyProductionSyncService = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
  async initialize() { await initialize(); },
  async list() { await initialize(); return Promise.all((await syncDatabase.listSubmissions()).map(queueItem)); },
  async get(clientSubmissionId: string) {
    await initialize(); const record = await syncDatabase.getSubmission(clientSubmissionId);
    return record ? queueItem(record) : null;
  },
  async stageDraft(draft: ComplaintDraft) { const item = await stageDraft(draft); void this.process(); return item; },
  async enqueue(draft: ComplaintDraft) {
    const item = await stageDraft(draft); const record = (await syncDatabase.getSubmission(draft.id))!;
    record.submitRequested = true; record.state = "queued"; record.draftJson = JSON.stringify(draft); record.updatedAt = now();
    await syncDatabase.putSubmission(record); emit(); return { ...item, submitRequested: true, status: "local" as const };
  },
  async requestSubmit(draft: ComplaintDraft) { const result = await this.enqueue(draft); void this.process(); return result; },
  async process(): Promise<ProcessResult> {
    if (activeProcess) {
      processRequested = true;
      return activeProcess;
    }
    activeProcess = (async () => {
      await initialize();
      const result: ProcessResult = { acknowledged: 0, retryableFailed: 0, blocked: 0 };
      do {
        processRequested = false;
        const owner = Array.from(getRandomBytes(16), (value) => value.toString(16).padStart(2, "0")).join("");
        if (!(await syncDatabase.acquireCoordinatorLease(owner, LEASE_MS))) continue;
        try {
          for (const submission of await syncDatabase.listSubmissions()) {
            if (submission.state === "acknowledged" || submission.state === "blocked" || (submission.nextAttemptAt && submission.nextAttemptAt > now())) continue;
            const state = await processSubmission(submission, owner);
            if (state === "acknowledged") result.acknowledged += 1;
            if (state === "retryable") result.retryableFailed += 1;
            if (state === "blocked") result.blocked += 1;
          }
        } finally {
          await syncDatabase.releaseCoordinatorLease(owner);
        }
      } while (processRequested);
      emit(); return result;
    })();
    try { return await activeProcess; } finally { activeProcess = null; processRequested = false; }
  },
  async retryFailed(clientSubmissionId?: string) {
    const requiresUserAction = new Set([
      "media_action_required", "media_unavailable", "attachment_count_limit", "aggregate_limit",
      "file_too_large", "unsupported_type", "invalid_server_offset", "unexpected_server_state",
      "validation_failed", "identity_unavailable",
    ]);
    for (const record of await syncDatabase.listSubmissions()) {
      if (clientSubmissionId && record.clientSubmissionId !== clientSubmissionId) continue;
      if (["retryable_failed", "blocked"].includes(record.state) && !requiresUserAction.has(record.lastErrorCode ?? "")) {
        await syncDatabase.putSubmission({ ...record, state: "queued", attempts: 0, nextAttemptAt: undefined,
          lastErrorCode: undefined, updatedAt: now() });
      }
    }
    emit();
  },
  async replaceMedia(clientSubmissionId: string, mediaId: string, replacement: SyncMediaReplacement) {
    const submission = await syncDatabase.getSubmission(clientSubmissionId);
    const media = (await syncDatabase.listMedia(clientSubmissionId)).find((entry) => entry.id === mediaId);
    if (!submission || !media) throw codedError("saved_report_missing");
    await removeMedia(submission, media);
    await stageOne(clientSubmissionId, { id: mediaId, uri: replacement.uri, kind: media.kind,
      originalName: replacement.originalName, mimeType: replacement.mimeType, capturedAt: replacement.capturedAt,
      recordedAt: replacement.recordedAt, durationMs: replacement.durationMs });
    await syncDatabase.putSubmission({ ...submission, state: "queued", attempts: 0, nextAttemptAt: undefined,
      lastErrorCode: undefined, updatedAt: now() });
  },
  async omitMedia(clientSubmissionId: string, mediaId: string) {
    const submission = await syncDatabase.getSubmission(clientSubmissionId);
    const media = (await syncDatabase.listMedia(clientSubmissionId)).find((entry) => entry.id === mediaId);
    if (!submission || !media) throw codedError("saved_report_missing");
    await removeMedia(submission, media);
    const draft = JSON.parse(submission.draftJson) as ComplaintDraft;
    draft.evidence = draft.evidence.filter((entry) => entry.id !== mediaId);
    if (draft.voice?.id === mediaId) draft.voice = null;
    await syncDatabase.putSubmission({ ...submission, state: "queued", draftJson: JSON.stringify(draft), attempts: 0,
      nextAttemptAt: undefined, lastErrorCode: undefined, updatedAt: now() });
  },
  async discard(clientSubmissionId: string) {
    const submission = await syncDatabase.getSubmission(clientSubmissionId);
    if (!submission || submission.submitRequested) throw codedError("submitted_report_cannot_be_discarded");
    for (const media of await syncDatabase.listMedia(clientSubmissionId)) await removeMedia(submission, media);
    await syncDatabase.deleteSubmission(clientSubmissionId); await expoIdentityService.removeIdentity(clientSubmissionId); emit();
  },
  async listRegistry() { return (await readRegistry()).items; },
  async clear() {
    for (const upload of activeUploads.values()) await upload.abort().catch(() => undefined);
    activeUploads.clear(); await syncDatabase.clear();
    if (FileSystem.documentDirectory) await FileSystem.deleteAsync(`${FileSystem.documentDirectory}${MEDIA_FOLDER}/`, { idempotent: true }).catch(() => undefined);
    await AsyncStorage.removeItem(REGISTRY_KEY); emit();
  },
};

export const productionSyncService = COMPLAINT_PIPELINE_V3_ENABLED
  ? complaintPipelineV3Service as typeof legacyProductionSyncService
  : legacyProductionSyncService;
