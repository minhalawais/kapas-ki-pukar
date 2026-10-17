# Phase 9 — PUWF Portal Shell, Dashboard and Complaint Listing

    **Document Type:** Phase Implementation Guide  
    **Product:** Kapas ki Pukaar  
    **Prepared for:** Pakistan United Workers Federation (PUWF)  
    **Technical Partner:** Fruit of Sustainability (FOS)  
    **Version:** 1.1  
    **Date:** 19 August 2026  
    **Phase Duration:** 6–8 working days  
    **Delivery Mode:** Frontend-only functional product with dummy data  
    **Purpose:** Build the web portal shell, operational KPIs, complaint table, search/filter/sort and repository-derived dashboard analytics.

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

- implement one-role PUWF shell;
- implement dashboard KPIs;
- implement 2–4 charts;
- implement complaint table;
- implement search/filter/sort/pagination;
- ensure all data derives from repository.

## 4. Step-by-Step Implementation

### Step 1 — Build Portal Layout

Files:
- `apps/puwf-portal/src/app/layout.tsx`
- `apps/puwf-portal/src/components/layout/PortalSidebar.tsx`
- `PortalTopbar.tsx`

Sidebar:
- Dashboard & Complaints
- Analytics

Hidden:
- Demo Controls

### Step 2 — Build KPI Cards

Metrics:
- Total
- New
- Critical
- In Progress
- Overdue
- Resolved

Create:
`MetricCard.tsx`

### Step 3 — Create Analytics Selectors

File:
`packages/mock-services/src/analyticsSelectors.ts`

Derive all KPI values from current complaint repository.

### Step 4 — Build Compact Charts

Recommended:
- category distribution
- complaint trend
- status distribution
- geography

### Step 5 — Build Complaint Table

Use:
- TanStack Table

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

### Step 6 — Build Filter Bar

Filters:
- text search
- category
- status
- priority
- location
- privacy
- date range

### Step 7 — Build Sorting/Pagination

At minimum:
- submitted date
- priority
- status

### Step 8 — Build Empty/Error States

- no complaints
- no filtered results
- repository error

### Step 9 — Persist Web Mutations/State

Persist demo case mutations.
Filter persistence may be optional.

## 5. Relevant Technical/Reference Files

References:
- `03_Information_Architecture_and_Screen_Inventory.md`
- `06_UI_UX_Design_System_and_Localization_RTL_Guidelines.md`
- `10_Analytics_KPI_Privacy_and_Accessibility_Specification.md`

Implementation:
- `apps/puwf-portal/src/app/dashboard/page.tsx`
- `apps/puwf-portal/src/components/dashboard/*`
- `apps/puwf-portal/src/components/complaints/ComplaintTable.tsx`
- `packages/mock-services/src/AnalyticsService.ts`

## 6. Styling Rules

- PUWF Sovereign Green is concentrated in the sidebar/institutional anchor.
- Main content canvas remains white/soft neutral.
- KPI cards remain white/neutral with small mixed-colour icon accents.
- FOS Teal is used for secondary/technology/voice-related accents.
- Use semantic icons/chips, not full-card colour fills.
- Charts must use a mixed Teal/Gold/Blue/Emerald/Orange palette rather than multiple green shades.
- Dashboard must feel operational, not promotional.

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

    - Verify all KPI totals reconcile with complaint repository.
- Verify filters combine correctly.
- Verify search finds reference/category/location.
- Verify sorting is stable.
- Verify pagination works on 200 records.
- Verify empty states.
- Verify keyboard navigation.

    ### Regression Rule
    Any change to a shared domain type, taxonomy, lifecycle status, design token, locale key or mock service contract requires regression testing of every consuming screen.


    ## Definition of Done for This Phase

    - [ ] Portal shell complete.
- [ ] KPI cards complete.
- [ ] Charts complete.
- [ ] Complaint table complete.
- [ ] Filters/search/sort complete.
- [ ] Reconciliation tests pass.

    The phase is not complete until all checklist items are met, blocking defects are closed and the phase exit review is signed off by the FOS product/technical owner.
