# 10 — Analytics/KPI + Privacy/Accessibility Specification

**Document ID:** KKP-KPI-010  
**Product:** Kapas ki Pukaar — Voice-Enabled Smart Grievance Reporting Application for Cotton Farm Workers  
**Prepared for:** Pakistan United Workers Federation (PUWF)  
**Technical Partner:** Fruit of Sustainability (FOS)  
**Version:** 1.1  
**Date:** 19 August 2026  
**Status:** Frontend Development Baseline  
**Phase:** Phase 1 — Complete Frontend with Dummy Data  
**Purpose:** Define the analytical measures, frontend privacy presentation rules and accessibility requirements for the demonstration release.

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

## 2. Analytics Principle

Complaint volume alone is not a success or failure indicator.

A trusted grievance mechanism may initially receive more complaints because access and confidence improve.

Therefore the dashboard should distinguish:
- access/reporting;
- severity/risk;
- operational response;
- resolution;
- worker outcome.

## 3. Core Dashboard KPIs

| KPI | Definition |
|---|---|
| Total Complaints | All non-draft complaint records |
| New | Status = New |
| Critical | Priority = Emergency or Critical |
| In Progress | Under Review + Awaiting Worker + Action in Progress + Escalated |
| Overdue | Active case with due date earlier than current demo date |
| Resolved | Status = Resolved or Closed |

## 4. Additional Analytics

- complaints by category;
- subcategory;
- province/district;
- gender;
- privacy mode;
- priority;
- status;
- group vs individual;
- reporter type;
- complaint trend by week/month;
- time to first action;
- time to resolution;
- reopened cases;
- worker satisfaction;
- AI low-confidence share;
- AI human-review share.

## 5. KPI Formula Rules

### Resolution Rate
```text
Resolved + Closed
----------------- × 100
Eligible submitted complaints
```

### Open Case Rate
```text
New + Under Review + Awaiting Worker + Action in Progress + Escalated
--------------------------------------------------------------------- × 100
Total submitted complaints
```

### Worker-Confirmed Positive Resolution
```text
Satisfied responses
------------------- × 100
All resolution feedback responses
```

### Reopen Rate
```text
Reopened cases
-------------- × 100
Resolved + Closed cases
```

## 6. Frontend SLA Simulation

Phase 1 may include a demo `dueAt` timestamp.

Overdue = current demo date > dueAt AND status not in Resolved/Closed.

SLA targets shown in demo must be labelled as project/demo configuration unless formally approved by PUWF.

## 7. Analytics Filters

- date range;
- category;
- priority;
- status;
- province/district;
- gender;
- privacy mode.

All charts must respond to the same filter context.

## Data Visualisation Colour Rules — v1.1

Analytics must visually balance PUWF and FOS rather than use multiple green shades.

Recommended categorical palette:
1. FOS Teal `#2D9480`
2. Cotton Gold `#E5A62E`
3. Information Blue `#2877B8`
4. PUWF Emerald `#0B4F37`
5. FOS Orange `#E48424`
6. Neutral Grey `#7B8A84`

Rules:
- do not use more than two green-family series in one chart;
- do not use green shades to represent unrelated categories;
- reserve red for genuinely critical/negative states;
- every chart includes legend or direct labels;
- information must remain understandable without colour alone;
- KPI cards remain neutral/white and use small icon/accent treatments.

## 8. Reconciliation Rule

`Dashboard totals = filtered complaint repository totals`

No separate hard-coded summary dataset.

## 9. Geographic Privacy

For demo:
- use aggregate district/tehsil labels;
- no exact farm coordinates;
- no individual case map pin that could imply real identifiable location.

Future production systems must review re-identification risk before exposing maps.

## 10. Privacy Modes in UI

### Anonymous
Portal shows:
- identity unavailable/withheld;
- no fake hidden identity reveal button.

### Confidential
Portal may show a demo restricted-information label, but Phase 1 has no true server-side access control.

### Identified
Demo identity may be fictional.

## 11. Privacy Disclaimer for Phase 1

Frontend privacy behaviours are **visual and logical simulations**, not production security controls.

The prototype does not claim:
- encrypted server storage;
- real access-control enforcement;
- secure identity vault;
- production retention/deletion controls.

These belong to Phase 2.

## 12. Sensitive Case Presentation

Sensitive categories should:
- avoid unnecessary names;
- use restrained evidence display;
- show privacy status clearly;
- avoid putting graphic detail on dashboard cards;
- show only necessary summary text in list view.

## 13. Contact Safety

Where enabled, worker can choose:
- safe to call;
- safe to message;
- do not message;
- no contact;
- alternate contact demo field.

Do not expose sensitive complaint text in notification mockups.

## 14. Accessibility Goals

Target WCAG AA-oriented practice for web and accessible mobile patterns.

The product is specifically designed for low-literacy users, so accessibility is a primary product feature.

## 15. Mobile Accessibility Requirements

- minimum large touch targets;
- main CTAs 56–64 px;
- microphone 72–88 px;
- clear pressed/disabled states;
- audio replay on major screens;
- large Urdu text;
- strong outdoor contrast;
- no reliance on fine motor precision;
- minimal typing;
- concise instructions;
- screen-reader labels for icons;
- support text scaling without clipping.

## 16. Web Accessibility Requirements

- keyboard navigation;
- visible focus;
- semantic headings;
- labelled controls;
- accessible dialogs;
- table header semantics;
- charts accompanied by text/legend;
- status not communicated by colour only;
- sufficient contrast;
- logical tab order.

## 17. Motion

- avoid unnecessary looping animations;
- provide restrained waveform/pulse;
- respect reduced-motion preference where feasible.

## 18. Colour Accessibility

- semantic label + icon + colour;
- red reserved for danger;
- muted grey text must still meet contrast expectations;
- selected cards require border/icon/text changes in addition to colour.
- neutral/cream/white surfaces must dominate normal screens.
- green-heavy composition is an accessibility/readability risk for this product because it reduces visual hierarchy and makes semantic green harder to interpret.
- FOS Teal and information blue must remain distinguishable from PUWF/Kapas greens.

## 19. Low-Literacy Design Checks

A worker should be able to:
- identify Report a Problem without reading a paragraph;
- understand answer options through icon + short label + audio;
- recover from errors without technical wording;
- confirm a complaint without editing long text;
- understand submission success clearly.

## 20. Analytics Export

CSV export may include:
- complaint reference;
- category;
- priority;
- status;
- region;
- privacy mode;
- dates;
- dummy analytics fields.

Do not export fictitious sensitive identity details unnecessarily.

## 21. KPI Governance

Any new KPI must define:
- purpose;
- formula;
- source fields;
- filter behaviour;
- exclusions;
- display format;
- test case.

## 22. Accessibility Acceptance

The release is not complete until:
- key mobile flows pass manual low-literacy usability review;
- keyboard-only web review passes;
- colour contrast is checked;
- screen-reader labels exist for key controls;
- large-text layout does not break critical mobile screens.
