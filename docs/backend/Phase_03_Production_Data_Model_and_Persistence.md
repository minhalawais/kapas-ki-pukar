# Phase 03 — Production Data Model and Persistence

**Phase objective:** Implement the authoritative relational model and transactional repositories while preserving approved domain behavior.  
**Depends on:** Phase 02 infrastructure and CI complete.  
**Produces:** Reviewed schema, migrations, repositories, projections, seeds, transaction rules and data-integrity tests.

## 1. Modeling rules

- PostgreSQL stores durable facts; clients do not control authoritative IDs, timestamps or derived values.
- Normal relational columns represent fields used for access control, filtering, joining, uniqueness or reporting.
- JSONB is limited to versioned structured questionnaire answers, provider metadata and bounded extension data.
- Append-only history records material changes.
- Sensitive identity data is separated from operational case data.
- Worker, staff and analytics projections are explicit and independent.
- Referential integrity and database constraints complement application validation.

## 2. Core schema

Implement at least the following logical entities.

### Complaints

`complaints`:

- UUIDv7 primary key;
- unique human reference number;
- category and subcategory codes;
- status, priority and privacy mode;
- reporter type and affected-worker fields;
- submission, update and SLA timestamps;
- optimistic concurrency version;
- assigned staff identifier when introduced;
- created source and schema version;
- archival/retention state.

`overdue` is computed from due time and lifecycle status, not stored as freely mutable client data.

### Incident and location

`incidents` stores occurrence time, danger flags, description and versioned structured answers.

`complaint_locations` separates:

- province, district, tehsil and village labels;
- manually supplied descriptive place;
- exact latitude/longitude;
- source and accuracy;
- analytics-safe geographic projection.

Exact coordinates must be nullable, encrypted or otherwise access-restricted according to the approved threat model.

### Reporter and private identity

Operational reporter fields and private contact/identity data must not share an unrestricted table projection. Private records require their own authorization path and audit treatment.

Anonymous complaints must have no private identity row. Confidential complaints may have one, but ordinary staff list and analytics queries must not join it.

### Evidence and voice

Store metadata, never binary data, in PostgreSQL:

- server storage ID;
- complaint ID;
- kind and original display name;
- server-generated storage name;
- detected MIME type;
- byte length;
- SHA-256 integrity digest;
- upload, scan and availability state;
- encryption key ID and algorithm metadata;
- capture and server receipt timestamps;
- retention and deletion state;
- uploader actor/source.

### Case history

Use append-only records for:

- case actions;
- status transitions;
- priority changes;
- assignment changes;
- contact attempts;
- findings;
- referrals and escalations;
- resolutions;
- worker feedback.

Every record contains actor type, actor ID where applicable, timestamp, visibility, request ID and structured reason data where needed.

### AI and jobs

`ai_analysis_runs` records input references, provider/model metadata, prompt version, output, confidence, warnings, human-review state, failure state and timestamps. It must support multiple runs without destroying earlier provenance.

`outbox_events` records durable asynchronous intent. Delivery attempts and final status are observable.

## 3. Enumerations and reference data

Do not blindly duplicate TypeScript enums as database enum types. Decide per field whether a check constraint/reference table or PostgreSQL enum gives the safest migration behavior.

Taxonomy codes, lifecycle statuses, action types and priorities must be mapped to the approved `@kapas/domain` definitions. CI must detect drift between application contracts and stored constraints/reference data.

## 4. Reference-number generation

Define a non-secret, human-readable reference format that:

- is unique under concurrency;
- is easy to read aloud and enter;
- contains no identity or exact location data;
- does not itself authorize case access;
- does not expose a simple sequential count to public users.

The database enforces uniqueness. Collision handling is tested.

## 5. Repository boundaries

Create repository interfaces for:

- complaint commands;
- staff case queries;
- worker tracking queries;
- evidence metadata;
- identity/private contact data;
- case history;
- audit events;
- outbox events;
- analytics read models.

