# Environment, Delivery and Capacity Plan

## Environments

| Environment | Data | Isolation and purpose |
|---|---|---|
| Local | Synthetic only | Docker Compose dependencies; developer-owned secrets; mock adapters allowed |
| CI | Ephemeral synthetic only | Clean install, bounded checks/builds, no persistent credentials |
| Demo | Synthetic golden scenarios only | Separate hostname, DB, storage root, keys and credentials; visible non-production label |
| Staging | Synthetic or formally approved test data | Production topology/config validation; never a production data copy |
| Production | Real data | Dedicated hostname, DB, Redis namespace, storage/backup roots, keys and notification destinations |

Production profile invariants: `APP_MODE=production`, all demo-control/credential flags false, seed/reset endpoints absent, development error pages off, OpenAPI UI restricted or disabled, provider adapters disabled unless approved.

## CI quality gates

1. Frozen `pnpm` install on Node 24 LTS.
2. Secret scanning and dependency/license/vulnerability review.
3. Typecheck, lint and unit tests with bounded Turbo concurrency.
4. Contract/OpenAPI drift and migration validation once backend exists.
5. Portal production build and Expo Android/iOS/web export using production flags.
6. Integration tests against ephemeral PostgreSQL/Redis/storage in Phase 02+.
7. Golden scenarios, privacy negative tests, authorization tests and log-redaction tests.
8. Image build/SBOM/signing and staging smoke test before promotion.

Current CI implements items 1, 3 and the frontend portion of 5. It uses a 30-minute job timeout and Turbo concurrency of two. Items 2, 4, 6–8 belong to Phase 02 or later.

## Deployment and rollback

- Build immutable images in CI; do not build on the VPS.
- Back up and verify prerequisites before migrations.
- Use expand/contract schema changes. Apply migrations through a one-shot controlled job.
- Start new API/worker images, wait for readiness, run smoke checks, then complete promotion.
- Roll back application images only when schema compatibility is proven. For incompatible data changes, use a tested forward fix or the approved restore procedure.
- Record artifact digests, migration IDs, operator, approver and timestamps.

## Secrets and operator access

Secret values are never stored in Git, `NEXT_PUBLIC_*`, `EXPO_PUBLIC_*`, logs or image layers. Production secret files are root-owned, mode `0600`, outside the checkout, backed by a password-manager/offline recovery record, and readable only by their target service identity. Separate database, Redis, backup, provider, session and encryption keys by environment and purpose.

## Observability baseline

- JSON logs with correlation ID, route template, status, latency, actor pseudonymous ID and result code.
- Metrics for latency/error/saturation, DB pool, disk/inodes, upload backlog, outbox age, queue failures, notification/provider failures and backup freshness.
- Traces must exclude payloads and secrets.
- Alerts route to named on-call/service owner with severity and runbook link.

## Capacity model (approved planning assumptions)

Use variables rather than false precision:

- `C` = complaints/day; `A` = average accepted evidence bytes/complaint; `R` = retention days.
- Primary evidence capacity ≈ `C × A × R × 1.20` (metadata/headroom).
- Backup capacity depends on encrypted incremental/change rate and backup retention; reserve at least two independently restorable generations off-host.
- Database sizing is driven by complaints, actions/audits, idempotency/outbox and indexes; load-test at 5× expected peak request rate.

The project owner accepted the Phase 02 planning baseline on 2026-10-16: 100 complaints/day, 15 MiB average accepted evidence per complaint and 365-day evidence retention. This yields about 535 GiB raw, roughly 642 GiB with 20% headroom before backup copies. It is a design and load-test input, not a VPS procurement figure; measured media distribution, growth, encryption overhead, database/WAL usage, backup change rate and restore staging must inform production sizing.

Disk operational thresholds: warning at 70%, critical at 80%, stop accepting new evidence before 90%; reserve space for database WAL, upload quarantine, encryption copies and restore staging. Quarantine and expired exports have short, enforced TTLs once policy is approved.

## Approved Phase 02 ownership and scope

The project owner approved this scope for implementation on 2026-10-16. Role accountability is effective for development; PUWF must attach named people to these roles before staging access or production operations.

| Workstream | Accountable role | Scope |
|---|---|---|
| Backend foundation | Backend lead | Nest/Fastify API and worker skeleton, config, health, logging, OpenAPI |
| Local infrastructure | Platform/service owner | Compose PostgreSQL 18, Redis, storage roots and developer bootstrap |
| Contracts | Backend + mobile + portal leads | Wire schemas, client generation/adapters and contract tests |
| Security baseline | Security owner | Secret handling, headers, rate limits, threat-control tests |
| Quality/release | QA/release owner | CI service containers, clean builds, evidence and rollback checks |

Phase 02 must not add production authentication, real complaint persistence or external AI/notification providers beyond the exact foundation scope defined in its phase document.

