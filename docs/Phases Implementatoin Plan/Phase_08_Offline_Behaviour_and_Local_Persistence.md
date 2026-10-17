# Phase 8 — Offline Behaviour and Local Persistence

    **Document Type:** Phase Implementation Guide  
    **Product:** Kapas ki Pukaar  
    **Prepared for:** Pakistan United Workers Federation (PUWF)  
    **Technical Partner:** Fruit of Sustainability (FOS)  
    **Version:** 1.0  
    **Date:** 18 August 2026  
    **Phase Duration:** 4–5 working days  
    **Delivery Mode:** Frontend-only functional product with dummy data  
    **Purpose:** Implement the frontend-only offline experience, local queue simulation, draft recovery and persistence resilience.

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

- simulate offline state;
- allow grievance continuation offline;
- save drafts locally;
- queue local submission;
- simulate reconnect;
- recover from interruption;
- provide clear worker-facing states.

## 4. Step-by-Step Implementation

### Step 1 — Create Connectivity Store

File:
`apps/mobile/src/stores/connectivityStore.ts`

States:
- online
- offline-demo
- reconnecting

### Step 2 — Create Offline Banner

Do not use technical jargon.

Worker copy should communicate:
- no internet
- your complaint is saved
- it will be sent later

### Step 3 — Create Local Submission Queue

File:
`apps/mobile/src/services/offlineQueueService.ts`

Queue item:
- complaint draft snapshot
- local media references
- createdAt
- retry count
- status

### Step 4 — Offline Submit Behaviour

When offline:
- validate locally
- save complaint as `Saved on Device`
- do not mark network-submitted
- show local reference if desired by approved spec

### Step 5 — Reconnect Simulation

On reconnect:
- process queue
- simulate delay
- mark Submitted
- add timeline event

### Step 6 — Draft Recovery

On app launch:
- detect unfinished draft
- offer resume/discard

### Step 7 — Persistence Versioning

Use keys such as:
- `kkp:v1:locale`
- `kkp:v1:draft`
- `kkp:v1:complaints`
- `kkp:v1:offlineQueue`

### Step 8 — Recovery from Schema Change

If stored schema version mismatches:
- migrate if safe
- otherwise notify demo/dev and reset controlled data

### Step 9 — Demo Controls

Add:
- Simulate Offline
- Simulate Reconnect
- Queue One Complaint
- Process Queue

## 5. Relevant Technical/Reference Files

References:
- `01_Product_Requirements_Document_PRD.md`
- `09_Frontend_Technical_Architecture_and_Mock_Service_Contracts.md`
- `11_QA_UAT_Test_Plan_and_Definition_of_Done.md`

Implementation:
- `apps/mobile/src/stores/connectivityStore.ts`
- `apps/mobile/src/services/offlineQueueService.ts`
- `apps/mobile/src/services/localPersistence.ts`
- `packages/mock-services/src/DemoService.ts`

## 6. Styling Rules

- Offline state uses warning/neutral, not critical red.
- “Saved on phone” must look reassuring.
- Reconnect processing uses restrained progress.

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

    - Create complaint fully while offline.
- Kill/relaunch app and recover draft.
- Reconnect and process queue.
- Verify no duplicate complaint after retry.
- Verify reset clears queue.
- Verify bundled audio works offline.

    ### Regression Rule
    Any change to a shared domain type, taxonomy, lifecycle status, design token, locale key or mock service contract requires regression testing of every consuming screen.


    ## Definition of Done for This Phase

    - [ ] Offline demo toggle works.
- [ ] Drafts persist.
- [ ] Queue persists.
- [ ] Reconnect works.
- [ ] No duplicate submissions in simulation.
- [ ] Recovery UX approved.

    The phase is not complete until all checklist items are met, blocking defects are closed and the phase exit review is signed off by the FOS product/technical owner.
