# Kapas ki Pukaar — End-to-End Frontend Development Plan

**Document ID:** KKP-FE-PLAN-013  
**Product:** Kapas ki Pukaar — A Voice-Enabled Smart Grievance Reporting Application for Cotton Farm Workers  
**Prepared for:** Pakistan United Workers Federation (PUWF)  
**Technical Partner:** Fruit of Sustainability (FOS)  
**Version:** 1.1  
**Date:** 19 August 2026  
**Status:** Frontend Development Execution Baseline  
**Phase:** Frontend-Only Functional Product with Dummy Data  

**Revision Note:** v1.1 updates the product visual identity to a balanced FOS + PUWF + Kapas system with neutral surfaces dominant, PUWF green used as an institutional anchor, FOS teal used for voice/AI/technology, Kapas green used selectively for primary actions and Cotton Gold used for agricultural highlights. It explicitly prohibits green-heavy page composition.

---

## 1. Executive Summary

This document defines the complete, phase-by-phase plan for the end-to-end frontend development of **Kapas ki Pukaar**, covering both:

1. the **complainant-facing mobile application**, and  
2. the **standalone PUWF grievance-management web portal**.

The current implementation phase is intentionally **frontend only**. No production backend, server-side database, production authentication, live SMS service, production AI inference, cloud object storage, or live integration with the existing PUWF Unified Workforce & Digital Operations Platform is included.

Despite that limitation, the Phase 1 product must behave like a complete application from the user’s perspective.

The final frontend release must demonstrate the full intended experience:

> Worker opens the app → selects Urdu → listens to voice guidance → reports a grievance through one-question-at-a-time visual interaction → records a real voice message → receives simulated AI transcription and case structuring → selects privacy mode → submits the complaint → receives a complaint ID → tracks the complaint → PUWF views the matching grievance in its portal → reviews original audio and AI analysis → takes case actions → updates status → records resolution → analytics update accordingly.

The frontend architecture must also be designed so that in a later production phase, the dummy repositories and simulated AI services can be replaced by real backend APIs without redesigning the complete user interface.

---

# 2. Confirmed Product Scope

## 2.1 Mobile Application

The mobile application is exclusively **complainant-focused**.

Primary user:

**Cotton farm worker / complainant**

The app will provide:

- Urdu-first experience
- RTL interface
- English alternate interface
- voice-guided instructions
- one-question-at-a-time grievance reporting
- illustrated answer cards
- category-specific branching
- real microphone recording
- real audio playback
- photo/document attachment interface
- anonymous/confidential/identified reporting
- safe-contact preferences
- current-danger identification
- group grievance handling
- simulated AI transcription
- simulated AI translation
- simulated AI categorisation
- simulated AI summary
- simulated AI risk suggestion
- worker confirmation
- locally generated complaint ID
- complaint tracking
- rights and awareness content
- simulated offline behaviour
- local persistence
- complete loading/error/empty states

The mobile application must **not** become a conventional long-form grievance application.

---

## 2.2 PUWF Web Portal

The PUWF portal will remain intentionally compact.

Phase 1 includes **one functional role only**:

> **PUWF Grievance Manager**

The portal will consist of approximately **2–3 primary pages**:

1. **Dashboard + Complaints**
2. **Complaint Detail / Case Workspace**
3. **Analytics & Reports**

The PUWF user must be able to:

- view all complaints
- search and filter complaints
- identify critical cases
- open complaint details
- listen to worker audio
- review Urdu transcript
- review English translation
- review AI summary
- review AI suggested category and priority
- view evidence
- start review
- change priority
- add internal notes
- record worker contact
- request information
- record investigation findings
- record actions taken
- escalate
- propose resolution
- resolve
- close
- reopen
- view full timeline
- view analytics
- export dummy report data

---

# 3. Phase 1 Technical Boundaries

## Included

- complete mobile frontend
- complete web frontend
- dummy data
- mock repositories
- mock service layer
- real local audio recording
- local audio playback
- bundled Urdu voice prompts
- simulated AI
- simulated speech-to-text
- simulated translation
- simulated notifications
- local persistence
- local/offline simulation
- fully working search/filter/sort
- real dashboard calculations from dummy data
- real analytics from dummy data
- fully functional case lifecycle
- demo scenario controls
- QA/UAT ready build

## Not Included

