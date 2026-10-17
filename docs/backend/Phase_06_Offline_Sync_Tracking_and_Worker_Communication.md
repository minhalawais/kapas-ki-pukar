# Phase 06 — Offline Sync, Tracking and Worker Communication

**Phase objective:** Make the mobile application reliable under intermittent connectivity and connect tracking, worker-visible history, information requests and outcome feedback to production APIs.  
**Depends on:** Phase 05 intake and Phase 04 worker credentials.  
**Produces:** Durable mobile outbox, retry protocol, worker projections, tracking authentication, feedback handling and worker communication state.

## 1. Offline design principles

- Offline is a normal operating condition, not an exception.
- The local queue is an outbox of worker intent, not the production system of record.
- Every retry is safe and idempotent.
- Media and structured data have explicit dependency states.
- Server acknowledgement is the boundary between queued and submitted.
- The UI must not imply that a locally saved complaint has reached PUWF.
- Sync never silently discards or overwrites a worker draft.

## 2. Local queue model

Replace the demo queue with a versioned durable model containing:

- queue item ID;
- draft and client submission IDs;
- schema version;
- idempotency key;
- encrypted or OS-protected local payload reference;
- media items and individual upload states;
- status: `local`, `uploading`, `ready`, `submitting`, `acknowledged`, `retryable_failed`, `blocked`;
- retry count and next attempt time;
- last stable error code;
- created and updated times;
- acknowledgement data.

Do not store tracking secrets or sensitive contact information in unprotected general storage.

## 3. Sync state machine

```text
local
  -> uploading
  -> ready
  -> submitting
  -> acknowledged

Any network/transient failure -> retryable_failed -> previous safe state
Any schema/privacy/permanent failure -> blocked -> explicit worker recovery path
```

State transitions must be atomic in local storage. A process crash at any state must resume safely.

## 4. Retry policy

- Trigger on application start, foreground, explicit worker request and verified connectivity restoration.
- Use exponential backoff with jitter and a maximum interval.
- Do not retry validation, unsupported-version, rejected-media or privacy failures automatically.
- Respect server `Retry-After` for rate limits and temporary dependency failures.
- Limit concurrent media uploads for low-memory devices.
- Provide cancel/pause behavior that does not corrupt partial uploads.
- Stop background work when device constraints or platform policy require it.

Connectivity indicators are hints; the result of the API request determines success.

## 5. Server synchronization contracts

Provide:

```text
GET  /api/v1/complaints/submissions/:clientSubmissionId
POST /api/v1/worker-sessions
GET  /api/v1/worker/complaints
GET  /api/v1/worker/complaints/:referenceNumber
POST /api/v1/worker/complaints/:referenceNumber/feedback
POST /api/v1/worker/complaints/:referenceNumber/information-responses
```

The submission lookup is scoped to proof of the original idempotency/submission context and must not become a public enumeration endpoint.

## 6. Worker case projection

Worker detail may include:

- safe reference and submitted date;
- localized worker-facing status;
- category/summary appropriate to the reporter;
- safe location granularity;
- worker-visible actions only;
- evidence acknowledgement without server paths;
- proposed/final resolution intended for the worker;
- requests for further information;
- expected next step and due-state guidance;
- feedback state.

It must exclude:

- internal notes and investigation findings not explicitly marked worker-visible;
- staff identities unless policy approves them;
- internal assignment, risk scoring and operational flags;
- confidential identity fields;
- exact coordinates unless clearly required and safe;
- raw provider metadata, prompts and internal AI warnings;
- evidence storage/encryption paths.

## 7. Tracking session behavior

- Unlock using reference plus tracking secret or securely stored device credential.
- Use a short-lived scoped worker session.
- Permit local re-entry using OS-secured credentials according to the approved UX.
- Clear active worker session data on explicit logout.
- Avoid displaying sensitive complaint details in notifications, task switcher previews or lock-screen content.
- Support shared-device guidance and a quick-exit/clear-local-access option if approved by product safety review.

## 8. Further-information responses

When staff requests more information:

- the action must be explicitly worker-visible;
- the worker can submit text/structured answers and approved new evidence;
- submission is idempotent;
- new evidence follows the same quarantine and scan pipeline;
- a case action records receipt without exposing internal details;
- status transition, if any, is server-controlled;
- staff sees provenance linking the response to the request.

## 9. Worker feedback

Support `satisfied`, `partial` and `unresolved` outcomes.

- Feedback is available only in approved lifecycle states.
- A complaint accepts one current feedback outcome unless the domain explicitly supports revision.
- `unresolved` or approved `partial` feedback may transition a resolved/closed complaint to `Reopened` using server lifecycle rules.
- Feedback and transition occur in one transaction.
- Duplicate retries return the same result.
- Internal automation cannot falsely attribute feedback to a staff actor.

## 10. Versioning and compatibility

- Mobile sends app version, API contract version and complaint schema version.
- Server publishes minimum-supported and latest-known mobile versions through a safe metadata endpoint.
- Additive response changes remain backward compatible.
- Unsupported submissions return a stable error with a non-destructive upgrade/recovery path.
- Local migrations preserve queued drafts and media references across application upgrades.
- Never delete a queued complaint solely because its local schema is old.

## 11. Localization and safe errors

Backend returns stable codes and bounded parameters, not embedded English UI prose. Mobile maps them into Urdu/English/Sindhi/Saraiki messaging where supported.

Worker messages must distinguish:

- saved on this device;
- waiting for connection;
- uploading evidence;
- received by PUWF;
- needs worker action;
- cannot send until a specific field/file is corrected;
- temporary service issue.

Do not expose stack traces, provider names, database errors or security-rule details.

## 12. Tests

- App killed during every sync state resumes without duplication or data loss.
- Network loss during media upload resumes from the acknowledged offset.
- Network loss after server commit but before client response resolves through idempotency/status lookup.
- Multiple manual sync taps create one complaint.
- Queue survives device restart and approved application upgrade migration.
- Worker projection excludes every internal/private field by snapshot and schema tests.
- Invalid reference and wrong secret remain indistinguishable.
- Feedback retries are idempotent and reopen atomically when applicable.
- Further-information response cannot attach another complaint's upload.
- Shared-device logout clears active access while preserving only approved local recovery data.

## 13. Deliverables

- Production mobile outbox and state machine.
- Sync coordinator and retry scheduler.
- Worker tracking and complaint APIs.
- Worker-safe server projections.
- Further-information and feedback workflows.
- Local schema migration and recovery logic.
- Offline/connectivity test harness and device test report.
- Worker support troubleshooting guide.

## 14. Exit criteria

- A complaint created offline reaches the server exactly once after reconnection.
- Every interruption point has a tested recovery outcome.
- Mobile clearly distinguishes local save from server receipt.
- Worker tracking works without exposing case existence to unauthenticated callers.
- Feedback and information requests operate against production data.
- No internal/private field is present in worker API schemas or recorded mobile diagnostics.

## 15. Non-goals

- No general worker social account/profile system.
- No peer-to-peer synchronization.
- No guarantee of continuous background execution beyond mobile OS capabilities.
- No SMS/push provider activation until Phase 08.

