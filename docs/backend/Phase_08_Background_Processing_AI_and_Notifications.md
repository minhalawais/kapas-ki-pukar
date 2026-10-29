# Phase 08 — Background Processing, AI and Notifications

**Phase objective:** Implement durable asynchronous processing for scanning follow-up, AI assistance, notifications, exports and scheduled maintenance without coupling complaint acceptance to external providers.  
**Depends on:** Production intake, worker tracking and portal case management.  
**Produces:** Transactional outbox dispatcher, BullMQ workers, AI provider boundary, notification adapters, retries, provenance and operational controls.

## 1. Asynchronous processing model

PostgreSQL records durable intent in `outbox_events` in the same transaction as the business change. A dispatcher publishes pending events to BullMQ. Workers process jobs and record durable outcomes back in PostgreSQL.

Redis improves scheduling and execution but is not the only record that work is required. Redis loss must not erase committed business intent.

## 2. Event and job catalogue

Define versioned event types such as:

- `complaint.submitted.v1`;
- `evidence.scan.requested.v1`;
- `ai.analysis.requested.v1`;
- `worker.notification.requested.v1`;
- `case.information-requested.v1`;
- `case.resolution-proposed.v1`;
- `case.status-changed.v1`;
- `export.requested.v1`;
- `retention.review-due.v1`;
- `storage.integrity-check.requested.v1`.

Event payloads contain identifiers and bounded metadata, not full transcripts, evidence bytes, tracking secrets or decrypted identities.

## 3. Transactional outbox

The dispatcher must:

- claim records safely across restarts;
- publish with deterministic job IDs that support deduplication;
- track attempts and timestamps;
- retry transient Redis errors;
- recover records left in an intermediate state;
- avoid permanently marking delivery until queue acknowledgement;
- expose backlog age/count metrics;
- retain enough history for diagnosis under the approved retention policy.

Consumers must still be idempotent because at-least-once delivery is expected.

## 4. Queue design

Use separate queues or controlled concurrency classes for:

- media scanning/post-processing;
- AI transcription/translation/analysis;
- notifications;
- exports;
- maintenance and integrity jobs.

Configure:

- exponential backoff with jitter;
- maximum attempts per failure category;
- timeouts and cancellation/abort handling;
- bounded concurrency based on VPS resources;
- job retention limits;
- terminal failure/dead-letter recording;
- priority only where it does not starve ordinary cases;
- graceful worker shutdown.

Permanent validation, permission and unsupported-media failures are not retried indefinitely.

## 5. AI provider interface

Implement provider-neutral interfaces matching approved domain outputs:

- transcription;
- translation;
- classification;
- summarization;
- structured fact extraction;
- priority suggestion.

The provider adapter must support:

- timeout and cancellation;
- bounded retries;
- provider/model configuration;
- request redaction/minimization;
- structured output validation;
- token/cost and latency metadata;
- failure mapping;
- a deterministic fake provider for tests;
- provider disablement without blocking complaint submission.

Do not bind the database schema or UI directly to one vendor response format.

## 6. AI processing pipeline

1. Complaint and clean original voice/evidence already exist.
2. Policy engine decides whether processing is permitted.
3. Worker creates an `ai_analysis_run` in pending state.
4. Input is minimized and decrypted only for the duration required.
5. Provider performs approved operations.
6. Output is schema-validated and safety-bounded.
7. Deterministic priority floors are applied after AI suggestions.
8. Result and provenance are stored as a new immutable run.
9. Case receives a system action indicating availability/failure where useful.
10. Portal queries show the latest eligible result and human-review requirement.

The original voice remains authoritative. AI failure leaves the complaint fully operable.

## 7. AI safety and governance