- NestJS production backend
- production REST APIs
- PostgreSQL
- production cloud database
- real worker login
- real PUWF authentication
- real OTP
- live SMS
- live push notification infrastructure
- real WhatsApp integration
- production Whisper server
- production LLM
- production TTS server
- production AI safety layer
- production server-side RBAC
- production encryption
- cloud media storage
- production audit infrastructure
- integration with PUWF Unified Workforce & Digital Operations Platform
- cross-device live data synchronisation

---

# 4. Recommended Frontend Technology Stack

| Layer | Recommended Technology |
|---|---|
| Mobile App | React Native + Expo + TypeScript |
| Web Portal | Next.js + TypeScript |
| Mobile Styling | NativeWind |
| Web Styling | Tailwind CSS + shadcn/ui |
| Shared State | Zustand |
| Async Data Layer | TanStack Query |
| Forms | React Hook Form + Zod |
| Mobile Persistence | AsyncStorage / SQLite |
| Web Persistence | IndexedDB / localStorage |
| Routing — Mobile | Expo Router |
| Routing — Web | Next.js App Router |
| Charts | Recharts |
| Icons | Lucide |
| Mobile Animation | React Native Reanimated |
| Web Animation | Framer Motion |
| Maps | MapLibre + OpenStreetMap |
| Testing | Vitest + Playwright |
| Workspace | pnpm Workspace / Turborepo |
| CI/CD | GitHub Actions |

---

# 5. Development Approach

The project should be delivered through **13 structured phases**.

Each phase contains:

- objectives
- scope
- activities
- technical outputs
- UX outputs
- QA requirements
- exit criteria

A phase should not be considered complete merely because code has been written.

Each phase must satisfy its defined **quality gate** before the team progresses.

---

# PHASE 0 — Project Initiation, Scope Freeze and Documentation Baseline

## Objective

Convert the concept note and stakeholder expectations into one controlled frontend development baseline.

## Key Activities

- confirm standalone product status
- confirm no integration with PUWF Unified Workforce Platform
- confirm mobile app user
- confirm one PUWF web role
- confirm 2–3 portal pages
- confirm frontend-only scope
- approve grievance categories
- approve case lifecycle
- approve privacy modes
- approve voice-first experience
- approve dummy data strategy
- approve simulated AI approach
- approve initial languages
- approve design system direction
- approve technical stack
- define Phase 2 exclusions

## Required Inputs

- PRD
- FRS
- Information Architecture
- Screen Inventory
- User Journeys
- Decision Trees
- Taxonomy
- Lifecycle
- UI/UX design system
- AI simulation specification
- dummy data specification
- technical architecture
- QA plan

## Deliverables

- approved scope statement
- final feature list
- approved screen list
- approved development backlog
- project repository created
- Jira/GitHub issue structure created
- change-management process defined

## Exit Criteria

Development proceeds only when the project team can answer:

> What should happen when the user taps every visible interactive element?

---

# PHASE 1 — UX Architecture, Visual Design System and Component Specification

## Objective

Create a unified visual and interaction system before feature development begins.

## Mobile Design Principles

The worker app must be:

- voice-first
- visual
- low-literacy friendly
- calm
- high contrast
- suitable for outdoor use
- minimal in text
- one-question-at-a-time
- easy to navigate
- reassuring without being overly decorative

## Web Design Principles

The PUWF portal must be:

- operational
- clean
- compact
- case-focused
- data-driven
- professional
- easy to scan
- action-oriented

## Core Colour System

| Token | Hex | Primary Role |
|---|---|---|
| Cotton Cream | `#F7F3E8` | Primary mobile background |
| Surface White | `#FFFFFF` | Cards and web content |
| Soft Neutral | `#F4F6F4` | Portal page background |
| PUWF Sovereign Green | `#004027` | Institutional anchor/sidebar |
| FOS Teal | `#2D9480` | Voice, audio, AI and secondary action |
| FOS Deep Teal | `#206E71` | Teal emphasis |
| Kapas Green | `#0B5D3B` | Primary worker CTA |
| Cotton Gold | `#E5A62E` | Progress/agriculture highlight |
| FOS Orange | `#E48424` | Small visualisation/illustration accent |
| Soft Teal | `#E7F4F1` | AI/voice card surface |
| Main Text | `#17231E` | Primary text |
| Secondary Text | `#66736D` | Supporting text |
| Border | `#DCE5E0` | Dividers |
| Information Blue | `#2877B8` | Information/data viz |
| Critical | `#C83B3B` | Emergency/destructive |
| Warning | `#D88416` | Warning/overdue |
| Success | `#27845A` | Success/resolved |

