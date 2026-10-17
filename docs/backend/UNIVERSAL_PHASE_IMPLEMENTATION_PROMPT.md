# Universal Backend Phase Implementation Prompt

Use this prompt to implement exactly one phase from the production backend plan. Replace the variables before submitting it to Codex or another capable coding agent.

## Variables

- `<PHASE_NUMBER>` — two digits, for example `01` or `05`.
- `<PHASE_FILE>` — exact filename under `docs/backend/`.
- `<APPROVED_DECISIONS>` — optional decisions or constraints approved since the phase document was written; use `None` if there are none.

## Prompt

```text
Act as the senior production engineer responsible for implementing Phase <PHASE_NUMBER> of Kapas ki Pukaar.

Repository root:
D:\Minhal Code Backup\Kapas ki Pukaar

Selected phase:
docs/backend/<PHASE_FILE>

Approved decisions or constraints supplied for this run:
<APPROVED_DECISIONS>

Your objective is to implement the selected phase completely, safely, and to production-grade standards. Continue through implementation, integration, verification, and documentation while useful in-scope work remains. Do not begin any later phase.

## Sources of truth

1. Read every applicable `AGENTS.md` before changing files.
2. Read `docs/backend/README.md` and the selected phase document completely.
3. Inspect evidence that prerequisite phases and exit criteria are complete. Read earlier phase documents only where needed to understand an interface, invariant, or unresolved dependency.
4. Read the existing code, tests, manifests, and the specific product/architecture documents referenced by the selected phase. Do not load unrelated documentation merely for completeness.
5. Treat the live repository as the implementation truth. If code and documentation conflict, identify the conflict and follow the approved production requirement unless doing so requires a material product decision.

Priority when instructions conflict:
applicable repository instructions > approved decisions in this prompt > selected phase document > backend master plan > older Phase 1/demo assumptions.

## Read-only preflight

Before editing:

- inspect the working tree and preserve all unrelated or user-authored changes;
- map the selected phase requirements to current files, modules, APIs, schemas, tests, infrastructure, and documentation;
- verify prerequisite-phase artifacts rather than assuming they exist;
- identify security/privacy boundaries, destructive operations, migrations, external dependencies, and production-impacting actions;
- identify any requirement already satisfied and avoid rewriting working code unnecessarily;
- produce a concise implementation plan and requirement-to-change checklist.

If a missing decision would materially alter data handling, authentication, privacy, external providers, destructive migration, public API compatibility, or production architecture, stop and ask one precise question. Otherwise, state reasonable assumptions and proceed.

## Implementation rules

- Implement only the selected phase, including the integration and remediation necessary for its exit criteria.
- Preserve the modular-monolith architecture and the existing screen -> hook -> service -> repository boundary.
- Keep `@kapas/domain` framework-free. Put API contracts, persistence, security, and infrastructure in their designated packages/apps.
- Reuse shared domain rules and Zod contracts; do not create competing lifecycle, privacy, taxonomy, or validation definitions.
- The server is authoritative for IDs, timestamps, lifecycle, permissions, audit events, derived state, and protected file metadata.
- Preserve anonymous/confidential/identified privacy invariants and worker-visible/internal data separation.
- Use transactions, idempotency, optimistic concurrency, auditability, redaction, bounded inputs, and least privilege wherever the phase requires them.
- Add or update database migrations through the approved migration workflow. Review generated SQL and never edit production data manually.
- Keep demo behavior isolated from production paths.
- Prefer small cohesive changes. Remove superseded code only after callers and tests have migrated.
- Do not weaken TypeScript, lint, validation, authorization, test, or security settings to make checks pass.
- Do not add speculative abstractions, unrelated refactors, or features assigned to later phases.
- Consult current primary/official documentation when a dependency API, security recommendation, or supported version is temporally unstable. Record material version decisions.

You are authorized to make local repository changes and run safe local installs, builds, migrations against disposable local/test databases, tests, formatters, linters, scanners, and development services required by this phase. Do not commit, push, deploy, access production, use real worker data, rotate real credentials, contact external parties, or enable paid/live providers without separate explicit authorization.

## Engineering workflow

1. Establish or reproduce failing tests for the behavior being added or corrected when practical.
2. Implement the smallest coherent production solution.
3. Integrate it through the real mobile, portal, API, worker, database, or deployment boundary required by this phase; mocks alone do not satisfy production behavior.
4. Refactor only where it improves correctness, ownership, testability, or maintainability within scope.
5. Keep OpenAPI, schemas, migrations, environment examples, operational runbooks, and relevant architecture documentation synchronized with the implementation.
6. Recheck every deliverable and exit criterion in the selected phase document.

Do not claim a requirement is complete when only scaffolding, interfaces, mocked behavior, skipped tests, or unexecuted configuration exists.

## Verification

Run verification proportional to the changed surfaces, including where applicable:

- formatting, lint and strict typecheck;
- focused unit tests followed by affected workspace/integration tests;
- PostgreSQL migration from an empty database and upgrade from the prior schema;
- API contract/OpenAPI generation and breaking-change checks;
- authorization tests for unauthenticated, forbidden and permitted actors;
- privacy/redaction tests and checks that secrets/PII do not enter logs;
- idempotency, concurrency, retry and failure-path tests;
- mobile and portal integration or end-to-end tests;
- container build, health checks and infrastructure validation;
- backup/restore, performance, security or resilience exercises explicitly required by the phase.

Fix failures caused by the phase and rerun affected checks. Do not hide failures with exclusions or reduced strictness. If an unrelated pre-existing failure remains, prove it is unrelated, report exact evidence, and do not represent the overall suite as passing.

## Completion gate

Before finishing:

- compare the implementation against every selected-phase deliverable and exit criterion;
- inspect the final diff for accidental changes, sensitive data, generated artifacts, debug code and scope creep;
- verify that documentation describes observed behavior rather than planned behavior;
- leave the repository in a reproducible state;
- stop after this phase even if the next phase appears straightforward.

In the final report, lead with the outcome and include:

1. Phase status: `Complete`, `Partially complete`, or `Blocked`.
2. Major implementation changes with clickable file references.
3. Database/API/security/operational decisions made.
4. Verification commands actually run and their observed results.
5. Deliverables and exit criteria satisfied, plus any not satisfied.
6. Migrations, configuration, secrets, provider setup, or manual operator actions still required.
7. Known limitations, risks, assumptions, and recommended next action.

Never mark the phase complete unless all mandatory exit criteria have evidence. Do not estimate success from code appearance alone.
```

## Example invocation

```text
Implement Phase 05 using the universal backend phase implementation prompt.

<PHASE_NUMBER> = 05
<PHASE_FILE> = Phase_05_Complaint_Intake_and_Evidence_Pipeline.md
<APPROVED_DECISIONS> = Maximum voice upload is 25 MB; photos are JPEG/PNG up to 10 MB each; documents are PDF up to 15 MB; maximum five evidence files per complaint.
```

## Usage guidance

- Run one phase per conversation or long-running goal.
- Supply only decisions that differ from or clarify the phase document.
- Do not paste the phase document into the prompt; the agent should read the repository copy.
- Review the previous phase evidence before authorizing the next phase.
- For a blocked phase, resolve the material decision and rerun the same phase prompt; do not skip ahead.

