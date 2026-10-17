# Architecture Decision Records

Decisions are approved individually by the project owner and remain subject to formal PUWF ratification before production launch. Role-based owner placeholders are used until PUWF assigns named personnel; no fictitious approver names are recorded.

## ADR-001 — Modular monolith and process boundaries

- **Context:** One small team and one VPS need strong domain boundaries without distributed-system overhead.
- **Decision:** NestJS modular monolith with separate API and worker processes sharing framework-free application/domain packages.
- **Alternatives:** Microservices; single combined process; serverless functions.
- **Consequences:** Simple transactions/deployment and later extraction seams; one release train and database require disciplined module ownership.
- **Security impact:** Smaller network surface; worker has separately scoped credentials.
- **Rollback:** Combine worker with API temporarily only if queue isolation prevents operation; extract modules when independent scaling/ownership is proven.
- **Approver/status:** Approved for implementation by project owner on 2026-10-16; formal PUWF Technical Reviewer assignment/ratification remains pending.

## ADR-002 — REST and OpenAPI

- **Context:** Expo and Next clients need predictable, cacheable contracts and offline retry semantics.
- **Decision:** REST JSON at `/api/v1`, generated OpenAPI, shared Zod wire schemas and contract tests.
- **Alternatives:** GraphQL; RPC-only APIs.
- **Consequences:** Explicit operations and mature tooling; more endpoints and projection DTOs.
- **Security impact:** Per-operation authorization and bounded input schemas are reviewable.
- **Rollback:** Add a versioned compatibility adapter; never mutate published semantics silently.
- **Approver/status:** Approved for implementation by project owner on 2026-10-16; formal PUWF Technical Reviewer ratification remains pending.

## ADR-003 — PostgreSQL 18 and Prisma

- **Context:** Cases require transactions, constraints, audit history and reporting.
- **Decision:** Current PostgreSQL 18 minor release, Prisma stable major selected in Phase 02 after compatibility validation; custom SQL migrations where constraints/extensions require it.
- **Alternatives:** MongoDB; MySQL; handwritten SQL only.
- **Consequences:** Strong consistency and migrations; JSON is limited to bounded metadata, not core lifecycle facts.
- **Security impact:** Least-privilege DB roles, private network binding and encrypted backups.
- **Rollback:** Restore a pre-migration backup and deploy the previous compatible image; forward fixes preferred after data migrations.
- **Approver/status:** Approved for implementation by project owner on 2026-10-16; formal PUWF Technical Reviewer and database-owner ratification remains pending.

## ADR-004 — Staff sessions and MFA

- **Context:** Portal handles highly sensitive worker and safeguarding data.
- **Decision:** Named accounts, Argon2id password hashes, mandatory TOTP before production case access, server-side opaque sessions in secure HttpOnly SameSite cookies; factor model supports WebAuthn later.
- **Alternatives:** JWT in browser storage; SMS MFA; external OIDC immediately.
- **Consequences:** Session store/revocation and recovery operations are required; avoids bearer tokens in JavaScript storage.
- **Security impact:** Step-up authentication for identity reveal, evidence/export and user administration; recovery is audited and dual-controlled.
- **Rollback:** Disable account access, revoke sessions/factors and use controlled recovery; never bypass MFA globally.
- **Approver/status:** Approved for implementation by project owner on 2026-10-16; formal PUWF Security Reviewer ratification remains pending.

## ADR-005 — Worker tracking credential

- **Context:** Anonymous workers need status without creating conventional accounts.
- **Decision:** Server-generated public reference plus independent high-entropy one-time tracking secret, stored only as a slow hash; exchange for short-lived scoped sessions. Never derive a PIN from the reference.
- **Alternatives:** Reference alone; predictable four-digit PIN; full worker accounts.
- **Consequences:** Worker must save/recover the secret; support process cannot reveal protected case data without policy.
- **Security impact:** Rate limiting, rotation and enumeration-resistant responses are mandatory.
- **Rollback:** Revoke/rotate the tracking credential and issue through an approved recovery process.
- **Approver/status:** Approved for implementation by project owner on 2026-10-16; formal PUWF Security and Safeguarding Reviewer ratification remains pending.

## ADR-006 — Evidence encryption and key ownership

- **Context:** VPS local storage may contain voice, documents and photos.
- **Decision:** Streamed AES-256-GCM envelope encryption per object; key IDs/metadata in DB, master key outside DB/storage root, separate keys for evidence, sensitive fields and sessions. Security owner controls rotation; operator cannot approve own recovery.
- **Alternatives:** Filesystem permissions only; full-disk encryption only; database blobs.
- **Consequences:** Key lifecycle/restore tests become operational dependencies; local paths remain internal.
- **Security impact:** Reduces disclosure from copied disks/backups; does not protect a fully compromised running host.
- **Rollback:** Versioned decryptors retain old-key support through rotation; restore keys and data as one recovery set.
- **Approver/status:** Approved for implementation by project owner on 2026-10-16; formal PUWF Security and Privacy/Data Reviewer ratification remains pending.

## ADR-007 — tus resumable uploads

