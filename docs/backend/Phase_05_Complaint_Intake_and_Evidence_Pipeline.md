# Phase 05 — Complaint Intake and Evidence Pipeline

**Phase objective:** Implement production complaint submission and a secure, resumable evidence pipeline while preserving worker privacy and original media.  
**Depends on:** Phase 04 security controls and Phase 03 transaction model.  
**Produces:** Idempotent complaint API, upload lifecycle, quarantine/scanning/encryption, server-side validation and mobile intake integration.

## 1. Submission trust boundary

The mobile client may provide draft content and client-generated correlation IDs. It must not authoritatively set:

- server complaint ID or public reference;
- status or lifecycle history;
- priority without deterministic server evaluation;
- SLA due time;
- staff actions;
- AI result provenance;
- scan status;
- server file paths;
- server timestamps.

The server validates the complete submission against current schemas and privacy invariants.

## 2. Submission workflow

1. Mobile creates a durable local `clientSubmissionId` and idempotency key.
2. Mobile creates upload sessions for voice/evidence while retaining local originals.
3. Upload service writes chunks to quarantine storage.
4. Completion triggers signature validation, integrity hashing and malware scanning.
5. Approved files are encrypted and moved atomically into protected evidence storage.
6. Mobile submits structured complaint data plus approved upload IDs.
7. API validates ownership, upload state, privacy rules and domain submission rules.
8. One transaction creates complaint facts, initial history, evidence associations, tracking credential hash and outbox events.
9. API returns reference, one-time tracking secret, official status/version and submitted time.
10. Mobile records acknowledgement before deleting its local queued originals.

AI and notification processing occur after acknowledgement.

## 3. API endpoints

```text
POST   /api/v1/uploads
HEAD   /api/v1/uploads/:id
PATCH  /api/v1/uploads/:id
DELETE /api/v1/uploads/:id
GET    /api/v1/uploads/:id/status

POST   /api/v1/complaints
GET    /api/v1/complaints/submissions/:clientSubmissionId
```

The tus-compatible routes may be hosted by a dedicated service, but authorization, metadata validation and completion hooks remain owned by the application.

## 4. Upload authorization and ownership

An unauthenticated worker upload uses a short-lived, narrowly scoped upload grant created by the API. The grant limits:

- upload ID;
- intended kind;
- maximum bytes;
- accepted media families;
- expiration;
- client submission ID;
- number of upload resources.

An upload may be attached only to the same client submission and only once unless the approved replacement flow is used. Abandoned uploads expire and are deleted from quarantine.

## 5. File validation

For every file:

- enforce per-kind and aggregate size limits before and during transfer;
- allowlist extensions only as a usability hint;
- inspect magic bytes and detected MIME type;
- reject ambiguous, executable, archive and unsupported active-content formats unless explicitly approved;
- generate the storage filename server-side;
- preserve the sanitized original name only as display metadata;
- calculate SHA-256 during or immediately after upload;
- scan with ClamAV in quarantine;
- prevent download or complaint attachment before scan approval;
- apply an upload timeout and incomplete-upload expiry;
- record scan engine version and outcome.

Images should be decoded safely and optionally re-encoded for display previews. The original is preserved as evidence when policy requires it. Documents are served as downloads unless a separately hardened preview pipeline exists.

## 6. Local storage layout

```text
/srv/kapas-data/
  quarantine/              # temporary, no execution, not backed up as evidence
  evidence/
    2026/10/<storage-id>/ciphertext.bin
  derived/
    2026/10/<storage-id>/preview.bin
  exports/                 # short-lived, separately permissioned
```

Requirements:

- mounted outside application source and webroot;
- owned by a dedicated service user;
- no execute permission;
- restrictive directory/file modes;
- atomic move from approved quarantine state;
- filesystem paths never exposed in APIs;
- database metadata and disk state reconciled by a scheduled integrity job;
- disk capacity thresholds alert before upload failure.

## 7. Evidence encryption

- Encrypt each final object with authenticated encryption and a unique data key/nonce strategy.
- Bind complaint/upload identity and media kind as associated data.
- Store encryption metadata and key ID in PostgreSQL.
- Stream encryption/decryption; do not load large evidence completely into memory.
- Write to a temporary path, fsync as appropriate, then rename atomically.
- Verify the integrity digest after restore and periodically according to policy.
- Never cache decrypted evidence on disk beyond controlled temporary processing.