## Brand Balance Rule — v1.1

Normal screens must be visually light. Use neutral/cream/white as the canvas, PUWF green as the institutional anchor, FOS teal for voice/AI/technology, Kapas green for primary worker actions and Cotton Gold for agricultural progress/highlights.

Target composition:
- 60–70% neutral/cream/white;
- 10–15% PUWF green;
- 8–12% FOS teal;
- 3–7% Kapas green;
- 2–5% Gold/Orange.

Do not render every mobile header, card and button green. Do not build dashboard charts from multiple green shades.

## Mobile Components to Design

- Splash
- LanguageCard
- PrimaryActionCard
- VoiceQuestion
- AnswerCard
- ProgressIndicator
- VoiceRecorder
- AudioReplayButton
- PrivacyCard
- EvidenceCard
- ContactPreferenceCard
- EmergencyNotice
- AIProcessingState
- AIUnderstandingCard
- ComplaintReviewCard
- ComplaintStatusCard
- Timeline
- RightsTopicCard
- ErrorState
- OfflineState

## Web Components to Design

- PortalSidebar
- PortalTopbar
- MetricCard
- FilterBar
- ComplaintTable
- SearchField
- StatusBadge
- PriorityBadge
- CaseHeader
- VoiceEvidenceCard
- AIInsightCard
- EvidenceGallery
- CaseTimeline
- ActionRail
- ActionModal
- ResolutionCard
- AnalyticsCard
- EmptyState
- ErrorState

## Deliverables

- approved Figma design system
- component library
- mobile layouts
- web layouts
- responsive rules
- RTL patterns
- loading/error/empty states
- design tokens

## Exit Criteria

No major screen should enter development without an approved design or defined system pattern.

---

# PHASE 2 — Frontend Repository, Tooling and Shared Foundation

## Objective

Create the technical foundation for both applications.

## Recommended Monorepo

```text
kapas-ki-pukaar/
│
├── apps/
│   ├── mobile/
│   └── puwf-portal/
│
├── packages/
│   ├── domain/
│   ├── validation/
│   ├── localization/
│   ├── design-tokens/
│   ├── mock-data/
│   ├── mock-services/
│   ├── ai/
│   └── speech/
│
├── assets/
│   ├── audio/
│   ├── illustrations/
│   └── demo-evidence/
│
├── tooling/
│
└── docs/
```

## Technical Tasks

- configure pnpm workspace/Turborepo
- configure strict TypeScript
- configure ESLint
- configure formatting
- configure shared tsconfig
- configure Next.js
- configure Expo
- configure NativeWind
- configure Tailwind
- configure shadcn/ui
- configure Zustand
- configure TanStack Query
- configure React Hook Form
- configure Zod
- create environment variables
- set up automated build checks
- configure unit test framework
- configure Playwright
- define error boundaries
- define design token package

## Deliverables

- mobile app bootstraps
- web app bootstraps
- shared package imports work
- design tokens work
- routing works
- lint/build/test pipeline works

## Exit Criteria

Both applications successfully build, run and deploy to internal development environments.

---

# PHASE 3 — Domain Model, Dummy Data Engine and Mock Service Layer

## Objective

Ensure the entire frontend is built as if a real backend already existed.

## Core Rule

UI components must **never directly consume raw dummy data**.

Correct architecture:

```text
UI
↓
Feature Hook
↓
Service
↓
Repository
↓
Mock Repository
↓
Dummy Data
```

Later:

```text
UI
↓
Feature Hook
↓
Service
↓
REST API Repository
↓
Backend
```

## Core Domain Models

- Complaint
- Reporter
- AffectedWorker
- Incident
- Location
- Evidence
- VoiceEvidence
- AIAnalysis
- CaseAction
- StatusHistory
- Resolution
- WorkerFeedback
- RightsTopic
- AnalyticsSnapshot
- DemoScenario

## Dummy Dataset

Recommended:

**200 complaints**

Suggested mix:

- wages
- contractor misconduct
- pesticide exposure
- health and safety
- harassment
- child labour
- forced labour
- working hours
- sanitation
- discrimination
- other