- **Context:** Rural/mobile networks and large audio require pause/resume and offset safety.
- **Decision:** tus 1.0 compatible upload service with application-owned authorization, metadata policy, quotas and completion hooks; quarantine before acceptance.
- **Alternatives:** Multipart single request; custom chunking; external object storage direct upload.
- **Consequences:** Extra service/protocol testing; reliable recovery and standardized clients.
- **Security impact:** Strict length/type/checksum limits, non-executable storage and upload credentials bound to case intent.
- **Rollback:** Disable new uploads while preserving status/finalization; fall back only to bounded multipart for small files after review.
- **Approver/status:** Approved for implementation by project owner on 2026-10-16; formal PUWF Technical and Security Reviewer ratification remains pending.

## ADR-008 — BullMQ plus transactional outbox

- **Context:** AI, scanning, notifications and exports must survive Redis/process loss.
- **Decision:** Business transaction writes `outbox_events`; dispatcher publishes to BullMQ; idempotent workers record durable outcomes in PostgreSQL.
- **Alternatives:** Redis-only queues; database polling without BullMQ; synchronous processing.
- **Consequences:** More state/reconciliation logic; no dual-write data loss.
- **Security impact:** Minimal job payloads containing identifiers, not sensitive content; scoped worker credentials.
- **Rollback:** Pause consumers and replay pending outbox events after fix; business commits remain authoritative.
- **Approver/status:** Approved for implementation by project owner on 2026-10-16; formal PUWF Technical Reviewer ratification remains pending.

## ADR-009 — AI provider and data restrictions

- **Context:** Voice/transcript/complaint facts may be extremely sensitive and AI is advisory.
- **Decision:** Provider adapter is disabled by default. Production requires a signed processing assessment covering region, retention, no-training, subprocessors and deletion. Send the minimum approved fields; deterministic safety/priority rules override AI; retain provenance and human review state.
- **Alternatives:** Self-hosted models; direct provider calls from clients; no AI.
- **Consequences:** Application remains functional without AI; provider choice can change.
- **Security impact:** No raw evidence leaves the system until explicitly approved; redact identifiers where possible.
- **Rollback:** Kill switch stops dispatch, cancels retries and routes all cases to manual review.
- **Approver/status:** Approved for implementation by project owner on 2026-10-16. AI remains disabled by default; production activation requires the stated processing assessment and formal PUWF Privacy/Data, Security and Safeguarding Reviewer ratification.

## ADR-010 — Backup targets

- **Context:** One VPS and local evidence storage create host-loss risk.
- **Decision:** Target database RPO 15 minutes, evidence RPO 1 hour and service RTO 4 hours, using encrypted off-host backups and quarterly restore exercises. These are accepted engineering objectives, not guarantees, until a restore exercise demonstrates them on production-shaped infrastructure.
- **Alternatives:** Daily backup; synchronous replica; zero-data-loss claim.
- **Consequences:** Storage/bandwidth cost and operational drills; targets are not guarantees until demonstrated.
- **Security impact:** Separate credentials, immutable retention tier and key-inclusive recovery procedure.
- **Rollback:** Restore last verified set to clean infrastructure, reconcile outbox/uploads and document loss window.
- **Approver/status:** Approved for implementation and capacity planning by project owner on 2026-10-16; formal PUWF Service and Security Reviewer ratification, budget confirmation and restore demonstration remain required before production.

## ADR-011 — Deployment and secrets

- **Context:** Hostinger VPS must support repeatable releases with minimal operator error.
- **Decision:** Docker Compose, pinned immutable images, Caddy, private internal network, root-owned environment/secret files outside repository, SSH keys only, firewall default deny, deploy with health checks and previous-image rollback.
- **Alternatives:** Manual host installs; Kubernetes; secrets committed as environment examples.
- **Consequences:** Simple single-host operations; Compose and host remain a failure domain.
- **Security impact:** No secrets in public build variables/logs/images; separate environment credentials and storage roots.
- **Rollback:** Repoint Compose to previous image after compatibility check; database migration rules from ADR-003 apply.
- **Approver/status:** Approved for implementation by project owner on 2026-10-16; formal PUWF Technical, Security and Service Reviewer ratification remains pending.

## ADR-012 — Retention, legal hold, deletion and export approval

- **Context:** Different data classes and safeguarding/legal duties require approved lifecycle policy.
- **Decision:** Implement policy-driven retention classes, immutable legal holds, approved deletion/anonymization workflows and step-up/dual approval for sensitive exports. Use the interim engineering schedule in `DATA_MODEL_AND_GOVERNANCE.md` for schema, configuration and capacity work. It is not a legal conclusion and must remain configurable; real-data production launch requires formal PUWF privacy/legal ratification.
- **Alternatives:** Indefinite retention; one duration for everything; ad-hoc deletion buttons.
- **Consequences:** Engineering can design and test against concrete defaults; production activation remains blocked until PUWF ratifies or amends them. Every disposition produces evidence without retaining deleted content.
- **Security impact:** Minimization reduces breach impact; holds and exports require least privilege and audit.
- **Rollback:** Pause disposition jobs, never restore intentionally deleted data unless an authorized backup policy explicitly permits it.
- **Approver/status:** Interim schedule approved for implementation by project owner on 2026-10-16; formal PUWF Privacy/Data and Legal Reviewer ratification remains required before real data is retained or deleted under it.

## Current-source validation

The baseline was checked on 2026-10-16 against official documentation: Node 24 is an LTS line; PostgreSQL 18 is supported; Prisma documents PostgreSQL 18 support; Nest documents Fastify and OpenAPI integration; BullMQ recommends idempotent jobs; tus defines the resumable upload protocol. Version pins are selected and locked during Phase 02, not guessed in Phase 01.

