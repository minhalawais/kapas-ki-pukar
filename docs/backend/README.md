# Kapas ki Pukaar — Production Backend Development Plan

**Document owner:** Engineering Lead  
**Version:** 1.0  
**Status:** Approved implementation baseline; production ratification gates remain  
**Date:** 16 October 2026  
**Target environment:** Hostinger VPS, Ubuntu LTS, Docker Compose, local primary evidence storage

## 1. Purpose

This documentation set defines the controlled migration of Kapas ki Pukaar from a frontend demonstration backed by local mock repositories to a production-capable grievance intake and case-management system.

It covers the Expo mobile application, the Next.js PUWF portal, the new backend API and worker processes, PostgreSQL persistence, staff authentication, offline synchronization, evidence handling, AI-assisted processing, notifications, analytics, security, deployment, backup, and operational handover.

The plan is implementation-oriented. Each phase has prerequisites, concrete work packages, API and data implications, testing requirements, security controls, deliverables, and measurable exit criteria.

## 2. System outcome

At completion:

- workers can submit anonymous, confidential, or identified complaints online or after an offline period;
- voice recordings, photos, and documents are resumably uploaded, scanned, encrypted, and access-controlled;
- workers receive a server-issued reference and secret tracking credential;
- PUWF staff authenticate with MFA and manage real cases through the existing portal;
- every material case mutation and sensitive evidence access is attributable and auditable;
- deterministic lifecycle and safety rules remain authoritative;
- AI processing is asynchronous, reviewable, replaceable, and never the sole decision-maker;
- analytics and exports reconcile to the same production records used by case management;
- the system is deployable, monitorable, recoverable, and supportable on the target VPS.

## 3. Approved architecture baseline

| Concern | Baseline |
|---|---|
| Architecture | Modular monolith with separate API and worker processes |
| Runtime | Node.js 24 LTS |
| API framework | NestJS with Fastify |
| API style | Versioned REST under `/api/v1`, documented with OpenAPI |
| Validation | Shared Zod schemas; server is authoritative |
| Database | PostgreSQL 18, pinned to a supported minor release |
| ORM and migrations | Prisma ORM, pinned and migration files reviewed |
| Queue | BullMQ with Redis; PostgreSQL transactional outbox for recoverability |
| Evidence uploads | tus-compatible resumable upload service |
| Primary evidence storage | Encrypted local filesystem outside the webroot |
| Reverse proxy | Caddy with automatic HTTPS |
| Packaging | pnpm workspace and Turborepo |
| Deployment | Docker Compose with immutable images |
| Observability | Structured logs, metrics, traces, health/readiness endpoints, alerting |

## 4. Architecture principles

1. **One source of truth.** PostgreSQL is authoritative for complaints, case state, access control, audit events, and job intent.
2. **The original worker voice is primary evidence.** Transcripts and summaries are derivatives.
3. **Privacy mode changes persisted data.** Anonymous mode must not merely hide identity in the UI; identity fields must not be transmitted or stored.
4. **The server owns trust decisions.** Clients may suggest IDs, timestamps, status, priority, or derived values, but the server validates or generates them.
5. **Offline retries are safe.** Every submission and mutation that may be retried has an idempotency strategy.
6. **Case history is append-oriented.** Material actions are not silently overwritten.
7. **Worker-visible and internal information are separate.** Internal notes, identities, exact coordinates, and operational actions cannot leak into worker responses.
8. **No public evidence paths.** Evidence is served only through an authorized application endpoint.
9. **AI is assistive.** Deterministic safety floors and human decisions take precedence.
10. **A local disk is not a backup.** Encrypted recovery copies must leave the VPS.

## 5. Target runtime topology

```text
Internet
  |
  v
Caddy :80/:443
  |-- portal container (Next.js)
  |-- API container (NestJS/Fastify)
  `-- upload endpoint/service
         |
         v
     quarantine volume --> scan/validate worker --> encrypted evidence volume

API/worker private network
  |-- PostgreSQL
  |-- Redis
  |-- ClamAV
  `-- local mounted data volumes
```

