# 03 — Information Architecture + Screen Inventory

**Document ID:** KKP-IA-003  
**Product:** Kapas ki Pukaar — Voice-Enabled Smart Grievance Reporting Application for Cotton Farm Workers  
**Prepared for:** Pakistan United Workers Federation (PUWF)  
**Technical Partner:** Fruit of Sustainability (FOS)  
**Version:** 1.0  
**Date:** 2026-08-18  
**Status:** Frontend Development Baseline  
**Phase:** Phase 1 — Complete Frontend with Dummy Data  
**Purpose:** Define the navigation structure, route hierarchy, screen ownership and complete frontend screen catalogue.

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

## 2. Information Architecture Principles

1. Mobile navigation must be shallow.
2. Reporting must be reachable from Home in one tap.
3. Grievance flow is a guided wizard, not a conventional form.
4. Worker tracking and rights content are secondary to reporting.
5. PUWF portal must keep complaint operations within 2–3 primary work pages.
6. Supporting dialogs/drawers do not count as separate portal pages.
7. The mobile app and web portal share domain terminology but not navigation structures.

## 3. Mobile Information Architecture

```text
Kapas ki Pukaar Mobile
├── Splash
├── Language & Welcome
├── Home
│   ├── Report a Problem
│   │   ├── Intro / Safety Notice
│   │   ├── Issue Category
│   │   ├── Category-Specific Questions (incl. CON/HRS/SAN/DIS: M-037–M-040)
│   │   ├── Voice Description
│   │   ├── Incident Timing
│   │   ├── Location
│   │   ├── Others Affected
│   │   ├── Immediate Danger
│   │   ├── Privacy Mode
│   │   ├── Evidence
│   │   ├── Safe Contact
│   │   ├── AI Understanding
│   │   ├── Review
│   │   └── Submission Success
│   ├── My Complaints
│   │   ├── Complaint List
│   │   └── Complaint Detail
│   └── Rights & Help
│       ├── Rights Topics
│       └── Topic Detail
└── Supporting
    ├── Audio Permission
    ├── Offline Banner
    ├── Draft Recovery
    ├── Error Modal
    └── Demo Controls (hidden)
```

## 4. Recommended Mobile Navigation

Bottom navigation after onboarding:
- **Home**
- **My Complaints**
- **Rights & Help**

Do not create a worker dashboard with KPIs.

## 5. PUWF Web Information Architecture

```text
Kapas ki Pukaar — PUWF Portal
├── Dashboard + Complaints
│   ├── KPI Summary
│   ├── Operational Charts
│   ├── Search / Filters
│   └── Complaint Table
├── Complaint Detail / Case Workspace
│   ├── Complaint Overview
│   ├── Worker Voice
│   ├── AI Case Intelligence
│   ├── Evidence
│   ├── Case Timeline
│   └── Action Panel
└── Analytics & Reports
    ├── Filters
    ├── Trend Cards
    ├── Charts
    └── CSV Export
```

Optional supporting routes:
- `/demo-entry`
- `/about`
- hidden `/demo-controls`

## 6. Mobile Screen Inventory

