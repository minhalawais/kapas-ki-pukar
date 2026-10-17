# Phase 3 — Domain Model, Dummy Data Engine and Mock Service Layer

    **Document Type:** Phase Implementation Guide  
    **Product:** Kapas ki Pukaar  
    **Prepared for:** Pakistan United Workers Federation (PUWF)  
    **Technical Partner:** Fruit of Sustainability (FOS)  
    **Version:** 1.0  
    **Date:** 18 August 2026  
    **Phase Duration:** 4–5 working days  
    **Delivery Mode:** Frontend-only functional product with dummy data  
    **Purpose:** Create the canonical frontend data model, deterministic seed data and backend-ready service/repository abstractions.

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

- define canonical types;
- implement Zod validation;
- generate 150–200 realistic dummy complaints;
- create repository interfaces;
- create mock service implementations;
- create golden demo scenarios;
- implement deterministic reset.

## 4. Step-by-Step Implementation

### Step 1 — Define Domain Types

File:
`packages/domain/src/complaint.ts`

Types:
- Complaint
- ComplaintDraft
- Reporter
- Incident
- Location
- Evidence
- VoiceEvidence
- AIAnalysis
- CaseAction
- Resolution
- WorkerFeedback

Separate files:
- `status.ts`
- `priority.ts`
- `privacy.ts`
- `taxonomy.ts`
- `scenario.ts`

### Step 2 — Define Enumerations from Approved Specifications

Use codes from:
`05_Grievance_Taxonomy_and_Case_Lifecycle_Specification.md`

Do not invent alternative labels.

### Step 3 — Create Validation Schemas

Files:
- `packages/validation/src/complaint.schema.ts`
- `packages/validation/src/action.schema.ts`
- `packages/validation/src/resolution.schema.ts`

Use Zod.

### Step 4 — Create Seed Generator

File:
`packages/mock-data/src/generateComplaints.ts`

Requirements:
- deterministic random seed;
- 200 complaints;
- realistic distributions;
- all categories;
- all statuses;
- all priorities;
- all privacy modes;
- Punjab/Sindh locations;
- significant female worker representation;
- group grievances.

### Step 5 — Create Golden Scenarios

Directory:
`packages/mock-data/src/scenarios/`

Files:
- `GS01_WageUnderpayment.ts`
- `GS02_PesticideEmergency.ts`
- `GS03_ConfidentialHarassment.ts`
- `GS04_ChildLabour.ts`
- `GS05_ForcedLabour.ts`
- `GS06_GroupWageComplaint.ts`
- `GS07_Sanitation.ts`
- `GS08_AILowConfidence.ts`
- `GS09_AIFailure.ts`
- `GS10_ReopenedCase.ts`

### Step 6 — Create Repository Interfaces

File:
`packages/mock-services/src/repositories/ComplaintRepository.ts`

Methods:
- list
- get
- save
- remove
- reset

Implement:
- mobile local repository
- web local repository

### Step 7 — Create Service Interfaces

Create:
- `ComplaintService.ts`
- `CaseManagementService.ts`
- `AnalyticsService.ts`
- `DemoService.ts`
- `EvidenceService.ts`

### Step 8 — Implement Local Persistence Adapters

Mobile:
- AsyncStorage or SQLite

Web:
- IndexedDB/localStorage

Use versioned storage keys:
`kkp:v1:*`

### Step 9 — Implement Reset

`DemoService.reset()`

Must:
- clear mutated data;
- reload canonical seed;
- clear active scenario;
- reset filters;
- reset AI flags;
- reset offline simulation.

### Step 10 — Seed QA Fixtures

Create:
`packages/mock-data/src/fixtures/qaFixtures.ts`

Include one case for every category/status/priority/privacy mode.

## 5. Relevant Technical/Reference Files

References:
- `05_Grievance_Taxonomy_and_Case_Lifecycle_Specification.md`
- `08_Dummy_Data_and_Golden_Demo_Scenario_Specification.md`
- `09_Frontend_Technical_Architecture_and_Mock_Service_Contracts.md`

Implementation files:
- `packages/domain/src/*`
- `packages/validation/src/*`
- `packages/mock-data/src/*`
- `packages/mock-services/src/*`

## 6. Styling References

No page styling is primary here, but dummy content must be compatible with:
- status badge variants from `06_UI_UX...`
- priority colour rules
- complaint table field lengths
- Urdu/English content lengths

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

    - Validate every generated complaint against Zod schema.
- Assert all category codes are valid.
- Assert every lifecycle status appears in seed fixtures.
- Assert reset returns exact baseline counts.
- Assert no real CNIC/phone data exists.
- Assert analytics-ready dates and locations are present.

    ### Regression Rule
    Any change to a shared domain type, taxonomy, lifecycle status, design token, locale key or mock service contract requires regression testing of every consuming screen.


    ## Definition of Done for This Phase

    - [ ] Canonical domain types approved.
- [ ] Seed generator produces deterministic dataset.
- [ ] Golden scenarios created.
- [ ] Repositories implemented.
- [ ] Mock services implemented.
- [ ] Reset verified.
- [ ] No component needs raw data imports.

    The phase is not complete until all checklist items are met, blocking defects are closed and the phase exit review is signed off by the FOS product/technical owner.