PostgreSQL, Redis, ClamAV, worker ports, and storage directories must not be publicly reachable.

## 6. Proposed monorepo additions

```text
apps/
  api/                      # NestJS REST API
  worker/                   # BullMQ consumers and scheduled operations
  mobile/
  puwf-portal/
packages/
  api-contracts/            # Zod API request/response contracts
  database/                 # Prisma schema, client, migrations and seeds
  security/                 # redaction, cryptography and authorization helpers
  observability/            # logger, metrics and trace conventions
  domain/                   # framework-free domain rules
  validation/
deploy/
  compose/
  caddy/
  scripts/
docs/backend/
```

Framework, database, filesystem, or network dependencies must not be introduced into `@kapas/domain`.

## 7. Phase map

Use the [Universal Backend Phase Implementation Prompt](UNIVERSAL_PHASE_IMPLEMENTATION_PROMPT.md) to execute one approved phase at a time.

| Phase | Name | Primary outcome |
|---:|---|---|
| 01 | [Discovery, Baseline and Architecture](Phase_01_Discovery_Baseline_and_Architecture.md) | Approved contracts, threat model, clean build baseline and architecture decisions |
| 02 | [Backend Foundation and Local Infrastructure](Phase_02_Backend_Foundation_and_Local_Infrastructure.md) | Runnable API, worker, database, Redis and development environment |
| 03 | [Production Data Model and Persistence](Phase_03_Production_Data_Model_and_Persistence.md) | Transactional PostgreSQL schema and repository implementations |
| 04 | [Identity, Authentication, Authorization and Privacy](Phase_04_Identity_Authentication_Authorization_and_Privacy.md) | Secure staff access and privacy-safe worker tracking |
| 05 | [Complaint Intake and Evidence Pipeline](Phase_05_Complaint_Intake_and_Evidence_Pipeline.md) | Production complaint submission and protected resumable media uploads |
| 06 | [Offline Sync, Tracking and Worker Communication](Phase_06_Offline_Sync_Tracking_and_Worker_Communication.md) | Reliable mobile synchronization, tracking, feedback and recovery |
| 07 | [Portal Case Management and Audit](Phase_07_Portal_Case_Management_and_Audit.md) | Fully functional PUWF operational case workspace |
| 08 | [Background Processing, AI and Notifications](Phase_08_Background_Processing_AI_and_Notifications.md) | Durable async processing with controlled AI and notification providers |
| 09 | [Analytics, Reporting and Data Governance](Phase_09_Analytics_Reporting_and_Data_Governance.md) | Reconciled analytics, safe exports, retention and data operations |
| 10 | [Production Hardening, Deployment and Handover](Phase_10_Production_Hardening_Deployment_and_Handover.md) | Tested, recoverable and supportable production release |

Phase evidence and decision artifacts are stored under the matching phase directory. Phase 01's implementation package starts at [phase-01/README.md](phase-01/README.md).

Phases are sequential gates. Limited parallel work is permitted only where the owning phase explicitly identifies it and must not bypass an unmet dependency.

## 8. Cross-cutting non-functional requirements

### Security and privacy

- TLS is mandatory in every non-local environment.
- Staff MFA is mandatory before production access.
- Secrets must not exist in source, images, logs, crash reports, or client bundles.
- Passwords use an approved memory-hard password hashing algorithm.
- Sensitive identity and evidence data use authenticated encryption at rest.
- Authorization is enforced at the API, never only in the UI.
- Anonymous submissions contain no direct identity fields.
- Exact coordinates and sensitive-category metadata are restricted and excluded from ordinary analytics.
- Logs must redact contact data, government identifiers, transcripts, tokens, secrets, file contents, and exact coordinates.

### Reliability

- Submission and queue operations are idempotent.
- Database migrations are forward-controlled, reviewed, and exercised against production-like data.
- Queue intent is recoverable from PostgreSQL if Redis data is lost.
- Backup restoration is tested, not assumed.
- No deployment may delete or overwrite the evidence volume.

### Performance objectives

Initial objectives, approved for implementation planning in Phase 01 and subject to measurement before production:

