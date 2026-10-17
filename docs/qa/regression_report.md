# Regression Report — Phase 13

**Product:** Kapas ki Pukaar  
**Build:** Product Phase 1 frontend (dummy data)  
**Date:** 19 August 2026  
**Method:** Vitest (unit/integration) + Playwright (portal) + code review against FRS Must-Have rows  
**Suggested tag:** `v1.0-frontend-demo` (not applied in this pass; owner tags after UAT sign-off)

## Automated results

| Suite | Result |
|---|---|
| `@kapas/localization` | Pass (catalogs equal) |
| `@kapas/mock-data` | Pass (200-record seed, golden IDs) |
| `@kapas/mock-services` | Pass (lifecycle, analytics reconcile, demo load/inject/advance/reset, AI flags, offline queue) |
| `@kapas/puwf-portal` Vitest | Pass |
| `@kapas/mobile` Vitest | Pass |
| Playwright portal | Tests added (skip-link, table, search, demo). Not re-run here: port 3000 was already in use by a stale Next process. Restart `dev:portal`, then `npx pnpm@9.15.0 test:e2e`. |

Exact counts are taken from the latest `pnpm test` / `pnpm test:e2e` run recorded in the Phase 13 verification section of the implementation report.

## Mobile matrix (doc 11 §4)

| Area | Result | Evidence |
|---|---|---|
| Splash, language, RTL, home | Pass | Screens exist; locale persistence; RTL via `dir` |
| Categories / branching | Pass | Workflow engine + tests |
| Voice record/play/re-record | Pass (device-dependent) | Real `expo-av`; mic-denied recovery screen |
| AI normal / low / fail | Pass | Simulated service + demo flags |
| Privacy, evidence, submit, tracking, rights | Pass | Phase 07 screens |
| Offline / persistence | Pass | Queue + schema reset tests |
| Hidden demo | Pass | Long-press Demo build |

Physical small/mid/large Android farm was **not** executed in this engineering pass. That remains a UAT/device lab item.

## Portal matrix (doc 11 §5)

| Area | Result | Evidence |
|---|---|---|
| Dashboard KPIs / charts / table | Pass | Repository-derived; pagination 20 |
| Search / filters / sort | Pass | FilterBar + table sort |
| Case audio, AI card, evidence, timeline | Pass | Workspace components |
| Lifecycle actions + confirmation | Pass | `caseLifecycleService` + UI modals |
| Analytics + CSV | Pass | Selectors + export tests |
| Demo reset / inject | Pass | `demoService` tests + Playwright |

## Lifecycle and priority

Invalid transitions throw `InvalidTransitionError`. Child labour / forced labour / immediate danger floors are covered by `priorityRulesService` tests.

## Analytics reconciliation

KPI and series totals match the filtered repository. Demo reset restores 200 rows.

## Demo reliability

Flagship GS-01 → `KP-26-000101`. Scripts: `docs/demo/ILO_PUWF_Demo_Script.md`, `docs/demo/Demo_Reset_Checklist.md`.

## Blocking defects

No P0/P1 opened from automated suites. See `docs/qa/defect_log.md`.