Include:

- Punjab
- Sindh
- male/female users
- anonymous/confidential/identified
- every priority
- every status
- group grievances
- single-worker grievances
- completed and open cases

## Golden Scenarios

At minimum:

1. Wage Underpayment
2. Pesticide Emergency
3. Harassment / Confidential
4. Child Labour
5. Forced Labour
6. Group Wage Complaint
7. Sanitation
8. AI Low Confidence
9. AI Failure
10. Reopened Case

## Mock Services

- ComplaintService
- CaseManagementService
- AnalyticsService
- AIService
- SpeechService
- EvidenceService
- DemoService
- NotificationService

## Deliverables

- typed domain package
- deterministic seed generator
- mock complaint repository
- mock services
- golden scenario repository
- reset demo functionality
- analytics based on repository

## Exit Criteria

All future screens can consume data through services without importing raw JSON/arrays directly.

---

# PHASE 4 — Mobile App Shell, Localization and Accessibility Foundation

## Objective

Build the mobile application foundation before the complaint engine.

## Screens

- Splash
- Language Selection
- Welcome
- Home
- Draft Recovery
- Permission States

## Main Home Actions

1. **Report a Problem**
2. **Track My Complaint**
3. **Know Your Rights**
4. **Listen to This Screen**

## Localization

Primary:

**Urdu**

Alternate:

**English**

Architecture should allow later:

- Saraiki
- Sindhi
- Balochi

## RTL Requirements

Implement:

- RTL layout helpers
- locale switching
- correct directional icons
- LTR isolation for complaint IDs
- mixed Urdu/English handling
- RTL-safe progress navigation

## Accessibility

Implement from the beginning:

- large touch areas
- high contrast
- screen-reader labels
- large Urdu fonts
- proper focus
- clear error messages
- audio replay
- no colour-only meaning

## Deliverables

- mobile shell
- locale store
- Urdu translation infrastructure
- RTL
- navigation
- prompt playback framework
- accessibility baseline

## Exit Criteria

An unfamiliar worker can open the app and reach **Report a Problem** without training.

---

# PHASE 5 — Grievance Conversation Engine

## Objective

Build the complete one-question-at-a-time complaint intake.

## Core Journey

```text
Start Complaint
↓
Issue Category
↓
Category Questions
↓
Voice Description
↓
Incident Timing
↓
Location
↓
Others Affected
↓
Immediate Danger
↓
Privacy
↓
Evidence
↓
Safe Contact
↓
AI Understanding
↓
Review
↓
Submit
```

## Core Categories

- Wages
- Pesticide
- Health & Safety
- Harassment
- Child Labour
- Forced Labour
- Contractor Issue
- Working Hours
- Sanitation
- Discrimination
- Other

## Workflow Architecture

Do not hard-code all branching into pages.

Use a workflow configuration:

```ts
type QuestionNode = {
  id: string
  category: string
  promptKey: string
  answerType: string
  options?: AnswerOption[]
  next?: string | BranchRule[]
}
```

## Deterministic Safety Rules

Examples:

```text
Immediate Danger = Yes
→ Emergency

Child Labour
→ Minimum Critical

Forced Labour
→ Minimum Critical

Severe Pesticide Symptoms + Danger
→ Emergency
```

## Deliverables

- grievance state machine
- category-specific branching
- progress handling
- draft persistence
- back/forward handling
- validation
- group complaint logic
- priority rules

## Exit Criteria

Every primary grievance category can be completed from start through pre-submission review.

---

# PHASE 6 — Real Voice Recording, Audio Experience and Simulated AI

## Objective

Make Kapas ki Pukaar genuinely feel voice-enabled while keeping AI frontend-only.

## Real Voice Functions

The worker must be able to:

- permit microphone
- start recording
- stop recording
- replay recording
- delete recording
- record again

## Bundled Voice Prompts

Examples:

- welcome
- issue selection
- voice description
- danger
- privacy
- evidence
- submission
- success

Voice assets must work without a network connection.

## AI Simulation Pipeline

```text
Voice Recording
↓
"Understanding your voice..."
↓
Mock Transcription
↓
Mock Translation
↓
Mock Classification
↓
Mock Summary
↓
Mock Key Facts
↓
Mock Priority
↓
Deterministic Rule Check
↓
Worker Confirmation
```