- p95 ordinary API reads under 500 ms at the VPS boundary;
- p95 ordinary writes under 800 ms excluding media transfer and asynchronous work;
- portal list queries use server pagination and bounded filters;
- complaint submission acknowledgement does not wait for AI processing;
- upload interruption can resume without retransmitting completed chunks;
- dashboards return bounded aggregates and never load the complete evidence graph.

### Accessibility and localization

Backend errors exposed to workers use stable error codes that map to localized, plain-language client messages. Backend-provided worker-visible text must support Urdu and English without assuming left-to-right rendering.

## 9. Environments

| Environment | Purpose | Data policy |
|---|---|---|
| Local | Developer feedback | Generated fixtures only |
| CI | Automated tests and migration checks | Ephemeral generated fixtures |
| Staging | Integration, UAT, restore rehearsal | Synthetic or formally approved redacted data |
| Production | Live service | Real data under approved access and retention controls |

Production data must never be copied into local or CI environments. Staging must not share credentials, databases, storage paths, encryption keys, or notification recipients with production.

## 10. API conventions

- Base path: `/api/v1`.
- JSON uses `camelCase`; database naming may use `snake_case` through mappings.
- Timestamps are RFC 3339 UTC strings externally and `timestamptz` internally.
- Errors follow a stable envelope containing `code`, `message`, `requestId`, and optional field errors.
- Pagination uses opaque cursors and a server-enforced maximum page size.
- `Idempotency-Key` is mandatory for retryable creation operations.
- Mutations use an expected version or strong precondition to prevent lost updates.
- API responses expose explicit projections; database entities are never serialized directly.
- OpenAPI is generated and checked for breaking changes in CI.

## 11. Data classification

| Class | Examples | Minimum handling |
|---|---|---|
| Public | Rights content, app metadata | Integrity controls |
| Internal | Aggregate operational metrics | Authenticated staff access |
| Confidential | Case notes, worker contact preference | RBAC, audit, encryption |
| Highly sensitive | Audio, evidence, CNIC-related data, exact coordinates, harassment/child/forced-labour details | Strict least privilege, encryption, access audit, retention controls |

## 12. Global quality gates

Every phase must satisfy all applicable gates:

- architecture and threat-model decisions are recorded;
- lint, typecheck, unit and integration suites pass;
- migrations apply to an empty database and upgrade the previous phase database;
- authorization tests cover unauthenticated, wrong-role, and permitted access;
- sensitive data does not appear in logs or error responses;
- API contracts and clients are regenerated without unreviewed breaking changes;
- operational documentation changes in the same phase as behavior;
- rollback or recovery behavior is demonstrated;
- no unresolved P0/P1 defects and no unaccepted P2 defects remain.

## 13. Global definition of done

A feature is not complete merely because its happy path works. It is complete when:

- domain rules, persistence, authorization, audit, error handling and telemetry are implemented;
- mobile and/or portal integration uses the real service boundary;
- loading, empty, offline, forbidden, conflict and server-error states are handled;
- automated tests cover success, invalid input, duplicate retry and unauthorized access;
- data retention and privacy behavior are documented;
- support staff can diagnose failure without accessing sensitive payloads.

## 14. Mandatory reference documents

- `docs/01_Product_Requirements_Document_PRD_v1.1.md`
- `docs/02_Functional_Requirements_Specification_FRS_v1.1.md`
- `docs/05_Grievance_Taxonomy_and_Case_Lifecycle_Specification.md`
- `docs/07_Voice_Prompt_and_AI_Simulation_Specification_v1.1.md`
- `docs/09_Frontend_Technical_Architecture_and_Mock_Service_Contracts_v1.1.md`
- `docs/10_Analytics_KPI_Privacy_and_Accessibility_Specification_v1.1.md`
- `docs/11_QA_UAT_Test_Plan_and_Definition_of_Done_v1.1.md`
- `docs/release/backend_readiness.md`
- `docs/release/known_limitations.md`

Where a production requirement conflicts with a Phase 1 demo assumption, the production requirement must be documented through an architecture decision record and approved before implementation.

