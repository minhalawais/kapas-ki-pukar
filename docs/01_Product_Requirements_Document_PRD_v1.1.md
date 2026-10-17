# 01 — Product Requirements Document (PRD)

**Document ID:** KKP-PRD-001  
**Product:** Kapas ki Pukaar — Voice-Enabled Smart Grievance Reporting Application for Cotton Farm Workers  
**Prepared for:** Pakistan United Workers Federation (PUWF)  
**Technical Partner:** Fruit of Sustainability (FOS)  
**Version:** 1.1  
**Date:** 19 August 2026  
**Status:** Frontend Development Baseline  
**Phase:** Phase 1 — Complete Frontend with Dummy Data  
**Purpose:** Define the product vision, scope, users, goals, features, constraints, priorities and acceptance baseline for the complete frontend release.

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

## 2. Executive Product Definition

**Kapas ki Pukaar** is a voice-first, low-literacy grievance reporting experience for cotton farm workers, combined with a compact PUWF grievance-management portal.

The product consists of two interfaces:

1. **Complainant Mobile App** — designed for rural and seasonal cotton workers, with Urdu-first voice guidance, illustrated one-question-at-a-time interactions, minimal typing, anonymous/confidential reporting, voice evidence and complaint tracking.
2. **PUWF Web Portal** — designed for one operational PUWF grievance-management role to view all complaints, review worker voice evidence, take case actions, update status, record outcomes and analyse grievance trends.

The application is not intended to be a general union-management system, a worker registry, a donor MIS or an enterprise compliance suite.

## 3. Problem Statement

Cotton workers may face wage issues, unsafe pesticide exposure, excessive working hours, harassment, discrimination, child labour risks, forced labour risks, sanitation problems, unsafe working conditions and contractor misconduct. Conventional complaint applications often assume literacy, typing ability, smartphone familiarity and stable connectivity.

Kapas ki Pukaar must reduce these barriers by making grievance reporting:
- conversational rather than form-heavy;
- voice-assisted rather than text-dependent;
- visual rather than jargon-based;
- privacy-aware;
- suitable for low-connectivity settings;
- simple enough for first-time or low-literacy users.

## 4. Product Objectives

The Phase 1 frontend shall demonstrate that the proposed product can:

1. Enable a worker to start and complete a grievance journey with minimal reading and no mandatory long-form typing.
2. Guide the user through approved grievance questions using voice prompts, illustrations and large selectable answers.
3. Support anonymous, confidential and identified reporting modes.
4. Capture real voice recordings and local evidence attachments in the frontend.
5. Simulate AI-generated Urdu transcription, English translation, grievance categorisation, summary, extracted facts and priority recommendation.
6. Generate a unique complaint reference and let the worker track a locally persisted complaint.
7. Let PUWF review complaints in a professional case-management interface.
8. Let PUWF take and record case actions using dummy/local state.
9. Provide analytics derived from the same mock complaint dataset used by the portal.
10. Demonstrate a coherent worker-to-PUWF-to-resolution story without a production backend.
11. Preserve a clean architecture that can later be connected to production services.

## 5. Primary Users

### 5.1 Complainant / Cotton Worker

Characteristics:
- may have low literacy;
- may be a seasonal or daily-wage worker;
- may use an inexpensive Android device;
- may use a shared family device;
- may prefer Urdu or a local language;
- may have limited data connectivity;
- may fear retaliation;
- may be unfamiliar with formal grievance terminology.

Primary goals:
- report a problem safely;
- understand what the app is asking;
- avoid lengthy typing;
- protect identity where needed;
- provide evidence;
- receive a complaint reference;
- see what is happening with the complaint.

### 5.2 PUWF Grievance Manager

Single Phase 1 web role.

Primary goals:
- see new and priority complaints;
- search and filter cases;
- review original worker audio, transcript and AI summary;
- take case actions;
- record investigation notes and action taken;
- update status and priority;
- propose resolution;
- close or reopen complaints;
- view aggregate trends and export demonstration data.

## 6. Product Principles

### 6.1 Voice First, Not Voice Added
Voice is a primary interaction mode, not merely an attachment option.

### 6.2 One Question at a Time
The mobile grievance journey must not be converted into a traditional long form.

### 6.3 Worker Language Before Legal Language
Worker-facing terminology must be simple and everyday. Detailed legal or analytical taxonomy remains internal.

### 6.4 Privacy by Design
Anonymous, confidential and identified modes must be clearly differentiated.

### 6.5 Human-Controlled Grievance Logic
AI may simulate understanding and assist classification, but the approved grievance workflow and critical safety rules remain deterministic.

