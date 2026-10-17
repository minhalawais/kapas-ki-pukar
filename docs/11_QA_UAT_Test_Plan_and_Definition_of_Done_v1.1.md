# 11 — QA/UAT Test Plan + Definition of Done

**Document ID:** KKP-QA-011  
**Product:** Kapas ki Pukaar — Voice-Enabled Smart Grievance Reporting Application for Cotton Farm Workers  
**Prepared for:** Pakistan United Workers Federation (PUWF)  
**Technical Partner:** Fruit of Sustainability (FOS)  
**Version:** 1.1  
**Date:** 19 August 2026  
**Status:** Frontend Development Baseline  
**Phase:** Phase 1 — Complete Frontend with Dummy Data  
**Purpose:** Define quality assurance coverage, user acceptance testing, traceability, defect handling and completion standards for the frontend release.

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

## 2. QA Objectives

QA must verify:
- product requirements;
- functional correctness;
- Urdu/RTL;
- voice recording;
- mock AI;
- grievance branching;
- lifecycle logic;
- dummy data integrity;
- analytics reconciliation;
- local persistence;
- accessibility;
- responsive layouts;
- demo reliability.

## 3. Test Levels

### Unit Tests
Target:
- taxonomy helpers;
- lifecycle rules;
- priority rules;
- analytics formulas;
- validation schemas;
- reference generation.

### Component Tests
Target:
- answer cards;
- voice recorder states;
- status badge;
- priority badge;
- action modal;
- AI insight card.

### Integration Tests
Target:
- grievance draft flow;
- submission;
- complaint persistence;
- portal case actions;
- analytics update after mutation.

### End-to-End Tests
Target:
- complete worker journey;
- complete PUWF case journey;
- golden demo scenarios.

## 4. Mobile Functional Test Matrix

Must test:
- splash;
- language switch;
- RTL;
- home navigation;
- every primary grievance category;
- branch logic;
- back/forward;
- draft recovery;
- microphone permission;
- recording;
- replay;
- re-record;
- attachment;
- privacy;
- safe contact;
- AI normal;
- AI low confidence;
- AI failure;
- submission;
- reference;
- complaint list;
- complaint detail;
- rights content;
- offline simulation.

## 5. Portal Functional Test Matrix

Must test:
- dashboard totals;
- charts;
- search;
- filters;
- sorting;
- pagination;
- case open;
- audio playback;
- transcript;
- AI card;
- evidence;
- timeline;
- start review;
- change priority;
- add note;
- contact action;
- request info;
- finding;
- action taken;
- escalate;
- propose resolution;
- resolve;
- close;
- reopen;
- analytics;
- CSV;
- reset demo data.

## 6. Lifecycle Transition Tests

Valid transitions must succeed.

Invalid examples must be blocked:
- New → Closed directly without allowed workflow;
- Closed → Action in Progress without Reopen;
- Draft → Resolved.

## 7. Priority Rule Tests

- immediate danger → Emergency;
- child labour cannot become Standard;
- forced labour cannot become Standard;
- severe pesticide + danger → Emergency;
- AI suggestion below minimum is reconciled upward.

## 8. Analytics Reconciliation Tests

For every build:
- KPI totals reconcile to complaint repository;
- category chart total reconciles;
- status chart total reconciles;
- filters apply consistently;
- closing/reopening case updates analytics;
- reset restores baseline values.

## 9. RTL Tests

Check:
- Urdu alignment;
- arrows;
- progress;
- modal layout;
- mixed numbers;
- complaint IDs;
- audio controls;
- long Urdu labels;
- font scaling.

## 10. Responsive Tests

### Mobile
Test at least:
- small Android viewport;
- common mid-size Android;
- large Android.

### Web
Test:
- 1366×768;
- 1440×900;
- 1920×1080;
- tablet-ish width if supported.

## 11. Accessibility QA

Manual:
- keyboard-only portal;
- visible focus;
- screen reader labels;
- no colour-only meaning;
- contrast;
- large text;
- touch target size;
- reduced motion where applicable.

## 12. Error-State QA

Test:
- microphone denied;
- recording failure;
- no audio;
- AI failure;
- AI low confidence;
- no complaints;
- no filtered results;
- invalid form;
- persistence failure simulation if implemented;
- offline save;
- reconnect submit.

