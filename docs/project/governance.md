# Project Governance

**Product:** Kapas ki Pukaar  
**Prepared for:** Pakistan United Workers Federation (PUWF)  
**Technical Partner:** Fruit of Sustainability (FOS)  
**Date:** 19 August 2026  
**Status:** Phase 0 baseline

## Owners

| Role | Organisation | Named person | Notes |
|---|---|---|---|
| Product Owner | FOS | TBD | Scope, backlog priority, CR approval |
| Technical Owner | FOS Frontend/Software Lead | TBD | Architecture, phase exit, TypeScript/CI |
| Operational Reviewer | PUWF | TBD | Grievance workflow, UAT, field language |
| UI/UX Owner | FOS | TBD | Design system, Figma, visual QA |
| QA Owner | FOS | TBD | Traceability tests, UAT pack |
| Urdu / Content Reviewer | FOS / PUWF | TBD | Worker copy, audio scripts, RTL |

Named persons are to be filled at the Phase 0 exit review. Role titles are frozen.

## Approval gates

| Gate | Required before | Approver |
|---|---|---|
| Phase 0 exit | Phase 1 design / Phase 2 repo | Product Owner + Technical Owner |
| Design system (Impl. Phase 1) | Feature UI coding | UI/UX Owner |
| Implementation phase exit | Next implementation phase | Technical Owner |
| Sprint demo | External PUWF/ILO showing | Product Owner |
| UAT (Impl. Phase 13) | Frontend v1.0 tag | PUWF Operational Reviewer + FOS Product Owner |

## Workflow

```text
Backlog → Ready for Design → Design Approved → Ready for Development
→ In Development → Code Review → QA → UAT Ready → Done
```

## Rules

- One Product Owner. Scope changes use `change_request_template.md`.
- Implementation follows `docs/prompts/KAPAS_TASK_IMPLEMENTATION_PROMPT.md`.
- Design and styling come from referenced files, not from agent memory.
- Product Phase 2 (backend) is a change request unless separately contracted.
