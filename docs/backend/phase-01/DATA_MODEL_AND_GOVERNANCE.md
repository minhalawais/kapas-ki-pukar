# Data Model Gap Analysis and Governance Draft

## Model authority rules

The mobile draft is worker intent, not a production complaint record. The server generates internal IDs, reference numbers, tracking credentials, official timestamps, lifecycle state, SLA/due time, derived overdue state, priority floor and audit/outbox records. AI output is a versioned suggestion, never an authoritative fact.

## Gaps between current frontend types and production persistence

| Current shape/gap | Production design requirement |
|---|---|
| One `Complaint` aggregate contains almost everything | Normalize complaint, reporter/contact, identity vault, location, evidence, voice asset, action/history, resolution, feedback, AI run and access policy records |
| `id`, `trackingId`, `referenceNumber` are identical/client-shaped | Separate immutable internal ID, human reference and hashed tracking secret; server generates all three |
| Mutable `status`, `priority`, `overdue` | Append transition/priority history; validate state machine; compute overdue from SLA/due time |
| `ReporterIdentity` supports CNIC while mobile code also emits phone | Define discriminated wire types for anonymous/CNIC/phone; encrypt normalized value, store safe display suffix separately; reject impossible combinations |
| Anonymous drafts can carry arbitrary structured answers | Allowlist answers per workflow and remove identity/direct-contact data before persistence; regression coverage added to mock baseline |
| Local evidence has `localUri` only | Storage object ID, original name, safe MIME, bytes, hash, quarantine/scan state, encryption key/version/nonce metadata, retention state |
| Voice is embedded local metadata | Dedicated evidence asset plus language, duration, consent, processing state and transcript links |
| AI result is embedded and overwritten | Immutable `ai_runs` with task/model/provider/prompt-policy versions, timestamps, confidence, failure, redaction and human-review decision |
| Free-form `structuredAnswers` | Versioned workflow schema; typed promoted fields for queryable/high-risk facts; bounded JSON for remaining answers |
| Actions use role string, no actor ID | Actor type/ID, authorization context, purpose, visibility, before/after version and correlation ID |
| Resolution and feedback have no version/history | Append-only proposal/resolution/feedback records linked to lifecycle commands |
| Location mixes display and exact coordinates | Separate coarse worker-safe location from encrypted/restricted exact coordinates and collection consent |
| No consent/policy version | Record privacy selection, notice version, locale, consent timestamps and collection purpose |
| No tenancy/case access scope | Explicit organization/team/assignment/sensitivity tags and policy checks |
| No outbox/idempotency/session/upload/audit models | Add durable operational tables with expiry and purge policies |

## Proposed production aggregates/tables

`complaints`, `complaint_revisions`, `reporters`, `reporter_contacts`, `reporter_identities`, `locations`, `case_assignments`, `case_actions`, `status_history`, `priority_history`, `resolutions`, `worker_feedback`, `evidence_assets`, `upload_sessions`, `ai_runs`, `notification_attempts`, `users`, `roles`, `permissions`, `user_roles`, `mfa_factors`, `sessions`, `tracking_credentials`, `idempotency_records`, `audit_events`, `outbox_events`, `export_jobs`, `legal_holds`, `retention_dispositions` and versioned reference tables.

## Data classification

| Class | Examples | Minimum controls |
|---|---|---|
| Public | Reviewed rights content, public app metadata | Integrity/version review |
| Internal | Health summaries, non-sensitive configuration, operational metrics | Staff access; no public diagnostics |
| Confidential | Worker-safe case status, staff notes, coarse location, assignment | RBAC/ABAC, audit, encryption in transit/backup |
| Highly sensitive | CNIC/phone, exact coordinates, audio/photo/documents, harassment/child/forced-labour details, identity reveal and export | Field/object encryption, strict permission, purpose and access audit, step-up, retention control |
| Secret | Password/session/tracking hashes, encryption keys, provider tokens | Never logged/exported; dedicated secret/key ownership and rotation |

## Privacy-mode invariants

- `ANON`: no identity/contact record is created; no direct-contact notification; analytics suppress gender/identity inference; content can still accidentally identify a person and remains highly sensitive.
- `CONF`: identity/contact is collected but hidden from ordinary case views; explicit reveal permission, purpose and audit are required.
- `IDEN`: identity may appear only in role-appropriate views; it is never public or included in standard exports by default.
- Changing privacy mode is a governed command with consent/policy checks and cannot retroactively erase audit facts.

## Interim retention matrix approved for implementation

The project owner approved this schedule on 2026-10-16 as a configurable engineering baseline. It supports schema, lifecycle, capacity and automated-test work; it is not a statement of Pakistani statutory retention requirements. PUWF privacy/legal reviewers must ratify or amend it before production receives real worker data. A legal hold suspends disposition without silently extending the configured policy for unrelated records.

| Data class | Trigger | Duration | Hold exception | Disposition | Approver |
|---|---|---|---|---|---|
| Complaint and lifecycle history | Case closure | 7 years | Yes | Irreversibly anonymize or delete according to the ratified legal basis | Privacy/data + legal reviewer |
| Reporter identity/contact | Purpose completion or case closure, whichever is earlier | 1 year maximum after case closure | Yes | Cryptographic erasure plus non-identifying tombstone | Privacy/data reviewer |
| Evidence and voice | Case closure | 1 year | Yes | Delete encrypted object, derivatives and wrapped data key | Safeguarding + privacy/data reviewer |
| Audit/security logs | Event date | 2 years | Yes | Delete by partition/policy while retaining non-sensitive disposition proof | Security + legal reviewer |
| Staff sessions | Expiry or revocation | 30 days | No, except incident hold | Delete session hash and operational metadata | Security reviewer |
| Worker tracking credentials | Final case disposition or credential revocation | 90 days | Yes when case is held | Delete credential hash and safe metadata | Security + safeguarding reviewer |
| AI input/output/provenance | Case closure | 1 year; external provider retention must be zero or the formally approved minimum and training is prohibited | Yes | Delete sensitive input/output; retain only non-identifying operational metrics | Privacy/data reviewer |
| Exports and temporary files | Creation | 7 days maximum | No routine hold; regenerate from governed source if authorized | Automatic secure deletion | Privacy/data reviewer |
| Incomplete uploads and rejected quarantine files | Last activity or rejection | 24 hours incomplete; 72 hours rejected | No | Automatic encrypted-object deletion | Security + service reviewer |
| Backups | Backup completion | 35-day rolling window | Documented legal/incident hold only | Encrypted set expiry plus key/media rotation | Service + legal reviewer |

Retention jobs may be implemented and tested against these defaults but must run in report-only mode outside local/CI until formal PUWF ratification, access controls, legal-hold checks and restore/deletion behavior are verified.

## Data ownership

- PUWF data controller: accountable for purpose, privacy mode, access, retention, legal holds and data-subject handling; named person pending.
- Safeguarding lead: accountable for high-risk case handling and disclosure constraints; pending.
- Security owner: key/session/access-control design and incident response; pending.
- Service owner: availability, backup/restore and operational access; pending.
- Engineering: processor/custodian implementing approved policy; cannot self-approve legal retention or export policy.