### 6.6 Original Voice Matters
The original audio recording remains visible as the primary worker statement. AI text is an assistive derivative.

### 6.7 Donor-Ready but Not Donor-Led
The product should be suitable for ILO presentation while remaining a practical worker-rights mechanism rather than a reporting dashboard built mainly for a donor.

## 7. Scope

### 7.1 Mobile App — In Scope

- splash/branding;
- language selection;
- Urdu RTL interface;
- home;
- report a problem;
- issue-category selection;
- dynamic grievance questions;
- real microphone recording;
- audio replay and re-record;
- incident date/time options;
- location selection;
- affected-worker/group question;
- immediate-danger question;
- anonymous/confidential/identified privacy selection;
- photo/document attachment UI;
- safe-contact preference;
- simulated AI processing;
- complaint summary and confirmation;
- local complaint submission;
- complaint reference generation;
- complaint history;
- complaint detail/timeline;
- rights and safety audio content;
- simulated offline state and local draft queue;
- local persistence;
- demo/reset support.

### 7.2 PUWF Web Portal — In Scope

Primary pages:
1. Dashboard + Complaints
2. Complaint Detail / Case Workspace
3. Analytics & Reports

Supporting surfaces:
- sign-in/demo entry screen if required;
- modal/drawer actions;
- hidden demo control panel;
- toast, error, loading and empty states.

Functional capabilities:
- KPI cards;
- complaint table;
- search;
- filtering;
- sorting;
- pagination;
- case review;
- audio playback;
- AI summary display;
- timeline;
- notes;
- priority changes;
- status changes;
- action recording;
- resolution recording;
- close/reopen;
- analytics;
- CSV export;
- local persistence;
- reset to seed data.

## 8. Explicitly Out of Scope for Phase 1

- production backend;
- PostgreSQL or other server database;
- production authentication;
- live OTP;
- live SMS or WhatsApp;
- push-notification infrastructure;
- production Whisper deployment;
- production LLM deployment;
- real AI decision-making;
- real cross-device synchronisation between mobile and web;
- real cloud object storage;
- production encryption at rest;
- government portal;
- union portal;
- multi-role RBAC;
- integration with PUWF Unified Workforce & Digital Operations Platform;
- legal case management beyond the agreed grievance workflow;
- production hosting architecture.

## 9. Important Frontend-Only Limitation

Because the mobile app and the web portal have no shared backend in Phase 1, they cannot genuinely synchronise case state across different devices.

For demonstrations, FOS shall use a **deterministic scenario bridge**:
- the mobile app creates a complaint reference based on a known scenario;
- the PUWF portal can load/inject the matching scenario through the hidden Demo Control Panel;
- both interfaces then show consistent complaint details and state;
- this is presentation/test synchronisation, not production data synchronisation.

This limitation must be documented internally and must not be represented as a live production integration.

## 10. Feature Prioritisation

### Must Have
- Urdu-first mobile interface;
- voice prompt playback;
- real voice recording/playback;
- grievance branching;
- key complaint categories;
- privacy modes;
- evidence UI;
- simulated AI;
- local complaint submission;
- complaint tracking;
- PUWF dashboard/table;
- PUWF case workspace;
- PUWF actions/timeline;
- analytics from shared mock data;
- local persistence;
- demo reset;
- responsive design;
- error/loading/empty states.

### Should Have
- English alternate language;
- offline simulation;
- rights awareness content;
- case export to CSV;
- group grievance handling;
- safe-contact preferences;
- worker resolution feedback;
- AI confidence indicator.

### Could Have
- browser/device TTS experiments;
- map visualisation;
- animated waveform;
- QR-based demo scenario loading;
- downloadable complaint summary;
- accessibility text-size control.

### Won't Have in Phase 1
Production services listed in Section 8.

## 11. High-Level User Stories

- As a worker, I want the app to speak instructions so I do not need to read long text.
- As a worker, I want to report without giving my identity if I fear retaliation.
- As a worker, I want to record my own words rather than type a long complaint.
- As a worker, I want simple illustrated choices that I can understand quickly.
- As a worker, I want to know whether my complaint was submitted.
- As a worker, I want to track what is happening to my complaint.
- As a PUWF grievance manager, I want to see priority complaints immediately.
- As a PUWF grievance manager, I want to listen to the original worker statement.
- As a PUWF grievance manager, I want AI assistance clearly separated from verified facts.
- As a PUWF grievance manager, I want every action to appear in a case timeline.
- As a PUWF grievance manager, I want analytics to reflect the actual dummy complaint dataset.

## 12. Core Product Success Criteria for Phase 1

The frontend release is successful when:

1. A new user can start a grievance from the mobile home screen without training.
2. Every primary grievance category can be completed end to end.
3. The worker can record and replay audio.
4. Simulated AI outputs are scenario-aware and consistent with the selected grievance.
5. A local complaint reference is generated and persisted.
6. Worker status views use simple language.
7. The PUWF portal can take a complaint through a complete dummy case lifecycle.
8. All web KPIs and charts are derived from the same mock dataset.
9. Urdu RTL layout works across all worker-critical screens.
10. The system survives refresh/relaunch according to the persistence specification.
11. Demo data can be reset reliably.
12. No Phase 1 screen depends on a real backend.


## Visual Identity Amendment — v1.1

The product must **not** be rendered as a predominantly green application. The intended identity is a balanced combination of PUWF institutional trust, FOS technology/voice character and Kapas agricultural warmth.

### Approved Visual Roles

| Role | Colour | Intended Use |
|---|---|---|
| Warm Neutral / Cotton Cream | `#F7F3E8` | Primary mobile background and warm empty space |
| Surface White | `#FFFFFF` | Cards, forms, web content surfaces |
| PUWF Sovereign Green | `#004027` | Institutional anchor, web sidebar, limited high-emphasis areas |
| FOS Teal | `#2D9480` | Voice, audio, AI assistive states, secondary actions |
| Kapas Green | `#0B5D3B` | Primary worker CTA, selected key actions, product accent |
| Cotton Gold | `#E5A62E` | Progress, cotton/agriculture detail, highlights |
| FOS Orange | `#E48424` | Small illustration/data-visualisation accent only |
| Information Blue | `#2877B8` | Information states and data visualisation |
| Critical Red | `#C83B3B` | Emergency, critical safeguarding and destructive actions only |

### Composition Target

Across a typical screen or dashboard viewport:
- **60–70%** neutral/cream/white surfaces;
- **10–15%** PUWF deep green;
- **8–12%** FOS teal;
- **3–7%** Kapas green;
- **2–5%** Cotton Gold / FOS orange;
- semantic red/amber/blue only as required.

These are composition guides rather than pixel-level quotas. The controlling rule is that green must not dominate the entire visual field.

### Non-Negotiable Anti-Green-Heavy Rules

1. Mobile screens must not use a dark/medium green full-screen background except approved splash/brand moments.
2. Mobile top bars should default to cream/white or very light neutral; dark green headers are reserved for exceptional emphasis rather than every screen.
3. A normal mobile screen should contain no more than one large saturated-green surface.
4. Voice recording, waveform, listening and AI processing use **FOS Teal**, not another shade of green.
5. AI insight cards use a soft teal-tinted surface, not dark green.
6. Web portal content area remains light; the main dark-green region is the PUWF sidebar.
7. KPI cards remain white/neutral and use small multicolour accents.
8. Charts must use a mixed palette and must not be composed mainly of green shades.
9. Cotton Gold appears in progress, agriculture illustrations and selected highlights, not as a primary CTA.
10. FOS orange/lime may appear in illustrations or data visualisation, but not as dominant interface controls.

### Product Design Meaning

- **PUWF Green = institutional ownership and trust**
- **FOS Teal = voice, AI and technology**
- **Kapas Green = key worker action**
- **Cotton Gold = agriculture and progress**
- **Cream/White = accessibility, humanity and breathing room**


## 13. Non-Functional Frontend Requirements

- Android-first mobile design.
- Support modern browsers for the PUWF portal.
- Responsive portal at common desktop/tablet widths.
- WCAG AA-oriented contrast and focus behaviour.
- Large mobile touch targets.
- No critical meaning communicated by colour alone.
- Neutral/cream/white surfaces must visually dominate the application; saturated greens must be used selectively.
- FOS Teal must be the standard interaction colour for voice/audio/AI assistive states.
- PUWF Sovereign Green must act as an institutional anchor rather than a full-screen default colour.
- KPI cards and content cards should remain white/neutral; charts must use a mixed brand/semantic palette rather than several green shades.
- Strong outdoor readability.
- Minimal mobile bundle and compressed assets.
- Predictable state transitions.
- Strict TypeScript.
- Reusable design tokens.
- Service abstractions for future backend integration.
- Deterministic mock data for repeatable QA.

## 14. Approval Baseline

The PRD is considered approved when FOS and PUWF agree on:
- the two user types;
- one PUWF role;
- three primary web pages;
- mobile grievance flow;
- grievance taxonomy;
- privacy modes;
- lifecycle statuses;
- Phase 1 frontend-only limitations;
- feature prioritisation;
- demo approach.

Any material feature added after approval must be recorded as a scope change.
