# Phase 04 — Identity, Authentication, Authorization and Privacy

**Phase objective:** Establish secure staff access and privacy-safe worker tracking before exposing production case data.  
**Depends on:** Phase 03 persistence and projections complete.  
**Produces:** Staff authentication with MFA, server-side sessions, role/permission enforcement, worker tracking credentials, sensitive-data controls and auditable access.

## 1. Identity domains

Treat staff identity and worker complaint access as different security domains.

### Staff

PUWF staff are named, managed users with roles, sessions, MFA and attributable actions.

### Workers

Workers may submit without creating an account. Access to a complaint is granted by a complaint reference plus a high-entropy tracking secret or a securely enrolled recovery mechanism. A complaint reference alone is never an authentication credential.

### Service identities

Workers, schedulers and integrations use separately scoped service credentials. They must not reuse staff accounts or browser sessions.

## 2. Staff account model

Implement:

- `users` with immutable ID, display name, normalized login identifier, status and timestamps;
- roles and explicit permissions;
- password credential metadata;
- MFA factors and recovery-code hashes;
- server-side sessions;
- login attempts and lockout/risk records;
- account lifecycle audit events;
- optional assignment scope for future organizational boundaries.

Initial roles:

| Role | Intended access |
|---|---|
| `grievance_manager` | Normal complaint review and case actions |
| `supervisor` | Manager capabilities plus assignment, approval and sensitive escalation access |
| `administrator` | User/role management; no automatic entitlement to evidence content |
| `auditor_read_only` | Audited read access without case mutation |

Permissions must be capability-based, for example `case.read`, `case.mutate`, `identity.reveal`, `evidence.download`, `export.create`, `user.manage` and `audit.read`.

## 3. Password and MFA controls

- Hash passwords with Argon2id using parameters benchmarked on the target VPS.
- Enforce minimum length and compromised/common-password screening.
- Do not require arbitrary periodic password changes without a security reason.
- Require MFA enrollment before production case access.
- Prefer TOTP initially; design the factor model so WebAuthn can be added.
- Generate one-time recovery codes and store only their hashes.
- Require recent reauthentication for password, factor, role and sensitive export changes.
- Notify the account owner or supervisor of relevant security changes.

Bootstrap of the first administrator must use a one-time, documented command that does not print or persist a plaintext password.

## 4. Session model

Use opaque, high-entropy session identifiers in `Secure`, `HttpOnly`, `SameSite` cookies. Store session state server-side in PostgreSQL so it remains revocable if Redis is unavailable.

Sessions include:

- user and assurance/MFA state;
- issued, last-seen, idle-expiry and absolute-expiry times;
- hashed session token;
- revocation time/reason;
- coarse device metadata suitable for security review;
- last IP only if approved by the data-retention policy.

Rotate the session after authentication and privilege elevation. Revoke sessions on password reset, account disablement, role change or suspected compromise.

## 5. Portal protections

- Add authenticated route protection to all portal pages except login and recovery flows.
- Enforce CSRF protection for cookie-authenticated mutations.
- Rate-limit login, MFA and recovery endpoints by account and network signal.
- Use generic login failure responses.
- Prevent open redirects.
- Set a restrictive Content Security Policy and frame protections.
- Never persist authentication tokens in `localStorage`.
- Remove demo credentials and simulated login behavior from production builds.

## 6. Authorization architecture

Authorization is evaluated in application services, with route guards as an outer layer. Every command/query declares its required permission and resource scope.

Sensitive identity reveal, original evidence download, export creation, user management and audit access require distinct permissions. Administrator status must not bypass evidence or case confidentiality automatically.

Add negative authorization tests for every protected operation:

- unauthenticated;
- authenticated without permission;
- correct role outside resource scope;
- disabled/revoked session;
- valid permitted access.

## 7. Worker tracking credentials

At complaint creation, generate:

- a non-secret human-readable reference number;
- a random tracking secret with sufficient entropy;
- an optional easy-entry representation or recovery phrase approved by UX;
- a server-side hash of the tracking secret.

Return the secret once. The mobile app stores it in secure device storage, not ordinary async storage. The backend never returns or logs it again.

Tracking authentication must:

- use constant-time verification;
- rate-limit and detect enumeration attempts;
- return indistinguishable failures for unknown reference and wrong secret;
- issue a short-lived scoped worker session after successful verification;
- allow access only to the complaint(s) bound to that credential;
- support secure credential rotation/recovery only after a separately approved identity process.

## 8. Privacy-mode enforcement

### Anonymous (`ANON`)

- Identity and contact fields are rejected or discarded before persistence.
- No private reporter record is created.
- Analytics and audit logs must not create an avoidable identity trail.
- Staff UI must clearly state that identity is unavailable, not merely hidden.

### Confidential (`CONF`)

- Contact/identity data is stored separately and encrypted.
- Ordinary case reads return a masked indicator only.
- Reveal requires `identity.reveal`, a declared reason, recent authentication and an audit event.
- Exports exclude private identity by default.

### Identified (`IDEN`)

- Only fields covered by approved consent and necessity are collected.
- Access remains permission-controlled and audited.
- Identified does not mean unrestricted visibility.

Privacy-mode invariants are enforced in schemas, application services and persistence tests.

## 9. Cryptographic design

Implement versioned envelope-encryption interfaces for private reporter fields and later evidence files:

- authenticated encryption such as AES-256-GCM through maintained libraries;
- unique nonce per encryption operation;
- stored key identifier and algorithm version;
- associated data binding ciphertext to entity and field purpose;
- separate keys for sessions, field encryption and evidence encryption;
- rotation and recovery procedure before production use;
- keys injected at runtime and excluded from images, Git and ordinary backups.

If a full external key-management service is not available, document the reduced threat protection and store key material with restrictive host permissions separately from database/evidence volumes. Keep an encrypted, access-controlled recovery copy off the VPS.

## 10. Audit events

Audit at minimum:

- login success/failure and MFA events;
- session creation, revocation and expiry;
- account creation, disablement and role changes;
- private identity reveal;
- evidence view/download attempt and outcome;
- export request/download;
- permission denial for sensitive operations;
- key-rotation administrative events.

Audit events are append-only through application permissions. They contain actor, action, resource, outcome, request ID, timestamp and bounded metadata, but never secrets or sensitive content.

## 11. API surface

```text
POST   /api/v1/auth/login
POST   /api/v1/auth/mfa/verify
POST   /api/v1/auth/logout
GET    /api/v1/auth/session
POST   /api/v1/auth/reauthenticate
POST   /api/v1/auth/password/change
POST   /api/v1/auth/mfa/enroll
POST   /api/v1/auth/mfa/recovery-codes/rotate

POST   /api/v1/worker-sessions
DELETE /api/v1/worker-sessions/current

GET    /api/v1/admin/users
POST   /api/v1/admin/users
PATCH  /api/v1/admin/users/:id
POST   /api/v1/admin/users/:id/sessions/revoke
```

Do not expose whether a worker reference exists before tracking authentication succeeds.

## 12. Tests

- Password hashes are never plaintext and parameters meet the approved benchmark.
- MFA enrollment, verification, recovery and replay rejection work.
- Session fixation, expired sessions and revoked sessions are rejected.
- CSRF requests fail without a valid token/origin proof.
- Every permission has positive and negative API tests.
- Anonymous input cannot create identity data.
- Confidential identity reveal requires permission, reason and recent authentication.
- Worker references cannot be enumerated through timing or response differences within practical test tolerances.
- Tracking secrets are hashed, rate-limited and redacted from logs.
- Key rotation can decrypt old records and encrypt new records under the new key.

## 13. Deliverables

- Staff authentication and MFA modules.
- Session and authorization middleware/guards.
- Portal login and logout integration.
- Worker tracking credential service.
- Privacy enforcement and sensitive-field encryption.
- User administration baseline.
- Authentication, authorization and key-management runbooks.
- Security audit event implementation.

## 14. Exit criteria

- All production portal routes require valid staff sessions.
- MFA is mandatory in staging and production configurations.
- Authorization is enforced and tested server-side.
- Anonymous submissions are structurally unable to persist identity.
- Confidential identity access is reasoned, reauthenticated and audited.
- Tracking references alone cannot retrieve case data.
- Session and encryption-key rotation procedures are demonstrated.

## 15. Non-goals

- No social login or external organizational SSO.
- No mandatory worker account.
- No SMS-based MFA as the preferred staff factor.
- No production complaint intake until Phase 05.

