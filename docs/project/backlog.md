# Implementation Backlog Structure

Tickets live in Jira or GitHub Issues. This file freezes **epics** and the required ticket fields.

## Epics

| Epic | Implementation phases | Notes |
|---|---|---|
| GOV-BASELINE | 00 | This folder. No app code. |
| DESIGN-SYSTEM | 01 | Figma + tokens. Gate for UI. |
| FOUNDATION | 02 | Monorepo, CI, shells. |
| DOMAIN-DATA | 03 | Types, seed, mock services. |
| MOBILE-FOUNDATION | 04 | Splash, language, home, RTL. |
| MOBILE-GRIEVANCE | 05 | Workflow engine, categories. |
| MOBILE-VOICE | 06 | Real audio, prompts. |
| MOBILE-AI | 06 | MockAIService, confirmation. |
| MOBILE-TRACKING | 07 | Submit, list, detail, feedback. |
| MOBILE-RIGHTS | 07 | Rights library. |
| MOBILE-OFFLINE | 08 | Queue, banners, restore. |
| WEB-DASHBOARD | 09 | KPIs, table, filters. |
| WEB-CASE | 10 | Workspace, lifecycle actions. |
| WEB-ANALYTICS | 11 | Charts, CSV. |
| DEMO-ORCHESTRATION | 12 | Hidden panel, GS bridge. |
| QA-ACCESSIBILITY | 13 | Regression, UAT, tag. |

Should-Have FRS items stay in these epics but are lower priority than Must-Have rows in `requirements_traceability.csv`.

## Required ticket fields

Every implementation ticket must include:

- FRS requirement IDs
- Screen IDs (from IA)
- Design link (Figma, when OQ-002 is filled)
- Acceptance criteria copied or cited from FRS
- Test notes / intended QA ID
- Dependencies (phase/epic)
- Surface: mobile | puwf-portal | shared-package

## Priority inside an epic

1. FRS priority **M**  
2. FRS priority **S**  
3. FRS priority **C**  

Do not schedule Product Phase 2 backend tickets in this backlog.
