# Phase 7 — Privacy, Evidence, Submission, Complaint Tracking and Worker Rights

    **Document Type:** Phase Implementation Guide  
    **Product:** Kapas ki Pukaar  
    **Prepared for:** Pakistan United Workers Federation (PUWF)  
    **Technical Partner:** Fruit of Sustainability (FOS)  
    **Version:** 1.1  
    **Date:** 19 August 2026  
    **Phase Duration:** 5–6 working days  
    **Delivery Mode:** Frontend-only functional product with dummy data  
    **Purpose:** Complete the worker-facing mobile application from privacy choice through submission, tracking, feedback and rights content.

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

- implement privacy modes;
- implement safe contact;
- implement evidence;
- implement final review;
- implement local submission/reference;
- implement complaint tracking;
- implement rights content;
- implement resolution feedback.

## 4. Step-by-Step Implementation

### Step 1 — Implement Privacy Screen

Cards:
- Anonymous
- Confidential
- Identified

Each:
- short explanation
- audio help
- clear selected state

### Step 2 — Implement Safe Contact

Options:
- Safe to call
- Safe to message
- Call only
- Do not message
- No contact
- Alternate contact

Use fictional/demo contact data only.

### Step 3 — Implement Evidence Picker

Create:
- photo picker
- document picker
- preview
- remove

Frontend stores local URI/metadata.

### Step 4 — Build Review Screen

Sections:
- issue
- key answers
- voice
- location
- privacy
- evidence

Edit link per section.

### Step 5 — Build Local Submission Service

Generate:
`KP-26-######`

Persist complaint locally.

### Step 6 — Build Success Screen

Show:
- success confirmation
- complaint reference
- track complaint
- return home

### Step 7 — Build My Complaints

Cards:
- reference
- issue
- date
- status
- latest update

### Step 8 — Build Complaint Detail

Show:
- reference
- plain-language status
- timeline
- complaint summary
- submitted evidence summary

### Step 9 — Build Worker Resolution Feedback

Options:
- Satisfied
- Partially satisfied
- Not satisfied

Not satisfied can trigger scenario-specific Reopened state in demo.

### Step 10 — Build Rights & Help

Topics:
- Wage Rights
- Pesticide Safety
- Health & Safety
- Women at Work
- Child Labour
- Safe Reporting

Each topic:
- illustration
- short text
- audio

## 5. Relevant Technical/Reference Files

References:
- `05_Grievance_Taxonomy_and_Case_Lifecycle_Specification.md`
- `06_UI_UX_Design_System_and_Localization_RTL_Guidelines.md`
- `10_Analytics_KPI_Privacy_and_Accessibility_Specification.md`

Implementation:
- `apps/mobile/app/grievance/privacy.tsx`
- `apps/mobile/app/grievance/evidence.tsx`
- `apps/mobile/app/grievance/review.tsx`
- `apps/mobile/app/grievance/success.tsx`
- `apps/mobile/app/complaints/*`
- `apps/mobile/app/rights/*`
- `packages/mock-services/src/ComplaintService.ts`

## 6. Styling Rules

- Privacy screens use shield/lock visual language.
- Anonymous is not styled as suspicious.
- Success state uses a neutral/cream page with a green success icon and primary action; do not make the full page green.
- Worker statuses use simple language.
- Rights content is short and audio-supported.

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

    - Test all privacy modes.
- Test optional contact can be skipped.
- Test evidence add/remove.
- Test submission persists after relaunch.
- Test complaint reference uniqueness in local dataset.
- Test tracking for multiple statuses.
- Test resolution feedback scenarios.

    ### Regression Rule
    Any change to a shared domain type, taxonomy, lifecycle status, design token, locale key or mock service contract requires regression testing of every consuming screen.


    ## Definition of Done for This Phase

    - [ ] Privacy complete.
- [ ] Evidence complete.
- [ ] Submission complete.
- [ ] Tracking complete.
- [ ] Rights section complete.
- [ ] Worker-side mobile experience end-to-end complete.

    The phase is not complete until all checklist items are met, blocking defects are closed and the phase exit review is signed off by the FOS product/technical owner.
