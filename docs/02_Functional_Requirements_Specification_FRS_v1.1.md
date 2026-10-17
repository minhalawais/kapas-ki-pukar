# 02 — Functional Requirements Specification (FRS)

**Document ID:** KKP-FRS-002  
**Product:** Kapas ki Pukaar — Voice-Enabled Smart Grievance Reporting Application for Cotton Farm Workers  
**Prepared for:** Pakistan United Workers Federation (PUWF)  
**Technical Partner:** Fruit of Sustainability (FOS)  
**Version:** 1.1  
**Date:** 19 August 2026  
**Status:** Frontend Development Baseline  
**Phase:** Phase 1 — Complete Frontend with Dummy Data  
**Purpose:** Translate the approved product scope into testable frontend functional requirements with unique IDs and acceptance conditions.

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

## 2. Requirement Conventions

Priority:
- **M** — Must Have
- **S** — Should Have
- **C** — Could Have

Requirement states:
- Draft
- Approved
- Implemented
- QA Passed

Every requirement must be traceable to at least one UI screen and one QA test.

## 3. Mobile Foundation Requirements

| ID | Requirement | Priority | Acceptance |
|---|---|---:|---|
| MOB-001 | App shall launch to a branded splash screen. | M | Splash renders without broken assets and transitions to language/home flow. |
| MOB-002 | User shall be able to choose Urdu as primary language. | M | Urdu immediately applies to labels and layout direction. |
| MOB-003 | English shall be available as alternate language. | S | Language can switch without app restart. |
| MOB-004 | Urdu screens shall render RTL. | M | Text, layout and directional controls are correct. |
| MOB-005 | App shall persist selected language locally. | M | Relaunch retains language. |
| MOB-006 | Home shall prioritise Report a Problem. | M | Primary CTA is visually dominant and reachable in one tap. |
| MOB-007 | Home shall expose Track My Complaint. | M | User reaches complaint list/detail. |
| MOB-008 | Home shall expose Rights & Help. | S | User reaches awareness content. |
| MOB-009 | Major worker screens shall provide Listen Again. | M | Tapping replays the bundled prompt. |
| MOB-010 | Back navigation shall not unintentionally discard a complaint draft. | M | User receives safe navigation behaviour. |

## 4. Grievance Intake Requirements

| ID | Requirement | Priority | Acceptance |
|---|---|---:|---|
| GRV-001 | Worker shall start a new complaint without mandatory registration. | M | No login is required to begin. |
| GRV-002 | Intake shall follow one-question-at-a-time flow. | M | No long multi-field grievance form is used. |
| GRV-003 | Worker shall select a simple issue category through large illustrated cards. | M | Category selection is tap-based and accessible. |
| GRV-004 | System shall branch questions based on category. | M | Wage, pesticide, harassment, child labour and other flows differ. |
| GRV-005 | Worker shall be able to select Other Issue. | M | Flow allows voice description even without a listed category. |
| GRV-006 | Worker shall indicate when the incident occurred using simple options. | M | Today/Yesterday/This Week/Older/Not Sure supported. |
| GRV-007 | Worker shall indicate location using simple location choices. | M | Farm/village/district demo data selectable. |
| GRV-008 | Worker shall indicate whether other workers are affected. | M | Individual/group state saved. |
| GRV-009 | Group grievance shall support approximate affected-worker range. | S | 2–5, 6–20, 20+, Not Sure. |
| GRV-010 | Worker shall indicate whether anyone is currently in danger. | M | Answer triggers deterministic priority rules. |
| GRV-011 | Critical categories shall trigger protected priority floor. | M | Child labour/forced labour cannot be reduced to Standard by AI mock. |
| GRV-012 | Worker shall choose Anonymous, Confidential or Identified mode. | M | Choice is persisted in complaint draft. |
| GRV-013 | Privacy options shall include voice explanation. | M | Each mode can be listened to. |
| GRV-014 | Identified/confidential modes shall allow optional safe contact details. | S | Worker can add or skip contact. |
| GRV-015 | Worker shall specify whether it is safe to receive a message/call. | S | Contact preference stored locally. |
| GRV-016 | Worker shall be able to attach a photo/document from device picker. | S | Attachment preview/remove works. |
| GRV-017 | Evidence attachment shall be optional. | M | Complaint can submit without evidence. |
| GRV-018 | System shall preserve grievance draft locally until submitted/discarded. | M | Relaunch returns recoverable draft. |

