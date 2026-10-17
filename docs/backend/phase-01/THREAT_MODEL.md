# Threat Model and Initial Risk Register

## Assets and adversaries

Primary assets are worker identity/contact, exact location, evidence/audio, safeguarding facts, credentials/keys, case integrity, audit history and service availability. Adversaries include external attackers, abusive employers/supervisors, opportunistic device users, unauthorized or over-privileged staff, compromised providers and compromised VPS/operator accounts.

## Abuse cases and controls

| ID | Threat/abuse case | Initial risk | Required controls | Residual/owner |
|---|---|---:|---|---|
| T01 | Enumerate tracking references or brute-force PIN | Critical | Independent high-entropy secret, slow hash, uniform responses, network/account throttles, rotation | Medium; security |
| T02 | Anonymous report linked through identity/contact/GPS | Critical | No identity row for ANON, allowlisted fields, exact-location choice, metadata review, privacy tests | Medium; privacy/safeguarding |
| T03 | Staff views/reveals cases outside purpose | Critical | Named accounts, MFA, least privilege, scope policy, reveal purpose, immutable access audit and review | Medium; data owner |
| T04 | Stolen portal cookie/session | High | HttpOnly Secure SameSite cookie, rotation, idle/absolute expiry, CSRF defense, step-up, revocation | Medium; security |
| T05 | Malicious/oversize/polyglot upload | Critical | tus quotas, declared/observed MIME checks, checksum, quarantine, AV scan, non-executable roots, safe streaming | Medium; security |
| T06 | Path traversal/symlink/local-file exposure | Critical | Server-generated object IDs, canonical root checks, no user paths, restrictive permissions, no static serving | Low; engineering |
| T07 | AI/provider receives prohibited data or prompt injection manipulates priority | Critical | Provider off by default, minimization/redaction, contract approval, untrusted output schemas, deterministic priority floors, human review | Medium; data/security |
| T08 | Redis loss drops committed work or duplicate job causes repeated side effect | High | Transactional outbox, idempotent consumers, unique effect keys, reconciliation and DLQ operations | Low; service owner |
| T09 | Client forges status/priority/timestamps/IDs | High | Ignore/reject authoritative fields; server policy and transactions; contract negative tests | Low; engineering |
| T10 | Concurrent staff commands overwrite one another | High | Resource version/expected version, transactions, conflict response and append-only history | Low; engineering |
| T11 | Logs/telemetry/backups leak sensitive payloads | Critical | Structured allowlist logging, redaction tests, encrypted off-host backup, separate keys/credentials | Medium; security/service |
| T12 | VPS/root compromise exposes live plaintext/keys | Critical | Patch/harden host, minimal services, SSH keys, firewall, key separation, monitored access, incident/key rotation runbook | High; service/security |
| T13 | Demo controls/credentials enabled in production | High | Opt-in demo flags, server route gate, production build env, CI checks, distinct demo data/host/keys | Low; release owner |
| T14 | Destructive export/deletion by one compromised staff account | Critical | Step-up, dedicated permission, dual approval, bounded exports, legal hold checks, audit | Medium; data owner |
| T15 | Mobile device loss exposes drafts/audio/tracking secret | High | OS secure storage for secrets, encrypted app storage where feasible, minimal local retention, screen privacy guidance, remote session revocation | Medium; mobile/security |
| T16 | Denial of service exhausts CPU/disk through uploads/auth/search | High | Caddy/body limits, quotas, rate limits, query bounds/timeouts, disk alerts/reservations, backpressure | Medium; service owner |

## Security verification required before production

- Authorization matrix and negative tests for every staff/worker operation.
- Anonymous/confidential/identified fixture tests at API, database and export boundaries.
- Session fixation, CSRF, MFA replay/recovery and credential enumeration tests.
- Upload fuzzing, path/symlink tests, checksum mismatch, malware and quota tests.
- Log/trace snapshot tests proving secrets and complaint bodies are absent.
- Backup restore including encryption keys; Redis-loss/outbox replay drill.
- Dependency/container/VPS vulnerability review and external penetration test.

## Accepted-risk rule

No critical residual risk may be accepted by engineering alone. Acceptance records require the risk owner, rationale, compensating controls, expiry/review date and named approving authority.

