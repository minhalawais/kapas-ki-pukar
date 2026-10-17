# 12 — Frontend Development Roadmap + Sprint Plan

**Document ID:** KKP-ROAD-012  
**Product:** Kapas ki Pukaar — Voice-Enabled Smart Grievance Reporting Application for Cotton Farm Workers  
**Prepared for:** Pakistan United Workers Federation (PUWF)  
**Technical Partner:** Fruit of Sustainability (FOS)  
**Version:** 1.1  
**Date:** 19 August 2026  
**Status:** Frontend Development Baseline  
**Phase:** Phase 1 — Complete Frontend with Dummy Data  
**Purpose:** Provide the phased delivery sequence, sprint plan, dependencies, quality gates and milestone structure for complete frontend implementation.

**Revision Note:** v1.1 updates the product visual identity to a balanced FOS + PUWF + Kapas system with neutral surfaces dominant, PUWF green used as an institutional anchor, FOS teal used for voice/AI/technology, Kapas green used selectively for primary actions and Cotton Gold used for agricultural highlights. It explicitly prohibits green-heavy page composition.

---

## 1. Document Context

Kapas ki Pukaar is being developed as a **standalone product**. It has no runtime, database, API or authentication integration with the PUWF Unified Workforce & Digital Operations Platform. The existing PUWF platform may be used only as a reference for prior FOS learning on worker-centred grievance design, Urdu/RTL interfaces and grievance-management patterns.

The current delivery phase is **frontend only**. It must provide a complete, realistic and testable product experience using dummy/local data. Real production backend services, a production database, server-side authentication, live SMS, production AI inference and cloud infrastructure are explicitly outside this phase.

The Phase 1 experience must nevertheless feel complete from the user perspective:
- mobile microphone recording and audio playback are functional;
- Urdu voice prompts are bundled locally and playable;
- AI transcription, categorisation, summarisation and translation are simulated through deterministic frontend services and curated scenarios;
- grievance workflows, branching, validation, case actions, analytics and local persistence are fully functional in the frontend;
- the PUWF portal is intentionally lean, with one operational role and 2–3 primary work pages;
- all architecture is designed so the mock service layer can later be replaced by real backend APIs without rewriting the UI.

---

## 2. Delivery Strategy

The work should be delivered as a structured frontend product programme, not a page-by-page coding exercise.

Recommended total duration:
**10–14 weeks**, depending on team size and parallelisation.

Recommended team:
- Product/Project Lead — 1
- UI/UX Designer — 1
- Frontend Tech Lead — 1
- React Native Developer — 1–2
- Next.js Developer — 1–2
- QA Engineer — 1
- Urdu/content reviewer — part-time

## 3. Development Phases

### Phase 0 — Scope Freeze
Duration: 2–3 days

Outputs:
- PRD baseline;
- FRS baseline;
- screen inventory;
- lifecycle/taxonomy approval;
- explicit Phase 1 exclusions.

Gate:
No serious feature development before scope baseline.

### Phase 1 — Design System & UX Architecture
Duration: 4–5 days

Outputs:
- Figma system;
- balanced FOS + PUWF + Kapas colour-role system;
- explicit anti-green-heavy composition rules;
- typography;
- mobile components;
- web components;
- RTL patterns;
- high-fidelity core screens.

Gate:
Approved design language.

**Visual identity review gate:** a representative mobile home, voice screen, AI summary screen and PUWF dashboard must demonstrate the v1.1 balance: neutral surfaces dominant, PUWF green institutional, FOS teal technological, Kapas green selective and Cotton Gold secondary.

### Phase 2 — Technical Foundation
Duration: 3–4 days

Outputs:
- monorepo;
- mobile shell;
- web shell;
- shared packages;
- lint/type/test setup;
- routing;
- design tokens.

Gate:
Both apps build and run.

### Phase 3 — Domain, Dummy Data & Mock Services
Duration: 4–5 days

Outputs:
- domain types;
- Zod schemas;
- seed generator;
- complaint repository;
- mock services;
- golden scenarios;
- reset function.

Gate:
Seed data powers basic test screens.

### Phase 4 — Mobile Shell & Localization
Duration: 4–5 days

Outputs:
- splash;
- language;
- welcome;
- home;
- Urdu RTL;
- prompt playback infrastructure.

Gate:
Worker reaches Report a Problem without guidance.

### Phase 5 — Grievance Conversation
Duration: 7–10 days

Outputs:
- categories;
- branching;
- timing;
- location;
- group impact;
- danger;
- privacy;
- contact;
- evidence;
- review.

Gate:
Every main grievance category reaches review.

### Phase 6 — Voice & AI Simulation
Duration: 5–7 days

Outputs:
- microphone;
- record/play/delete;
- bundled prompts;
- mock transcription;
- classification;
- summary;
- confidence;
- AI failure;
- priority reconciliation.

Gate:
At least 10 scenario-aware outputs pass.

### Phase 7 — Submission, Tracking & Rights
Duration: 5–6 days

Outputs:
- submission;
- local references;
- complaint list;
- tracking;
- resolution feedback;
- rights content;
- offline simulation.

Gate:
Worker experience complete.

### Phase 8 — PUWF Dashboard
Duration: 6–8 days