## 5. Voice Requirements

| ID | Requirement | Priority | Acceptance |
|---|---|---:|---|
| VOC-001 | App shall request microphone permission before recording. | M | Clear permission state shown. |
| VOC-002 | Worker shall be able to start recording. | M | Recording timer/visual state changes. |
| VOC-003 | Worker shall be able to stop recording. | M | Audio file/state is created locally. |
| VOC-004 | Worker shall be able to replay recording. | M | Playback works through app controls. |
| VOC-005 | Worker shall be able to delete and re-record. | M | Old recording removed from draft state. |
| VOC-006 | App shall provide clear recording-state feedback. | M | Idle/recording/processing/complete states distinct. |
| VOC-007 | App shall play bundled Urdu voice prompts. | M | Prompt playback works offline. |
| VOC-008 | Audio prompt shall not be mandatory to complete screen. | M | Visual interaction remains available. |
| VOC-009 | Microphone-denied state shall provide recovery guidance. | M | User can retry/open settings. |
| VOC-010 | Simulated transcription shall not replace original audio. | M | Original audio remains accessible. |

## 6. AI Simulation Requirements

| ID | Requirement | Priority | Acceptance |
|---|---|---:|---|
| AI-001 | Frontend shall simulate transcription after voice input. | M | Deterministic scenario transcript appears after brief processing state. |
| AI-002 | Frontend shall simulate English translation. | S | Translation card appears in PUWF view. |
| AI-003 | Frontend shall simulate complaint category suggestion. | M | Suggested category matches scenario. |
| AI-004 | Frontend shall simulate subcategory extraction. | M | Structured output stored in AIAnalysis. |
| AI-005 | Frontend shall simulate complaint summary. | M | Summary is readable and concise. |
| AI-006 | Frontend shall simulate key-fact extraction. | M | Amounts, actor, location or affected group shown when relevant. |
| AI-007 | Frontend shall simulate priority recommendation. | M | Output cannot override hard safety rules. |
| AI-008 | AI outputs shall display as assistive suggestions. | M | Labels use Suggested/AI Summary, not Decision. |
| AI-009 | AI confidence shall be displayable. | S | High/medium/low or numeric confidence shown. |
| AI-010 | Low-confidence scenario shall show Human Review Required. | S | Portal displays warning. |
| AI-011 | AI failure state shall be demonstrable. | S | UI shows fallback without blocking complaint. |
| AI-012 | Worker shall review a simple complaint understanding before final submission. | M | Worker can confirm or go back. |

## 7. Submission and Tracking Requirements

| ID | Requirement | Priority | Acceptance |
|---|---|---:|---|
| SUB-001 | App shall validate required complaint steps before submission. | M | Missing mandatory data blocks final submit. |
| SUB-002 | App shall generate a local complaint reference. | M | Format such as KP-26-001248. |
| SUB-003 | Submission shall show a realistic processing state. | M | Short delay then success state. |
| SUB-004 | Successful complaint shall persist locally. | M | Complaint visible after relaunch. |
| SUB-005 | Worker shall see complaint reference on success screen. | M | Reference is clear and copyable where appropriate. |
| SUB-006 | Worker shall see complaint list. | M | Locally submitted complaints displayed. |
| SUB-007 | Worker shall open complaint detail. | M | Summary, status and timeline shown. |
| SUB-008 | Worker status labels shall use plain language. | M | No internal technical jargon. |
| SUB-009 | Anonymous demo complaints may use a local PIN simulation. | C | PIN shown/stored locally for demo. |
| SUB-010 | Worker shall be able to provide resolution feedback in scenarios that reach resolution. | S | Satisfied/Partially/Not Satisfied supported. |

## 8. Offline Simulation Requirements

