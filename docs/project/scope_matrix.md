# Scope Matrix — Product Phase 1 Frontend

**Status:** Frozen for implementation  
**Date:** 19 August 2026  
**Sources:** PRD v1.1, FRS v1.1, End-to-End Plan v1.1, Phase 00 guide

## Mandatory Phase 1 statements

- Standalone Kapas product.
- No runtime/API/database/auth integration with the PUWF Unified Workforce & Digital Operations Platform.
- One complainant mobile role.
- One PUWF web role (Grievance Manager).
- 2–3 primary portal pages: Dashboard + Complaints; Complaint Detail / Case Workspace; Analytics & Reports.
- Frontend dummy data only.
- Real local microphone recording and playback.
- Simulated AI (STT, translation, classification, summary).
- Deterministic demo scenario bridge. Not live cross-device sync.

## In scope — Product Phase 1 frontend

### Mobile (complainant)

- Splash, language, welcome, home.
- Urdu-first RTL; English alternate.
- One-question-at-a-time grievance intake for approved categories.
- Real record / stop / play / delete / re-record.
- Bundled Urdu voice prompts (offline).
- Privacy: Anonymous, Confidential, Identified.
- Optional evidence picker; optional safe-contact (Should-Have).
- Simulated AI processing and worker confirmation.
- Local submission, `KP-26-######` reference, tracking, timeline.
- Rights & Help (Should-Have topics; Must-Have plain language).
- Draft persistence; simulated offline queue (Should-Have).
- Hidden demo controls.

### PUWF portal

- One operational role.
- Dashboard + complaint table (search, filter, sort, pagination).
- KPIs derived from repository: Total, New, Critical, In Progress, Overdue, Resolved.
- Case workspace: original audio, transcript, assistive AI, timeline, actions, lifecycle enforcement.
- Analytics from the same dataset; CSV export (Should-Have).
- Local persistence and Reset Demo Data.
- Hidden `/demo` control panel.

### Shared

- Domain types, Zod, mock services, 150–200 seed complaints, 10 golden scenarios.
- Design tokens per doc 06.
- Loading / empty / error states.
- WCAG AA-oriented practice.

## Out of scope — backend / production (Product Phase 2 unless CR)

- NestJS, production REST, PostgreSQL or other server database.
- Real worker login, PUWF authentication, OTP, live SMS, WhatsApp, push.
- Production Whisper, LLM, TTS, AI safety layer.
- Cloud object storage, production encryption, server-side RBAC, production audit.
- Integration with Unified Workforce & Digital Operations Platform.
- Real cross-device synchronisation.
- Government portal, union portal, multi-role RBAC.
- Legal case management beyond the agreed grievance workflow.
- Production hosting architecture.

## Future — Product Phase 2+

- Replace mock repositories with REST.
- Production AI inference with the same UI contracts.
- Live notifications.
- Additional languages (Saraiki, Sindhi, Balochi) — architecture may reserve locale files.
- Additional PUWF roles only via change request.
- Map visualisation (Could-Have; default in Phase 1 is district/area picker).

## Open questions (non-blocking for Phase 2 repo)

| ID | Question | Owner | Needed by |
|---|---|---|---|
| OQ-001 | Named persons for governance roles | Product Owner | Phase 0 exit sign-off |
| OQ-002 | Figma file URL matching `docs/design/tokens` names | UI/UX Owner | Before feature UI polish; coding may use `docs/design/` (DEC-017) |
| OQ-003 | Official ILO brand blue if partner lockup is used | Product Owner | Splash/about lockup |
| OQ-004 | Mobile E2E tool (Maestro vs Detox vs other) | Technical Owner | Implementation Phase 4 |
| OQ-005 | Gender in analytics for ANON cases | Product Owner | Implementation Phase 11 |

None of the above blocks creating the monorepo in Implementation Phase 2.
