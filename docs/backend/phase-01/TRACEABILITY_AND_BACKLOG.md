# Frontend–Backend Traceability and Prioritized Backlog

## Route and behavior traceability

| Surface/behavior | Current implementation | Required backend capability | Phase |
|---|---|---|---:|
| Mobile onboarding/language/permission/rights | Local stores and reviewed content | Versioned content/config endpoint only if remote management is approved | 02/06 |
| Grievance wizard and review | `ComplaintDraft`, workflows, local media | Submission intent, validation, consent/privacy policy and upload allocation | 05 |
| Offline saved reports | Local mock queue | Durable mobile outbox, idempotency/status recovery and resumable upload | 05/06 |
| Submission success/tracking | Demo tracking ID/derived PIN | Server reference + independent secret, scoped tracking session and worker projection | 04/06 |
| Worker complaint detail/feedback | Local complaint repository | Safe status/action projection, feedback command and controlled reopen | 06 |
| Portal login | Presentation-only form | Named account, password/MFA, server session, recovery and logout | 04 |
| Dashboard/list/detail | Browser mock repository | Scoped queries, pagination, filtering, safe summaries and case details | 07 |
| Staff case actions | In-memory lifecycle service | Authorized/versioned commands, transactions, history/audit/outbox | 03/07 |
| Evidence playback/gallery | Demo assets/local URI | Protected streaming, scan/encryption state, permission and access audit | 05/07 |
| Analytics/export | Client-side selectors/CSV | Reconciled server aggregates, suppression, async approved exports | 09 |
| AI insight | Scenario/static results | Provider adapter, provenance, deterministic override and human review | 08 |
| Demo routes/reset/scenario injection | Explicit mock/demo services | Separate demo composition/environment; absent from production | 01/02 |

## Golden-scenario contract expectations

| Scenario | Backend invariant |
|---|---|
| GS-01 wage underpayment | Normal submission, review/action lifecycle and wage fields survive projections |
| GS-02 pesticide emergency | Deterministic Emergency floor overrides lower AI suggestion |
| GS-03 confidential harassment | Confidential identity/reveal and safe-contact restrictions enforced |
| GS-04 child labour | Critical minimum priority and safeguarding visibility controls |
| GS-05 forced labour | Critical minimum priority and escalation/audit behavior |
| GS-06 group wage complaint | Affected range retained; no accidental individual identity inference |
| GS-07 sanitation | Standard category workflow and location projection |
| GS-08 AI low confidence | Human review required; no automatic authoritative mutation |
| GS-09 AI failure | Complaint remains actionable through manual workflow |
| GS-10 reopened case | Worker feedback can invoke only valid, audited reopen transition |

Golden fixtures remain synthetic and stable. Contract tests should run the same fixture intent through domain/application services and compare safe mobile/staff projections, not compare database rows to the current all-in-one frontend object.

## Definition of done by work item

Every backend item requires: acceptance criteria linked to a product requirement; Zod/OpenAPI contract; authorization and privacy cases; implementation and unit/integration/contract tests; idempotency/concurrency behavior where relevant; safe logs/metrics/audit; migration/rollback/operations notes; documentation update; clean CI.

## Prioritized backlog

### P0 — Phase 01 remaining release-governance blockers

1. Attach named PUWF people to the technical, privacy/data, security, safeguarding, service and delivery roles before staging/production.
2. Obtain formal PUWF ratification or amendments for the approved implementation ADRs and interim policy schedule before production use of real data.
3. Demonstrate the accepted RPO/RTO targets with production-shaped backup/restore exercises and confirm capacity/budget from measured workloads.
4. Regenerate, validate and approve the six stale voice prompts blocking the repository release gate: `SC-complaint-detail`, `WF-identity`, `WF-privacy`, `RT-child-labour-guidance`, `RT-worker-voice-guidance` and `RT-migrant-tenant-guidance`.

### P1 — Phase 02 foundation

1. Add `apps/api`, `apps/worker`, shared config/logger/contracts/testing packages without business persistence.
2. Add local Compose PostgreSQL 18/Redis/storage services and repeatable bootstrap.
3. Implement environment validation, liveness/readiness, request IDs, safe errors, logs and OpenAPI generation.
4. Add CI integration services, contract drift checks, secret/dependency scanning and immutable container build.
5. Add frontend adapters behind existing service boundaries while keeping mock adapters for demo/tests.

### P2 — Later approved phases

- Production schema/migrations/transactional domain service (03).
- Auth/MFA/RBAC/tracking credentials/encryption primitives (04).
- Intake/upload/quarantine/scan/encryption (05).
- Durable mobile sync and worker projections (06).
- Portal case management/audit (07).
- Outbox/workers/AI/notifications (08).
- Analytics/exports/retention governance (09).
- Production hardening, restore drills and handover (10).

