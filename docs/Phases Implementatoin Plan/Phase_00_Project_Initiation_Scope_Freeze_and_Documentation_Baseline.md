# Phase 0 — Project Initiation, Scope Freeze and Documentation Baseline

    **Document Type:** Phase Implementation Guide  
    **Product:** Kapas ki Pukaar  
    **Prepared for:** Pakistan United Workers Federation (PUWF)  
    **Technical Partner:** Fruit of Sustainability (FOS)  
    **Version:** 1.0  
    **Date:** 18 August 2026  
    **Phase Duration:** 2–3 working days  
    **Delivery Mode:** Frontend-only functional product with dummy data  
    **Purpose:** Freeze the product scope, establish governance and convert all requirements into an implementation-ready backlog.

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

- establish one source of truth for scope;
- prevent uncontrolled scope growth;
- validate that all 12 frontend documentation files are internally consistent;
- confirm what is in Phase 1 and what is deferred;
- prepare a traceable implementation backlog;
- assign ownership;
- create approval gates for design, development, QA and UAT.

## 4. Step-by-Step Implementation

### Step 1 — Establish Project Governance

Create:
- Product Owner: FOS
- Technical Owner: FOS Frontend/Software Lead
- Operational Reviewer: PUWF
- UI/UX Owner
- QA Owner
- Urdu/Content Reviewer

Create a project decision log:
`docs/project/decision_log.md`

Every material decision must include:
- decision ID;
- date;
- decision;
- reason;
- affected documents;
- owner;
- status.

### Step 2 — Validate Scope Boundary

Create:
`docs/project/scope_matrix.md`

Separate:
- In Scope — Phase 1 Frontend
- Out of Scope — Backend/Production
- Future — Phase 2+
- Open Questions

Mandatory Phase 1 statements:
- standalone Kapas product;
- no PUWF platform integration;
- one complainant mobile role;
- one PUWF web role;
- 2–3 primary portal pages;
- frontend dummy data;
- real local audio;
- simulated AI.

### Step 3 — Requirements Traceability Baseline

Create:
`docs/project/requirements_traceability.csv`

Columns:
- Requirement ID
- Requirement Summary
- Source Document
- Screen ID
- Phase
- Developer
- QA Test ID
- Status
- Notes

Map every Must-Have requirement from `02_Functional_Requirements_Specification_FRS.md`.

### Step 4 — Resolve Inconsistencies Before Coding

Review:
- screen names;
- category codes;
- lifecycle statuses;
- privacy modes;
- priority names;
- language scope;
- portal role;
- analytics definitions;
- mock service contracts.

Do not allow duplicate or conflicting terminology.

### Step 5 — Establish Backlog Structure

Recommended epics:
- MOBILE-FOUNDATION
- MOBILE-GRIEVANCE
- MOBILE-VOICE
- MOBILE-AI
- MOBILE-TRACKING
- MOBILE-RIGHTS
- WEB-DASHBOARD
- WEB-CASE
- WEB-ANALYTICS
- DEMO-ORCHESTRATION
- QA-ACCESSIBILITY

Each ticket must contain:
- requirement IDs;
- design link;
- acceptance criteria;
- test notes;
- dependencies.

### Step 6 — Create Coding and Review Rules

Create:
`CONTRIBUTING.md`

Define:
- branch naming;
- commit format;
- PR template;
- code review requirement;
- TypeScript strict mode;
- lint/test required before merge.

### Step 7 — Establish Change Control

Create:
`docs/project/change_request_template.md`

Changes requiring formal approval:
- new user role;
- new portal/page;
- live backend/API;
- live AI;
- new critical grievance category;
- new lifecycle state;
- integration with other PUWF software;
- material visual redesign.

### Step 8 — Sprint and Milestone Mapping

Map the approved phases into the sprint plan in:
`12_Frontend_Development_Roadmap_and_Sprint_Plan.md`

Confirm owner and expected sign-off date for each phase.

## 5. Relevant Technical/Reference Files

Project documents:
- all 12 baseline `.md` documents;
- `Kapas_ki_Pukaar_End_to_End_Frontend_Development_Plan.md`.

Files to create in repository:
- `README.md`
- `CONTRIBUTING.md`
- `docs/project/scope_matrix.md`
- `docs/project/decision_log.md`
- `docs/project/requirements_traceability.csv`
- `docs/project/change_request_template.md`
- `docs/project/release_checklist.md`

## 6. Styling References

This phase does not implement UI, but it must formally approve:
- `06_UI_UX_Design_System_and_Localization_RTL_Guidelines.md`
- token names to be implemented later in `packages/design-tokens/`
- approved Figma project and component library links.

## 7. Review Meeting Agenda

1. confirm scope;
2. confirm role model;
3. confirm mobile and web IA;
4. confirm taxonomy/lifecycle;
5. confirm design direction;
6. confirm frontend-only limitations;
7. confirm milestone dates;
8. record unresolved items.

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

    - Verify every Must-Have FRS requirement is mapped to a phase.
- Verify no production backend tasks exist in Phase 1 backlog.
- Verify all screen IDs in IA are unique and traceable.
- Verify taxonomy and lifecycle codes are consistent across documents.
- Verify one-role PUWF portal scope is preserved.

    ### Regression Rule
    Any change to a shared domain type, taxonomy, lifecycle status, design token, locale key or mock service contract requires regression testing of every consuming screen.


    ## Definition of Done for This Phase

    - [ ] Scope matrix approved.
- [ ] Requirements traceability baseline created.
- [ ] Change-control process documented.
- [ ] Backlog structured and prioritised.
- [ ] Owners assigned.
- [ ] No unresolved blocker remains before repository implementation.

    The phase is not complete until all checklist items are met, blocking defects are closed and the phase exit review is signed off by the FOS product/technical owner.
