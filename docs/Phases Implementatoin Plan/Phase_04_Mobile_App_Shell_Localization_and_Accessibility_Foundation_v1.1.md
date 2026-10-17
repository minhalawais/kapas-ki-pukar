# Phase 4 — Mobile App Shell, Localization and Accessibility Foundation

    **Document Type:** Phase Implementation Guide  
    **Product:** Kapas ki Pukaar  
    **Prepared for:** Pakistan United Workers Federation (PUWF)  
    **Technical Partner:** Fruit of Sustainability (FOS)  
    **Version:** 1.1  
    **Date:** 19 August 2026  
    **Phase Duration:** 4–5 working days  
    **Delivery Mode:** Frontend-only functional product with dummy data  
    **Purpose:** Build the mobile navigation shell, Urdu/English localization, RTL engine, onboarding and accessibility baseline.

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

- establish mobile navigation;
- implement Urdu-first localization;
- implement RTL-safe layout;
- implement accessibility baseline;
- build Splash, Language, Welcome and Home;
- prepare prompt playback infrastructure.

## 4. Step-by-Step Implementation

### Step 1 — Configure Expo Router

Suggested routes:

```text
apps/mobile/app/
  _layout.tsx
  index.tsx
  language.tsx
  welcome.tsx
  home.tsx
  grievance/
  complaints/
  rights/
```

### Step 2 — Create Localization Store

Files:
- `apps/mobile/src/i18n/locales/ur.json`
- `apps/mobile/src/i18n/locales/en.json`
- `apps/mobile/src/stores/localeStore.ts`

Future placeholders:
- `sd.json`
- `skr.json`

### Step 3 — Implement RTL Helpers

File:
`apps/mobile/src/i18n/rtl.ts`

Helpers:
- `isRTL(locale)`
- directional row classes
- icon mirroring rules
- LTR isolate for complaint IDs

### Step 4 — Build Splash

Use:
- Kapas branding
- “An initiative of PUWF”
- “Technology Partner: FOS”
- “Supported by ILO” acknowledgement if approved

Avoid excessive partner logos inside all screens.

### Step 5 — Build Language Screen

Large language cards:
- Urdu
- English

Persist selection.

### Step 6 — Build Welcome Screen

Include:
- illustration
- short explanation
- Play Audio
- Continue

### Step 7 — Build Home

Primary:
- Report a Problem

Secondary:
- Track My Complaint
- Know Your Rights

Optional:
- Listen to This Screen

### Step 8 — Create Audio Prompt Player

Files:
- `apps/mobile/src/services/promptAudioService.ts`
- `apps/mobile/assets/audio/ur/`

Use prompt IDs from `07_Voice_Prompt...`.

### Step 9 — Accessibility Foundation

Apply:
- accessibilityLabel
- accessibilityRole
- large touch areas
- high contrast
- readable Urdu
- reduced animation
- clear focus/pressed states

### Step 10 — Draft Recovery Shell

Add startup check for saved grievance draft.

Show:
- Resume
- Discard

Do not silently discard.

## 5. Relevant Technical/Reference Files

References:
- `03_Information_Architecture_and_Screen_Inventory.md`
- `06_UI_UX_Design_System_and_Localization_RTL_Guidelines.md`
- `07_Voice_Prompt_and_AI_Simulation_Specification.md`

Implementation:
- `apps/mobile/app/_layout.tsx`
- `apps/mobile/src/i18n/*`
- `apps/mobile/src/theme/tokens.ts`
- `apps/mobile/src/theme/layout.ts`
- `apps/mobile/src/components/navigation/*`
- `apps/mobile/src/services/promptAudioService.ts`

## 6. Styling Rules

- Cotton Cream/White is the dominant worker-app background.
- Default top bars are light/neutral; deep green is not the default header on every screen.
- Kapas Green is used selectively for the main CTA.
- FOS Teal is used for audio/voice/AI controls.
- Main Urdu question at large size.
- Minimal visual clutter.
- No dashboard metrics on Home.

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

    - Test language persists after relaunch.
- Test Urdu RTL on all foundation screens.
- Test complaint IDs remain LTR.
- Test screen reader labels.
- Test 200% text scaling.
- Test prompt playback without network.
- Test draft recovery entry.

    ### Regression Rule
    Any change to a shared domain type, taxonomy, lifecycle status, design token, locale key or mock service contract requires regression testing of every consuming screen.


    ## Definition of Done for This Phase

    - [ ] Splash, Language, Welcome and Home complete.
- [ ] Urdu/English switching works.
- [ ] RTL rules validated.
- [ ] Accessibility baseline implemented.
- [ ] Prompt playback infrastructure works.
- [ ] Draft recovery shell exists.

    The phase is not complete until all checklist items are met, blocking defects are closed and the phase exit review is signed off by the FOS product/technical owner.
