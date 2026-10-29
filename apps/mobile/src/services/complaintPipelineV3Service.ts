import type { ComplaintDraft } from "@kapas/domain";
import { bytesToUtf8, utf8ToBytes } from "@noble/ciphers/utils.js";
import { getRandomBytes } from "expo-crypto";
import { File } from "expo-file-system";
import * as FileSystem from "expo-file-system/legacy";
import * as SecureStore from "expo-secure-store";
import { Upload } from "tus-js-client";

import { getApiUrl } from "./apiUrl";
import { complaintCompletionStatus } from "./complaintCompletion";
import {
  complaintV3Database,
  createLocalUuid,
  StaleRevisionError,
  type LocalAttachment,
  type LocalDraft,
  type LocalOutboxCommand,
} from "./complaintV3Database";
import { classifyTusError } from "./complaintV3TusError";
import { expoIdentityService } from "./expoIdentityService";
import { expoTusFileReader } from "./expoTusFileReader";
import { syncDatabase } from "./syncDatabase";
import { getMobileTusFilesEndpoint, resolveTusUploadUrl } from "./tusUploadUrl";

const CHUNK_SIZE = 1024 * 1024;
const LEASE_MS = 10 * 60_000;
const MEDIA_ROOT = "kapas-complaints-v3";
const TRACKING_SECRET_PREFIX = "kapas.tracking-secret.";
const MIGRATION_MARKER = "kapas.complaint-pipeline-v3-migration.v1";
const RETRY_DELAYS = [2, 5, 15, 30, 60, 120, 300, 900].map((seconds) => seconds * 1000);
const listeners = new Set<() => void>();
let activePass: Promise<{ acknowledged: number; retryableFailed: number; blocked: number }> | null =
  null;
let anotherPassRequested = false;
let retryTimer: ReturnType<typeof setTimeout> | undefined;
let retryTimerAt: number | undefined;

const now = () => new Date().toISOString();
const emit = () => listeners.forEach((listener) => listener());
const utf8 = (value: Uint8Array | undefined) => (value ? bytesToUtf8(value) : undefined);
const retryAt = (attempt: number) => {
  const base = RETRY_DELAYS[Math.min(Math.max(0, attempt - 1), RETRY_DELAYS.length - 1)]!;
  const jitter = Math.round(base * (Math.random() * 0.3 - 0.15));
  return new Date(Date.now() + Math.max(1000, base + jitter)).toISOString();
};
const safeName = (value: string) =>
  value
    .replace(/[^\p{L}\p{N}._ -]+/gu, " ")
    .trim()
    .slice(0, 255) || "attachment";
const extension = (value: string) => value.match(/\.[A-Za-z0-9]{1,10}$/u)?.[0]?.toLowerCase() ?? "";

function codedError(code: string, retryable = false): Error & { code: string; retryable: boolean } {
  return Object.assign(new Error(code), { code, retryable });
}