## Mock AI Outputs

- Urdu transcript
- English translation
- category
- subcategory
- summary
- extracted amounts
- responsible party
- affected workers
- suggested priority
- confidence
- human-review flag

## Required AI Demo States

- normal
- low confidence
- partial understanding
- AI failure
- delayed response

## Critical Principle

AI is assistive.

Never display:

- AI Verdict
- Proven
- Guilty
- Complaint Confirmed

Use:

- AI Summary
- Suggested Category
- Suggested Priority
- Human Review Required

## Deliverables

- real audio recorder
- playback
- mock AI engine
- processing states
- confidence states
- failure states
- worker confirmation

## Exit Criteria

At least 10 predefined voice/demo scenarios produce distinct, realistic and deterministic AI outputs.

---

# PHASE 7 — Privacy, Evidence, Submission, Complaint Tracking and Worker Rights

## Objective

Complete the complainant-facing mobile app.

## Privacy Modes

### Anonymous
No identity required.

### Confidential
Identity may conceptually be known to PUWF, but the Phase 1 frontend only simulates this.

### Identified
Worker consents to identified handling.

## Safe Contact

Options:

- safe to call
- safe to message
- call only
- do not message
- no contact
- alternate contact

## Evidence

Frontend must support:

- photo picker
- document picker
- preview
- remove
- optional attachment

## Submission

The frontend must:

- validate required steps
- simulate submission delay
- generate unique complaint ID
- persist locally
- display success state

Example:

`KP-26-001248`

## Complaint Tracking

Worker view:

- complaint reference
- issue
- submitted date
- status
- latest update
- timeline

Worker-facing language must remain simple.

## Rights & Help

Suggested topics:

- Wage Rights
- Pesticide Safety
- Health & Safety
- Women at Work
- Child Labour
- Safe Reporting

Each topic:

- illustration
- short text
- voice explanation

## Deliverables

- privacy flow
- evidence UI
- submission
- reference generation
- tracking
- rights library
- local persistence

## Exit Criteria

The worker app is functionally complete end to end.

---

# PHASE 8 — Offline Behaviour and Local Persistence

## Objective

Demonstrate the intended rural/offline UX even without a backend.

## Required Simulation

```text
Internet Available
→ Normal

Simulated Offline
→ Worker continues complaint
→ Complaint saved locally
→ "Saved on this phone"

Simulated Reconnect
→ Queue processes
→ Complaint becomes Submitted
```

## Local State to Persist

- language
- active complaint draft
- recorded audio reference
- selected evidence metadata
- submitted complaints
- complaint statuses
- demo scenario state
- offline queue

## Demo Toggle

Hidden control:

**Simulate Offline Mode**

## Error Conditions

- local save failed
- microphone denied
- missing evidence file
- corrupted draft
- reconnect failed

## Deliverables

- local persistence strategy
- offline queue simulation
- recovery states
- draft restore
- reset logic

## Exit Criteria

A worker can close and reopen the app without losing an active saved grievance, subject to the defined prototype limitations.

---

# PHASE 9 — PUWF Portal Shell, Dashboard and Complaint Listing

## Objective

Build the compact operational PUWF portal.

## Portal Role

**PUWF Grievance Manager**

Do not create multiple portal roles in Phase 1.

## Page 1

# Dashboard + Complaints

## KPI Cards

- Total Complaints
- New
- Critical
- In Progress
- Overdue
- Resolved

## Charts

Maximum recommended first view:

- Complaints by Category
- Complaint Trend
- Status Distribution
- Geographic Distribution

## Complaint Table

Columns:

- ID
- Category
- Location
- Date
- Privacy
- Priority
- Status
- Last Action
- Action

## Filters

- search
- date
- category
- priority
- status
- location
- privacy mode

## Required Functions

- search
- sort
- filter
- paginate
- open complaint
- clear filters
- empty states

## Important Rule

All KPI and chart values must be calculated from the **same current complaint repository** as the table.

## Deliverables

- web shell
- sidebar
- topbar
- KPI cards
- chart cards
- table
- filters
- local persistence

## Exit Criteria

Dashboard, charts and complaint table reconcile exactly.

---

# PHASE 10 — PUWF Complaint Detail and Case Action Workspace

## Objective

Build the operational heart of the PUWF portal.

## Layout

