# Phase 10 — PUWF Complaint Detail and Case Action Workspace

    **Document Type:** Phase Implementation Guide  
    **Product:** Kapas ki Pukaar  
    **Prepared for:** Pakistan United Workers Federation (PUWF)  
    **Technical Partner:** Fruit of Sustainability (FOS)  
    **Version:** 1.1  
    **Date:** 19 August 2026  
    **Phase Duration:** 7–10 working days  
    **Delivery Mode:** Frontend-only functional product with dummy data  
    **Purpose:** Implement the operational case workspace, voice evidence, AI insights, timeline, case actions and lifecycle enforcement.

    ---

    ## 1. Phase Context

    This guide is part of the controlled frontend implementation baseline for **Kapas ki Pukaar**, a standalone voice-first grievance reporting product for cotton farm workers. It must remain separate from the PUWF Unified Workforce & Digital Operations Platform and must not create runtime/API/database dependencies on that product during this phase.

    The current development scope includes:
    - a complainant-focused mobile app;
    - one PUWF grievance-management role;
    - a 2–3 page PUWF web portal;
    - realistic dummy data;
    - local persistence;
    - real microphone recording and audio playback;
    - bundled Urdu voice prompts;
    - simulated AI/STT/translation/classification;
    - fully working frontend interactions;
    - no production backend, production database, live SMS, live OTP or production AI inference.

    ## 2. Mandatory Reference Documentation

    The implementation team must review the following files before starting work in this phase:

    - `01_Product_Requirements_Document_PRD.md`
- `02_Functional_Requirements_Specification_FRS.md`
- `03_Information_Architecture_and_Screen_Inventory.md`
- `04_User_Journeys_and_Grievance_Decision_Trees.md`
- `05_Grievance_Taxonomy_and_Case_Lifecycle_Specification.md`
- `06_UI_UX_Design_System_and_Localization_RTL_Guidelines.md`
- `07_Voice_Prompt_and_AI_Simulation_Specification.md`
- `08_Dummy_Data_and_Golden_Demo_Scenario_Specification.md`
- `09_Frontend_Technical_Architecture_and_Mock_Service_Contracts.md`
- `10_Analytics_KPI_Privacy_and_Accessibility_Specification.md`
- `11_QA_UAT_Test_Plan_and_Definition_of_Done.md`
- `12_Frontend_Development_Roadmap_and_Sprint_Plan.md`
- `Kapas_ki_Pukaar_End_to_End_Frontend_Development_Plan.md`

    Where this phase conflicts with any earlier draft, the latest approved PRD/FRS, lifecycle/taxonomy specification and this phase implementation guide take precedence.

    ---

## 3. Phase Objectives

- build case header and facts;
- play worker audio;
- display AI assistive analysis;
- show evidence;
- show chronological timeline;
- implement all PUWF actions;
- enforce valid lifecycle transitions;
- persist actions locally.

## 4. Step-by-Step Implementation

### Step 1 — Build Case Route

`apps/puwf-portal/src/app/complaints/[id]/page.tsx`

Load via:
`CaseManagementService.get(id)`

### Step 2 — Build Case Header

Show:
- reference
- category
- status
- priority
- privacy
- location
- submitted date

### Step 3 — Build Worker Voice Card

File:
`VoiceEvidenceCard.tsx`

Show:
- play original
- duration
- transcript
- translation
- AI confidence

### Step 4 — Build AI Insight Card

Show:
- AI Summary
- Suggested Category
- Suggested Priority
- Extracted Facts
- Human Review Required

### Step 5 — Build Evidence Gallery

Show dummy images/docs.
Avoid overexposing sensitive details in list-level views.

### Step 6 — Build Timeline

Every action appends:
- action type
- timestamp
- actor label
- note

### Step 7 — Build Sticky Action Rail

Actions:
- Start Review
- Change Priority
- Add Note
- Record Contact
- Request Info
- Add Finding
- Record Action
- Escalate
- Propose Resolution
- Resolve
- Close
- Reopen

### Step 8 — Build Action Modals

Consequential actions require:
- reason
- note
- confirmation

### Step 9 — Implement Lifecycle Service

File:
`packages/mock-services/src/CaseLifecycleService.ts`

Block invalid transitions.

### Step 10 — Persist Action Mutations

After each mutation:
- update complaint
- append timeline
- update updatedAt
- analytics changes automatically

### Step 11 — Implement Reopen

Require reason.
Status sequence:
Closed/Resolved → Reopened → Under Review

## 5. Relevant Technical/Reference Files

References:
- `05_Grievance_Taxonomy_and_Case_Lifecycle_Specification.md`
- `07_Voice_Prompt_and_AI_Simulation_Specification.md`
- `09_Frontend_Technical_Architecture_and_Mock_Service_Contracts.md`

Implementation:
- `apps/puwf-portal/src/app/complaints/[id]/page.tsx`
- `apps/puwf-portal/src/components/case/*`
- `packages/mock-services/src/CaseLifecycleService.ts`
- `packages/mock-services/src/CaseManagementService.ts`

## 6. Styling Rules

- Three-zone desktop layout.
- Action rail sticky.
- Original audio visually prominent.
- AI card uses FOS Teal + Soft Teal on a light page, not green authority styling.
- The case content canvas remains white/light; dark PUWF green should not spread from the sidebar into the workspace.
- Critical status uses restrained but strong red.
- Long internal notes remain readable.

## Implementation Rules

1. **Do not bypass the service layer.** Components must not import raw dummy arrays directly.
2. **Do not hard-code business logic into UI components.** Workflow, lifecycle and priority logic belong in dedicated configuration/services.
3. **Do not hard-code Urdu/English strings inside components.** Use localization keys.
4. **Do not hard-code analytics totals.** All KPI/chart values must derive from the live mock repository.
5. **Do not introduce backend scope.** Any production API/database/authentication work is Phase 2 unless explicitly approved.
6. **Do not redesign approved UX while coding.** Material UX changes require design/product review.
7. **Do not use red for ordinary negative choices.** Reserve it for danger, destructive actions and critical safeguarding states.
8. **Do not treat simulated AI as authoritative.** Use assistive labels such as Suggested Category and AI Summary.
9. **Do not discard user drafts silently.** Back navigation and app interruption must preserve state according to the persistence specification.
10. **Do not claim cross-device real-time synchronisation.** Phase 1 uses deterministic demo scenario bridging only.

    ## Testing Methods

    ### Unit Testing
    - Test deterministic rules, schema validation and helper functions with **Vitest**.

    ### Component Testing
    - Test major interactive components in isolated states: default, loading, error, disabled and success.

    ### Integration Testing
    - Test feature flows across service, repository, persistence and UI boundaries.

    ### End-to-End Testing
    - Use **Playwright** for web journeys and the agreed Expo/mobile test approach for critical mobile flows.

    ### Manual QA Focus for This Phase

    - Test every allowed lifecycle transition.
- Test invalid transitions are blocked.
- Test action modal validation.
- Test timeline ordering.
- Test refresh preserves mutations.
- Test audio playback.
- Test reopen flow.
- Test analytics updates after case changes.

    ### Regression Rule
    Any change to a shared domain type, taxonomy, lifecycle status, design token, locale key or mock service contract requires regression testing of every consuming screen.


    ## Definition of Done for This Phase

    - [ ] Case workspace complete.
- [ ] All case actions functional.
- [ ] Timeline functional.
- [ ] Lifecycle rules enforced.
- [ ] Audio and AI cards complete.
- [ ] Persistence verified.

    The phase is not complete until all checklist items are met, blocking defects are closed and the phase exit review is signed off by the FOS product/technical owner.
