import Constants from "expo-constants";
import { getRandomBytes } from "expo-crypto";
import * as SecureStore from "expo-secure-store";

export const submissionStates = [
  "drafting",
  "queued",
  "uploading",
  "processing",
  "ready",
  "submitting",
  "acknowledged",
  "retryable_failed",
  "blocked",
] as const;
export type SubmissionState = (typeof submissionStates)[number];

export const mediaStates = [
  "staging",
  "queued",
  "creating",
  "uploading",
  "processing",
  "uploaded",
  "retryable_failed",
  "rejected",
  "missing",
  "cancelled",
] as const;
export type MediaState = (typeof mediaStates)[number];

export interface SubmissionRecord {
  clientSubmissionId: string;
  schemaVersion: number;
  state: SubmissionState;
  submitRequested: boolean;
  draftJson: string;
  referenceNumber?: string;
  attempts: number;
  nextAttemptAt?: string;
  lastErrorCode?: string;
  leaseOwner?: string;
  leaseExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MediaRecord {
  id: string;
  clientSubmissionId: string;
  kind: "voice" | "photo" | "document";
  localUri: string;
  originalName: string;
  mimeType: string;
  totalBytes: number;
  uploadedBytes: number;
  state: MediaState;
  uploadUrl?: string;
  uploadToken?: string;
  uploadExpiresAt?: string;
  attempts: number;
  nextAttemptAt?: string;
  lastErrorCode?: string;
  capturedAt?: string;
  recordedAt?: string;
  durationMs?: number;
  managed: boolean;
}

interface SubmissionRow {
  client_submission_id: string;
  schema_version: number;
  state: SubmissionState;
  submit_requested: number;
  draft_json: string;
  reference_number: string | null;
  attempts: number;
  next_attempt_at: string | null;
  last_error_code: string | null;
  lease_owner: string | null;
  lease_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

interface MediaRow {
  id: string;
  client_submission_id: string;
  kind: MediaRecord["kind"];
  local_uri: string;
  original_name: string;
  mime_type: string;
  total_bytes: number;
  uploaded_bytes: number;
  state: MediaState;
  upload_url: string | null;
  upload_token: string | null;
  upload_expires_at: string | null;
  attempts: number;
  next_attempt_at: string | null;
  last_error_code: string | null;
  captured_at: string | null;
  recorded_at: string | null;
  duration_ms: number | null;
  managed: number;
}

type Database = import("expo-sqlite").SQLiteDatabase;
const DATABASE_KEY = "kapas.sync-database-key.v1";
let databasePromise: Promise<Database> | undefined;
let transactionQueue: Promise<unknown> = Promise.resolve();

async function withKeyedTransaction<T>(
  db: Database,
  callback: (transaction: Database) => Promise<T>,
): Promise<T> {
  const run = transactionQueue.then(async () => {
    await db.execAsync("BEGIN IMMEDIATE;");
    try {
      const result = await callback(db);
      await db.execAsync("COMMIT;");
      return result;
    } catch (error) {
      await db.execAsync("ROLLBACK;").catch(() => undefined);
      throw error;
    }
  });
  transactionQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

const memorySubmissions = new Map<string, SubmissionRecord>();
const memoryMedia = new Map<string, MediaRecord>();
let memoryCoordinatorLease: { owner: string; expiresAt: string } | undefined;
const isExpoGo = Constants.executionEnvironment === "storeClient" || Constants.appOwnership === "expo";
const allowInsecureExpoGo = process.env.EXPO_PUBLIC_ALLOW_INSECURE_EXPO_GO === "true";
const useMemory = process.env.NODE_ENV === "test" || (isExpoGo && allowInsecureExpoGo);

const optional = (value: string | null) => value ?? undefined;
function mapSubmission(row: SubmissionRow): SubmissionRecord {
  return {
    clientSubmissionId: row.client_submission_id,
    schemaVersion: row.schema_version,
    state: row.state,
    submitRequested: row.submit_requested === 1,
    draftJson: row.draft_json,
    referenceNumber: optional(row.reference_number),
    attempts: row.attempts,
    nextAttemptAt: optional(row.next_attempt_at),
    lastErrorCode: optional(row.last_error_code),
    leaseOwner: optional(row.lease_owner),
    leaseExpiresAt: optional(row.lease_expires_at),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMedia(row: MediaRow): MediaRecord {
  return {
    id: row.id,
    clientSubmissionId: row.client_submission_id,
    kind: row.kind,
    localUri: row.local_uri,
    originalName: row.original_name,
    mimeType: row.mime_type,
    totalBytes: row.total_bytes,
    uploadedBytes: row.uploaded_bytes,
    state: row.state,
    uploadUrl: optional(row.upload_url),
    uploadToken: optional(row.upload_token),
    uploadExpiresAt: optional(row.upload_expires_at),
    attempts: row.attempts,
    nextAttemptAt: optional(row.next_attempt_at),
    lastErrorCode: optional(row.last_error_code),
    capturedAt: optional(row.captured_at),
    recordedAt: optional(row.recorded_at),
    durationMs: row.duration_ms ?? undefined,
    managed: row.managed === 1,
  };
}

function hex(bytes: Uint8Array): string {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

async function databaseKey(): Promise<string> {
  const existing = await SecureStore.getItemAsync(DATABASE_KEY);
  if (existing) return existing;
  const generated = hex(getRandomBytes(32));
  await SecureStore.setItemAsync(DATABASE_KEY, generated, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  return generated;
}

async function openDatabase(): Promise<Database> {
  if (!databasePromise) {
    databasePromise = (async () => {
      if (isExpoGo) throw new Error("sqlcipher_unavailable_in_expo_go");
      const SQLite = await import("expo-sqlite");
      const db = await SQLite.openDatabaseAsync("kapas-sync-v1.db");
      const key = await databaseKey();
      await db.execAsync(`PRAGMA key = '${key}';`);
      const cipher = await db.getFirstAsync<{ cipher_version: string }>("PRAGMA cipher_version;");
      if (!cipher?.cipher_version) throw new Error("sqlcipher_unavailable");
      console.info("[storage] SQLCipher initialized", {
        database: "kapas-sync-v1.db",
        cipherVersion: cipher.cipher_version,
      });
      await db.execAsync("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS sync_submissions (
          client_submission_id TEXT PRIMARY KEY NOT NULL,
          schema_version INTEGER NOT NULL,
          state TEXT NOT NULL,
          submit_requested INTEGER NOT NULL DEFAULT 0,
          draft_json TEXT NOT NULL,
          reference_number TEXT,
          attempts INTEGER NOT NULL DEFAULT 0,
          next_attempt_at TEXT,
          last_error_code TEXT,
          lease_owner TEXT,
          lease_expires_at TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS sync_media (
          id TEXT PRIMARY KEY NOT NULL,
          client_submission_id TEXT NOT NULL REFERENCES sync_submissions(client_submission_id) ON DELETE CASCADE,
          kind TEXT NOT NULL,
          local_uri TEXT NOT NULL,
          original_name TEXT NOT NULL,
          mime_type TEXT NOT NULL,
          total_bytes INTEGER NOT NULL,
          uploaded_bytes INTEGER NOT NULL DEFAULT 0,
          state TEXT NOT NULL,
          upload_url TEXT,
          upload_token TEXT,
          upload_expires_at TEXT,
          attempts INTEGER NOT NULL DEFAULT 0,
          next_attempt_at TEXT,
          last_error_code TEXT,
          captured_at TEXT,
          recorded_at TEXT,
          duration_ms INTEGER,
          managed INTEGER NOT NULL DEFAULT 1
        );
        CREATE INDEX IF NOT EXISTS sync_submissions_state_idx ON sync_submissions(state, next_attempt_at);
        CREATE INDEX IF NOT EXISTS sync_media_submission_idx ON sync_media(client_submission_id, state);
        CREATE TABLE IF NOT EXISTS sync_coordinator (
          singleton INTEGER PRIMARY KEY NOT NULL CHECK (singleton = 1),
          lease_owner TEXT,
          lease_expires_at TEXT
        );
        INSERT OR IGNORE INTO sync_coordinator(singleton) VALUES (1);
      `);
      return db;
    })();
  }
  return databasePromise;
}

export const syncDatabase = {
  durable: !useMemory,

  async initialize(): Promise<void> {
    if (!useMemory) await openDatabase();
  },

  async listSubmissions(): Promise<SubmissionRecord[]> {
    if (useMemory) return [...memorySubmissions.values()].map((row) => ({ ...row }));
    const db = await openDatabase();
    return (await db.getAllAsync<SubmissionRow>("SELECT * FROM sync_submissions ORDER BY created_at ASC")).map(mapSubmission);
  },

  async getSubmission(id: string): Promise<SubmissionRecord | null> {
    if (useMemory) return memorySubmissions.get(id) ?? null;
    const db = await openDatabase();
    const row = await db.getFirstAsync<SubmissionRow>(
      "SELECT * FROM sync_submissions WHERE client_submission_id = ?",
      id,
    );
    return row ? mapSubmission(row) : null;
  },

  async listMedia(clientSubmissionId: string): Promise<MediaRecord[]> {
    if (useMemory)
      return [...memoryMedia.values()].filter((row) => row.clientSubmissionId === clientSubmissionId).map((row) => ({ ...row }));
    const db = await openDatabase();
    return (
      await db.getAllAsync<MediaRow>(
        "SELECT * FROM sync_media WHERE client_submission_id = ? ORDER BY rowid ASC",
        clientSubmissionId,
      )
    ).map(mapMedia);
  },

  async putSubmission(record: SubmissionRecord): Promise<void> {
    if (useMemory) {
      memorySubmissions.set(record.clientSubmissionId, { ...record });
      return;
    }
    const db = await openDatabase();
    await db.runAsync(
      `INSERT INTO sync_submissions
       (client_submission_id, schema_version, state, submit_requested, draft_json, reference_number,
        attempts, next_attempt_at, last_error_code, lease_owner, lease_expires_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(client_submission_id) DO UPDATE SET
         schema_version=excluded.schema_version, state=excluded.state,
         submit_requested=excluded.submit_requested, draft_json=excluded.draft_json,
         reference_number=excluded.reference_number, attempts=excluded.attempts,
         next_attempt_at=excluded.next_attempt_at, last_error_code=excluded.last_error_code,
         lease_owner=excluded.lease_owner, lease_expires_at=excluded.lease_expires_at,
         updated_at=excluded.updated_at`,
      record.clientSubmissionId,
      record.schemaVersion,
      record.state,
      record.submitRequested ? 1 : 0,
      record.draftJson,
      record.referenceNumber ?? null,
      record.attempts,
      record.nextAttemptAt ?? null,
      record.lastErrorCode ?? null,
      record.leaseOwner ?? null,
      record.leaseExpiresAt ?? null,
      record.createdAt,
      record.updatedAt,
    );
  },

  async putMedia(record: MediaRecord): Promise<void> {
    if (useMemory) {
      memoryMedia.set(record.id, { ...record });
      return;
    }
    const db = await openDatabase();
    await db.runAsync(
      `INSERT INTO sync_media
       (id, client_submission_id, kind, local_uri, original_name, mime_type, total_bytes,
        uploaded_bytes, state, upload_url, upload_token, upload_expires_at, attempts,
        next_attempt_at, last_error_code, captured_at, recorded_at, duration_ms, managed)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         local_uri=excluded.local_uri, original_name=excluded.original_name, mime_type=excluded.mime_type,
         total_bytes=excluded.total_bytes, uploaded_bytes=excluded.uploaded_bytes, state=excluded.state,
         upload_url=excluded.upload_url, upload_token=excluded.upload_token,
         upload_expires_at=excluded.upload_expires_at, attempts=excluded.attempts,
         next_attempt_at=excluded.next_attempt_at, last_error_code=excluded.last_error_code,
         captured_at=excluded.captured_at, recorded_at=excluded.recorded_at,
         duration_ms=excluded.duration_ms, managed=excluded.managed`,
      record.id,
      record.clientSubmissionId,
      record.kind,
      record.localUri,
      record.originalName,
      record.mimeType,
      record.totalBytes,
      record.uploadedBytes,
      record.state,
      record.uploadUrl ?? null,
      record.uploadToken ?? null,
      record.uploadExpiresAt ?? null,
      record.attempts,
      record.nextAttemptAt ?? null,
      record.lastErrorCode ?? null,
      record.capturedAt ?? null,
      record.recordedAt ?? null,
      record.durationMs ?? null,
      record.managed ? 1 : 0,
    );
  },

  async deleteMedia(id: string): Promise<void> {
    if (useMemory) {
      memoryMedia.delete(id);
      return;
    }
    await (await openDatabase()).runAsync("DELETE FROM sync_media WHERE id = ?", id);
  },

  async deleteSubmission(id: string): Promise<void> {
    if (useMemory) {
      memorySubmissions.delete(id);
      for (const [mediaId, media] of memoryMedia)
        if (media.clientSubmissionId === id) memoryMedia.delete(mediaId);
      return;
    }
    await (await openDatabase()).runAsync(
      "DELETE FROM sync_submissions WHERE client_submission_id = ?",
      id,
    );
  },

  async acquireLease(id: string, owner: string, ttlMs: number): Promise<boolean> {
    const now = new Date();
    const expiry = new Date(now.getTime() + ttlMs).toISOString();
    if (useMemory) {
      const row = memorySubmissions.get(id);
      if (!row) return false;
      if (row.leaseExpiresAt && row.leaseExpiresAt > now.toISOString() && row.leaseOwner !== owner)
        return false;
      memorySubmissions.set(id, { ...row, leaseOwner: owner, leaseExpiresAt: expiry });
      return true;
    }
    const db = await openDatabase();
    const result = await db.runAsync(
      `UPDATE sync_submissions SET lease_owner = ?, lease_expires_at = ?
       WHERE client_submission_id = ?
         AND (lease_expires_at IS NULL OR lease_expires_at <= ? OR lease_owner = ?)`,
      owner,
      expiry,
      id,
      now.toISOString(),
      owner,
    );
    return result.changes === 1;
  },

  async acquireCoordinatorLease(owner: string, ttlMs: number): Promise<boolean> {
    const timestamp = new Date();
    const expiry = new Date(timestamp.getTime() + ttlMs).toISOString();
    if (useMemory) {
      if (memoryCoordinatorLease && memoryCoordinatorLease.expiresAt > timestamp.toISOString() && memoryCoordinatorLease.owner !== owner) return false;
      memoryCoordinatorLease = { owner, expiresAt: expiry };
      return true;
    }
    const result = await (await openDatabase()).runAsync(
      `UPDATE sync_coordinator SET lease_owner = ?, lease_expires_at = ?
       WHERE singleton = 1 AND (lease_expires_at IS NULL OR lease_expires_at <= ? OR lease_owner = ?)`,
      owner, expiry, timestamp.toISOString(), owner,
    );
    return result.changes === 1;
  },

  async renewCoordinatorLease(owner: string, ttlMs: number): Promise<boolean> {
    const expiry = new Date(Date.now() + ttlMs).toISOString();
    if (useMemory) {
      if (memoryCoordinatorLease?.owner !== owner) return false;
      memoryCoordinatorLease = { owner, expiresAt: expiry };
      return true;
    }
    const result = await (await openDatabase()).runAsync(
      "UPDATE sync_coordinator SET lease_expires_at = ? WHERE singleton = 1 AND lease_owner = ?",
      expiry,
      owner,
    );
    return result.changes === 1;
  },

  async renewLease(id: string, owner: string, ttlMs: number): Promise<boolean> {
    const expiry = new Date(Date.now() + ttlMs).toISOString();
    if (useMemory) {
      const row = memorySubmissions.get(id);
      if (!row || row.leaseOwner !== owner) return false;
      memorySubmissions.set(id, { ...row, leaseExpiresAt: expiry });
      return true;
    }
    const result = await (await openDatabase()).runAsync(
      "UPDATE sync_submissions SET lease_expires_at = ? WHERE client_submission_id = ? AND lease_owner = ?",
      expiry,
      id,
      owner,
    );
    return result.changes === 1;
  },

  async releaseCoordinatorLease(owner: string): Promise<void> {
    if (useMemory) {
      if (memoryCoordinatorLease?.owner === owner) memoryCoordinatorLease = undefined;
      return;
    }
    await (await openDatabase()).runAsync(
      "UPDATE sync_coordinator SET lease_owner = NULL, lease_expires_at = NULL WHERE singleton = 1 AND lease_owner = ?",
      owner,
    );
  },

  async releaseLease(id: string, owner: string): Promise<void> {
    const row = await syncDatabase.getSubmission(id);
    if (!row || row.leaseOwner !== owner) return;
    await syncDatabase.putSubmission({ ...row, leaseOwner: undefined, leaseExpiresAt: undefined });
  },

  async importLegacy(submissions: SubmissionRecord[], media: MediaRecord[]): Promise<void> {
    if (useMemory) {
      for (const record of submissions) memorySubmissions.set(record.clientSubmissionId, { ...record });
      for (const record of media) memoryMedia.set(record.id, { ...record });
      return;
    }
    const db = await openDatabase();
    await withKeyedTransaction(db, async (tx) => {
      for (const record of submissions) {
        await tx.runAsync(
          `INSERT OR REPLACE INTO sync_submissions
           (client_submission_id, schema_version, state, submit_requested, draft_json, reference_number,
            attempts, next_attempt_at, last_error_code, lease_owner, lease_expires_at, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          record.clientSubmissionId, record.schemaVersion, record.state, record.submitRequested ? 1 : 0,
          record.draftJson, record.referenceNumber ?? null, record.attempts, record.nextAttemptAt ?? null,
          record.lastErrorCode ?? null, record.leaseOwner ?? null, record.leaseExpiresAt ?? null,
          record.createdAt, record.updatedAt,
        );
      }
      for (const record of media) {
        await tx.runAsync(
          `INSERT OR REPLACE INTO sync_media
           (id, client_submission_id, kind, local_uri, original_name, mime_type, total_bytes,
            uploaded_bytes, state, upload_url, upload_token, upload_expires_at, attempts,
            next_attempt_at, last_error_code, captured_at, recorded_at, duration_ms, managed)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          record.id, record.clientSubmissionId, record.kind, record.localUri, record.originalName,
          record.mimeType, record.totalBytes, record.uploadedBytes, record.state, record.uploadUrl ?? null,
          record.uploadToken ?? null, record.uploadExpiresAt ?? null, record.attempts,
          record.nextAttemptAt ?? null, record.lastErrorCode ?? null, record.capturedAt ?? null,
          record.recordedAt ?? null, record.durationMs ?? null, record.managed ? 1 : 0,
        );
      }
    });
  },

  async clear(): Promise<void> {
    if (useMemory) {
      memorySubmissions.clear();
      memoryMedia.clear();
      memoryCoordinatorLease = undefined;
      return;
    }
    const db = await openDatabase();
    await withKeyedTransaction(db, async (tx) => {
      await tx.execAsync("DELETE FROM sync_media; DELETE FROM sync_submissions;");
    });
  },
};
