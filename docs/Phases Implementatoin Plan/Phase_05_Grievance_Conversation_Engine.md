# Phase 5 — Grievance Conversation Engine

    **Document Type:** Phase Implementation Guide  
    **Product:** Kapas ki Pukaar  
    **Prepared for:** Pakistan United Workers Federation (PUWF)  
    **Technical Partner:** Fruit of Sustainability (FOS)  
    **Version:** 1.0  
    **Date:** 18 August 2026  
    **Phase Duration:** 7–10 working days  
    **Delivery Mode:** Frontend-only functional product with dummy data  
    **Purpose:** Implement the complete one-question-at-a-time grievance workflow, category branching, safety logic and draft state machine.

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

- implement complaint wizard state machine;
- implement category cards;
- implement category-specific branches;
- implement progress;
- implement back/forward;
- implement group grievance;
- implement immediate-danger logic;
- persist draft continuously.

## 4. Step-by-Step Implementation

### Step 1 — Create Workflow Configuration

Directory:
`apps/mobile/src/features/grievance/workflows/`

Files:
- `common.ts`
- `wages.ts`
- `pesticide.ts`
- `healthSafety.ts`
- `harassment.ts`
- `childLabour.ts`
- `forcedLabour.ts`
- `contractor.ts`
- `workingHours.ts`
- `sanitation.ts`
- `discrimination.ts`
- `other.ts`

Do not encode branches directly in screen components.

### Step 2 — Define Question Node Schema

```ts
type QuestionNode = {
  id: string
  promptKey: string
  promptAudioId?: string
  type: "single" | "multi" | "voice" | "amount" | "date" | "location"
  options?: AnswerOption[]
  required?: boolean
  next: NextRule
}
```

### Step 3 — Build Generic Question Renderer

File:
`apps/mobile/src/features/grievance/components/QuestionRenderer.tsx`

It maps node type to:
- AnswerCard
- amount selector
- date shortcut
- location selector
- voice screen
- evidence flow

### Step 4 — Implement Category Selection

Use taxonomy codes from Phase 5 spec.

Worker sees simple labels/icons, internal state stores canonical codes.

### Step 5 — Implement Wage Branch

Test:
- unpaid
- paid less
- paid late
- deduction
- piece-rate

### Step 6 — Implement Pesticide Branch

Include:
- exposure type
- symptoms
- medical help
- current danger

### Step 7 — Implement Sensitive Branches

Harassment:
- minimal necessary questions
- safe contact
- optional female handler preference demo field

Child Labour:
- critical floor

Forced Labour:
- critical floor

### Step 8 — Implement Common Tail

Common after category-specific flow:
- when
- where
- others affected
- immediate danger
- privacy
- evidence
- contact
- review

### Step 9 — Implement Priority Rules

File:
`packages/domain/src/priorityRules.ts`

Rules:
- danger yes → Emergency
- child labour → >= Critical
- forced labour → >= Critical
- severe pesticide + danger → Emergency

### Step 10 — Implement Draft Persistence

Save after every meaningful answer.

Use debounced or explicit persistence via ComplaintService.

### Step 11 — Implement Progress

Progress should reflect logical journey without misleading exact completion if branches vary.

Use section progress rather than raw node count if necessary.

### Step 12 — Implement Validation

Required fields only.
Do not force optional sensitive details.

## 5. Relevant Technical/Reference Files

References:
- `04_User_Journeys_and_Grievance_Decision_Trees.md`
- `05_Grievance_Taxonomy_and_Case_Lifecycle_Specification.md`
- `06_UI_UX_Design_System_and_Localization_RTL_Guidelines.md`

Implementation:
- `apps/mobile/src/features/grievance/workflows/*`
- `apps/mobile/src/features/grievance/components/*`
- `apps/mobile/src/stores/grievanceDraftStore.ts`
- `packages/domain/src/priorityRules.ts`
- `packages/validation/src/complaint.schema.ts`

## 6. Styling Rules

- One question per screen.
- Large illustrated answer cards.
- No tiny radio buttons.
- Continue button only when required selection is valid.
- Sensitive screens use calm neutral surfaces, not alarming red.
- Emergency state is isolated and explicit.

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

    - Complete every category branch end to end.
- Test back/forward without losing answers.
- Test draft restore mid-branch.
- Test immediate danger priority override.
- Test child/forced labour priority floor.
- Test group grievance ranges.
- Test optional fields do not block submission.

    ### Regression Rule
    Any change to a shared domain type, taxonomy, lifecycle status, design token, locale key or mock service contract requires regression testing of every consuming screen.


    ## Definition of Done for This Phase

    - [ ] All category workflows implemented.
- [ ] Generic question renderer complete.
- [ ] Priority rules enforced.
- [ ] Draft persistence works.
- [ ] Progress works.
- [ ] All branches have QA coverage.

    The phase is not complete until all checklist items are met, blocking defects are closed and the phase exit review is signed off by the FOS product/technical owner.
