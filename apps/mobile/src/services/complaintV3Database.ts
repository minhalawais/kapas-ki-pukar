import { utf8ToBytes } from "@noble/ciphers/utils.js";
import Constants from "expo-constants";
import { getRandomBytes } from "expo-crypto";
import * as SecureStore from "expo-secure-store";

import { assertAttachmentTransition } from "./complaintV3StateMachine";

export type DraftLifecycle = "editing" | "sealed" | "accepted" | "discarded";
export type AttachmentDeliveryState =
  | "staged"
  | "pending_allocation"
  | "allocated"
  | "uploading"
  | "server_processing"
  | "available"
  | "retry_wait"
  | "action_required"
  | "omitted";
export type OutboxState = "pending" | "running" | "retry_wait" | "completed" | "dead_letter";
export type CommandType =
  | "submit_complaint"
  | "allocate_evidence"
  | "upload_evidence"
  | "refresh_evidence"
  | "omit_evidence";

export interface LocalDraft {
  id: string;
  revision: number;
  lifecycle: DraftLifecycle;
  currentStep: string;
  schemaVersion: number;
  answersJson: string;
  privacyMode?: "ANON" | "CONF" | "IDEN";
  referenceNumber?: string;
  encryptedTrackingSecret?: Uint8Array;
  acceptedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocalAttachment {
  id: string;
  draftId: string;
  revision: number;
  kind: "voice" | "photo" | "document";
  localPath: string;
  displayName: string;
  declaredMimeType: string;
  totalBytes: number;
  uploadedBytes: number;
  state: AttachmentDeliveryState;
  serverEvidenceId?: string;
  uploadUrl?: string;
  encryptedUploadToken?: Uint8Array;
  grantExpiresAt?: string;
  attempts: number;
  nextAttemptAt?: string;
  errorCode?: string;
  replacementForId?: string;
  capturedAt?: string;
  recordedAt?: string;
  durationMs?: number;
  createdAt: string;
  updatedAt: string;
}

export interface LocalOutboxCommand {
  id: string;
  aggregateId: string;
  commandType: CommandType;
  payloadJson: string;
  state: OutboxState;
  attempts: number;
  nextAttemptAt?: string;
  leaseOwner?: string;
  leaseExpiresAt?: string;
  lastErrorCode?: string;
  createdAt: string;
  updatedAt: string;
}

type Database = import("expo-sqlite").SQLiteDatabase;
let writeQueue: Promise<unknown> = Promise.resolve();

/** SQLCipher keys are connection-local. Expo's exclusive transaction API opens
 * a second native connection, which cannot read the encrypted database unless
 * it is keyed separately. Keep writes on the keyed primary connection and
 * serialize them so BEGIN/COMMIT boundaries cannot overlap. */
async function withWriteTransaction<T>(
  db: Database,
  callback: (transaction: Database) => Promise<T>,
): Promise<T> {
  const run = writeQueue.then(
    async () => {
      await db.execAsync("BEGIN IMMEDIATE;");
      try {
        const result = await callback(db);
        await db.execAsync("COMMIT;");
        return result;
      } catch (error) {
        await db.execAsync("ROLLBACK;").catch(() => undefined);
        throw error;
      }
    },
  );
  writeQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}
const DATABASE_KEY = "kapas.complaint-v3.sqlcipher-key.v1";
const IS_EXPO_GO =
  Constants.executionEnvironment === "storeClient" || Constants.appOwnership === "expo";
const ALLOW_INSECURE_EXPO_GO = process.env.EXPO_PUBLIC_ALLOW_INSECURE_EXPO_GO === "true";
// Expo Go cannot load config-plugin native modules such as SQLCipher. Keep its
// test data in a separate database so it can never be confused with the
// encrypted database used by a standalone/development build.
const DATABASE_NAME = IS_EXPO_GO
  ? "kapas-complaints-v3-expogo.db"
  : "kapas-complaints-v3.db";
let databasePromise: Promise<Database> | undefined;

function hex(bytes: Uint8Array): string {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

async function key(): Promise<string> {
  const existing = await SecureStore.getItemAsync(DATABASE_KEY);
  if (existing) return existing;
  const generated = hex(getRandomBytes(32));
  await SecureStore.setItemAsync(DATABASE_KEY, generated, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  return generated;
}

async function open(): Promise<Database> {
  if (!databasePromise)
    databasePromise = (async () => {
      const SQLite = await import("expo-sqlite");
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      const encryptionKey = await key();
       if (!IS_EXPO_GO) {
         await db.execAsync(`PRAGMA key = '${encryptionKey}';`);
         const cipher = await db.getFirstAsync<{ cipher_version: string }>("PRAGMA cipher_version;");
         if (!cipher?.cipher_version) throw new Error("sqlcipher_unavailable");
         console.info("[storage] SQLCipher initialized", {
           database: DATABASE_NAME,
           cipherVersion: cipher.cipher_version,
         });
       } else if (ALLOW_INSECURE_EXPO_GO) {
         console.warn(
           "Expo Go does not support SQLCipher; using the isolated unencrypted Expo Go database. Use a development build for protected local storage.",
         );
       } else {
         throw new Error("sqlcipher_unavailable_in_expo_go");
       }
       await db.execAsync(
         "PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA synchronous = FULL; PRAGMA busy_timeout = 10000;",
       );
      await db.execAsync(`
      CREATE TABLE IF NOT EXISTS local_drafts (
        id TEXT PRIMARY KEY NOT NULL, revision INTEGER NOT NULL, lifecycle TEXT NOT NULL,
        current_step TEXT NOT NULL, schema_version INTEGER NOT NULL, answers_json TEXT NOT NULL,
        privacy_mode TEXT, reference_number TEXT, encrypted_tracking_secret BLOB, accepted_at TEXT,
        created_at TEXT NOT NULL, updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS local_attachments (
        id TEXT PRIMARY KEY NOT NULL, draft_id TEXT NOT NULL REFERENCES local_drafts(id) ON DELETE RESTRICT,
        revision INTEGER NOT NULL, kind TEXT NOT NULL, local_path TEXT NOT NULL, display_name TEXT NOT NULL,
        declared_mime_type TEXT NOT NULL, total_bytes INTEGER NOT NULL, uploaded_bytes INTEGER NOT NULL DEFAULT 0,
        state TEXT NOT NULL, server_evidence_id TEXT, upload_url TEXT, encrypted_upload_token BLOB,
        grant_expires_at TEXT, attempts INTEGER NOT NULL DEFAULT 0, next_attempt_at TEXT,
        error_code TEXT, replacement_for_id TEXT, captured_at TEXT, recorded_at TEXT, duration_ms INTEGER,
        created_at TEXT NOT NULL, updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS local_outbox (
        id TEXT PRIMARY KEY NOT NULL, aggregate_id TEXT NOT NULL REFERENCES local_drafts(id) ON DELETE RESTRICT,
        command_type TEXT NOT NULL, payload_json TEXT NOT NULL, state TEXT NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0, next_attempt_at TEXT, lease_owner TEXT,
        lease_expires_at TEXT, last_error_code TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS local_outbox_active_command_key
        ON local_outbox(aggregate_id, command_type, payload_json)
        WHERE state IN ('pending', 'running', 'retry_wait');
      CREATE INDEX IF NOT EXISTS local_outbox_due_idx ON local_outbox(state, next_attempt_at, created_at);
      CREATE INDEX IF NOT EXISTS local_attachments_draft_state_idx ON local_attachments(draft_id, state);
      CREATE TABLE IF NOT EXISTS local_coordinator (
        singleton INTEGER PRIMARY KEY NOT NULL CHECK(singleton = 1), lease_owner TEXT, lease_expires_at TEXT
      );
      INSERT OR IGNORE INTO local_coordinator(singleton) VALUES (1);
    `);
      // Earlier internal V3 builds created this table before capture metadata was
      // added. CREATE TABLE IF NOT EXISTS does not evolve an existing table, so
      // inspect the physical schema instead of trusting a previously-written
      // user_version value.
      const attachmentColumns = await db.getAllAsync<{ name: string }>(
        "PRAGMA table_info(local_attachments);",
      );
      const columnNames = new Set(attachmentColumns.map((column) => column.name));
      const additions = [
        ["captured_at", "TEXT"],
        ["recorded_at", "TEXT"],
        ["duration_ms", "INTEGER"],
      ] as const;
      for (const [name, type] of additions) {
        if (!columnNames.has(name))
          await db.execAsync(`ALTER TABLE local_attachments ADD COLUMN ${name} ${type};`);
      }
      await db.execAsync("PRAGMA user_version = 4;");
      return db;
    })();
  return databasePromise;
}

const optional = <T>(value: T | null): T | undefined => value ?? undefined;

function mapDraft(row: Record<string, unknown>): LocalDraft {
  return {
    id: String(row.id),
    revision: Number(row.revision),
    lifecycle: row.lifecycle as DraftLifecycle,
    currentStep: String(row.current_step),
    schemaVersion: Number(row.schema_version),
    answersJson: String(row.answers_json),
    privacyMode: optional(row.privacy_mode as LocalDraft["privacyMode"] | null),
    referenceNumber: optional(row.reference_number as string | null),
    encryptedTrackingSecret: optional(row.encrypted_tracking_secret as Uint8Array | null),
    acceptedAt: optional(row.accepted_at as string | null),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapAttachment(row: Record<string, unknown>): LocalAttachment {
  return {
    id: String(row.id),
    draftId: String(row.draft_id),
    revision: Number(row.revision),
    kind: row.kind as LocalAttachment["kind"],
    localPath: String(row.local_path),
    displayName: String(row.display_name),
    declaredMimeType: String(row.declared_mime_type),
    totalBytes: Number(row.total_bytes),
    uploadedBytes: Number(row.uploaded_bytes),
    state: row.state as AttachmentDeliveryState,
    serverEvidenceId: optional(row.server_evidence_id as string | null),
    uploadUrl: optional(row.upload_url as string | null),
    encryptedUploadToken: optional(row.encrypted_upload_token as Uint8Array | null),
    grantExpiresAt: optional(row.grant_expires_at as string | null),
    attempts: Number(row.attempts),
    nextAttemptAt: optional(row.next_attempt_at as string | null),
    errorCode: optional(row.error_code as string | null),
    replacementForId: optional(row.replacement_for_id as string | null),
    capturedAt: optional(row.captured_at as string | null),
    recordedAt: optional(row.recorded_at as string | null),
    durationMs:
      row.duration_ms === null || row.duration_ms === undefined
        ? undefined
        : Number(row.duration_ms),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapCommand(row: Record<string, unknown>): LocalOutboxCommand {
  return {
    id: String(row.id),
    aggregateId: String(row.aggregate_id),
    commandType: row.command_type as CommandType,
    payloadJson: String(row.payload_json),
    state: row.state as OutboxState,
    attempts: Number(row.attempts),
    nextAttemptAt: optional(row.next_attempt_at as string | null),
    leaseOwner: optional(row.lease_owner as string | null),
    leaseExpiresAt: optional(row.lease_expires_at as string | null),
    lastErrorCode: optional(row.last_error_code as string | null),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export class StaleRevisionError extends Error {
  constructor() {
    super("stale_revision");
    this.name = "StaleRevisionError";
  }
}

const complaintV3DatabaseRaw = {
  async initialize() {
    await open();
  },
  async getDraft(id: string) {
    const db = await open();
    const row = await db.getFirstAsync<Record<string, unknown>>(
      "SELECT * FROM local_drafts WHERE id = ?",
      id,
    );
    return row ? mapDraft(row) : null;
  },
  async listDrafts() {
    const db = await open();
    return (
      await db.getAllAsync<Record<string, unknown>>(
        "SELECT * FROM local_drafts WHERE lifecycle <> 'discarded' ORDER BY updated_at DESC",
      )
    ).map(mapDraft);
  },
  async listAttachments(draftId: string) {
    const db = await open();
    return (
      await db.getAllAsync<Record<string, unknown>>(
        "SELECT * FROM local_attachments WHERE draft_id = ? ORDER BY created_at",
        draftId,
      )
    ).map(mapAttachment);
  },
  async saveEditingDraft(
    input: Omit<LocalDraft, "revision" | "createdAt" | "updatedAt">,
    expectedRevision?: number,
  ) {
    const db = await open();
    const timestamp = new Date().toISOString();
    let saved: LocalDraft | undefined;
    await withWriteTransaction(db, async (tx) => {
      const existing = await tx.getFirstAsync<Record<string, unknown>>(
        "SELECT * FROM local_drafts WHERE id = ?",
        input.id,
      );
      if (!existing) {
        await tx.runAsync(
          "INSERT INTO local_drafts(id, revision, lifecycle, current_step, schema_version, answers_json, privacy_mode, created_at, updated_at) VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?)",
          input.id,
          input.lifecycle,
          input.currentStep,
          input.schemaVersion,
          input.answersJson,
          input.privacyMode ?? null,
          timestamp,
          timestamp,
        );
        const inserted = await tx.getFirstAsync<Record<string, unknown>>(
          "SELECT * FROM local_drafts WHERE id = ?",
          input.id,
        );
        saved = mapDraft(inserted!);
        return;
      }
      const revision = Number(existing.revision);
      if (expectedRevision !== undefined && revision !== expectedRevision)
        throw new StaleRevisionError();
      const result = await tx.runAsync(
        "UPDATE local_drafts SET revision = revision + 1, lifecycle = ?, current_step = ?, schema_version = ?, answers_json = ?, privacy_mode = ?, updated_at = ? WHERE id = ? AND revision = ? AND lifecycle = 'editing'",
        input.lifecycle,
        input.currentStep,
        input.schemaVersion,
        input.answersJson,
        input.privacyMode ?? null,
        timestamp,
        input.id,
        revision,
      );
      if (result.changes !== 1) throw new StaleRevisionError();
      const updated = await tx.getFirstAsync<Record<string, unknown>>(
        "SELECT * FROM local_drafts WHERE id = ?",
        input.id,
      );
      saved = mapDraft(updated!);
    });
    if (!saved) throw new Error("draft_write_failed");
    return saved;
  },
  async commitEditingDraft(
    input: Omit<LocalDraft, "revision" | "createdAt" | "updatedAt">,
    expectedRevision: number | undefined,
    additions: LocalAttachment[],
    removalIds: string[],
  ) {
    const db = await open();
    const timestamp = new Date().toISOString();
    let saved: LocalDraft | undefined;
    await withWriteTransaction(db, async (tx) => {
      const existing = await tx.getFirstAsync<Record<string, unknown>>(
        "SELECT * FROM local_drafts WHERE id=?",
        input.id,
      );
      if (!existing) {
        if (expectedRevision !== undefined) throw new StaleRevisionError();
        await tx.runAsync(
          "INSERT INTO local_drafts(id,revision,lifecycle,current_step,schema_version,answers_json,privacy_mode,created_at,updated_at) VALUES (?,1,'editing',?,?,?,?,?,?)",
          input.id,
          input.currentStep,
          input.schemaVersion,
          input.answersJson,
          input.privacyMode ?? null,
          timestamp,
          timestamp,
        );
      } else {
        const revision = Number(existing.revision);
        if (expectedRevision !== revision) throw new StaleRevisionError();
        const result = await tx.runAsync(
          "UPDATE local_drafts SET revision=revision+1,current_step=?,schema_version=?,answers_json=?,privacy_mode=?,updated_at=? WHERE id=? AND revision=? AND lifecycle='editing'",
          input.currentStep,
          input.schemaVersion,
          input.answersJson,
          input.privacyMode ?? null,
          timestamp,
          input.id,
          revision,
        );
        if (result.changes !== 1) throw new StaleRevisionError();
      }
      for (const attachmentId of removalIds) {
        await tx.runAsync(
          "DELETE FROM local_attachments WHERE id=? AND draft_id=?",
          attachmentId,
          input.id,
        );
      }
      for (const attachment of additions) {
        await tx.runAsync(
          `INSERT INTO local_attachments(id,draft_id,revision,kind,local_path,display_name,declared_mime_type,total_bytes,uploaded_bytes,state,attempts,replacement_for_id,captured_at,recorded_at,duration_ms,created_at,updated_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          attachment.id,
          attachment.draftId,
          1,
          attachment.kind,
          attachment.localPath,
          attachment.displayName,
          attachment.declaredMimeType,
          attachment.totalBytes,
          attachment.uploadedBytes,
          attachment.state,
          attachment.attempts,
          attachment.replacementForId ?? null,
          attachment.capturedAt ?? null,
          attachment.recordedAt ?? null,
          attachment.durationMs ?? null,
          attachment.createdAt,
          attachment.updatedAt,
        );
      }
      const row = await tx.getFirstAsync<Record<string, unknown>>(
        "SELECT * FROM local_drafts WHERE id=?",
        input.id,
      );
      saved = mapDraft(row!);
    });
    if (!saved) throw new Error("draft_write_failed");
    return saved;
  },
  async insertAttachment(attachment: LocalAttachment, expectedDraftRevision: number) {
    const db = await open();
    await withWriteTransaction(db, async (tx) => {
      const draftUpdate = await tx.runAsync(
        "UPDATE local_drafts SET revision = revision + 1, updated_at = ? WHERE id = ? AND revision = ? AND lifecycle = 'editing'",
        attachment.updatedAt,
        attachment.draftId,
        expectedDraftRevision,
      );
      if (draftUpdate.changes !== 1) throw new StaleRevisionError();
      await tx.runAsync(
        `INSERT INTO local_attachments(id,draft_id,revision,kind,local_path,display_name,declared_mime_type,total_bytes,uploaded_bytes,state,attempts,replacement_for_id,captured_at,recorded_at,duration_ms,created_at,updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        attachment.id,
        attachment.draftId,
        1,
        attachment.kind,
        attachment.localPath,
        attachment.displayName,
        attachment.declaredMimeType,
        attachment.totalBytes,
        attachment.uploadedBytes,
        attachment.state,
        attachment.attempts,
        attachment.replacementForId ?? null,
        attachment.capturedAt ?? null,
        attachment.recordedAt ?? null,
        attachment.durationMs ?? null,
        attachment.createdAt,
        attachment.updatedAt,
      );
    });
  },
  async insertAcceptedReplacement(attachment: LocalAttachment, replacedAttachmentId: string) {
    const db = await open();
    await withWriteTransaction(db, async (tx) => {
      const draft = await tx.getFirstAsync<{ lifecycle: DraftLifecycle }>(
        "SELECT lifecycle FROM local_drafts WHERE id=?",
        attachment.draftId,
      );
      const replaced = await tx.getFirstAsync<{ state: AttachmentDeliveryState }>(
        "SELECT state FROM local_attachments WHERE id=? AND draft_id=?",
        replacedAttachmentId,
        attachment.draftId,
      );
      if (draft?.lifecycle !== "accepted" || replaced?.state !== "action_required") {
        throw new Error("replacement_not_allowed");
      }
      await tx.runAsync(
        `INSERT INTO local_attachments(id,draft_id,revision,kind,local_path,display_name,declared_mime_type,total_bytes,uploaded_bytes,state,attempts,replacement_for_id,captured_at,recorded_at,duration_ms,created_at,updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        attachment.id,
        attachment.draftId,
        1,
        attachment.kind,
        attachment.localPath,
        attachment.displayName,
        attachment.declaredMimeType,
        attachment.totalBytes,
        0,
        "pending_allocation",
        0,
        replacedAttachmentId,
        attachment.capturedAt ?? null,
        attachment.recordedAt ?? null,
        attachment.durationMs ?? null,
        attachment.createdAt,
        attachment.updatedAt,
      );
      await tx.runAsync(
        "INSERT INTO local_outbox(id,aggregate_id,command_type,payload_json,state,attempts,created_at,updated_at) VALUES (?,?,'allocate_evidence',?,'pending',0,?,?)",
        getRandomId(),
        attachment.draftId,
        JSON.stringify({ attachmentId: attachment.id }),
        attachment.createdAt,
        attachment.updatedAt,
      );
    });
  },
  async sealAndEnqueue(
    draftId: string,
    expectedRevision: number,
    commandId: string,
    payloadJson: string,
  ) {
    const db = await open();
    const timestamp = new Date().toISOString();
    await withWriteTransaction(db, async (tx) => {
      const result = await tx.runAsync(
        "UPDATE local_drafts SET revision = revision + 1, lifecycle = 'sealed', updated_at = ? WHERE id = ? AND revision = ? AND lifecycle = 'editing'",
        timestamp,
        draftId,
        expectedRevision,
      );
      if (result.changes !== 1) throw new StaleRevisionError();
      await tx.runAsync(
        "INSERT OR IGNORE INTO local_outbox(id,aggregate_id,command_type,payload_json,state,attempts,created_at,updated_at) VALUES (?,?,'submit_complaint',?,'pending',0,?,?)",
        commandId,
        draftId,
        payloadJson,
        timestamp,
        timestamp,
      );
    });
  },
  async dueCommands(at: string) {
    const db = await open();
    return (
      await db.getAllAsync<Record<string, unknown>>(
        "SELECT * FROM local_outbox WHERE state IN ('pending','retry_wait') AND (next_attempt_at IS NULL OR next_attempt_at <= ?) ORDER BY created_at",
        at,
      )
    ).map(mapCommand);
  },
  async nextRetryAt() {
    const db = await open();
    const row = await db.getFirstAsync<{ next_attempt_at: string | null }>(
      "SELECT MIN(next_attempt_at) AS next_attempt_at FROM local_outbox WHERE state='retry_wait' AND next_attempt_at IS NOT NULL",
    );
    return optional(row?.next_attempt_at ?? null);
  },
  async recoverInterruptedCommands() {
    const db = await open();
    const timestamp = new Date().toISOString();
    const result = await db.runAsync(
      `UPDATE local_outbox
       SET state='pending',next_attempt_at=NULL,lease_owner=NULL,lease_expires_at=NULL,updated_at=?
       WHERE state='running'`,
      timestamp,
    );
    return result.changes;
  },
  async recoverRetryableMediaCommands() {
    const db = await open();
    const timestamp = new Date().toISOString();
    const result = await db.runAsync(
      `UPDATE local_outbox
       SET state='pending',attempts=0,next_attempt_at=NULL,last_error_code=NULL,
           lease_owner=NULL,lease_expires_at=NULL,updated_at=?
       WHERE state='dead_letter' AND command_type IN ('allocate_evidence','upload_evidence')
         AND last_error_code IN ('upload_grant_missing','network_unavailable','service_unavailable')`,
      timestamp,
    );
    return result.changes;
  },
  /**
   * Repair accepted drafts whose media was declared on the server but whose
   * local allocation command was lost (for example after an Expo Go restart,
   * an old app version, or a local database migration). This is intentionally
   * idempotent: an attachment gets at most one pending allocation command.
   */
  async requeueMissingEvidenceCommands() {
    const db = await open();
    const timestamp = new Date().toISOString();
    const drafts = await db.getAllAsync<{ id: string }>(
      "SELECT id FROM local_drafts WHERE lifecycle='accepted' AND reference_number IS NOT NULL",
    );
    let repaired = 0;
    for (const draft of drafts) {
      const result = await db.runAsync(
        `INSERT INTO local_outbox(id,aggregate_id,command_type,payload_json,state,attempts,created_at,updated_at)
         SELECT lower(hex(randomblob(16))),a.draft_id,'allocate_evidence',json_object('attachmentId',a.id),'pending',0,?,?
         FROM local_attachments a
         WHERE a.draft_id=? AND a.state IN ('staged','pending_allocation')
           AND NOT EXISTS (
             SELECT 1 FROM local_outbox o
             WHERE o.aggregate_id=a.draft_id AND o.command_type='allocate_evidence'
               AND o.payload_json LIKE '%' || a.id || '%'
               AND o.state NOT IN ('completed')
           )`,
        timestamp,
        timestamp,
        draft.id,
      );
      repaired += result.changes;
    }
    return repaired;
  },
  async startCommand(id: string) {
    const db = await open();
    const result = await db.runAsync(
      `UPDATE local_outbox
       SET state='running',next_attempt_at=NULL,last_error_code=NULL,updated_at=?
       WHERE id=? AND state IN ('pending','retry_wait')`,
      new Date().toISOString(),
      id,
    );
    return result.changes === 1;
  },
  async listCommands(aggregateId: string) {
    const db = await open();
    return (
      await db.getAllAsync<Record<string, unknown>>(
        "SELECT * FROM local_outbox WHERE aggregate_id=? ORDER BY created_at",
        aggregateId,
      )
    ).map(mapCommand);
  },
  async updateCommand(
    id: string,
    values: Partial<
      Pick<
        LocalOutboxCommand,
        "state" | "attempts" | "nextAttemptAt" | "lastErrorCode" | "leaseOwner" | "leaseExpiresAt"
      >
    >,
  ) {
    const db = await open();
    const current = await db.getFirstAsync<Record<string, unknown>>(
      "SELECT * FROM local_outbox WHERE id = ?",
      id,
    );
    if (!current) throw new Error("outbox_command_missing");
    const row = mapCommand(current);
    await db.runAsync(
      "UPDATE local_outbox SET state=?,attempts=?,next_attempt_at=?,last_error_code=?,lease_owner=?,lease_expires_at=?,updated_at=? WHERE id=?",
      values.state ?? row.state,
      values.attempts ?? row.attempts,
      values.nextAttemptAt ?? null,
      values.lastErrorCode ?? null,
      values.leaseOwner ?? null,
      values.leaseExpiresAt ?? null,
      new Date().toISOString(),
      id,
    );
  },
  async enqueueCommand(command: LocalOutboxCommand) {
    const db = await open();
    await db.runAsync(
      "INSERT OR IGNORE INTO local_outbox(id,aggregate_id,command_type,payload_json,state,attempts,next_attempt_at,last_error_code,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
      command.id,
      command.aggregateId,
      command.commandType,
      command.payloadJson,
      command.state,
      command.attempts,
      command.nextAttemptAt ?? null,
      command.lastErrorCode ?? null,
      command.createdAt,
      command.updatedAt,
    );
  },
  async completeAndEnqueue(commandId: string, command: LocalOutboxCommand) {
    const db = await open();
    await withWriteTransaction(db, async (tx) => {
      const completed = await tx.runAsync(
        `UPDATE local_outbox
         SET state='completed',attempts=0,next_attempt_at=NULL,last_error_code=NULL,
             lease_owner=NULL,lease_expires_at=NULL,updated_at=?
         WHERE id=? AND state='running'`,
        command.updatedAt,
        commandId,
      );
      if (completed.changes !== 1) throw new Error("outbox_command_not_running");
      await tx.runAsync(
        `INSERT OR IGNORE INTO local_outbox
         (id,aggregate_id,command_type,payload_json,state,attempts,next_attempt_at,last_error_code,created_at,updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        command.id,
        command.aggregateId,
        command.commandType,
        command.payloadJson,
        command.state,
        command.attempts,
        command.nextAttemptAt ?? null,
        command.lastErrorCode ?? null,
        command.createdAt,
        command.updatedAt,
      );
    });
  },
  async resetExpiredGrantAndEnqueue(
    commandId: string,
    attachmentId: string,
    nextCommand: LocalOutboxCommand,
  ) {
    const db = await open();
    await withWriteTransaction(db, async (tx) => {
      const row = await tx.getFirstAsync<Record<string, unknown>>(
        "SELECT * FROM local_attachments WHERE id=?",
        attachmentId,
      );
      if (!row) throw new Error("attachment_missing");
      const attachment = mapAttachment(row);
      assertAttachmentTransition(attachment.state, "pending_allocation");
      const updated = await tx.runAsync(
        `UPDATE local_attachments
         SET revision=revision+1,state='pending_allocation',uploaded_bytes=0,upload_url=NULL,
             encrypted_upload_token=NULL,grant_expires_at=NULL,attempts=0,next_attempt_at=NULL,
             error_code=NULL,updated_at=?
         WHERE id=? AND revision=?`,
        nextCommand.updatedAt,
        attachmentId,
        attachment.revision,
      );
      if (updated.changes !== 1) throw new StaleRevisionError();
      const completed = await tx.runAsync(
        `UPDATE local_outbox
         SET state='completed',attempts=0,next_attempt_at=NULL,last_error_code=NULL,
             lease_owner=NULL,lease_expires_at=NULL,updated_at=?
         WHERE id=? AND state='running'`,
        nextCommand.updatedAt,
        commandId,
      );
      if (completed.changes !== 1) throw new Error("outbox_command_not_running");
      await tx.runAsync(
        `INSERT OR IGNORE INTO local_outbox
         (id,aggregate_id,command_type,payload_json,state,attempts,created_at,updated_at)
         VALUES (?,?,?,?,?,?,?,?)`,
        nextCommand.id,
        nextCommand.aggregateId,
        nextCommand.commandType,
        nextCommand.payloadJson,
        nextCommand.state,
        nextCommand.attempts,
        nextCommand.createdAt,
        nextCommand.updatedAt,
      );
    });
  },
  async acceptDraft(
    draftId: string,
    referenceNumber: string,
    trackingSecret: string,
    acceptedAt: string,
  ) {
    const db = await open();
    const encoded = utf8ToBytes(trackingSecret);
    await withWriteTransaction(db, async (tx) => {
      await tx.runAsync(
        "UPDATE local_drafts SET lifecycle='accepted',reference_number=?,encrypted_tracking_secret=?,accepted_at=?,updated_at=? WHERE id=? AND lifecycle IN ('sealed','accepted')",
        referenceNumber,
        encoded,
        acceptedAt,
        new Date().toISOString(),
        draftId,
      );
      await tx.runAsync(
        "UPDATE local_outbox SET state='completed',lease_owner=NULL,lease_expires_at=NULL,updated_at=? WHERE aggregate_id=? AND command_type='submit_complaint'",
        new Date().toISOString(),
        draftId,
      );
      const attachments = await tx.getAllAsync<{ id: string }>(
        "SELECT id FROM local_attachments WHERE draft_id=? AND state IN ('staged','pending_allocation')",
        draftId,
      );
      for (const attachment of attachments) {
        await tx.runAsync(
          "UPDATE local_attachments SET state='pending_allocation',revision=revision+1,updated_at=? WHERE id=?",
          new Date().toISOString(),
          attachment.id,
        );
        await tx.runAsync(
          "INSERT OR IGNORE INTO local_outbox(id,aggregate_id,command_type,payload_json,state,attempts,created_at,updated_at) VALUES (?,?,'allocate_evidence',?,'pending',0,?,?)",
          getRandomId(),
          draftId,
          JSON.stringify({ attachmentId: attachment.id }),
          new Date().toISOString(),
          new Date().toISOString(),
        );
      }
    });
  },
  async importAcceptedDraft(
    draftId: string,
    referenceNumber: string,
    trackingSecret: string | undefined,
    acceptedAt: string,
  ) {
    const db = await open();
    await db.runAsync(
      "UPDATE local_drafts SET lifecycle='accepted',reference_number=?,encrypted_tracking_secret=?,accepted_at=?,updated_at=? WHERE id=? AND lifecycle='editing'",
      referenceNumber,
      trackingSecret ? utf8ToBytes(trackingSecret) : null,
      acceptedAt,
      new Date().toISOString(),
      draftId,
    );
  },
  async updateAttachment(id: string, expectedRevision: number, patch: Partial<LocalAttachment>) {
    const db = await open();
    const currentRow = await db.getFirstAsync<Record<string, unknown>>(
      "SELECT * FROM local_attachments WHERE id=?",
      id,
    );
    if (!currentRow) throw new Error("attachment_missing");
    const current = mapAttachment(currentRow);
    if (current.revision !== expectedRevision) throw new StaleRevisionError();
    const next = { ...current, ...patch };
    assertAttachmentTransition(current.state, next.state);
    const result = await db.runAsync(
      `UPDATE local_attachments SET revision=revision+1,state=?,uploaded_bytes=?,server_evidence_id=?,upload_url=?,encrypted_upload_token=?,grant_expires_at=?,attempts=?,next_attempt_at=?,error_code=?,updated_at=?
       WHERE id=? AND revision=?`,
      next.state,
      next.uploadedBytes,
      next.serverEvidenceId ?? null,
      next.uploadUrl ?? null,
      next.encryptedUploadToken ?? null,
      next.grantExpiresAt ?? null,
      next.attempts,
      next.nextAttemptAt ?? null,
      next.errorCode ?? null,
      new Date().toISOString(),
      id,
      expectedRevision,
    );
    if (result.changes !== 1) throw new StaleRevisionError();
  },
  async getAttachment(id: string) {
    const db = await open();
    const row = await db.getFirstAsync<Record<string, unknown>>(
      "SELECT * FROM local_attachments WHERE id=?",
      id,
    );
    return row ? mapAttachment(row) : null;
  },
  async removeEditingAttachment(
    draftId: string,
    attachmentId: string,
    expectedDraftRevision: number,
  ) {
    const db = await open();
    await withWriteTransaction(db, async (tx) => {
      const update = await tx.runAsync(
        "UPDATE local_drafts SET revision=revision+1,updated_at=? WHERE id=? AND revision=? AND lifecycle='editing'",
        new Date().toISOString(),
        draftId,
        expectedDraftRevision,
      );
      if (update.changes !== 1) throw new StaleRevisionError();
      await tx.runAsync(
        "DELETE FROM local_attachments WHERE id=? AND draft_id=?",
        attachmentId,
        draftId,
      );
    });
  },
  async discardDraft(draftId: string) {
    const db = await open();
    await withWriteTransaction(db, async (tx) => {
      const result = await tx.runAsync(
        "UPDATE local_drafts SET lifecycle='discarded',revision=revision+1,updated_at=? WHERE id=? AND lifecycle='editing'",
        new Date().toISOString(),
        draftId,
      );
      if (result.changes !== 1) throw new Error("submitted_report_cannot_be_discarded");
      await tx.runAsync(
        "UPDATE local_outbox SET state='completed',lease_owner=NULL,lease_expires_at=NULL,updated_at=? WHERE aggregate_id=? AND state <> 'completed'",
        new Date().toISOString(),
        draftId,
      );
    });
  },
  async acquireCoordinator(owner: string, leaseMs: number) {
    const db = await open();
    const now = new Date();
    const expires = new Date(now.getTime() + leaseMs).toISOString();
    const result = await db.runAsync(
      // A process can be killed while holding the lease. Running commands are
      // recovered immediately before acquisition, so an orphaned lease with
      // no running command must not block delivery for the full lease period.
      "UPDATE local_coordinator SET lease_owner=?,lease_expires_at=? WHERE singleton=1 AND (lease_owner IS NULL OR lease_expires_at < ? OR lease_owner=? OR NOT EXISTS (SELECT 1 FROM local_outbox WHERE state='running'))",
      owner,
      expires,
      now.toISOString(),
      owner,
    );
    return result.changes === 1;
  },
  async releaseCoordinator(owner: string) {
    const db = await open();
    await db.runAsync(
      "UPDATE local_coordinator SET lease_owner=NULL,lease_expires_at=NULL WHERE singleton=1 AND lease_owner=?",
      owner,
    );
  },
};

// Expo SQLite statements are native shared objects. Concurrent reads and
// writes against the same SQLCipher connection can release a statement while
// another operation is preparing it (especially during app restart/Fast
// Refresh). Serialize every database API call, not only explicit write
// transactions, so the local outbox cannot remain stuck in a loading state.
let databaseOperationQueue: Promise<unknown> = Promise.resolve();
export const complaintV3Database = new Proxy(complaintV3DatabaseRaw, {
  get(target, property, receiver) {
    const value = Reflect.get(target, property, receiver);
    if (typeof value !== "function") return value;
    return (...args: unknown[]) => {
      const operation = databaseOperationQueue.then(() => value(...args));
      databaseOperationQueue = operation.then(
        () => undefined,
        () => undefined,
      );
      return operation;
    };
  },
});

function getRandomId(): string {
  const bytes = getRandomBytes(16);
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const value = hex(bytes);
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}

export const createLocalUuid = getRandomId;