| ID | Requirement | Priority | Acceptance |
|---|---|---:|---|
| OFF-001 | Demo mode shall allow simulated offline state. | S | Toggle changes connectivity state. |
| OFF-002 | Worker shall continue drafting while simulated offline. | S | Answers/audio remain local. |
| OFF-003 | Offline submission shall become Saved on Device. | S | User receives clear status. |
| OFF-004 | Simulated reconnection shall allow queued complaint to move to Submitted. | S | Local state transitions correctly. |
| OFF-005 | Offline prompt audio shall remain available. | S | Bundled audio plays without network. |

## 9. Rights and Awareness Requirements

| ID | Requirement | Priority | Acceptance |
|---|---|---:|---|
| RGT-001 | Rights & Help section shall contain short topic cards. | S | At least wage, pesticide, safety, women, child labour and safe reporting. |
| RGT-002 | Topic shall support audio explanation. | S | Bundled audio playable. |
| RGT-003 | Content shall use simple worker language. | M | No dense legal copy required. |

## 10. PUWF Portal Foundation Requirements

| ID | Requirement | Priority | Acceptance |
|---|---|---:|---|
| WEB-001 | Portal shall provide one Phase 1 operational role. | M | One grievance-manager experience. |
| WEB-002 | Portal shall use desktop-first responsive layout. | M | Works at agreed desktop/tablet widths. |
| WEB-003 | Core navigation shall contain Dashboard/Complaints, Analytics and minimal supporting items. | M | No unnecessary enterprise menu. |
| WEB-004 | Portal shall persist mock case changes locally. | M | Refresh preserves user changes. |
| WEB-005 | Portal shall provide Reset Demo Data. | M | Seed dataset restored deterministically. |

## 11. Dashboard and Complaint List Requirements

| ID | Requirement | Priority | Acceptance |
|---|---|---:|---|
| DSH-001 | Dashboard shall display Total, New, Critical, In Progress, Overdue and Resolved KPIs. | M | Values derive from dataset. |
| DSH-002 | Dashboard shall display grievance category distribution. | M | Chart derives from dataset. |
| DSH-003 | Dashboard shall display complaint trend over time. | M | Chart derives from submitted dates. |
| DSH-004 | Dashboard shall display status distribution. | S | Values reconcile with complaint list. |
| DSH-005 | Dashboard shall display geographic distribution or map/chart. | S | Uses safe aggregate demo locations. |
| DSH-006 | Complaint list shall support search. | M | ID/category/location searchable. |
| DSH-007 | Complaint list shall support status filter. | M | Results update correctly. |
| DSH-008 | Complaint list shall support priority filter. | M | Results update correctly. |
| DSH-009 | Complaint list shall support category filter. | M | Results update correctly. |
| DSH-010 | Complaint list shall support date filter. | S | Range filtering works. |
| DSH-011 | Complaint list shall support sorting. | M | At least date/priority/status. |
| DSH-012 | Complaint list shall support pagination or virtualised browsing. | M | Large seed dataset remains usable. |
| DSH-013 | Clicking a complaint shall open case workspace. | M | Correct case loads. |

## 12. Case Workspace Requirements

| ID | Requirement | Priority | Acceptance |
|---|---|---:|---|
| CASE-001 | Case workspace shall show complaint identity and priority. | M | Header includes reference/category/status/priority. |
| CASE-002 | Workspace shall show privacy mode. | M | Anonymous/confidential/identified visible. |
| CASE-003 | Workspace shall show original worker audio when available. | M | Play controls functional. |
| CASE-004 | Workspace shall show Urdu transcript. | M | Scenario transcript visible. |
| CASE-005 | Workspace shall show English translation if available. | S | Toggle/card visible. |
| CASE-006 | Workspace shall show AI summary. | M | Visually distinct assistive card. |
| CASE-007 | Workspace shall show AI-extracted facts. | M | Structured facts displayed. |
| CASE-008 | Workspace shall show evidence gallery. | S | Dummy evidence previews supported. |
| CASE-009 | Workspace shall show chronological timeline. | M | All actions append to timeline. |
| CASE-010 | PUWF shall start review. | M | Status/timeline updates. |
| CASE-011 | PUWF shall change priority. | M | Priority and timeline update. |
| CASE-012 | PUWF shall add internal note. | M | Note persists locally. |
| CASE-013 | PUWF shall record contact attempt. | M | Timeline event created. |
| CASE-014 | PUWF shall request more information. | S | Status/action reflected. |
| CASE-015 | PUWF shall record investigation finding. | M | Structured or note action stored. |
| CASE-016 | PUWF shall record action taken. | M | Action visible in timeline. |
| CASE-017 | PUWF shall escalate case. | M | Status and reason stored. |
| CASE-018 | PUWF shall propose resolution. | M | Resolution detail stored. |
| CASE-019 | PUWF shall mark resolved. | M | Lifecycle rules enforced. |
| CASE-020 | PUWF shall close case. | M | Closure reason required. |
| CASE-021 | PUWF shall reopen case. | S | Case returns to active state with reason. |
| CASE-022 | Case actions shall use confirmation/modal where consequential. | M | Resolve/close/escalate require explicit confirmation. |

