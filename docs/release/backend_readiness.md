# Backend Readiness — Phase 2 Notes

**Product:** Kapas ki Pukaar  
**From:** Product Phase 1 frontend RC  
**Date:** 19 August 2026  
**Rule:** Do not implement a production backend in Phase 1. This file is notes only.

## Replaceable mock boundary

UI already follows: **screen → feature hook → service → repository → mock repository → dummy data**.

Phase 2 should swap implementations behind the existing contracts in `packages/mock-services` and `docs/09_Frontend_Technical_Architecture_and_Mock_Service_Contracts_v1.1.md`.

Do not rewrite screens to call HTTP directly.

## Services to replace first

| Contract | Phase 1 | Phase 2 |
|---|---|---|
| Complaint create / list mine | Local mobile repository | Worker API + auth |
| Case list / get / mutations | Local portal repository | PUWF case API + role auth |
| Analytics snapshot / CSV | Selectors on local rows | Aggregates or same formulas on server data |
| AI analysis | `@kapas/ai` deterministic simulation | Real STT/LLM behind the same `AIAnalysis` shape |
| Voice prompts | Bundled assets | Same URIs or CDN; keep offline prompts |
| Evidence | Local URIs | Object storage; keep original audio as source of truth |
| Demo service | Local flags + golden inject | Optional staff tools; never present as worker UX |

## Persistence keys

Keep `kkp:v1:*` only for drafts/offline/demo flags if a backend exists. Do not treat localStorage as the system of record in production.

## Auth and privacy

- Worker: still no mandatory registration for intake if the PRD remains voice-first and anonymous-capable.
- PUWF: real role = Grievance Manager only unless a CR adds roles.
- Anonymous mode must not send identity fields. Confidential contact rules stay in the domain layer.

## Sync

Phase 1 demo bridge is **not** a sync protocol. Phase 2 needs a real complaint ID issued by the server. Do not keep dual golden IDs as the production mechanism.

## What not to copy from Unified Workforce

No shared database, SSO, or API coupling in the first backend slice unless a signed CR says otherwise. Prior FOS learning only.

## Suggested first backend slice

1. Authenticated PUWF case read/write for the existing three portal pages  
2. Worker submit endpoint that stores audio + structured fields + privacy mode  
3. Replace mock AI last (keep assistive labels and safety floors)