### Main Case Area
- complaint summary
- category
- incident
- location
- affected workers
- privacy mode
- attachments

### Worker Voice
- play original audio
- waveform
- Urdu transcript
- English translation

### AI Case Intelligence
- AI summary
- suggested category
- suggested priority
- key facts
- confidence
- human-review flag

### Timeline
Chronological case events.

### Action Rail
Sticky where appropriate.

## PUWF Actions

Must work:

- Start Review
- Change Priority
- Add Internal Note
- Record Worker Contact
- Request More Information
- Add Investigation Finding
- Record Action Taken
- Escalate
- Propose Resolution
- Resolve
- Close
- Reopen

## Case Lifecycle

```text
New
↓
Under Review
↓
Action in Progress
↓
Proposed Resolution
↓
Resolved
↓
Closed
```

Conditional:

- Awaiting Worker
- Escalated
- Reopened

## Lifecycle Enforcement

Invalid transitions must be blocked by a frontend lifecycle service.

## Action Modals

Consequential actions require structured confirmation:

- reason
- note
- date
- optional supporting data

## Deliverables

- case workspace
- audio card
- AI card
- evidence
- timeline
- action forms
- lifecycle service
- local case mutations

## Exit Criteria

A complaint can move:

> New → Under Review → Action → Proposed Resolution → Resolved → Closed

entirely in the frontend.

---

# PHASE 11 — Analytics, Reports and Frontend Exports

## Objective

Provide credible programme analytics for PUWF/ILO demonstration.

## Analytics Areas

- complaints by category
- complaints by status
- complaints by priority
- complaints by province/district
- complaints by gender
- anonymous vs confidential vs identified
- group grievances
- complaint trend over time
- first-action time
- resolution time
- resolved/closed rates
- reopened cases
- worker feedback
- AI low-confidence cases

## Analytics Principle

More complaints do not automatically mean poorer performance.

The dashboard should distinguish:

- reporting/access
- risk/severity
- operational response
- remedy/outcome

## Filters

All analytics should respond to:

- date range
- category
- priority
- location
- status
- privacy mode

## CSV Export

Frontend can genuinely generate CSV from current dummy data.

## Deliverables

- analytics page
- reusable chart components
- filters
- KPI calculations
- CSV export
- reconciliation tests

## Exit Criteria

Changing complaint status or resetting dummy data produces corresponding analytics changes.

---

# PHASE 12 — Demo Orchestration, Cross-App Scenario Bridge and Presentation Readiness

## Objective

Create a reliable demonstration environment for PUWF and ILO.

## Important Limitation

Because Phase 1 has no backend, mobile and web cannot genuinely synchronise across devices.

Therefore create a **deterministic demo scenario bridge**.

## Example

Scenario:

`GS-01 — Wage Underpayment`

Mobile generates:

`KP-26-000101`

Web Demo Control Panel:

**Inject GS-01**

Portal then displays:

`KP-26-000101`

Both experiences use the same seeded scenario.

This simulates the intended end-to-end architecture without falsely claiming production data synchronisation.

## Demo Control Panel

Hidden from ordinary users.

Functions:

- Reset Demo Data
- Load Golden Scenario
- Inject Complaint
- Simulate Offline
- Simulate AI Delay
- Simulate AI Failure
- Set AI Confidence
- Advance Complaint Status
- Advance Worker Tracking
- Generate Additional Complaints

## Official Demo Scenarios

Prepare at least:

1. Wage Underpayment
2. Pesticide Emergency
3. Confidential Harassment
4. Child Labour
5. Complaint → PUWF Action → Resolution

## Flagship Demo Flow

```text
Worker
↓
Urdu
↓
Wage complaint
↓
Voice recording
↓
AI understanding
↓
Confidential
↓
Submit
↓
Complaint ID
↓
PUWF portal injects same scenario
↓
PUWF opens case
↓
Listens to voice
↓
Starts review
↓
Records action
↓
Proposes resolution
↓
Closes
↓
Worker tracking shows updated state
```

## Deliverables

- demo panel
- golden scenario controls
- deterministic IDs
- cross-app presentation script
- reset
- demo validation checklist

## Exit Criteria

All official demonstration journeys can be repeated without manual data editing.

---

# PHASE 13 — QA, Accessibility, UAT, Optimisation and Final Handover

## Objective

Convert the completed frontend into a stable, reviewable release.

