# Phase 10 — Production Hardening, Deployment and Handover

**Phase objective:** Prove that the complete system is secure, deployable, observable, recoverable and operationally supportable before live data is accepted.  
**Depends on:** Phases 01–09 complete and staging feature-complete.  
**Produces:** Hardened Hostinger deployment, automated release process, backup/PITR, monitoring, security validation, disaster-recovery evidence, UAT sign-off and support handover.

## 1. Production topology

Deploy immutable containers through Docker Compose:

```text
caddy
portal
api
worker
postgres
redis
tusd or approved upload service
clamav
metrics/telemetry components approved for VPS capacity
```

Only Caddy ports 80/443 are public. SSH is restricted by Hostinger firewall and host firewall to approved administrative sources where operationally feasible. PostgreSQL, Redis, metrics, ClamAV, upload internals and container management endpoints are private.

## 2. VPS baseline

- Supported Ubuntu LTS image.
- Dedicated non-root administrative user with key-only SSH.
- Root login and password SSH disabled after verified alternative access.
- Hostinger and UFW firewall rules documented and tested.
- Automatic security updates configured with controlled reboot procedure.
- Time synchronization enabled.
- Docker and Compose installed from an approved source and version-pinned.
- Data directories mounted with restrictive ownership and permissions.
- Swap and memory limits sized deliberately; no reliance on unlimited overcommit.
- Log rotation and disk quotas/thresholds configured.
- Malware/security monitoring enabled where compatible with workload and privacy.

## 3. Caddy and TLS

- Separate approved hostnames for portal and API, or a documented same-origin route plan.
- Automatic HTTPS with valid public DNS.
- HTTP redirects to HTTPS.
- Security headers include HSTS after deployment verification, CSP, `nosniff`, referrer policy and framing restrictions.
- Upload/body limits are consistent across Caddy and API/upload service.
- Proxy timeouts support resumable uploads without enabling unbounded slow connections.
- Trusted proxy handling is fixed and tested.
- Access logs redact query parameters and sensitive paths where required.

## 4. Production Compose controls

- Application code is inside images, not host source bind mounts.
- Containers run as non-root where supported.
- Root filesystem is read-only where practical.
- Writable mounts are explicit and minimal.
- Images are pinned by immutable tag/digest through release promotion.
- Health checks and restart policies are defined.
- CPU and memory limits prevent one process from exhausting the VPS.
- Database/evidence volumes are never removed by deployment scripts.
- Secrets are mounted/injected at runtime and absent from Compose source/history.
- Production services use an internal network and no unnecessary host ports.

## 5. Release pipeline

The release process must:

1. Build once from an immutable commit.
2. Run all quality, security, contract, migration and container checks.
3. Sign or record image digests and generate a software bill of materials.
4. Deploy the same images to staging.
5. Execute smoke, integration and migration rehearsal tests.
6. Require approval for production promotion.
7. Verify fresh backups and available disk before migration.
8. Apply migrations through a single controlled job.
9. Deploy services with health/readiness checks.
10. Run post-deployment smoke tests.
11. Record release version, operator, migration and outcome.

Rollback uses the previous compatible image. Database rollback relies on backward-compatible expand/contract deployments or tested restore/recovery—not improvised reverse migrations.

## 6. Backup architecture

Hostinger snapshots/backups supplement but do not replace application backups.

Implement:

- PostgreSQL base backups and WAL archiving for point-in-time recovery;
- periodic logical dumps for portability and selected-object recovery;
- encrypted incremental/snapshot backup of evidence ciphertext and metadata manifests;
- backup of deployment configuration, migration history and required key-recovery material;
- encrypted off-VPS destination under separate credentials;
- retention tiers and automatic expiry;
- success/failure/age monitoring;
- integrity verification and periodic restore tests.

Never back up quarantine or ephemeral decrypted/export files as authoritative evidence.

## 7. Recovery objectives and procedures

Approve and test targets such as:

- database RPO: 15 minutes;
- evidence RPO: 1 hour;
- service RTO: 4 hours.

Document recovery for:

- accidental record mutation/deletion;
- PostgreSQL corruption;
- evidence volume loss;
- full VPS loss;
- lost Redis data;
- failed deployment/migration;
- compromised credential or encryption key;
- domain/DNS/TLS failure;
- disk exhaustion.

A full disaster-recovery rehearsal must rebuild service on a clean host or isolated environment, restore database and evidence, reapply deletion/legal-hold journals, validate hashes, rotate affected secrets and pass functional smoke tests.

## 8. Monitoring and alerting

Monitor:

- public availability and TLS expiry;
- API latency/error rates;
- authentication failures and lockouts;
- database connections, locks, slow queries, disk and WAL archive state;
- Redis health and memory policy;
- queue/outbox depth and oldest age;
- upload/scan failures and quarantine backlog;
- evidence/database integrity mismatches;
- filesystem capacity/inodes;
- backup success and last verified restore;
- worker CPU/memory/event-loop delay;
- notification and AI provider degradation;
- audit-log write failures.

Alerts must include severity, owner, safe context and runbook link. Alerts must not include complaint content or identity.