## Visual Identity Regression — v1.1

Add a dedicated visual QA pass to every release candidate.

### Mobile checks
- [ ] normal content screens use cream/white/light neutral backgrounds;
- [ ] no normal screen is predominantly dark/medium green;
- [ ] no more than one large saturated-green surface appears on a normal mobile screen;
- [ ] primary CTA uses Kapas Green;
- [ ] voice/audio/AI states use FOS Teal;
- [ ] Cotton Gold is used only as progress/agriculture highlight;
- [ ] success state does not turn the whole page green.

### Web checks
- [ ] dark PUWF green is concentrated in the sidebar/institutional anchor;
- [ ] main content canvas is light;
- [ ] KPI cards are white/neutral;
- [ ] AI cards use Soft Teal/teal accents;
- [ ] charts use a mixed palette rather than shades of green;
- [ ] critical red remains semantically reserved.

### Automated/Assisted Method
Use screenshot-based visual regression for representative screens:
- Mobile Home
- Issue Category
- Voice Recording
- Privacy
- AI Summary
- Success
- PUWF Dashboard
- Case Workspace
- Analytics

The approved v1.1 design mockups become the visual baseline.

## 13. Demo Reliability QA

Before each PUWF/ILO demo:
1. reset seed;
2. load golden scenario;
3. confirm audio assets;
4. confirm demo portal injection;
5. confirm analytics baseline;
6. confirm no stale local state;
7. confirm build version.

## 14. Defect Severity

### P0 — Blocker
Cannot complete core complaint or case workflow.

### P1 — Critical
Major privacy/safety/lifecycle error or broken main demo.

### P2 — High
Important function broken with workaround.

### P3 — Medium
Visual/interaction defect not blocking primary flow.

### P4 — Low
Minor cosmetic issue.

## 15. Exit Criteria

Release Candidate may be approved when:
- no open P0;
- no open P1;
- agreed P2 threshold met;
- all Must-Have requirements tested;
- golden demos pass;
- analytics reconcile;
- RTL review passes;
- accessibility review passes;
- reset function verified.

## 16. UAT Participants

Recommended:
- FOS product/project lead;
- FOS technical lead;
- FOS QA;
- PUWF operational grievance user;
- PUWF management representative;
- Urdu reviewer;
- representative worker testers where feasible.

## 17. UAT Scenarios

### UAT-01
File anonymous wage complaint.

### UAT-02
File confidential pesticide emergency.

### UAT-03
Resume saved draft.

### UAT-04
Track complaint.

### UAT-05
PUWF reviews new complaint and starts action.

### UAT-06
PUWF resolves and closes case.

### UAT-07
Reopen unsatisfied resolution.

### UAT-08
Use dashboard filters and analytics.

## 18. Requirement Traceability

Maintain:
`Requirement ID → Screen ID → Test Case ID → Result`

Example:
`VOC-004 → M-014 → TC-MOB-VOICE-04 → Pass`

## 19. Definition of Done — Feature

A feature is Done only when:
- requirement is approved;
- UI matches approved design;
- Urdu/English handled;
- RTL handled if applicable;
- interactions function;
- validation implemented;
- mock service used;
- loading/error/empty states covered;
- persistence behaviour correct;
- tests pass;
- QA signs off;
- no unresolved critical issue.

## 20. Definition of Done — Screen

A screen is not done because it visually resembles Figma.

It is done when:
- all components functional;
- all states defined;
- data comes through service layer;
- responsive behaviour correct;
- accessibility labels present;
- copy/localisation approved;
- test cases passed.

## 21. Definition of Done — Release

Frontend Phase 1 is complete when this demonstrable chain works:

Worker opens app
→ chooses Urdu
→ reports through guided flow
→ records voice
→ simulated AI structures complaint
→ worker selects privacy
→ submits
→ receives reference
→ complaint can be represented in PUWF portal through deterministic demo scenario
→ PUWF reviews and acts
→ case timeline changes
→ analytics update
→ worker tracking scenario reflects resolution.

## 22. UAT Sign-Off Template

Record:
- build version;
- date;
- participant;
- scenario;
- result;
- issues;
- accepted deviations;
- approval.

No verbal-only sign-off for final baseline.