| ID | Screen | Purpose | Core Components | Data Source |
|---|---|---|---|---|
| M-001 | Splash | Product entry | Logo, partner line | Static |
| M-002 | Language Selection | Choose Urdu/English | Language cards, audio | Locale store |
| M-003 | Welcome | Explain voice-first flow | Illustration, audio, continue | Static |
| M-004 | Home | Main worker actions | Report CTA, track, rights | Local state |
| M-005 | Complaint Intro | Explain safe reporting | Audio, privacy note | Static |
| M-006 | Issue Category | Select simple category | Illustrated answer cards | Taxonomy |
| M-007 | Wage Branch | Wage-specific questions | Answer cards/amount shortcuts | Workflow config |
| M-008 | Pesticide Branch | Exposure-specific questions | Symptoms, danger | Workflow config |
| M-009 | Safety Branch | Safety/injury questions | Answer cards | Workflow config |
| M-010 | Harassment Branch | Minimal sensitive questions | Safe options | Workflow config |
| M-011 | Child Labour Branch | Safeguarding questions | Minimal choices | Workflow config |
| M-012 | Forced Labour Branch | Coercion/threat questions | Minimal choices | Workflow config |
| M-013 | Other Issue Branch | Open concern | Voice prompt | Workflow config |
| M-037 | Contractor Branch | Contractor-specific questions | Answer cards | Workflow config |
| M-038 | Hours Branch | Hours/rest questions | Answer cards | Workflow config |
| M-039 | Sanitation Branch | Water/sanitation questions | Answer cards | Workflow config |
| M-040 | Discrimination Branch | Discrimination questions | Answer cards | Workflow config |
| M-014 | Voice Description | Record worker statement | Recorder, timer, playback | Local media |
| M-015 | Incident Timing | Capture when | Shortcut options | Draft state |
| M-016 | Location | Capture demo location | Field/village/district choices | Location seeds |
| M-017 | Others Affected | Group grievance | Yes/no/range | Draft state |
| M-018 | Immediate Danger | Safety triage | Yes/no, emergency message | Rules engine |
| M-019 | Privacy Mode | Choose anonymity | 3 cards, audio help | Draft state |
| M-020 | Contact Preference | Safe contact | Call/message/no contact | Draft state |
| M-021 | Evidence | Add photo/doc | Picker, preview, remove | Local media |
| M-022 | AI Processing | Simulate understanding | Waveform/progress | MockAIService |
| M-023 | AI Understanding | Confirm summary | Simple spoken/visual summary | MockAIService |
| M-024 | Review Complaint | Final review | Summary sections, edit links | Draft state |
| M-025 | Submission Processing | Simulate submit | Progress | Mock service |
| M-026 | Success | Show reference | Complaint ID, next steps | Local complaint |
| M-027 | My Complaints | Local case list | Status cards | Complaint service |
| M-028 | Complaint Detail | Track case | Status, timeline | Complaint service |
| M-029 | Resolution Feedback | Worker response | Satisfied/partial/no | Scenario state |
| M-030 | Rights Topics | Awareness library | Topic cards | Static/local data |
| M-031 | Rights Detail | Topic content | Text, audio, illustration | Static/local data |
| M-032 | Draft Recovery | Resume/discard | Dialog | Persistence store |
| M-033 | Microphone Permission | Request/recover | Permission explanation | Device API |
| M-034 | Offline Saved | Explain local queue | Status card | Demo connectivity |
| M-035 | Error State | Recover gracefully | Retry/back/help | Local error |
| M-036 | Hidden Demo Controls | Scenario management | Toggles/actions | Demo store |

## 7. Web Screen Inventory

| ID | Route | Screen | Purpose |
|---|---|---|---|
| W-001 | `/dashboard` | Dashboard + Complaints | Operational overview and all complaints |
| W-002 | `/complaints/[id]` | Complaint Case Workspace | Review complaint and take actions |
| W-003 | `/analytics` | Analytics & Reports | Aggregate insight and export |
| W-004 | `/demo` | Demo Control Panel | Hidden scenario/reset tools |
| W-005 | optional | Demo Entry / Sign-in Shell | Simulated entry point only |

## 8. Dashboard + Complaints Screen Structure

Top to bottom:
1. Page title and date context
2. KPI cards
3. 2–4 compact charts
4. Search and filter bar
5. complaint table
6. pagination
7. contextual empty/error states

Recommended KPIs:
- Total Complaints
- New
- Critical
- In Progress
- Overdue
- Resolved

## 9. Complaint Workspace Structure

Desktop layout:
- **Main column (55–60%)** — complaint facts, audio, transcript, AI, evidence
- **Timeline column (20–25%)** — chronological events
- **Sticky action rail (20–25%)** — status, priority, actions

Mobile/tablet fallback may stack sections.

## 10. Analytics Screen Structure

1. Filter row
2. headline performance metrics
3. category trend
4. status/priority distribution
5. geography
6. privacy mode
7. resolution indicators
8. export actions

## 11. Screen Naming Rules

- Worker labels use plain language.
- Internal route/component names may use technical terminology.
- One business concept gets one canonical name.
- Avoid duplicate labels such as Complaint/Case/Grievance interchangeably in the same context:
  - worker-facing: **Complaint / Shikayat**
  - internal PUWF: **Grievance Case**

## 12. Navigation Rules

- Report a Problem is always reachable within one tap from Home.
- Back during active grievance never silently discards progress.
- Closing a sensitive modal returns to the same case.
- Web breadcrumb required on case workspace.
- Deep links are not required for Phase 1 but routes should be stable for Phase 2.
