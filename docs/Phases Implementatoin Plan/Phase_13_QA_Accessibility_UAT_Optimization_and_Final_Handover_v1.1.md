# Phase 13 — QA, Accessibility, UAT, Optimisation and Final Handover

    **Document Type:** Phase Implementation Guide  
    **Product:** Kapas ki Pukaar  
    **Prepared for:** Pakistan United Workers Federation (PUWF)  
    **Technical Partner:** Fruit of Sustainability (FOS)  
    **Version:** 1.1  
    **Date:** 19 August 2026  
    **Phase Duration:** 7–10 working days  
    **Delivery Mode:** Frontend-only functional product with dummy data  
    **Purpose:** Stabilise the frontend release, complete regression/accessibility/UAT, optimise performance and prepare the backend-ready handover.

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

- complete functional QA;
- complete RTL and language QA;
- complete accessibility review;
- complete responsive/device QA;
- close blocking defects;
- run PUWF UAT;
- optimise performance;
- produce release candidate and handover.

## 4. Step-by-Step Implementation

### Step 1 — Freeze Feature Scope

No new features after Release Candidate branch except approved blocker fixes.

### Step 2 — Run Requirement Traceability QA

For every Must-Have FRS item:
- requirement
- screen
- test
- result

### Step 3 — Mobile Regression

Test:
- onboarding
- language
- all grievance categories
- voice
- AI
- privacy
- evidence
- submission
- tracking
- rights
- offline
- persistence

### Step 4 — Portal Regression

Test:
- dashboard
- filters
- table
- case actions
- lifecycle
- timeline
- analytics
- CSV
- demo reset

### Step 5 — RTL/Urdu QA

Check:
- truncation
- line wrapping
- numbers
- IDs
- mirrored arrows
- font scaling
- mixed Urdu/English

### Step 6 — Accessibility QA

Web:
- keyboard-only
- focus
- labelled inputs
- dialogs
- semantic table

Mobile:
- screen-reader labels
- touch size
- contrast
- large text
- non-colour meaning

### Step 7 — Performance

Optimise:
- image sizes
- audio compression
- font loading
- lazy components
- table rendering
- chart rendering
- unnecessary re-renders
- bundle size

### Step 8 — Device/Browser Matrix

Mobile:
- small Android
- mid Android
- large Android

Web:
- Chrome
- Edge
- target supported modern browsers
- 1366x768
- 1440x900
- 1920x1080

### Step 9 — UAT

Use scenarios from:
`11_QA_UAT_Test_Plan_and_Definition_of_Done.md`

Collect:
- participant
- scenario
- result
- defect
- severity
- acceptance

### Step 10 — Defect Closure

No P0/P1 open before final sign-off.

### Step 11 — Prepare Final Documentation

Handover:
- source
- build instructions
- environment guide
- design source
- seed data
- demo guide
- test report
- UAT report
- known limitations
- Phase 2 integration notes

### Step 12 — Tag Release

Suggested:
`v1.0-frontend-demo`

## 5. Relevant Technical/Reference Files

References:
- `11_QA_UAT_Test_Plan_and_Definition_of_Done.md`
- all phase guides
- all 12 baseline documents

Implementation/support:
- `docs/qa/regression_report.md`
- `docs/qa/accessibility_report.md`
- `docs/qa/uat_report.md`
- `docs/release/known_limitations.md`
- `docs/release/backend_readiness.md`
- `CHANGELOG.md`

## 6. Styling Review

Final visual QA must verify:
- token consistency;
- no rogue colours;
- neutral/cream/white surfaces visibly dominate normal screens;
- no green-heavy mobile pages;
- FOS Teal clearly owns voice/AI states;
- PUWF deep green is concentrated in institutional areas;
- charts are not composed mainly of green shades;
- consistent radius/shadow;
- consistent Urdu type;
- no broken RTL;
- mobile and web clearly share product identity.

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

    - Run full regression suite.
- Run all golden scenarios.
- Run analytics reconciliation.
- Run keyboard-only portal QA.
- Run large-text mobile QA.
- Run fresh-install mobile test.
- Run local persistence upgrade/reset test.
- Run external demo rehearsal.

    ### Regression Rule
    Any change to a shared domain type, taxonomy, lifecycle status, design token, locale key or mock service contract requires regression testing of every consuming screen.


    ## Definition of Done for This Phase

    - [ ] No P0/P1 defects open.
- [ ] All Must-Have FRS requirements pass.
- [ ] Accessibility review signed off.
- [ ] RTL review signed off.
- [ ] PUWF UAT completed.
- [ ] Release package prepared.
- [ ] Frontend v1.0 tagged and archived.

    The phase is not complete until all checklist items are met, blocking defects are closed and the phase exit review is signed off by the FOS product/technical owner.

### Visual Balance Screenshot Set

Capture and approve screenshots for:
- Mobile Home
- Issue Category
- Voice Recording
- Privacy
- AI Summary
- Submission Success
- PUWF Dashboard
- Complaint Workspace
- Analytics

Reviewer must explicitly answer:
1. Does the screen look green-heavy?
2. Is FOS Teal visible where voice/AI/technology is involved?
3. Is PUWF Green clearly institutional rather than universal?
4. Is Cotton Gold used only as a restrained agriculture/progress accent?
5. Is the content canvas predominantly light?