Outputs:
- KPIs;
- charts;
- complaint table;
- search;
- filters;
- pagination;
- local persistence.

Gate:
Dashboard values reconcile with seed.

### Phase 9 — Case Workspace
Duration: 7–10 days

Outputs:
- case header;
- audio;
- transcript;
- AI card;
- evidence;
- timeline;
- all PUWF actions;
- lifecycle enforcement.

Gate:
New → Review → Action → Resolution → Closed works.

### Phase 10 — Analytics & Reports
Duration: 4–6 days

Outputs:
- filters;
- trend analytics;
- location/category/priority/status;
- worker feedback;
- CSV export.

Gate:
Analytics reconcile after case mutations.

### Phase 11 — Demo Orchestration
Duration: 3–4 days

Outputs:
- demo panel;
- reset;
- load scenario;
- inject complaint;
- AI failure/delay;
- offline;
- case advancement.

Gate:
Five official demo journeys repeat successfully.

### Phase 12 — QA, Accessibility & Optimisation
Duration: 7–10 days

Outputs:
- regression;
- RTL;
- accessibility;
- responsive;
- performance;
- defect closure.

Gate:
Release Candidate.

### Phase 13 — UAT & Handover
Duration: 3–5 days

Outputs:
- PUWF UAT;
- accepted fixes;
- documentation;
- backend-ready handover.

Gate:
Frontend v1.0 sign-off.

## 4. Suggested Sprint Plan

Assuming two-week sprints:

### Sprint 1 — Foundation
- architecture;
- monorepo;
- design system;
- localization skeleton;
- seed domain.

### Sprint 2 — Mobile Core
- home;
- grievance entry;
- category cards;
- main question framework;
- persistence.

### Sprint 3 — Mobile Advanced
- category branches;
- voice;
- privacy;
- evidence;
- AI simulation.

### Sprint 4 — Mobile Completion + Web Foundation
- submission;
- tracking;
- rights;
- offline;
- web shell;
- dashboard foundation.

### Sprint 5 — PUWF Operations
- table;
- case workspace;
- actions;
- timeline;
- audio/AI cards.

### Sprint 6 — Analytics + Demo
- analytics;
- export;
- demo controls;
- scenario bridge;
- reset.

### Sprint 7 — QA/UAT
- regression;
- RTL;
- accessibility;
- optimisation;
- PUWF UAT;
- release.

## 5. Workstream Dependencies

### Mobile depends on:
- taxonomy;
- decision trees;
- Urdu copy;
- audio scripts;
- design system.

### Web depends on:
- lifecycle;
- dummy data;
- action types;
- analytics definitions.

### AI simulation depends on:
- taxonomy;
- golden scenarios;
- priority rules.

### Analytics depends on:
- canonical domain;
- lifecycle timestamps;
- data generator.

## 6. Milestones for PUWF/ILO

### Milestone 1 — Product & UX Blueprint
Approved flows and design.

### Milestone 2 — Worker App Functional
Complete worker complaint journey.

### Milestone 3 — PUWF Portal Functional
Dashboard + case actions + analytics.

### Milestone 4 — End-to-End Frontend Demo
Worker scenario → PUWF case → resolution/tracking story.

## 7. Sprint Ceremonies

Recommended:
- sprint planning;
- daily 10–15 minute developer sync;
- mid-sprint design/QA review;
- weekly stakeholder demo;
- sprint review;
- defect triage;
- scope-change log.

## 8. Branching and Release Strategy

Example:
- `main`
- `develop`
- feature branches
- release tags `v0.x`
- `v1.0-rc`
- `v1.0`

Require PR review before merge.

## 9. Quality Gates Per Sprint

No sprint story is complete without:
- design match;
- localisation;
- mock service;
- validation;
- error/loading;
- QA test;
- review.

## 10. Scope Control

Any request that introduces:
- real backend;
- real database;
- new user role;
- real notification integration;
- live AI;
- live cross-device sync;
- new portal;
- production authentication

must be logged as Phase 2 or formal change request.

## 11. Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| Urdu copy delays | High | Approve translation early |
| Voice asset delays | Medium | Use placeholder approved recordings first |
| Developers turn wizard into forms | High | Enforce UX gate |
| Dummy data inconsistent | High | Central seed service |
| Dashboard hard-coded | High | Analytics from repository only |
| AI mock feels fake | Medium | Golden scenario mapping + realistic delay |
| Cross-app sync misunderstood | High | Document deterministic scenario bridge |
| Scope creep | High | Change log and explicit out-of-scope list |
| Accessibility postponed | High | Include in DoD from Sprint 1 |

## 12. Handover Package

Final Phase 1 handover:
- source code;
- build instructions;
- design source;
- documentation pack;
- seed data;
- audio assets;
- demo script;
- test report;
- UAT sign-off;
- known limitations;
- Phase 2 backend integration recommendations.

## 13. Completion Benchmark

Do not declare completion because every screen exists.

Completion requires a credible, repeatable, end-to-end demonstration with:
- worker voice-first intake;
- realistic simulated AI;
- complaint reference and tracking;
- PUWF case handling;
- case lifecycle;
- analytics;
- dummy data persistence;
- resettable scenarios;
- documented backend-ready architecture.
