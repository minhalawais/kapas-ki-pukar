# Phase 1 — UX Architecture, Visual Design System and Component Specification

    **Document Type:** Phase Implementation Guide  
    **Product:** Kapas ki Pukaar  
    **Prepared for:** Pakistan United Workers Federation (PUWF)  
    **Technical Partner:** Fruit of Sustainability (FOS)  
    **Version:** 1.1  
    **Date:** 19 August 2026  
    **Phase Duration:** 4–5 working days  
    **Delivery Mode:** Frontend-only functional product with dummy data  
    **Purpose:** Create the approved visual language, interaction patterns and component system for both mobile and web before feature coding.

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

- finalise Kapas visual identity;
- create reusable design tokens;
- approve mobile low-literacy interaction patterns;
- approve PUWF case-management visual patterns;
- define responsive behaviour;
- define Urdu/RTL behaviour;
- design all reusable states before development.

## 4. Step-by-Step Implementation

### Step 1 — Create Design Foundations

Use the palette in:
`06_UI_UX_Design_System_and_Localization_RTL_Guidelines.md`

Required tokens:
- `kapas.primary = #0B5D3B`
- `puwf.primary = #004027`
- `fos.teal = #2D9480`
- `fos.tealDark = #206E71`
- `cotton.gold = #E5A62E`
- `background = #F7F3E8`
- `surface = #FFFFFF`
- `critical = #C83B3B`
- `warning = #D88416`
- `success = #27845A`

Create Figma styles matching future code tokens.

### Step 2 — Typography System

Define:
- English: Inter
- Urdu heading: Noto Nastaliq Urdu where appropriate
- Urdu functional/UI: Noto Naskh Arabic or approved legible Naskh alternative

Create type styles:
- Display
- H1
- H2
- H3
- Body
- Helper
- Button
- Caption
- Table Label

### Step 3 — Spacing, Radius and Elevation

Use:
- spacing: 4/8/12/16/24/32/48/64
- mobile card radius: 16–20
- web card radius: 12–14
- mobile CTA height: 56–64
- voice button: 72–88
- subtle shadows only

### Step 4 — Design Mobile Core Components

Design component variants for:
- `PrimaryCTA`
- `SecondaryCTA`
- `VoiceQuestion`
- `AnswerCard`
- `VoiceRecorder`
- `AudioReplayButton`
- `ProgressIndicator`
- `PrivacyCard`
- `EvidenceCard`
- `EmergencyNotice`
- `ComplaintStatusCard`
- `RightsTopicCard`
- `AIUnderstandingCard`

Each component must include:
- default;
- pressed;
- selected;
- disabled;
- loading;
- error where applicable.

### Step 5 — Design Web Core Components

Design:
- `PortalSidebar`
- `MetricCard`
- `FilterBar`
- `ComplaintTable`
- `StatusBadge`
- `PriorityBadge`
- `CaseHeader`
- `VoiceEvidenceCard`
- `AIInsightCard`
- `CaseTimeline`
- `ActionRail`
- `ActionModal`
- `AnalyticsCard`

### Step 6 — Design One-Question-at-a-Time Mobile Templates

Create a base template:
- top progress
- main illustration
- question
- answer area
- listen-again
- back/continue
- safe bottom inset

Do not create multi-field forms for grievance intake.

### Step 7 — Design Web Page Templates

Dashboard:
- header
- KPI row
- compact charts
- filters
- complaint table

Case:
- main content
- timeline
- action rail

Analytics:
- global filters
- KPI summary
- chart grid
- export action

### Step 8 — Design RTL Behaviour

For every mobile component:
- define RTL alignment;
- define directional icon mirroring;
- ensure complaint IDs remain LTR;
- check number/date placement;
- test long Urdu strings.

### Step 9 — Accessibility Review

Check:
- colour contrast;
- large touch targets;
- no colour-only meaning;
- clear focus states on web;
- readability outdoors;
- no tiny helper text on worker screens.

### Step 10 — Handoff to Development

Create design-spec annotations:
- component name;
- token names;
- spacing;
- typography;
- state behaviour;
- interaction notes;
- screen ID;
- linked FRS requirements.

## 5. Relevant Technical/Reference Files

Primary references:
- `03_Information_Architecture_and_Screen_Inventory.md`
- `04_User_Journeys_and_Grievance_Decision_Trees.md`
- `06_UI_UX_Design_System_and_Localization_RTL_Guidelines.md`
- `10_Analytics_KPI_Privacy_and_Accessibility_Specification.md`

Code files to create later:
- `packages/design-tokens/src/colors.ts`
- `packages/design-tokens/src/spacing.ts`
- `packages/design-tokens/src/typography.ts`
- `packages/design-tokens/src/radius.ts`
- `apps/mobile/src/theme/tokens.ts`
- `apps/mobile/src/theme/layout.ts`
- `apps/puwf-portal/src/styles/globals.css`

## 6. Styling Rules

### v1.1 Visual Balance Rules

- Normal mobile screens default to Cotton Cream/White backgrounds.
- No normal mobile screen should contain more than one large saturated-green surface.
- Voice and AI screens use FOS Teal and Soft Teal.
- Web main canvas stays light; deep PUWF green is concentrated in the sidebar.
- KPI cards stay white/neutral.
- Charts use Teal + Gold + Blue + Emerald + Orange rather than several greens.
- Gold/orange remain accent colours only.

- Keep 70–75% neutral/white/cream.
- Use Kapas Green for primary worker CTA.
- Use PUWF Sovereign Green for institutional web chrome.
- Use FOS Teal for voice/AI assistive states.
- Use red only for danger/destructive states.
- Avoid glassmorphism, neumorphism, AI-purple gradients and over-animation.
- Mobile should feel warm and human.
- Web should feel controlled and operational.

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

    - Contrast-test all primary text and action colours.
- Test 200% text scaling in mobile mockups.
- Test Urdu strings longer than English equivalents.
- Verify touch target dimensions.
- Verify all component states exist before engineering handoff.
- Verify mobile grievance template remains one-question-at-a-time.

    ### Regression Rule
    Any change to a shared domain type, taxonomy, lifecycle status, design token, locale key or mock service contract requires regression testing of every consuming screen.


    ## Definition of Done for This Phase

    - [ ] Approved Figma design system exists.
- [ ] All design tokens documented.
- [ ] Mobile and web component variants approved.
- [ ] RTL behaviour documented.
- [ ] Accessibility review completed.
- [ ] Developer handoff annotations complete.

    The phase is not complete until all checklist items are met, blocking defects are closed and the phase exit review is signed off by the FOS product/technical owner.
