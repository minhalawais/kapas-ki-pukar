# Phase 01 — Discovery, Baseline and Architecture

**Phase objective:** Establish an agreed, testable production baseline before backend feature implementation begins.  
**Depends on:** Approved product scope and access to the current repository.  
**Produces:** Architecture decisions, threat model, API inventory, data classification, clean build baseline, delivery backlog and environment plan.

## 1. Why this phase exists

The current product intentionally simulates backend behavior. Several client models contain presentation-oriented or locally derived fields that must not be copied directly into a production database. The repository also has known mobile type-check failures. Building APIs before resolving these boundaries would convert demo assumptions into permanent production liabilities.

## 2. Mandatory review scope

Review and trace:

- all mobile routes under `apps/mobile/app`;
- all portal routes under `apps/puwf-portal/src/app`;
- hooks and stores used by complaint submission, tracking, locale and connectivity;
- `@kapas/domain`, `@kapas/validation`, `@kapas/ai`, `@kapas/speech` and `@kapas/mock-services`;
- golden scenarios and analytics formulas;
- privacy, lifecycle, priority, worker-visibility and submit rules;
- demo-only routes, flags, generated IDs, credentials and reset behavior.

## 3. Required decisions

Create architecture decision records for:

1. Modular monolith and process boundaries.
2. REST and OpenAPI conventions.
3. PostgreSQL and ORM choice.
4. Staff session model and MFA.
5. Anonymous worker tracking credential model.
6. Evidence encryption and key ownership.
7. Resumable upload protocol.
8. Queue plus transactional-outbox strategy.
9. AI provider boundary and data-processing restrictions.
10. Backup, recovery-point and recovery-time objectives.
11. Production deployment and secret-delivery mechanism.
12. Data retention, legal hold, deletion and export approval ownership.

Each ADR must contain context, decision, alternatives, consequences, security impact, rollback conditions and approver.

## 4. Contract inventory

Produce a contract matrix with at least these mappings:

| Existing client operation | Production responsibility |
|---|---|
| `complaintService.createFromDraft` | Idempotent worker submission API |
| `complaintService.listMine` | Credential-scoped worker complaint list |
| `complaintService.getById` | Privacy-safe worker case projection |
| `complaintService.submitWorkerFeedback` | Feedback mutation and conditional reopen |
| `caseManagementService.list/get` | Authenticated, paginated staff case queries |
| Case mutation methods | Authorized transactional commands |
| `analyticsService.getSnapshot` | Server-side reconciled aggregates |
| `analyticsService.exportCsv` | Audited asynchronous export |
| `offlineQueueService` | Mobile durable outbox and idempotent server API |
| `AIService` | Asynchronous provider adapter with human-review state |
| `evidenceService` | Resumable protected upload lifecycle |

For every operation, define actor, authorization, input schema, output schema, error codes, idempotency, audit event, sensitive fields and data owner.

## 5. Model gap analysis

Document and resolve these known gaps:

- `localUri` is a device concern and must not be persisted as a server file location.
- `overdue` is derived from `dueAt` and status; it should not be an independently mutable fact.
- client-created `id`, `trackingId`, `referenceNumber`, timestamps, status, priority and AI values are untrusted.
- worker and staff responses require different projections.
- `ReporterIdentity` containing only CNIC last four digits is not identity verification.
- exact location, formatted location and analytics-safe location require separate exposure rules.
- current action actor roles are too narrow for future supervisors, administrators and integrations.
- action visibility must be required and server-controlled.
- versioning is required for concurrent portal mutations.
- files need storage ID, integrity hash, byte length, scan status, encryption metadata and retention status.

## 6. Threat model

Run a structured threat-model workshop covering:

- anonymous worker deanonymization;
- enumeration of complaint references;
- stolen shared phones and locally cached complaints;
- malicious uploads and parser attacks;
- portal credential theft and session replay;
- staff access outside assigned duties;
- insider download or export abuse;
- exact-coordinate disclosure;
- log and backup leakage;
- duplicate offline submissions;
- lifecycle bypass and concurrent updates;
- queue replay, forged webhook and provider compromise;
- AI prompt injection through transcript or document content;
- disk exhaustion and denial of service;
- VPS, database or encryption-key loss.

The output must assign mitigations, owners and verification methods. Unmitigated high risks block Phase 02 approval.

## 7. Engineering baseline remediation

Before backend scaffolding:

1. Install the pinned workspace dependencies on the approved Node.js LTS version.
2. Fix existing mobile TypeScript errors without weakening strict compiler options.
3. Make lint, typecheck and tests reliable under bounded CI concurrency.
4. Remove demo credentials from default production-capable UI paths.
5. Add a feature flag/build profile that excludes demo controls from production.
6. Record current golden-scenario behavior as regression tests.
7. Confirm the portal and mobile apps build from a clean checkout.

Do not suppress errors with broad `any`, disabled lint rules or skipped test suites.

## 8. API and error catalogue

Define stable error codes including:

- `VALIDATION_FAILED`
- `AUTHENTICATION_REQUIRED`
- `MFA_REQUIRED`
- `FORBIDDEN`
- `RESOURCE_NOT_FOUND`
- `VERSION_CONFLICT`
- `IDEMPOTENCY_CONFLICT`
- `INVALID_STATUS_TRANSITION`
- `UPLOAD_TOO_LARGE`
- `UPLOAD_TYPE_REJECTED`
- `UPLOAD_SCAN_PENDING`
- `UPLOAD_MALWARE_DETECTED`
- `TRACKING_CREDENTIAL_INVALID`
- `RATE_LIMITED`
- `DEPENDENCY_UNAVAILABLE`

Client-facing messages must be generic where detail could leak case existence or authentication state.

## 9. Delivery and environment plan

Define:

- local, CI, staging and production environment ownership;
- domain names and API origin strategy;
- CORS policy;
- database and evidence volume sizing assumptions;
- secrets inventory and rotation responsibility;
- deployment approvers;
- migration approval and rollback process;
- incident contacts and severity definitions;
- synthetic-data policy for staging;
- production access request and revocation process.

## 10. Testing required in this phase

- Golden scenario regression suite passes.
- Lifecycle and priority rules have explicit unit tests.
- Privacy-mode tests prove anonymous drafts omit identity fields.
- Service-contract tests describe current client expectations.
- Clean install, lint, typecheck, unit tests and builds pass in CI.
- Test concurrency is bounded so resource exhaustion does not create false failures.

## 11. Deliverables

- Approved architecture diagram and ADR set.
- API operation inventory.
- Data classification and retention draft.
- Threat model and risk register.
- Frontend-to-backend traceability matrix.
- Prioritized backend backlog.
- Green repository quality baseline.
- Initial capacity and storage forecast.

## 12. Exit criteria

- All required ADRs are approved.
- Every existing production-relevant service operation has a target API owner.
- No unresolved ambiguity remains about anonymous, confidential and identified modes.
- Current apps pass the agreed clean-build quality gates.
- No high-severity threat lacks an approved mitigation.
- Phase 02 scope, environments and technical owners are approved.

## 13. Explicit non-goals

- No production database is created.
- No live worker data is collected.
- No real AI, SMS or push provider is enabled.
- No frontend is switched from mock services during this phase.