function normalizeClientSubmissionId(value: string): string {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value)) return value;
  const words = [2166136261, 16777619, 2246822519, 3266489917];
  for (const char of value) {
    for (let index = 0; index < words.length; index += 1)
      words[index] = Math.imul(words[index]! ^ char.charCodeAt(0), 16777619) >>> 0;
  }
  const hex = words.map((word) => word.toString(16).padStart(8, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20)}`;
}

const normalizeClientMediaId = normalizeClientSubmissionId;

async function fetchWithTimeout(input: string, init: RequestInit = {}, timeoutMs = 30_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function validateAttachment(kind: LocalAttachment["kind"], mimeType: string, bytes: number) {
  if (!Number.isSafeInteger(bytes) || bytes <= 0) throw codedError("empty_file");
  if (kind === "document" && mimeType !== "application/pdf") throw codedError("unsupported_type");
  if (kind === "photo" && !["image/jpeg", "image/png"].includes(mimeType))
    throw codedError("unsupported_type");
  if (kind === "voice" && !mimeType.startsWith("audio/")) throw codedError("unsupported_type");
  const limit = kind === "voice" ? 25 : kind === "photo" ? 10 : 15;
  if (bytes > limit * 1024 * 1024) throw codedError("file_too_large");
}

async function durableCopy(draftId: string, id: string, sourceUri: string, displayName: string) {
  if (!FileSystem.documentDirectory) throw codedError("local_storage_failure");
  const directory = `${FileSystem.documentDirectory}${MEDIA_ROOT}/${draftId}/`;
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  const destination = `${directory}${id}${extension(displayName)}`;
  try {
    await FileSystem.copyAsync({ from: sourceUri, to: destination });
    const copy = new File(destination);
    if (!copy.exists || copy.size <= 0) throw codedError("empty_file");
    return { path: destination, bytes: copy.size };
  } catch (error) {
    await FileSystem.deleteAsync(destination, { idempotent: true }).catch(() => undefined);
    throw Object.assign(codedError("local_storage_failure"), { cause: error });
  }
}

function sourceAttachments(draft: ComplaintDraft) {
  return [
    ...(draft.voice
      ? [
          {
            id: draft.voice.id,
            kind: "voice" as const,
            uri: draft.voice.localUri,
            displayName: `voice-statement${extension(draft.voice.localUri) || ".m4a"}`,
            mimeType: "audio/mp4",
            recordedAt: draft.voice.recordedAt,
            durationMs: draft.voice.durationMs,
          },
        ]
      : []),
    ...draft.evidence.map((item) => ({
      id: item.id,
      kind: item.kind,
      uri: item.localUri,
      displayName: item.fileName,
      mimeType: item.mimeType.toLowerCase(),
      capturedAt: item.capturedAt,
    })),
  ];
}

async function stageDraft(draft: ComplaintDraft) {
  await complaintV3Database.initialize();
  const stored = await complaintV3Database.getDraft(draft.id);
  if (stored?.lifecycle === "sealed" || stored?.lifecycle === "accepted")
    return toQueueItem(stored);
  const sources = sourceAttachments(draft);
  if (new Set(sources.map((source) => source.id)).size !== sources.length)
    throw codedError("duplicate_attachment");
  if (sources.filter((source) => source.kind !== "voice").length > 5)
    throw codedError("attachment_count_limit");
  if (sources.filter((source) => source.kind === "voice").length > 1)
    throw codedError("attachment_count_limit");
  const wanted = new Set(sources.map((source) => source.id));
  const existing = await complaintV3Database.listAttachments(draft.id);
  const existingById = new Map(existing.map((attachment) => [attachment.id, attachment]));
  const additions: LocalAttachment[] = [];
  try {
    let aggregateBytes = 0;
    for (const source of sources) {
      const current = existingById.get(source.id);
      if (current) {
        if (current.kind !== source.kind) throw codedError("duplicate_attachment");
        aggregateBytes += current.totalBytes;
        continue;
      }
      const sourceFile = new File(source.uri);
      const sourceBytes = sourceFile.exists ? sourceFile.size : 0;
      validateAttachment(source.kind, source.mimeType, sourceBytes);
      aggregateBytes += sourceBytes;
      if (aggregateBytes > 50 * 1024 * 1024) throw codedError("aggregate_limit");
      const copy = await durableCopy(draft.id, source.id, source.uri, source.displayName);
      const timestamp = now();
      additions.push({
        id: source.id,
        draftId: draft.id,
        revision: 1,
        kind: source.kind,
        localPath: copy.path,
        displayName: safeName(source.displayName),
        declaredMimeType: source.mimeType,
        totalBytes: copy.bytes,
        uploadedBytes: 0,
        state: "staged",
        attempts: 0,
        capturedAt: "capturedAt" in source ? source.capturedAt : undefined,
        recordedAt: "recordedAt" in source ? source.recordedAt : undefined,
        durationMs: "durationMs" in source ? source.durationMs : undefined,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }
    if (aggregateBytes > 50 * 1024 * 1024) throw codedError("aggregate_limit");
    const removals = existing.filter((attachment) => !wanted.has(attachment.id));
    const managedById = new Map([
      ...existing
        .filter((attachment) => wanted.has(attachment.id))
        .map((attachment) => [attachment.id, attachment.localPath] as const),
      ...additions.map((attachment) => [attachment.id, attachment.localPath] as const),
    ]);
    const canonicalDraft: ComplaintDraft = {
      ...draft,
      voice: draft.voice
        ? { ...draft.voice, localUri: managedById.get(draft.voice.id) ?? draft.voice.localUri }
        : null,
      evidence: draft.evidence.map((item) => ({
        ...item,
        localUri: managedById.get(item.id) ?? item.localUri,
      })),
    };
    const committed = await complaintV3Database.commitEditingDraft(
      {
        id: draft.id,
        lifecycle: "editing",
        currentStep: draft.stepId,
        schemaVersion: 3,
        answersJson: JSON.stringify(canonicalDraft),
        privacyMode: draft.privacyMode,
      },
      stored?.revision,
      additions,
      removals.map((attachment) => attachment.id),
    );
    for (const attachment of removals) {
      await FileSystem.deleteAsync(attachment.localPath, { idempotent: true }).catch(
        () => undefined,
      );
    }
    emit();
    return toQueueItem(committed);
  } catch (error) {
    for (const attachment of additions) {
      await FileSystem.deleteAsync(attachment.localPath, { idempotent: true }).catch(
        () => undefined,
      );
    }
    throw error;
  }
}

async function migrateV2Queue() {
  const marker = await SecureStore.getItemAsync(MIGRATION_MARKER);
  if (marker === "verified") return;
  if (marker === "prepared") {
    const legacy = await syncDatabase.listSubmissions();
    for (const submission of legacy) {
      if (!(await complaintV3Database.getDraft(submission.clientSubmissionId))) {
        throw codedError("legacy_migration_verification_failed");
      }
    }
    // The V3 attachment rows retain the durable file paths. Removing the old
    // queue here deletes only duplicate metadata, after a successful restart
    // and read-back; media remains until V3 delivery reaches a terminal state.
    await syncDatabase.clear();
    await SecureStore.setItemAsync(MIGRATION_MARKER, "verified");
    return;
  }
  await syncDatabase.initialize();
  for (const old of await syncDatabase.listSubmissions()) {
    if (await complaintV3Database.getDraft(old.clientSubmissionId)) continue;
    const draft = JSON.parse(old.draftJson) as ComplaintDraft;
    if (old.state === "acknowledged" && old.referenceNumber) {
      await complaintV3Database.saveEditingDraft({
        id: draft.id,
        lifecycle: "editing",
        currentStep: draft.stepId,
        schemaVersion: 3,
        answersJson: JSON.stringify(draft),
        privacyMode: draft.privacyMode,
      });
      const secret =
        (await SecureStore.getItemAsync(`${TRACKING_SECRET_PREFIX}${old.referenceNumber}`)) ??
        undefined;
      await complaintV3Database.importAcceptedDraft(
        draft.id,
        old.referenceNumber,
        secret,
        old.updatedAt,
      );
      continue;
    }
    const media = await syncDatabase.listMedia(old.clientSubmissionId);
    let imported = await complaintV3Database.saveEditingDraft({
      id: draft.id,
      lifecycle: "editing",
      currentStep: draft.stepId,
      schemaVersion: 3,
      answersJson: JSON.stringify(draft),
      privacyMode: draft.privacyMode,
    });
    for (const oldMedia of media.filter((entry) => entry.state !== "cancelled")) {
      const file = new File(oldMedia.localUri);
      const timestamp = now();
      await complaintV3Database.insertAttachment(
        {
          id: oldMedia.id,
          draftId: draft.id,
          revision: 1,
          kind: oldMedia.kind,
          localPath: oldMedia.localUri,
          displayName: safeName(oldMedia.originalName),
          declaredMimeType: oldMedia.mimeType,
          totalBytes: oldMedia.totalBytes,
          uploadedBytes: 0,
          state: file.exists ? "staged" : "action_required",
          attempts: 0,
          errorCode: file.exists ? undefined : "media_unavailable",
          capturedAt: oldMedia.capturedAt,
          recordedAt: oldMedia.recordedAt,
          durationMs: oldMedia.durationMs,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
        imported.revision,
      );
      imported = (await complaintV3Database.getDraft(draft.id))!;
    }
    if (old.submitRequested) {
      await complaintV3Database.sealAndEnqueue(
        imported.id,
        imported.revision,
        createLocalUuid(),
        JSON.stringify({ migratedFrom: "v2" }),
      );
    }
  }
  await SecureStore.setItemAsync(MIGRATION_MARKER, "prepared");
}

async function submissionPayload(draft: LocalDraft) {
  const value = JSON.parse(draft.answersJson) as ComplaintDraft;
  const clientSubmissionId = normalizeClientSubmissionId(value.id);
  const attachments = await complaintV3Database.listAttachments(draft.id);
  const identity =
    value.privacyMode === "ANON"
      ? undefined
      : ((await expoIdentityService.getIdentity(draft.id)) ?? undefined);
  if (!value.category) throw codedError("validation_failed");
  if (value.privacyMode !== "ANON" && !identity) throw codedError("identity_required");
  if (!value.incident.whenLabel) throw codedError("validation_failed");
  if (!value.location.province || !value.location.district) throw codedError("validation_failed");
  const selected = value.incident.structuredAnswers?.subcategory;
  return {
    clientSubmissionId,
    idempotencyKey: clientSubmissionId,
    schemaVersion: 3,
    revision: draft.revision,
    privacyMode: value.privacyMode,
    complaint: {
      categoryCode: value.category,
      subcategoryCode: typeof selected === "string" ? selected : value.ai?.suggestedSubcategory,
      priority: value.ai?.suggestedPriority ?? "Standard",
      reporterType: "self",
      contactPreference: value.incident.structuredAnswers?.contactPreference ?? "do-not-initiate",
      safeContactWindow: value.incident.structuredAnswers?.["contact-window"],
      preferredLanguage: value.incident.structuredAnswers?.["contact-language"],
      safeVoicemail: value.incident.structuredAnswers?.["contact-voicemail"] === "yes",
      representativeContact: value.incident.structuredAnswers?.["representative-contact"],
      incident: {
        whenLabel: value.incident.whenLabel,
        occurredAt: value.incident.occurredAt,
        description: value.incident.description,
        currentDanger: value.incident.currentDanger ?? false,
        immediateDanger: value.incident.immediateDanger ?? false,
        othersAffected: value.incident.othersAffected ?? "individual",
        structuredAnswers: value.incident.structuredAnswers ?? {},
        schemaVersion: 3,
      },
      location: {
        province: value.location.province,
        district: value.location.district,
        tehsil: value.location.tehsil,
        villageLabel: value.location.villageLabel,
        descriptivePlace: value.location.placeLabel ?? value.location.formattedAddress,
        source: value.location.source ?? "manual",
        accuracyMeters:
          typeof value.location.accuracyMeters === "number" &&
          Number.isFinite(value.location.accuracyMeters)
            ? Math.max(0, Math.round(value.location.accuracyMeters))
            : undefined,
        exactCoordinates: value.location.exactCoordinates ?? undefined,
      },
    },
    privateReporter: identity,
    attachments: attachments
      .filter((attachment) => attachment.state !== "omitted")
      .map((attachment) => ({
        clientMediaId: normalizeClientMediaId(attachment.id),
        kind: attachment.kind,
        displayName: attachment.displayName,
        declaredMimeType: attachment.declaredMimeType,
        totalBytes: attachment.totalBytes,
        capturedAt: attachment.capturedAt,
        recordedAt: attachment.recordedAt,
        durationMs: attachment.durationMs,
      })),
  };
}

async function submit(command: LocalOutboxCommand) {
  const draft = await complaintV3Database.getDraft(command.aggregateId);
  if (!draft) throw codedError("saved_report_missing");
  const payload = await submissionPayload(draft);
  const headers = { "content-type": "application/json", "idempotency-key": payload.idempotencyKey };
  const recoverReceipt = () =>
    fetchWithTimeout(`${getApiUrl()}/api/v3/intake-submissions/${encodeURIComponent(payload.clientSubmissionId)}`, {
      headers: { "idempotency-key": payload.idempotencyKey },
    });
  let response: Response;
  let recoveringUncertainSubmission = false;
  try {
    response = await fetchWithTimeout(`${getApiUrl()}/api/v3/intake-submissions`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
  } catch {
    recoveringUncertainSubmission = true;
    try {
      response = await recoverReceipt();
    } catch (error) {
      throw Object.assign(codedError("network_unavailable", true), { cause: error });
    }
  }
  if (!response.ok && response.status >= 500) {
    recoveringUncertainSubmission = true;
    response = await recoverReceipt();
  }
  if (recoveringUncertainSubmission && response.status === 404)
    throw codedError("network_unavailable", true);
  if (!response.ok) throw await responseError(response);
  const receipt = (await response.json()) as {
    referenceNumber: string;
    trackingSecret: string;
    acceptedAt: string;
  };
  if (!receipt.referenceNumber || !receipt.trackingSecret)
    throw codedError("invalid_acknowledgement");
  await complaintV3Database.acceptDraft(
    draft.id,
    receipt.referenceNumber,
    receipt.trackingSecret,
    receipt.acceptedAt,
  );
  await SecureStore.setItemAsync(
    `${TRACKING_SECRET_PREFIX}${receipt.referenceNumber}`,
    receipt.trackingSecret,
    {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    },
  );
  // acceptDraft enqueues allocation commands for every attachment. Request a
  // second pass so those commands run immediately after acknowledgement rather
  // than waiting for a future app launch/connectivity event.
  anotherPassRequested = true;
  emit();
}

async function allocate(command: LocalOutboxCommand) {
  const { attachmentId } = JSON.parse(command.payloadJson) as { attachmentId: string };
  let attachment = await complaintV3Database.getAttachment(attachmentId);
  const draft = await complaintV3Database.getDraft(command.aggregateId);
  const secret = utf8(draft?.encryptedTrackingSecret);
  if (!attachment || !draft?.referenceNumber || !secret) throw codedError("receipt_unavailable");
  if (attachment.replacementForId && !attachment.serverEvidenceId) {
    const replaced = await complaintV3Database.getAttachment(attachment.replacementForId);
    if (!replaced?.serverEvidenceId) throw codedError("replacement_target_unavailable");
    const declaration = {
      clientMediaId: normalizeClientMediaId(attachment.id),
      kind: attachment.kind,
      displayName: attachment.displayName,
      declaredMimeType: attachment.declaredMimeType,
      totalBytes: attachment.totalBytes,
      capturedAt: attachment.capturedAt,
      recordedAt: attachment.recordedAt,
      durationMs: attachment.durationMs,
    };
    const replacementResponse = await fetchWithTimeout(
      `${getApiUrl()}/api/v3/complaints/${encodeURIComponent(draft.referenceNumber)}/evidence`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-tracking-secret": secret,
          "x-replacement-for": replaced.serverEvidenceId,
        },
        body: JSON.stringify(declaration),
      },
    );
    if (!replacementResponse.ok) throw await responseError(replacementResponse, attachment.id);
    const delivery = (await replacementResponse.json()) as {
      evidence: Array<{ clientMediaId: string; evidenceId: string }>;
    };
    const declared = delivery.evidence.find(
      (item) => normalizeClientMediaId(item.clientMediaId) === normalizeClientMediaId(attachmentId),
    );
    if (!declared) throw codedError("replacement_declaration_missing", true);
    await complaintV3Database.updateAttachment(attachment.id, attachment.revision, {
      serverEvidenceId: declared.evidenceId,
    });
    const latestReplaced = await complaintV3Database.getAttachment(replaced.id);
    if (latestReplaced)
      await complaintV3Database.updateAttachment(latestReplaced.id, latestReplaced.revision, {
        state: "omitted",
        errorCode: undefined,
      });
    attachment = (await complaintV3Database.getAttachment(attachment.id))!;
  }
  const response = await fetchWithTimeout(
      `${getApiUrl()}/api/v3/complaints/${encodeURIComponent(draft.referenceNumber)}/evidence/${encodeURIComponent(normalizeClientMediaId(attachment.id))}/grant`,
    { method: "POST", headers: { "x-tracking-secret": secret } },
  );
  if (!response.ok) throw await responseError(response, attachment.id);
  const grant = (await response.json()) as {
    evidenceId: string;
    uploadUrl: string;
    uploadToken: string;
    uploadExpiresAt: string;
  };
  await complaintV3Database.updateAttachment(attachment.id, attachment.revision, {
    state: "allocated",
    uploadedBytes: attachment.uploadedBytes,
    serverEvidenceId: grant.evidenceId,
    uploadUrl: resolveTusUploadUrl(grant.uploadUrl),
    encryptedUploadToken: utf8ToBytes(grant.uploadToken),
    grantExpiresAt: grant.uploadExpiresAt,
    attempts: 0,
  });
  await completeAndEnqueue(command, "upload_evidence", { attachmentId });
}

const TUS_HEADERS = (token: string) => ({
  "Upload-Token": token,
  "Tus-Resumable": "1.0.0",
});

async function remoteTusOffset(uploadUrl: string, token: string): Promise<number | null> {
  try {
    const response = await fetch(resolveTusUploadUrl(uploadUrl), {
      method: "HEAD",
      headers: TUS_HEADERS(token),
    });
    if (!response.ok) return null;
    const offset = Number(response.headers.get("upload-offset") ?? "0");
    return Number.isFinite(offset) ? offset : null;
  } catch {
    return null;
  }
}

async function uploadEvidence(command: LocalOutboxCommand) {
  const { attachmentId } = JSON.parse(command.payloadJson) as { attachmentId: string };
  let attachment = await complaintV3Database.getAttachment(attachmentId);
  if (attachment?.state === "server_processing") {
    await completeAndEnqueue(command, "refresh_evidence", {});
    return;
  }
  if (!attachment?.uploadUrl || !attachment.encryptedUploadToken || !attachment.serverEvidenceId) {
    throw codedError("upload_grant_missing");
  }
  if (attachment.grantExpiresAt && new Date(attachment.grantExpiresAt).getTime() <= Date.now()) {
    throw codedError("upload_grant_expired");
  }
  const token = utf8(attachment.encryptedUploadToken)!;
  const file = new File(attachment.localPath);
  if (!file.exists || file.size !== attachment.totalBytes) throw codedError("media_unavailable");
  await complaintV3Database.updateAttachment(attachment.id, attachment.revision, {
    ...attachment,
    state: "uploading",
  });
  attachment = (await complaintV3Database.getAttachment(attachment.id))!;
  const uploadUrl = resolveTusUploadUrl(attachment.uploadUrl!);
  const remoteOffset = await remoteTusOffset(uploadUrl, token);
  if (remoteOffset !== null && remoteOffset >= attachment.totalBytes) {
    await complaintV3Database.updateAttachment(attachment.id, attachment.revision, {
      ...attachment,
      state: "server_processing",
      uploadedBytes: attachment.totalBytes,
    });
    await completeAndEnqueue(command, "refresh_evidence", {});
    return;
  }
  await new Promise<void>((resolve, reject) => {
    let durableWrite = Promise.resolve();
    const queueDurableWrite = (work: () => Promise<void>) => {
      durableWrite = durableWrite.then(work);
      void durableWrite.catch((error: unknown) => {
        try {
          upload.abort();
        } catch {
          /* ignore */
        }
        reject(error);
      });
    };
    const upload = new Upload({ uri: attachment!.localPath } as unknown as File, {
      endpoint: uploadUrl.endsWith("/files/") ? uploadUrl : undefined,
      uploadUrl: uploadUrl.endsWith("/files/") ? undefined : uploadUrl,
      uploadSize: attachment!.totalBytes,
      chunkSize: CHUNK_SIZE,
      retryDelays: null,
      storeFingerprintForResuming: false,
      removeFingerprintOnSuccess: false,
      headers: TUS_HEADERS(token),
      metadata: {
        grantId: token.split(".")[0]!,
        evidenceId: attachment!.serverEvidenceId!,
        clientMediaId: normalizeClientMediaId(attachment!.id),
        kind: attachment!.kind,
        filetype: attachment!.declaredMimeType,
      },
      fileReader: expoTusFileReader,
      onBeforeRequest: async () => {
        await durableWrite;
      },
      onUploadUrlAvailable: () => {
        queueDurableWrite(async () => {
          const current = await complaintV3Database.getAttachment(attachmentId);
          if (!current || !upload.url) return;
          await complaintV3Database.updateAttachment(current.id, current.revision, {
            uploadUrl: resolveTusUploadUrl(upload.url ?? current.uploadUrl ?? getMobileTusFilesEndpoint()),
          });
        });
      },
      onChunkComplete: (_chunk, uploadedBytes) => {
        queueDurableWrite(async () => {
          const current = await complaintV3Database.getAttachment(attachmentId);
          if (!current) throw codedError("media_unavailable");
          await complaintV3Database.updateAttachment(current.id, current.revision, {
            ...current,
            state: "uploading",
            uploadedBytes,
            uploadUrl: resolveTusUploadUrl(upload.url ?? current.uploadUrl ?? getMobileTusFilesEndpoint()),
            attempts: 0,
            errorCode: undefined,
          });
          emit();
        });
      },
      onError: (error) => {
        const classified = classifyTusError(error);
        reject(Object.assign(codedError(classified.code, classified.retryable), { cause: error }));
      },
      onSuccess: () => {
        void durableWrite.then(resolve, reject);
      },
    });
    upload.start();
  });
  const completed = await complaintV3Database.getAttachment(attachmentId);
  if (!completed) throw codedError("media_unavailable");
  await complaintV3Database.updateAttachment(completed.id, completed.revision, {
    ...completed,
    state: "server_processing",
    uploadedBytes: completed.totalBytes,
  });
  await completeAndEnqueue(command, "refresh_evidence", {});
}

async function refreshEvidence(command: LocalOutboxCommand) {
  const draft = await complaintV3Database.getDraft(command.aggregateId);
  const secret = utf8(draft?.encryptedTrackingSecret);
  if (!draft?.referenceNumber || !secret) throw codedError("receipt_unavailable");
  const response = await fetch(
    `${getApiUrl()}/api/v3/complaints/${encodeURIComponent(draft.referenceNumber)}/delivery`,
    {
      headers: { "x-tracking-secret": secret },
    },
  );
  if (!response.ok) throw await responseError(response);
  const result = (await response.json()) as {
    evidence: Array<{
      clientMediaId: string;
      evidenceId: string;
      status: string;
      uploadedBytes: number;
      reasonCode?: string;
    }>;
  };
  let pending = false;
  for (const delivery of result.evidence) {
    const local =
      (await complaintV3Database.getAttachment(delivery.clientMediaId)) ??
      (await complaintV3Database.listAttachments(command.aggregateId)).find(
        (item) => normalizeClientMediaId(item.id) === normalizeClientMediaId(delivery.clientMediaId),
      );
    if (!local) continue;
    const state =
      delivery.status === "available"
        ? "available"
        : ["rejected", "expired"].includes(delivery.status)
          ? "action_required"
          : "server_processing";
    pending ||= state === "server_processing";
    await complaintV3Database.updateAttachment(local.id, local.revision, {
      ...local,
      state,
      serverEvidenceId: delivery.evidenceId,
      uploadedBytes: delivery.uploadedBytes,
      errorCode: delivery.reasonCode,
    });
    if (state === "available") {
      await FileSystem.deleteAsync(local.localPath, { idempotent: true }).catch(() => undefined);
    }
  }
  if (pending) throw codedError("evidence_processing", true);
  await complaintV3Database.updateCommand(command.id, { state: "completed", attempts: 0 });
  emit();
}

async function omitEvidence(command: LocalOutboxCommand) {
  const { attachmentId } = JSON.parse(command.payloadJson) as { attachmentId: string };
  const draft = await complaintV3Database.getDraft(command.aggregateId);
  const attachment = await complaintV3Database.getAttachment(attachmentId);
  const secret = utf8(draft?.encryptedTrackingSecret);
  if (!draft?.referenceNumber || !secret || !attachment) throw codedError("receipt_unavailable");
  const response = await fetch(
    `${getApiUrl()}/api/v3/complaints/${encodeURIComponent(draft.referenceNumber)}/evidence/${encodeURIComponent(normalizeClientMediaId(attachmentId))}/omit`,
    { method: "POST", headers: { "x-tracking-secret": secret } },
  );
  if (!response.ok) throw await responseError(response, attachmentId);
  await complaintV3Database.updateAttachment(attachment.id, attachment.revision, {
    ...attachment,
    state: "omitted",
    errorCode: undefined,
  });
  await complaintV3Database.updateCommand(command.id, { state: "completed", attempts: 0 });
  await FileSystem.deleteAsync(attachment.localPath, { idempotent: true }).catch(() => undefined);
  emit();
}

async function completeAndEnqueue(
  command: LocalOutboxCommand,
  type: LocalOutboxCommand["commandType"],
  payload: object,
) {
  const timestamp = now();
  await complaintV3Database.completeAndEnqueue(command.id, {
    id: createLocalUuid(),
    aggregateId: command.aggregateId,
    commandType: type,
    payloadJson: JSON.stringify(payload),
    state: "pending",
    attempts: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  anotherPassRequested = true;
}

async function responseError(response: Response, attachmentId?: string) {
  let code = response.status >= 500 ? "network_unavailable" : "validation_failed";
  let retryable = response.status >= 500 || response.status === 408 || response.status === 429;
  try {
    const body = (await response.json()) as {
      code?: string;
      disposition?: string;
      retryAfterSeconds?: number;
    };
    code = body.code ?? code;
    retryable = body.disposition === "retry" || retryable;
    return Object.assign(codedError(code, retryable), {
      attachmentId,
      retryAfterMs: body.retryAfterSeconds ? body.retryAfterSeconds * 1000 : undefined,
    });
  } catch {
    return Object.assign(codedError(code, retryable), { attachmentId });
  }
}

async function processCommand(command: LocalOutboxCommand) {
  if (!(await complaintV3Database.startCommand(command.id))) return;
  console.info("[complaint-pipeline] command_started", {
    commandType: command.commandType,
    commandId: command.id,
    aggregateId: command.aggregateId,
  });
  try {
    if (command.commandType === "submit_complaint") await submit(command);
    else if (command.commandType === "allocate_evidence") await allocate(command);
    else if (command.commandType === "upload_evidence") await uploadEvidence(command);
    else if (command.commandType === "refresh_evidence") await refreshEvidence(command);
    else if (command.commandType === "omit_evidence") await omitEvidence(command);
  } catch (error) {
    const typed = error as Error & { code?: string; retryable?: boolean; retryAfterMs?: number };
    const tusCause = typed.cause as { originalResponse?: { getStatus?: () => number }; message?: string } | undefined;
    const tusStatus = tusCause?.originalResponse?.getStatus?.();
    console.warn("[complaint-pipeline] command_failed", {
      commandType: command.commandType,
      commandId: command.id,
      code: typed.code ?? "delivery_failed",
      retryable: typed.retryable === true,
      tusStatus: tusStatus ?? null,
      cause: tusCause?.message ?? (typed.cause instanceof Error ? typed.cause.message : undefined),
      message: typed.message,
    });
    if (
      ["upload_grant_expired", "upload_grant_missing"].includes(typed.code ?? "") &&
      command.commandType === "upload_evidence"
    ) {
      const { attachmentId } = JSON.parse(command.payloadJson) as { attachmentId: string };
      const timestamp = now();
      await complaintV3Database.resetExpiredGrantAndEnqueue(command.id, attachmentId, {
        id: createLocalUuid(),
        aggregateId: command.aggregateId,
        commandType: "allocate_evidence",
        payloadJson: JSON.stringify({ attachmentId }),
        state: "pending",
        attempts: 0,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      anotherPassRequested = true;
      return;
    }
    const attempts = command.attempts + 1;
    if (!typed.retryable) {
      await complaintV3Database.updateCommand(command.id, {
        state: "dead_letter",
        attempts,
        lastErrorCode: typed.code ?? "delivery_failed",
      });
      throw error;
    }
    const nextAttemptAt = typed.retryAfterMs
      ? new Date(Date.now() + typed.retryAfterMs).toISOString()
      : retryAt(attempts);
    await complaintV3Database.updateCommand(command.id, {
      state: "retry_wait",
      attempts,
      nextAttemptAt,
      lastErrorCode: typed.code ?? "network_unavailable",
    });
    scheduleWake(nextAttemptAt);
    throw error;
  }
}

function scheduleWake(at: string) {
  const target = new Date(at).getTime();
  if (!Number.isFinite(target)) return;
  if (retryTimer && retryTimerAt !== undefined && retryTimerAt <= target) return;
  if (retryTimer) clearTimeout(retryTimer);
  retryTimerAt = target;
  retryTimer = setTimeout(
    () => {
      retryTimer = undefined;
      retryTimerAt = undefined;
      void complaintPipelineV3Service.process();
    },
    Math.max(250, target - Date.now()),
  );
}

async function toQueueItem(draft: LocalDraft) {
  const attachments = await complaintV3Database.listAttachments(draft.id);
  const commands = await complaintV3Database.listCommands(draft.id);
  const related = commands.filter(
    (command) => command.aggregateId === draft.id && command.state !== "completed",
  );
  const dead = related.find((command) => command.state === "dead_letter");
  const retry = related.find((command) => command.state === "retry_wait");
  const status =
    dead
      ? "blocked"
      : retry
        ? "retryable_failed"
        : draft.lifecycle === "accepted"
          ? "acknowledged"
          : draft.lifecycle === "sealed"
            ? "submitting"
            : "local";
  const projectedMedia = attachments
      .filter((item) => item.state !== "omitted")
      .map((item) => ({
        id: item.id,
        uri: item.localPath,
        kind: item.kind,
        originalName: item.displayName,
        mimeType: item.declaredMimeType,
        totalBytes: item.totalBytes,
        uploadedBytes: item.uploadedBytes,
        capturedAt: item.capturedAt,
        recordedAt: item.recordedAt,
        durationMs: item.durationMs,
        state:
          item.state === "available"
            ? ("uploaded" as const)
            : item.state === "action_required"
              ? ("rejected" as const)
              : item.state === "server_processing"
                ? ("processing" as const)
                : item.state === "uploading"
                  ? ("uploading" as const)
                  : ("pending" as const),
        lastErrorCode: item.errorCode,
        managed: true,
      }));
  return {
    clientSubmissionId: draft.id,
    schemaVersion: draft.schemaVersion,
    draft: JSON.parse(draft.answersJson) as ComplaintDraft,
    media: projectedMedia,
    status,
    submitRequested: draft.lifecycle !== "editing",
    attempts: retry?.attempts ?? dead?.attempts ?? 0,
    nextAttemptAt: retry?.nextAttemptAt ?? null,
    lastErrorCode: dead?.lastErrorCode ?? retry?.lastErrorCode,
    lastErrorMediaId: attachments.find((item) => item.state === "action_required")?.id,
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt,
    referenceNumber: draft.referenceNumber,
    completionStatus: complaintCompletionStatus(
      draft.referenceNumber,
      status === "blocked" || status === "retryable_failed",
      projectedMedia,
    ),
  };
}

export const complaintPipelineV3Service = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  async initialize() {
    await complaintV3Database.initialize();
    await migrateV2Queue();
    void this.process();
  },
  async list() {
    return Promise.all((await complaintV3Database.listDrafts()).map(toQueueItem));
  },
  async get(id: string) {
    const draft = await complaintV3Database.getDraft(id);
    return draft ? toQueueItem(draft) : null;
  },
  async stageDraft(draft: ComplaintDraft) {
    return stageDraft(draft);
  },
  async enqueue(draft: ComplaintDraft) {
    return this.requestSubmit(draft);
  },
  async requestSubmit(draft: ComplaintDraft) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        await stageDraft(draft);
        const stored = await complaintV3Database.getDraft(draft.id);
        if (!stored) throw codedError("saved_report_missing");
        if (stored.lifecycle === "editing") {
          await complaintV3Database.sealAndEnqueue(
            draft.id,
            stored.revision,
            createLocalUuid(),
            JSON.stringify({ revision: stored.revision + 1 }),
          );
        }
        void this.process();
        return (await this.get(draft.id))!;
      } catch (error) {
        if (attempt === 0 && error instanceof StaleRevisionError) continue;
        throw error;
      }
    }
    throw codedError("saved_report_missing");
  },
  async process() {
    console.info("[complaint-pipeline] process_requested");
    if (activePass) {
      anotherPassRequested = true;
      return activePass;
    }
    activePass = (async () => {
      const result = { acknowledged: 0, retryableFailed: 0, blocked: 0 };
      do {
        anotherPassRequested = false;
        const owner = Array.from(getRandomBytes(16), (byte) =>
          byte.toString(16).padStart(2, "0"),
        ).join("");
        const acquired = await complaintV3Database.acquireCoordinator(owner, LEASE_MS);
        console.info("[complaint-pipeline] coordinator", { acquired });
        if (!acquired) break;
        try {
          await complaintV3Database.recoverInterruptedCommands();
          await complaintV3Database.recoverRetryableMediaCommands();
          // Repair media commands lost by an interrupted acknowledgement or
          // an older Expo Go database before taking the due-command snapshot.
          await complaintV3Database.requeueMissingEvidenceCommands();
          const due = await complaintV3Database.dueCommands(now());
          console.info("[complaint-pipeline] due_commands", {
            count: due.length,
            types: due.map((command) => command.commandType),
          });
          const run = async (command: LocalOutboxCommand) => {
            try {
              await processCommand(command);
              if (command.commandType === "submit_complaint") result.acknowledged += 1;
            } catch (error) {
              if ((error as { retryable?: boolean }).retryable) result.retryableFailed += 1;
              else result.blocked += 1;
            }
          };
          // Intake is ordered before evidence delivery. Keep local SQLite
          // mutations serialized; Expo SQLite cannot safely run overlapping
          // command transactions on the same connection.
          for (const command of due.filter((item) => item.commandType === "submit_complaint")) {
            await run(command);
          }
          for (const command of due.filter((item) => item.commandType !== "submit_complaint")) {
            await run(command);
          }
        } finally {
          await complaintV3Database.releaseCoordinator(owner);
        }
      } while (anotherPassRequested);
      const nextRetryAt = await complaintV3Database.nextRetryAt();
      if (nextRetryAt) scheduleWake(nextRetryAt);
      emit();
      return result;
    })();
    try {
      return await activePass;
    } finally {
      activePass = null;
    }
  },
  async retryFailed(draftId?: string) {
    const commands = draftId
      ? await complaintV3Database.listCommands(draftId)
      : await complaintV3Database.dueCommands("9999-12-31T23:59:59.999Z");
    for (const command of commands) {
      const retrySubmit =
        command.state === "dead_letter" && command.commandType === "submit_complaint";
      if (draftId) {
        if (command.state !== "retry_wait" && !retrySubmit) continue;
      } else if (command.state !== "retry_wait") {
        continue;
      }
      await complaintV3Database.updateCommand(command.id, {
        state: "pending",
        attempts: 0,
        nextAttemptAt: undefined,
        lastErrorCode: undefined,
      });
    }
    void this.process();
  },
  async omitMedia(draftId: string, mediaId: string) {
    const draft = await complaintV3Database.getDraft(draftId);
    const attachment = await complaintV3Database.getAttachment(mediaId);
    if (!draft || !attachment) throw codedError("saved_report_missing");
    if (draft.lifecycle === "editing") {
      await complaintV3Database.removeEditingAttachment(draftId, mediaId, draft.revision);
      await FileSystem.deleteAsync(attachment.localPath, { idempotent: true }).catch(
        () => undefined,
      );
      emit();
      return;
    }
    const timestamp = now();
    await complaintV3Database.enqueueCommand({
      id: createLocalUuid(),
      aggregateId: draftId,
      commandType: "omit_evidence",
      payloadJson: JSON.stringify({ attachmentId: mediaId }),
      state: "pending",
      attempts: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    void this.process();
  },
  async replaceMedia(
    draftId: string,
    mediaId: string,
    replacement: {
      uri: string;
      originalName: string;
      mimeType: string;
      capturedAt?: string;
      recordedAt?: string;
      durationMs?: number;
      byteLength?: number;
    },
  ) {
    const draft = await complaintV3Database.getDraft(draftId);
    const replaced = await complaintV3Database.getAttachment(mediaId);
    if (!draft || !replaced) throw codedError("saved_report_missing");
    if (draft.lifecycle !== "accepted" || replaced.state !== "action_required") {
      throw codedError("replacement_not_allowed");
    }
    const source = new File(replacement.uri);
    const sourceBytes = replacement.byteLength ?? (source.exists ? source.size : 0);
    validateAttachment(replaced.kind, replacement.mimeType.toLowerCase(), sourceBytes);
    const current = await complaintV3Database.listAttachments(draftId);
    const active = current.filter((item) => item.state !== "omitted" && item.id !== mediaId);
    const nonVoice =
      active.filter((item) => item.kind !== "voice").length + (replaced.kind === "voice" ? 0 : 1);
    const aggregate = active.reduce((sum, item) => sum + item.totalBytes, 0) + sourceBytes;
    if (nonVoice > 5) throw codedError("attachment_count_limit");
    if (aggregate > 50 * 1024 * 1024) throw codedError("aggregate_limit");
    const replacementId = createLocalUuid();
    const copy = await durableCopy(
      draftId,
      replacementId,
      replacement.uri,
      replacement.originalName,
    );
    try {
      const timestamp = now();
      await complaintV3Database.insertAcceptedReplacement(
        {
          id: replacementId,
          draftId,
          revision: 1,
          kind: replaced.kind,
          localPath: copy.path,
          displayName: safeName(replacement.originalName),
          declaredMimeType: replacement.mimeType.toLowerCase(),
          totalBytes: copy.bytes,
          uploadedBytes: 0,
          state: "pending_allocation",
          attempts: 0,
          replacementForId: mediaId,
          capturedAt: replacement.capturedAt,
          recordedAt: replacement.recordedAt,
          durationMs: replacement.durationMs,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
        mediaId,
      );
    } catch (error) {
      await FileSystem.deleteAsync(copy.path, { idempotent: true }).catch(() => undefined);
      throw error;
    }
    emit();
    void this.process();
  },
  async discard(draftId: string) {
    const draft = await complaintV3Database.getDraft(draftId);
    if (!draft) return;
    if (draft.lifecycle !== "editing") throw codedError("submitted_report_cannot_be_discarded");
    const attachments = await complaintV3Database.listAttachments(draftId);
    await complaintV3Database.discardDraft(draftId);
    for (const attachment of attachments) {
      await FileSystem.deleteAsync(attachment.localPath, { idempotent: true }).catch(
        () => undefined,
      );
    }
    await expoIdentityService.removeIdentity(draftId);
    emit();
  },
  async listRegistry() {
    return (await complaintV3Database.listDrafts())
      .filter((draft) => draft.referenceNumber)
      .map((draft) => ({
        clientSubmissionId: draft.id,
        referenceNumber: draft.referenceNumber!,
        updatedAt: draft.updatedAt,
      }));
  },
  async clear() {
    throw codedError("destructive_clear_disabled");
  },
};