## 8. Complaint validation

The production input schema is distinct from the Phase 1 `Complaint` response model. It includes only fields a worker is allowed to submit.

Validate:

- supported schema version;
- privacy-mode-specific identity rules;
- category and subcategory compatibility;
- required workflow answers;
- incident and location consistency;
- coordinate ranges and accuracy bounds;
- evidence ownership and approved status;
- voice duration and media constraints;
- safe-contact choices;
- server-side deterministic danger and priority floors;
- bounded string, array and structured-answer sizes.

Unknown fields are rejected or explicitly isolated; they are not silently trusted.

## 9. Idempotency

Store idempotency records with actor/submission scope, request fingerprint, response reference and expiry.

- Same key and same semantic request returns the original successful response.
- Same key with a different request returns `IDEMPOTENCY_CONFLICT`.
- Concurrent requests cannot create duplicate complaints.
- A timeout after commit is recoverable through the submission-status endpoint.
- Upload retries use offsets/checksums rather than duplicate objects.

## 10. Reference and tracking response

The successful response includes:

- server complaint ID for internal client correlation where safe;
- human reference number;
- tracking secret exactly once;
- submitted time;
- initial worker-facing status;
- next safe action;
- complaint version;
- attached media acknowledgement.

The response must not expose server paths, internal priority reasoning, identity encryption details, queue IDs or staff-only status fields.

## 11. Mobile integration

Create a production adapter behind the current complaint/evidence service boundaries. Preserve the mock adapter for tests and approved demo builds.

Mobile must:

- display upload progress and safe retry states;
- distinguish saved locally, uploading, submitted and failed;
- never claim success before server acknowledgement is durably stored;
- retain local evidence until acknowledgement;
- store tracking secrets in secure storage;
- map stable backend error codes to localized worker-safe messages;
- avoid sending identity fields in anonymous mode;
- permit cancel/retry without producing duplicate complaints.

## 12. Operational controls

- Rate-limit upload creation and complaint submission.
- Reserve disk space for database and system operation.
- Alert on quarantine backlog, malware detections, scan failures, abandoned uploads and low disk.
- Provide an administrative reconciliation report for orphaned database/file records.
- Do not permit manual file placement to bypass scan/encryption state.
- Define incident handling for detected malicious files without exposing sensitive worker content unnecessarily.

## 13. Tests

- Successful complaint with no media, voice only and mixed evidence.
- Anonymous payload containing identity is rejected or safely stripped according to the approved contract.
- Duplicate and concurrent idempotent requests create one complaint.
- Interrupted upload resumes at the correct offset.
- Oversized, spoofed MIME, executable, traversal filename and malware test files are rejected/quarantined.
- Unscanned or foreign upload IDs cannot be attached.
- Encryption round trip and tamper detection work.
- A crash between file completion and complaint submission leaves an expirable orphan, not accessible evidence.
- Database failure does not report submission success.
- Logs contain no complaint body, tracking secret, transcript or original filename.
- Mobile retains local media until acknowledgement and recovers after restart.

## 14. Deliverables

- Complaint intake API and idempotency store.
- Resumable upload service/hooks.
- Quarantine, validation, scanning and encryption pipeline.
- Evidence metadata repository and authorized stream service foundation.
- Mobile production complaint/evidence adapter.
- Storage capacity, malware and orphan-reconciliation runbooks.
- End-to-end intake tests.

## 15. Exit criteria

- A mobile device can submit a real persisted complaint with protected evidence.
- Interrupted transfers resume and duplicate retries remain single submissions.
- No uploaded file becomes available before validation and clean scan.
- Anonymous-mode invariants pass end-to-end tests.
- Tracking credentials are returned and securely stored exactly once.
- Disk-pressure and orphan cleanup controls are observable.
- Submission succeeds without waiting for AI or external notification providers.

## 16. Non-goals

- No automatic AI analysis beyond queued intent.
- No staff case mutation integration.
- No production SMS/push delivery.
- No public direct filesystem or static evidence URLs.