## Functional QA

Test every:

- screen
- button
- branch
- filter
- search
- modal
- status
- priority
- timeline action
- audio function
- AI scenario
- local persistence state
- offline state

## Urdu QA

Test:

- RTL
- line wrapping
- mixed Urdu/English
- numbers
- complaint IDs
- directional icons
- long Urdu labels
- font scaling

## Accessibility QA

Test:

- screen-reader labels
- contrast
- keyboard navigation
- focus states
- large touch areas
- no colour-only meaning
- text scaling
- reduced motion

## Device QA

Mobile:

- low/mid-size Android
- small screen
- common screen
- large screen

Web:

- 1366×768
- 1440×900
- 1920×1080
- supported tablet widths

## Edge Cases

Test:

- microphone denied
- no audio
- AI failure
- AI low confidence
- missing attachment
- empty complaint list
- no filter results
- invalid lifecycle transition
- offline save
- reconnect
- corrupt local state
- reset demo

## Performance

Optimise:

- bundle size
- Urdu fonts
- audio assets
- illustrations
- lists
- charts
- table rendering
- unnecessary animations

## UAT

Recommended reviewers:

- FOS Product Lead
- FOS Tech Lead
- FOS QA
- PUWF grievance user
- PUWF management
- Urdu language reviewer
- representative worker testers where possible

## Deliverables

- QA report
- UAT report
- defect log
- accessibility checklist
- performance notes
- Release Candidate
- final documentation
- backend readiness notes

## Exit Criteria

No open blocker or critical defect.

---

# 6. Suggested Sprint Structure

Assuming approximately **two-week sprints**.

## Sprint 1 — Foundation

- scope baseline
- repo
- shared types
- design tokens
- localization skeleton
- navigation shells
- dummy data architecture

## Sprint 2 — Mobile Core

- home
- language
- grievance engine
- categories
- workflow state
- draft persistence

## Sprint 3 — Voice + AI + Privacy

- microphone
- audio
- voice prompts
- AI simulation
- privacy
- evidence
- safety rules

## Sprint 4 — Mobile Completion

- submission
- complaint tracking
- rights
- offline
- worker feedback
- mobile QA

## Sprint 5 — PUWF Portal Core

- dashboard
- KPI
- charts
- complaint list
- search/filter
- case detail shell

## Sprint 6 — PUWF Case Management

- audio review
- AI insight
- timeline
- actions
- lifecycle
- analytics
- export

## Sprint 7 — Demo + QA + UAT

- scenario bridge
- demo controls
- regression
- RTL
- accessibility
- optimisation
- UAT
- release

---

# 7. Recommended Delivery Timeline

With parallel mobile and web work:

**10–14 weeks**

Indicative:

| Area | Duration |
|---|---:|
| Scope + UX | 1–2 weeks |
| Architecture + Data Foundation | 1 week |
| Mobile Core | 3–4 weeks |
| PUWF Portal | 3–4 weeks |
| Demo/Analytics | 1–2 weeks |
| QA/UAT | 1–2 weeks |

Some phases overlap when dependencies are stable.

---

# 8. Recommended Team

| Role | Recommended Capacity |
|---|---|
| Product / Project Lead | 1 |
| Frontend Architect / Tech Lead | 1 |
| UI/UX Designer | 1 |
| React Native Developer | 1–2 |
| Next.js Developer | 1–2 |
| QA Engineer | 1 |
| Urdu / Content Reviewer | Part-time |

---

# 9. Development Governance

## Every Feature Must Have

- requirement ID
- screen ID
- approved design
- acceptance criteria
- developer owner
- QA test
- status

## Suggested Workflow

```text
Backlog
→ Ready for Design
→ Design Approved
→ Ready for Development
→ In Development
→ Code Review
→ QA
→ UAT Ready
→ Done
```

## Scope Change Rule

Any request involving:

- new user role
- new portal
- live backend
- live database
- real AI
- real SMS
- cross-device synchronisation
- production login
- external integration

must be formally logged as:

**Phase 2 / Change Request**

unless separately approved.

---

# 10. Definition of Frontend Complete

Frontend development is **not complete** when:

> all screens have been coded.

It is complete when the following end-to-end experience works:

