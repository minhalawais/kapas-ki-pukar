# Phase 09 — Analytics, Reporting and Data Governance

**Phase objective:** Deliver reconciled operational analytics and controlled exports while implementing retention, deletion, legal-hold and data-quality governance.  
**Depends on:** Production case workflows and durable background processing.  
**Produces:** Server-side KPI calculations, analytics APIs, asynchronous exports, reconciliation controls, retention workflows and governance documentation.

## 1. Analytics principles

- Operational analytics derive from the same authoritative records used by case management.
- Every metric has a named owner, formula, time basis, inclusion/exclusion rules and test fixture.
- Aggregates do not expose workers or sensitive locations.
- Dashboard and export filters share canonical query semantics.
- Historical interpretation changes are versioned rather than silently rewriting prior reports.
- Analytics performance must not degrade complaint intake or case operations.

## 2. Canonical definitions

Create a KPI catalogue covering the existing product metrics, including:

- total complaints;
- open/active complaints;
- status distribution;
- priority distribution;
- emergency/critical cases;
- overdue cases;
- resolution rate;
- average/median time to first review;
- average/median resolution time;
- reopen rate;
- worker-confirmed positive resolution;
- category/subcategory trends;
- province/district distribution at approved granularity;
- group-impact distribution;
- AI failure/low-confidence/human-review rates where operationally useful.

For each KPI define numerator, denominator, terminal/open statuses, date field used, timezone, null behavior, privacy suppression and rounding.

## 3. Time semantics

- Store and calculate in UTC.
- Accept explicit reporting timezone only from an allowlisted configuration.
- Define whether date filtering uses submitted, updated, resolved or action time per metric.
- Use half-open ranges `[from, to)` to avoid double counting.
- Make current/open metrics distinguishable from period-created and period-resolved metrics.
- SLA duration rules specify calendar versus business time before implementation.

## 4. Analytics architecture

Start with indexed PostgreSQL queries and reviewed SQL views. Introduce materialized views only when measured query plans justify them.

Recommended layers:

- canonical filtered complaint fact query;
- KPI query functions/views;
- bounded breakdown queries;
- analytics response mapper;
- reconciliation tests against known fixture sets.

Do not maintain a separate analytics database on the initial single-VPS deployment.

## 5. API surface

```text
GET  /api/v1/analytics/summary
GET  /api/v1/analytics/breakdowns
GET  /api/v1/analytics/trends
POST /api/v1/exports
GET  /api/v1/exports/:id
GET  /api/v1/exports/:id/content
```

Filters include approved date range, status, priority, category/subcategory and safe geographic levels. The server enforces maximum date span, grouping cardinality and response size.

## 6. Privacy controls

- Exclude direct identifiers, contact details, exact coordinates, transcripts and evidence metadata from aggregate queries.
- Suppress or combine small geographic/category cells according to the approved disclosure threshold.
- Prevent cross-filtering that can trivially isolate one sensitive complaint.
- Sensitive category reporting may require higher permission or coarser grouping.
- Worker identity never appears in standard CSV exports.
- Analytics logs record query shape, actor and outcome, not returned sensitive values.

## 7. Export workflow

Exports are asynchronous background jobs:

1. Authorized staff submits filters, fields, purpose and format.
2. API validates permission and disclosure rules.
3. Database stores export request and audit event.
4. Worker reads through a bounded cursor/stream.
5. Output is generated in a protected temporary location.
6. File is encrypted at rest and given a short expiry.
7. Requester downloads through an authorized endpoint.
8. Download is audited.
9. Temporary export is deleted at expiry.

CSV generation must prevent spreadsheet formula injection by neutralizing values beginning with dangerous formula prefixes. Exports use stable UTF-8 encoding and documented columns.

## 8. Data quality

Implement quality checks for:

- invalid/missing taxonomy relationships;
- impossible lifecycle timing;
- resolution without required history;
- evidence/database mismatches;
- missing initial action;
- stale outbox/job state;
- coordinate range and location hierarchy mismatch;
- inconsistent worker feedback and status;
- duplicate reference/idempotency anomalies.

Quality findings produce operational reports or alerts; they do not silently mutate records.

## 9. Retention schedule

Before production, product/legal/data owners must approve a retention matrix for:

- complaint operational facts;
- private identity/contact data;
- original evidence and voice;
- derived previews/transcripts/AI outputs;
- audit and security logs;
- sessions and authentication events;
- idempotency records;
- notification delivery records;
- generated exports;
- database and filesystem backups.

Each class defines retention trigger, duration, legal-hold exception, deletion/anonymization method, approver and evidence of completion.

## 10. Deletion and anonymization

- Destructive retention work runs from reviewed policies, not arbitrary staff UI buttons.
- Legal hold blocks deletion for in-scope records.
- Deletion is staged, idempotent and auditable.
- Evidence deletion removes ciphertext, derived files and database availability while preserving only approved tombstone/audit metadata.
- Identity erasure must not corrupt non-identifying case/accountability records.
- Backups expire under their own schedule; do not promise immediate removal from immutable backup sets if technically impossible.
- Restored backups must reapply post-backup deletion/hold journals before service is returned to users.

## 11. Data subject/worker access process

Document a human-reviewed process for requests to access, correct or delete data where applicable. Anonymous workers may be unable to prove ownership beyond their tracking credential; staff must not weaken confidentiality to satisfy an unverifiable request.

Record request, verification basis, decision, actions and completion without placing excessive sensitive information into the request log.

## 12. Portal integration

Replace client-derived analytics with API responses while retaining presentation formatting in the portal.

- Query keys include canonical filters.
- Charts show server-provided values and explicit empty states.
- Filters and exports use the same serialized contract.
- UI displays metric definitions/tooltips from approved metadata.
- Data-management page exposes only permissioned operational controls, never raw database actions.
- Demo reset/generation remains absent from production.

## 13. Performance and load controls

- Verify query plans at expected one- and three-year data volumes.
- Bound date ranges, breakdown cardinality and export size.
- Stream exports rather than accumulating full files in memory.
- Use statement timeouts for analytics queries.
- Apply separate worker concurrency for exports.
- Consider a read replica or dedicated analytics store only after measured need and architecture review.

## 14. Tests

- Every KPI reconciles to hand-verified golden fixtures.
- Summary totals reconcile with filtered case counts under the same semantics.
- Timezone/date-boundary and reopened-case scenarios are covered.
- Small-cell suppression prevents approved re-identification cases.
- Unauthorized roles cannot create/download exports.
- Export content excludes private fields and neutralizes CSV formulas.
- Expired exports are unavailable and deleted.
- Retention job respects legal hold and is idempotent.
- Restore/deletion journal procedure is rehearsed.
- Representative analytics queries meet approved plans/latency targets.

## 15. Deliverables

- KPI dictionary and ownership register.
- Analytics query layer and APIs.
- Portal analytics integration.
- Asynchronous export service and secure download.
- Data-quality checks and dashboard/report.
- Approved retention/legal-hold/deletion policy implementation.
- Data request and governance runbooks.
- Analytics reconciliation and performance report.

## 16. Exit criteria

- Dashboard metrics and exports reconcile against authoritative fixtures.
- No standard analytics/export path reveals direct identity or exact coordinates.
- Export lifecycle is permissioned, audited and automatically cleaned.
- Retention and legal-hold behavior is approved and tested.
- Analytics load does not breach operational API objectives at the agreed capacity.
- Production data-management UI contains no uncontrolled reset/delete mechanism.

## 17. Non-goals

- No unrestricted self-service query builder.
- No donor warehouse or cross-organization data lake.
- No exact-location public visualization.
- No permanent generated export archive.