- Never send CNIC, tracking secret, staff credentials or unnecessary contact details to AI providers.
- Do not send raw evidence unless separately approved for that media type and purpose.
- Treat transcript/document contents as untrusted data, not instructions.
- Version prompts and preprocessing logic.
- Record provider, model, region if known, prompt version, input hash, timestamps, confidence and warnings.
- Require human review for low confidence, failed/partial output and sensitive categories.
- AI cannot close, suppress or downgrade safety priority below deterministic rules.
- Staff corrections are recorded separately; do not erase the original model output.
- Define provider retention/no-training requirements before production activation.

## 8. Notification service

Use a provider-neutral push-notification adapter. Notification intent is stored durably before delivery.

Store:

- template ID/version and locale;
- channel;
- encrypted destination reference or provider-safe token reference;
- reason/business event;
- attempt history;
- provider message ID;
- accepted/delivered/failed/unknown state;
- consent/contact-safety state used at send time.

Do not treat provider acceptance as confirmed human delivery.

## 9. Notification privacy

- Respect `contactAllowed`, safe channel and safe time preferences.
- Anonymous complaints without contact data receive no external notification.
- Lock-screen/push text must not identify complaint category or sensitive allegation.
- Push text must use neutral wording and direct the worker to secure tracking.
- Opt-out/withdrawn consent stops future optional messages.
- Contact destinations are never written to ordinary job logs.
- Templates are reviewed in every supported locale for privacy and comprehension.

## 10. Provider webhooks

Webhook endpoints must:

- verify provider signatures using raw request bytes where required;
- enforce timestamp/replay windows;
- deduplicate provider event IDs;
- map only valid state transitions;
- respond quickly and process asynchronously;
- log bounded metadata;
- not expose internal resource existence through verbose errors.

## 11. Scheduled jobs

Implement schedules for:

- outbox recovery;
- abandoned-upload cleanup;
- temporary decrypted/export file cleanup;
- notification retry/reconciliation;
- overdue/SLA recalculation or query maintenance where needed;
- retention review;
- storage/database integrity reconciliation;
- session and idempotency record cleanup;
- operational summaries.

Schedules must use a distributed/single-leader lock even on one VPS so restarts or future replicas do not double-run destructive work.

## 12. Observability

Metrics include:

- queue depth and oldest job age;
- outbox backlog;
- success/retry/final-failure counts by job type;
- AI latency, failure and human-review rates;
- provider request volume/cost where available;
- notification accepted/delivered/failed/unknown rates;
- worker memory/CPU and event-loop delay;
- cleanup and integrity-job outcomes.

Alerts prioritize age and terminal failure, not only queue length.

## 13. Tests

- Redis loss after business commit is recovered from the outbox.
- Duplicate delivery produces one effective side effect.
- Worker crash before/after provider call has a defined idempotent recovery.
- Provider timeout, malformed output and rate limit are classified correctly.
- AI cannot lower deterministic emergency/critical floors.
- Sensitive fields are absent from AI requests, notification payloads and logs.
- Low-confidence and failure states remain usable in the portal.
- Notification consent/contact-safety rules block unsafe sends.
- Forged and replayed webhooks are rejected.
- Scheduled cleanup never deletes active evidence or unexpired exports.

## 14. Deliverables

- Transactional outbox publisher and recovery loop.
- BullMQ queue/worker modules and job catalogue.
- AI provider interface, test provider and one approved production adapter.
- AI provenance and human-review workflow.
- Push notification adapter, templates and webhook handling.
- Scheduled maintenance jobs.
- Queue/provider dashboards and runbooks.
- Data-processing approval record for each external provider.

## 15. Exit criteria

- Committed jobs survive API/worker/Redis restarts.
- AI failure never blocks intake or case management.
- All AI output is traceable to a provider/model/prompt/input hash and review state.
- Notification content and routing pass privacy review.
- Queue backlogs, terminal failures and provider health are observable.
- Operators can safely retry or abandon a failed job without duplicating business effects.

## 16. Non-goals

- No autonomous case decisions.
- No unapproved provider receives live complaint content.
- No GPU model hosting requirement on the application VPS.
- No guarantee of SMS delivery where the provider/network cannot supply it.

