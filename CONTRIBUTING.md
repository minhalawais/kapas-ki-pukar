# Contributing — Kapas ki Pukaar

Product Phase 1 is frontend-only. Read `docs/project/scope_matrix.md` and `docs/prompts/KAPAS_TASK_IMPLEMENTATION_PROMPT.md` before writing code.

## Before you start a task

1. Use the universal implementation prompt.
2. Read the matching phase guide under `docs/Phases Implementatoin Plan/`.
3. Apply design from the files the prompt lists. Do not paste a new palette into components.
4. Map work to FRS IDs in `docs/project/requirements_traceability.csv`.

## Branch naming

```text
feat/<phase>-<short-slug>
fix/<phase>-<short-slug>
chore/<phase>-<short-slug>
docs/<phase>-<short-slug>
```

Examples: `feat/04-mobile-home`, `fix/10-lifecycle-guard`.

## Commits

Conventional commits:

```text
feat(mobile): persist language selection
fix(portal): reconcile overdue KPI with repository
docs(phase-00): add scope matrix
```

Do not commit secrets. Do not commit production credentials. Dummy data must remain fictional.

## Pull requests

Use `.github/PULL_REQUEST_TEMPLATE.md`.

Required:

- Linked FRS IDs and screen IDs
- Phase number (00–13)
- Confirmation that UI goes through services, not raw dummy arrays
- Confirmation that strings use locale keys
- At least one reviewer (Technical Owner or delegate)

## Code rules

- TypeScript strict; no implicit `any`
- Lint and unit tests must pass before merge
- Shared `packages/*` must not import React Native or Next.js
- No second component library
- No Product Phase 2 backend packages unless an approved CR exists

## Reviews

Every PR that changes UI, domain types, taxonomy, lifecycle, tokens, locale keys or mock contracts needs a code review. Changes to those shared contracts require regression of consuming screens.

## Change control

Material scope changes use `docs/project/change_request_template.md`.