## 9. Security verification

Complete:

- threat-model closure review;
- dependency/container vulnerability assessment;
- secret scan;
- SAST and targeted DAST;
- authorization matrix testing;
- session/CSRF/CORS/security-header review;
- upload and malware test suite;
- rate-limit and enumeration testing;
- encryption/key rotation recovery test;
- log redaction review;
- backup confidentiality review;
- independent penetration test before live deployment where budget permits.

No known critical/high vulnerability is accepted without documented risk ownership, compensating controls and time-bound remediation.

## 10. Performance and resilience tests

Test against an approved workload model including:

- normal and peak complaint submissions;
- concurrent resumable voice/evidence uploads;
- portal queue/list/detail traffic;
- analytics and export concurrency;
- AI/notification backlog;
- database restart;
- worker/API restart during jobs and submissions;
- Redis loss/recovery;
- slow/full evidence disk;
- ClamAV/provider unavailability.

Measure latency, throughput, error rate, memory, CPU, connection usage, queue age and recovery behavior. Tune based on evidence, not generic benchmark claims.

## 11. UAT and production readiness

UAT must cover end-to-end scenarios:

1. Anonymous offline wage complaint with voice evidence.
2. Confidential harassment complaint with restricted identity reveal.
3. Pesticide emergency with deterministic priority floor.
4. Interrupted upload and retry without duplication.
5. Staff review, contact, investigation, action and resolution.
6. Worker receives safe notification and tracks status.
7. Worker marks resolution unresolved and case reopens.
8. Analytics and export reconcile with case data.
9. AI failure leaves manual workflow intact.
10. Backup restore recovers complaint and evidence consistently.

Use synthetic UAT data. Real worker submissions are prohibited before formal go-live approval.

## 12. Operational runbooks

Deliver concise, tested runbooks for:

- deployment and rollback;
- migration failure;
- service restart and health diagnosis;
- account disablement/session revocation;
- lost MFA recovery;
- suspicious evidence/malware event;
- queue backlog and failed job replay;
- AI/SMS provider outage;
- disk pressure;
- backup failure and restore;
- privacy incident/data breach;
- encryption key rotation/compromise;
- worker complaint support without identity leakage;
- evidence integrity mismatch;
- planned VPS maintenance.

Every runbook states authority, prerequisites, exact verification, escalation and evidence to retain.

## 13. Deliverables and handover package

- Current architecture and network diagram.
- Component/version inventory and SBOM.
- Environment and configuration catalogue without secret values.
- Database ERD, migrations and data dictionary.
- OpenAPI specification and client-generation instructions.
- Permission matrix and account lifecycle procedure.
- Backup/restore and key-recovery documentation.
- Monitoring dashboard and alert ownership.
- Incident-response contacts and severity matrix.
- Data-retention and provider-processing records.
- Known limitations and accepted risks.
- Release, UAT, penetration-test and DR rehearsal evidence.
- On-call/support training record.

## 14. Go-live sequence

1. Freeze release candidate and approve change window.
2. Confirm DNS, firewall, TLS, capacity and provider readiness.
3. Confirm off-site backup destination and key recovery.
4. Deploy production infrastructure with intake disabled.
5. Apply migrations and create named staff accounts/MFA.
6. Run health, auth, privacy, upload and audit smoke tests.
7. Take recovery checkpoint/base backup.
8. Enable portal for controlled staff verification.
9. Enable worker intake to a limited pilot cohort if approved.
10. Monitor heightened metrics and review first cases.
11. Expand rollout only after pilot acceptance.

Define an explicit stop/rollback decision owner for the window.

## 15. Tests and evidence required

- All CI quality/security gates pass on release commit.
- Staging migration rehearsal uses production-like volume.
- Portal/mobile end-to-end suites pass against deployed staging.
- Load and resilience objectives are met.
- Backup restoration and full DR rehearsal pass with recorded timings.
- Evidence hashes match after restore.
- Security review and penetration findings are closed/accepted.
- UAT sign-off is recorded by product and PUWF operational owners.
- Production smoke checklist passes before intake is enabled.

## 16. Exit criteria

- Production runs only approved immutable artifacts.
- Public attack surface is limited to required HTTPS and restricted administration.
- Monitoring, alerting, backup and recovery are operational and owned.
- RPO/RTO are demonstrated through restoration, not only documented.
- No unresolved P0/P1 defect or unaccepted high security risk remains.
- Staff training, runbooks and escalation routes are complete.
- Product, engineering, security/privacy and operational owners sign the go-live record.

## 17. Post-launch controls

- Daily review during pilot week.
- Weekly backup/queue/capacity review during the first month.
- Monthly access and restore-sample review.
- Quarterly permission, dependency and incident drill review.
- Scheduled patching and supported-version upgrades.
- Capacity forecast updated from real evidence volume.
- Architecture review before adding organizations, major roles, external integrations or additional regions.

## 18. Non-goals

- No claim of high availability from a single VPS.
- No zero-data-loss promise beyond demonstrated RPO.
- No Kubernetes or microservice migration without measured need.
- No production launch based solely on a successful happy-path demo.