## 13. Analytics Requirements

| ID | Requirement | Priority | Acceptance |
|---|---|---:|---|
| ANL-001 | Analytics shall derive from complaint dataset, not hard-coded totals. | M | Reconciliation test passes. |
| ANL-002 | Analytics shall show category trends. | M | Correct grouped data. |
| ANL-003 | Analytics shall show location trends. | S | Aggregate district/region only. |
| ANL-004 | Analytics shall show priority distribution. | M | Correct counts. |
| ANL-005 | Analytics shall show privacy-mode distribution. | S | Correct counts. |
| ANL-006 | Analytics shall show resolution performance. | S | Uses lifecycle timestamps. |
| ANL-007 | Analytics shall support CSV export. | S | Frontend creates downloadable CSV. |

## 14. Demo Orchestration Requirements

| ID | Requirement | Priority | Acceptance |
|---|---|---:|---|
| DEM-001 | Hidden Demo Control Panel shall exist in demo build. | M | Not visible in normal worker flow. |
| DEM-002 | Demo panel shall reset data. | M | Seed state restored. |
| DEM-003 | Demo panel shall load golden scenario. | M | Selected scenario becomes available. |
| DEM-004 | Demo panel shall simulate offline mode. | S | Connectivity banners/states work. |
| DEM-005 | Demo panel shall simulate AI delay/failure. | S | Relevant UI states shown. |
| DEM-006 | Demo panel shall inject matching complaint into portal for cross-app demonstration. | M | Deterministic scenario bridge works. |

## 15. Global Frontend Requirements

| ID | Requirement | Priority | Acceptance |
|---|---|---:|---|
| GLB-001 | All primary screens shall have loading, empty and error states where applicable. | M | QA checklist passes. |
| GLB-002 | Status shall not be represented by colour alone. | M | Text/icon accompanies colour. |
| GLB-003 | Critical red shall be reserved for danger/destructive states. | M | Ordinary No action uses neutral styling. |
| GLB-004 | Shared design tokens shall be used. | M | No uncontrolled colour drift. |
| GLB-005 | Components shall consume services, not raw dummy files directly. | M | Architecture review passes. |
| GLB-006 | TypeScript shall use strict mode. | M | Build passes. |
| GLB-007 | Major actions shall be keyboard accessible on web. | M | Accessibility QA passes. |
| GLB-008 | Mobile interactive controls shall meet agreed large-touch target rules. | M | Accessibility QA passes. |
| GLB-009 | Neutral/cream/white surfaces shall dominate normal mobile and portal content areas. | M | Visual QA confirms the approved composition model and no green-heavy page treatment. |
| GLB-010 | PUWF Sovereign Green shall be used as an institutional anchor, not as the default background for normal mobile content. | M | Dark green is limited to approved institutional/high-emphasis areas. |
| GLB-011 | Voice, recording, waveform and AI-assistive interaction states shall use FOS Teal as the principal accent. | M | Voice/AI components use the approved teal token family. |
| GLB-012 | KPI cards shall remain neutral/white and use small accent icons rather than full-card saturated fills. | M | Dashboard visual QA passes. |
| GLB-013 | Charts shall use a mixed data-visualisation palette and shall not rely primarily on shades of green. | M | Chart colour audit passes. |
| GLB-014 | Cotton Gold and FOS Orange shall remain secondary agricultural/data-visualisation accents and shall not replace primary action colours. | M | Design-token and visual QA passes. |
