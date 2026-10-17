# Phase 12 — Demo Orchestration, Cross-App Scenario Bridge and Presentation Readiness

    **Document Type:** Phase Implementation Guide  
    **Product:** Kapas ki Pukaar  
    **Prepared for:** Pakistan United Workers Federation (PUWF)  
    **Technical Partner:** Fruit of Sustainability (FOS)  
    **Version:** 1.0  
    **Date:** 18 August 2026  
    **Phase Duration:** 3–4 working days  
    **Delivery Mode:** Frontend-only functional product with dummy data  
    **Purpose:** Create a repeatable demonstration environment that simulates worker-to-PUWF end-to-end behaviour without falsely implying production synchronisation.

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

- build hidden demo controls;
- load golden scenarios;
- inject matching portal complaints;
- simulate offline/AI delay/failure;
- advance worker tracking;
- prepare repeatable PUWF/ILO demo script.

## 4. Step-by-Step Implementation

### Step 1 — Create Demo Store

File:
`packages/mock-services/src/DemoService.ts`

State:
- activeScenarioId
- offline
- aiFailure
- aiDelay
- aiConfidenceOverride
- portalInjected
- workerTrackingStep

### Step 2 — Build Web Demo Control Panel

Route:
`/demo`

Controls:
- Reset
- Load Scenario
- Inject into Portal
- Advance Case
- Simulate AI Failure
- Simulate Low Confidence
- Simulate Offline
- Reconnect

### Step 3 — Build Mobile Hidden Demo Access

Possible:
- long press app version
- dev menu
- environment flag

Do not expose to normal worker UI.

### Step 4 — Deterministic Reference Mapping

Example:
- GS01 → KP-26-000101
- GS02 → KP-26-000102

### Step 5 — Cross-App Scenario Bridge

Because no backend exists:
- mobile loads scenario definition locally;
- web loads same scenario definition locally;
- shared scenario ID ensures content consistency.

### Step 6 — Create Flagship Demo Script

Document:
`docs/demo/ILO_PUWF_Demo_Script.md`

Flow:
- Urdu worker intake
- voice recording
- AI summary
- privacy
- submission
- portal injection
- PUWF action
- resolution
- worker tracking update

### Step 7 — Create Demo Reset Checklist

Before every external demo:
- reset data
- set scenario
- test microphone
- test audio
- verify portal totals
- verify browser zoom
- verify internet-independent assets

## 5. Relevant Technical/Reference Files

References:
- `08_Dummy_Data_and_Golden_Demo_Scenario_Specification.md`
- `09_Frontend_Technical_Architecture_and_Mock_Service_Contracts.md`
- `11_QA_UAT_Test_Plan_and_Definition_of_Done.md`

Implementation:
- `packages/mock-services/src/DemoService.ts`
- `packages/mock-data/src/scenarios/*`
- `apps/puwf-portal/src/app/demo/page.tsx`
- `apps/mobile/src/features/demo/*`
- `docs/demo/ILO_PUWF_Demo_Script.md`

## 6. Styling Rules

- Demo controls may be utilitarian and clearly marked as Demo.
- Do not show demo controls in production-like screenshots.
- External-facing flows remain fully branded.

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

    - Run each golden scenario from clean reset.
- Verify deterministic references.
- Verify portal injection matches mobile scenario.
- Verify AI failure toggle.
- Verify offline toggle.
- Verify reset returns canonical dashboard totals.
- Run complete flagship demo twice consecutively.

    ### Regression Rule
    Any change to a shared domain type, taxonomy, lifecycle status, design token, locale key or mock service contract requires regression testing of every consuming screen.


    ## Definition of Done for This Phase

    - [ ] Demo panel complete.
- [ ] Scenario bridge complete.
- [ ] Flagship script documented.
- [ ] Reset reliable.
- [ ] All official demo scenarios repeat successfully.

    The phase is not complete until all checklist items are met, blocking defects are closed and the phase exit review is signed off by the FOS product/technical owner.