Repositories return domain/application projections, not Prisma entities. Prisma stays inside `packages/database` or backend infrastructure adapters.

## 6. Transaction boundaries

Use one database transaction for:

- complaint creation, initial history and outbox event;
- each status transition and its history/action record;
- priority mutation and reason history;
- resolution plus lifecycle transition;
- worker feedback and any permitted reopen transition;
- evidence attachment to an existing complaint after scan approval;
- staff session revocation and security audit event where applicable.

External calls, file scanning, AI and SMS must not occur inside database transactions.

## 7. Lifecycle enforcement

Move authoritative lifecycle decisions into a framework-free application/domain service used by the backend. The API must reject transitions that are invalid for the current persisted status, even if a client submits a valid enum value.

Concurrent mutations use the expected complaint version. A stale version returns `VERSION_CONFLICT` with a safe current-version hint, not an automatic overwrite.

## 8. Projection design

Define separate response models:

- `WorkerComplaintSummary`;
- `WorkerComplaintDetail`;
- `StaffCaseListItem`;
- `StaffCaseDetail`;
- `SensitiveReporterDetail`;
- `AnalyticsComplaintFact`.

Worker projections include only worker-visible actions and safe resolution information. Staff list projections exclude binary metadata and private identity details unless explicitly required. Analytics facts exclude direct identifiers and exact coordinates.

## 9. Indexing baseline

Create and verify indexes for:

- reference lookup;
- status and priority queues;
- submitted/updated/due time sorting;
- category/subcategory filters;
- province/district filters;
- assignment;
- outbox pending state;
- audit lookup by case and actor;
- evidence by complaint and state.

Index choices must be supported by representative `EXPLAIN` plans, not intuition alone. Avoid indexing encrypted ciphertext or low-value fields indiscriminately.

## 10. Seed and fixture policy

- Production has no automatic demo seed.
- Local and CI seeds use deterministic synthetic identities and files.
- Golden scenarios are adapted into database fixtures without becoming production records.
- Seed commands hard-fail when the environment is staging or production unless a separately approved staging fixture workflow is used.
- Migration tests must not depend on application startup seeding.

## 11. Migration strategy

Each migration must be:

- generated from an approved schema change;
- reviewed as SQL;
- tested on an empty database;
- tested upgrading the previous phase schema;
- evaluated for locks, table rewrites and rollback/recovery implications;
- applied by the deployment pipeline, never opportunistically by every API replica.

Destructive schema changes require expand/backfill/contract sequencing and a verified backup.

## 12. Tests

- Database constraints reject invalid enum/code values and broken references.
- Anonymous complaints cannot acquire private identity rows through normal repositories.
- Duplicate reference numbers and idempotency identities are impossible under concurrency.
- Every lifecycle command writes matching history atomically.
- Failed transactions leave no partial case or outbox records.
- Worker projections never include internal actions or private fields.
- Optimistic concurrency rejects stale writes.
- Migration upgrade and representative query plans pass in CI.
- Seed/reset utilities cannot run against production configuration.

## 13. Deliverables

- Reviewed ERD and data dictionary.
- Prisma schema and migrations.
- Repository interfaces and PostgreSQL adapters.
- Worker/staff/analytics projection mappers.
- Transaction and lifecycle application services.
- Synthetic fixture and seed tooling.
- Index and representative query-plan report.
- Migration runbook.

## 14. Exit criteria

- Schema represents all current complaint, evidence, case-action, resolution and feedback concepts without storing client-only paths.
- Domain and database integrity tests pass.
- Worker and staff projections pass explicit privacy tests.
- Lifecycle mutations are transactional and concurrency-safe.
- Migrations succeed from empty and previous-phase databases.
- No production code uses the mock repository for persistence inside the backend.

## 15. Non-goals

- No staff login UI integration.
- No public complaint submission endpoint.
- No real evidence bytes stored.
- No live AI, SMS or analytics dashboard integration.

