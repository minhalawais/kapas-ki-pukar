# Phase 11 — Analytics, Reports and Frontend Exports

    **Document Type:** Phase Implementation Guide  
    **Product:** Kapas ki Pukaar  
    **Prepared for:** Pakistan United Workers Federation (PUWF)  
    **Technical Partner:** Fruit of Sustainability (FOS)  
    **Version:** 1.1  
    **Date:** 19 August 2026  
    **Phase Duration:** 4–6 working days  
    **Delivery Mode:** Frontend-only functional product with dummy data  
    **Purpose:** Implement analytics, KPI formulas, filters, programme reporting views and real frontend CSV export from dummy data.

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

- implement analytics page;
- implement KPI formulas;
- implement filter context;
- implement charts;
- implement CSV export;
- ensure analytical reconciliation.

## 4. Step-by-Step Implementation

### Step 1 — Build Analytics Route

`apps/puwf-portal/src/app/analytics/page.tsx`

### Step 2 — Build Shared Filter Context

Filters:
- date
- category
- status
- priority
- location
- privacy
- gender

### Step 3 — Implement KPI Selectors

File:
`packages/mock-services/src/analyticsSelectors.ts`

Functions:
- totalComplaints
- openCases
- resolutionRate
- criticalRate
- averageFirstAction
- averageResolution
- reopenRate

### Step 4 — Build Charts

Recommended:
- category trend
- status distribution
- priority distribution
- geography
- privacy mode
- gender
- worker outcome
- AI confidence/human review

### Step 5 — Build Reporting Cards

Include explanatory context where needed.
Do not imply lower complaint count = success.

### Step 6 — Implement CSV Export

File:
`packages/mock-services/src/exportCsv.ts`

CSV uses current filters.

### Step 7 — Reconciliation Tests

Every filtered chart total must reconcile with filtered complaint count.

### Step 8 — Handle Small/Zero Data

Show meaningful empty states.

## 5. Relevant Technical/Reference Files

References:
- `10_Analytics_KPI_Privacy_and_Accessibility_Specification.md`
- `08_Dummy_Data_and_Golden_Demo_Scenario_Specification.md`

Implementation:
- `apps/puwf-portal/src/app/analytics/page.tsx`
- `apps/puwf-portal/src/components/analytics/*`
- `packages/mock-services/src/AnalyticsService.ts`
- `packages/mock-services/src/exportCsv.ts`

## 6. Styling Rules

- Use the approved mixed chart palette: FOS Teal, Cotton Gold, Information Blue, PUWF Emerald, FOS Orange and Neutral Grey.
- Do not use more than two green-family series in one chart.
- Do not overuse gradients.
- Charts need legends/text.
- Critical red only for severe categories/priority.

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

    - Reconcile totals before and after filters.
- Reconcile totals after case status mutation.
- Test zero-data filters.
- Test CSV row count and fields.
- Test keyboard and screen-reader labels on filters.
- Test chart responsiveness.

    ### Regression Rule
    Any change to a shared domain type, taxonomy, lifecycle status, design token, locale key or mock service contract requires regression testing of every consuming screen.


    ## Definition of Done for This Phase

    - [ ] Analytics page complete.
- [ ] All formulas documented in code/tests.
- [ ] Filters consistent.
- [ ] CSV export works.
- [ ] Reconciliation passes.
- [ ] No hard-coded KPI totals.

    The phase is not complete until all checklist items are met, blocking defects are closed and the phase exit review is signed off by the FOS product/technical owner.