```text
Worker opens app
↓
Selects Urdu
↓
Receives audio guidance
↓
Starts complaint
↓
Completes category-specific questions
↓
Records voice
↓
Simulated AI interprets grievance
↓
Worker selects privacy
↓
Worker reviews complaint
↓
Worker submits
↓
Complaint ID generated
↓
Complaint stored locally
↓
PUWF portal displays corresponding demo case
↓
PUWF listens to worker voice
↓
PUWF reviews AI summary
↓
PUWF starts review
↓
PUWF records actions
↓
PUWF proposes resolution
↓
PUWF resolves/closes
↓
Timeline updates
↓
Analytics update
↓
Worker tracking scenario reflects outcome
```

All of the above must work **without a production backend**.

---

# 11. Frontend Definition of Done

A feature is only Done when:

- UI matches approved design
- interaction works
- dummy data is supplied via service layer
- Urdu works
- RTL works
- validation works
- loading state exists
- empty state exists where applicable
- error state exists
- accessibility checks pass
- persistence behaviour is correct
- unit/integration test passes
- QA signs off

---

# 12. Key Architectural Rules

## Rule 1 — Do Not Couple UI to Dummy Data

Bad:

```ts
import { complaints } from "../dummyData"
```

Correct:

```ts
const { data } = useComplaints()
```

---

## Rule 2 — Do Not Put Workflow Logic in Components

Bad:

```ts
if (category === "child-labour") {
  setPriority("critical")
}
```

Correct:

```ts
priorityRulesService.reconcile(context)
```

---

## Rule 3 — Do Not Hard-Code Analytics

All metrics must derive from complaint repository state.

---

## Rule 4 — Do Not Hard-Code Urdu in Components

Use locale keys.

---

## Rule 5 — AI Must Be Replaceable

Frontend:

`MockAIService`

Later:

`ProductionAIService`

---

## Rule 6 — Original Voice Remains Visible

AI transcript is not the only complaint evidence.

---

## Rule 7 — Critical Safety Logic Is Deterministic

AI does not control emergency handling.

---

# 13. Major Risks and Controls

| Risk | Impact | Control |
|---|---|---|
| Developers convert mobile flow into long forms | High | Enforce one-question UX and design review |
| Urdu becomes unreadable | High | Urdu QA and font rules |
| Voice experience feels fake | High | Real recording + professional prompt audio |
| AI demo looks random | High | Golden scenario mapping |
| Dashboard numbers conflict | High | Single repository-derived analytics |
| Mobile and web appear "synchronised" without backend | High | Document scenario bridge clearly |
| Dummy data looks unrealistic | Medium | Controlled seed distribution |
| Sensitive complaints overexposed | High | Privacy-aware list/detail design |
| Scope expands into production backend | High | Change-control rule |
| Accessibility added too late | High | Accessibility included in Definition of Done |
| Portal becomes too large | Medium | Maintain one role and 2–3 page structure |

---

# 14. Four Formal Delivery Milestones

## Milestone 1 — Product & UX Blueprint

Deliver:

- approved documents
- approved design system
- complete screen designs
- workflow definition

## Milestone 2 — Worker App Functional

Deliver:

- complete worker flow
- real audio
- simulated AI
- privacy
- submission
- tracking
- rights
- offline simulation

## Milestone 3 — PUWF Portal Functional

Deliver:

- dashboard
- complaint list
- case workspace
- actions
- lifecycle
- analytics

## Milestone 4 — Complete Frontend Demonstration

Deliver:

- deterministic cross-app scenario
- complaint handling
- resolution
- analytics
- QA
- UAT
- release candidate

---

# 15. Final Executive Recommendation

FOS should treat this phase as the creation of a **production-quality functional frontend prototype**, not as a collection of mock screens.

The frontend must be engineered so that:

- business logic is explicit;
- grievance workflows are deterministic;
- voice interactions are real;
- AI interactions are simulated but believable;
- data is dummy but analytically coherent;
- PUWF actions are fully functional;
- local persistence makes the system feel real;
- demo scenarios are repeatable;
- accessibility is embedded;
- the future backend can replace mock services without redesigning the application.

The strongest success criterion is therefore not:

> “The mobile and web screens are complete.”

The correct success criterion is:

> **A worker and a PUWF grievance manager can experience the full intended Kapas ki Pukaar journey end to end, using realistic frontend behaviour and dummy data, with no production backend required.**

That should remain the Phase 1 development benchmark from project initiation through UAT.
