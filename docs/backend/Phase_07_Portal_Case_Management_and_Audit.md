# Phase 07 — Portal Case Management and Audit

**Phase objective:** Replace portal mock services with authorized production APIs and make every operational case action transactional, concurrency-safe and auditable.  
**Depends on:** Phases 03–06 complete.  
**Produces:** Real dashboard/list/detail data, case commands, evidence access, assignment, audit history and production-safe demo separation.

## 1. Portal integration boundary

Retain the existing React Query hooks and service abstraction. Introduce an HTTP-backed implementation rather than embedding fetch calls in pages/components.

Remove production dependencies on:

- browser/local mock repositories;
- automatic seed/reset behavior;
- hard-coded login success;
- golden scenario injection;
- client-side authoritative analytics;
- client-calculated lifecycle availability as the sole enforcement.

The server returns permitted actions for usability, but validates every command independently.

## 2. Case query APIs

```text
GET /api/v1/cases
GET /api/v1/cases/:id
GET /api/v1/cases/:id/available-actions
GET /api/v1/cases/:id/history
GET /api/v1/cases/:id/evidence
GET /api/v1/reference-data/locations
```

Case list supports bounded, server-side:

- cursor pagination;
- search by approved fields;
- status, priority, category and subcategory filters;
- province/district filters;
- date range;
- overdue/attention/reopened/new queues;
- assignment filters;
- deterministic sort order with stable tie-breaker.

Search must not inspect encrypted identity fields unless a separately authorized identity-search workflow exists.

## 3. Case commands

Implement command endpoints or a typed action endpoint for:

- start review;
- change priority with reason;
- add internal note;
- record contact attempt/result;
- request more information;
- add investigation finding;
- record action/referral;
- escalate;
- propose resolution;
- resolve;
- close;
- reopen;
- assign/reassign case;
- change worker visibility where policy permits.

Each command requires:

- permission check;
- current/expected version;
- validated input;
- lifecycle precondition;
- database transaction;
- case history record;
- security/business audit event;
- response containing the new version and safe updated projection.

## 4. Optimistic concurrency

The portal submits the version it loaded. If another actor modified the case:

- API returns `VERSION_CONFLICT`;
- no partial mutation occurs;
- UI explains that the case changed;
- UI reloads or presents a controlled comparison;
- typed staff input is preserved where safe so it can be reviewed and resubmitted;
- actions are never silently replayed against a new state.

Test conflicts between status, priority, note, assignment and resolution actions.

## 5. Worker visibility

Visibility is explicit per action. Defaults:

| Action | Default visibility |
|---|---|
| Internal note | Internal |
| Investigation finding | Internal |
| Priority change | Internal |
| Assignment change | Internal |
| More information requested | Worker-visible |
| Action taken | Policy-dependent, explicit |
| Escalation | Policy-dependent, explicit |
| Proposed resolution | Worker-visible |
| Resolved/closed/reopened | Worker-visible with safe wording |

The backend—not the portal—sets or validates allowed visibility. Tests compare staff and worker projections after every action type.

## 6. Sensitive identity access

Normal case detail shows only the minimum required masked indicator. Reveal uses a separate endpoint and UI action requiring:

- `identity.reveal` permission;
- recent reauthentication;
- a selected or entered reason;
- case/privacy eligibility;
- an audit event for attempt and outcome;
- no persistent browser caching;
- no inclusion in generic case-query caches.

Identity data must not be prefetched with ordinary case detail.

## 7. Evidence access

Evidence is streamed through an authorized API endpoint:

```text
GET /api/v1/cases/:caseId/evidence/:evidenceId/content
```

The service must:

- verify case and evidence relationship;
- require the appropriate view/download permission;
- enforce scan-approved and available state;
- decrypt as a stream;
- set safe content headers and `nosniff`;
- use attachment disposition unless an approved safe preview exists;
- avoid cacheable public URLs;
- log access outcome without logging file content/path;
- stop cleanly if the client disconnects.

Original voice playback uses the same protected access model and supports range requests only if encryption/storage implementation safely supports them.

## 8. Dashboard queues

Move queue definitions from client-only filtering into shared/server query semantics:

- attention;
- emergency/critical;
- overdue;
- awaiting worker information;
- new submissions;
- reopened;
- assigned to me/unassigned when assignment is enabled.

Queue counts and list results must derive from the same predicates and transaction snapshot where practical. The UI must not show a count that cannot reconcile with the resulting filter.

## 9. Assignment and ownership

If approved in Phase 01, support assignment with:

- current assignee;
- assignment history;
- permissioned assign/reassign commands;
- unassigned queue;
- optional supervisor-only override;
- no implicit denial of emergency visibility due solely to assignment;
- optimistic concurrency.

Do not implement hidden row ownership rules without product and incident-response review.

## 10. Audit viewer

Provide an authorized, paginated audit view for supervisors/auditors. It must distinguish:

- business case history shown in the workspace;
- security/access audit events;
- system processing events.

Audit exports and reads are themselves audited. Audit records are not editable through the application.

## 11. Demo separation

The production build must exclude or disable:

- `/demo` routes;
- scenario injection;
- local reset-to-seed actions;
- known demo credentials;
- simulated reconnect controls;
- synthetic-case generation against production.

If a demo environment is retained, it uses a separate database, storage root, credentials, encryption keys and hostname with visible non-production labeling.

## 12. Tests

- Filters, cursors, sorting and queue counts reconcile over representative data.
- All commands accept valid state and reject invalid lifecycle transitions.
- Unauthorized roles cannot mutate, reveal identity, download evidence or export.
- Concurrent commands generate a conflict, not a lost update.
- Every successful command writes exactly one coherent history/audit sequence.
- Worker-visible projection changes only when an approved visible action is recorded.
- Evidence requests reject wrong case IDs, unavailable scans and revoked sessions.
- Identity reveal is never part of ordinary cached case data.
- Production build cannot access demo routes or seed/reset operations.
- Portal loading, empty, forbidden, conflict, validation and dependency-error states are usable.

## 13. Deliverables

- Production portal API adapter.
- Paginated case list, detail and queue APIs.
- Transactional case command handlers.
- Assignment support if approved.
- Protected evidence/audio streaming.
- Sensitive identity reveal workflow.
- Audit viewer and permission model.
- Demo/production build separation.
- Portal integration and concurrency test suite.

## 14. Exit criteria

- Dashboard, complaints list and case workspace use production APIs exclusively in staging.
- Every existing case action works against PostgreSQL with authorization and audit.
- Worker/internal visibility tests pass for every action.
- Two staff users cannot silently overwrite each other.
- Evidence and identity access are permissioned and auditable.
- Demo tools are inaccessible in production configuration and artifacts.

## 15. Non-goals

- No full donor MIS or workforce-management expansion.
- No unrestricted administrator evidence access.
- No real-time collaborative editing requirement.
- No client-side direct database or filesystem access.

