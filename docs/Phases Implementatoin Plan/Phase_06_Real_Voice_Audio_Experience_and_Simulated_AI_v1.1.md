# Phase 6 — Real Voice Recording, Audio Experience and Simulated AI

    **Document Type:** Phase Implementation Guide  
    **Product:** Kapas ki Pukaar  
    **Prepared for:** Pakistan United Workers Federation (PUWF)  
    **Technical Partner:** Fruit of Sustainability (FOS)  
    **Version:** 1.1  
    **Date:** 19 August 2026  
    **Phase Duration:** 5–7 working days  
    **Delivery Mode:** Frontend-only functional product with dummy data  
    **Purpose:** Implement real mobile recording/playback plus deterministic simulated transcription, translation, classification, summary and confidence states.

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

- implement microphone permission;
- implement record/stop/play/delete/re-record;
- implement bundled prompt audio;
- implement MockAIService;
- implement AI processing states;
- implement low-confidence/failure states;
- preserve original audio.

## 4. Step-by-Step Implementation

### Step 1 — Build Speech Service

File:
`packages/speech/src/SpeechService.ts`

Mobile implementation:
`apps/mobile/src/services/ExpoSpeechService.ts`

Methods:
- requestPermission
- startRecording
- stopRecording
- play
- stopPlayback
- deleteRecording

### Step 2 — Build Voice Recorder UI

Files:
- `VoiceRecorder.tsx`
- `RecordingTimer.tsx`
- `WaveformPlaceholder.tsx`

States:
- idle
- requesting permission
- recording
- stopped
- playing
- error

### Step 3 — Bundle Urdu Prompt Assets

Directory:
`apps/mobile/assets/audio/ur/`

Map IDs in:
`packages/speech/src/promptManifest.ts`

### Step 4 — Build Mock AI Service

File:
`packages/ai/src/MockAIService.ts`

Inputs:
- scenario ID
- category
- structured answers
- voice metadata

Outputs:
- transcript Urdu
- translation English
- category/subcategory
- summary
- facts
- suggested priority
- confidence
- human review flag

### Step 5 — Build Processing UX

Screen:
`M-022 AI Processing`

Show:
- teal waveform
- short progress copy
- realistic 0.8–3 sec delay configurable

### Step 6 — Build Worker AI Understanding

Show only concise summary.

Buttons:
- correct
- go back

No long transcript-edit burden.

### Step 7 — Build AI Failure State

If failure:
- complaint remains valid
- original audio remains
- worker can continue
- portal later shows AI unavailable

### Step 8 — Build Low Confidence State

Portal-facing:
- confidence
- Human Review Required

Worker-facing:
- simple confirmation only

### Step 9 — Reconcile Priority

Call deterministic priority rules after AI suggestion.

### Step 10 — Ensure Original Audio Is Retained

Never replace original audio with transcript.

## 5. Relevant Technical/Reference Files

References:
- `07_Voice_Prompt_and_AI_Simulation_Specification.md`
- `04_User_Journeys_and_Grievance_Decision_Trees.md`
- `05_Grievance_Taxonomy_and_Case_Lifecycle_Specification.md`

Implementation:
- `packages/speech/src/*`
- `packages/ai/src/*`
- `apps/mobile/src/features/voice/*`
- `apps/mobile/assets/audio/ur/*`
- `packages/mock-data/src/scenarios/*`

## 6. Styling Rules

- FOS Teal is the principal listening/recording/processing colour.
- AI cards use Soft Teal on a light neutral canvas, never dark-green full-card treatments.
- Avoid neon AI aesthetics and generic purple AI gradients.
- Original audio control must be obvious.
- Confidence warnings are subtle but clear.
- AI output is always labeled as assistive.

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

    - Test microphone denied/retry.
- Test record/stop/play/delete/re-record.
- Test prompt audio offline.
- Test 10 distinct scenario outputs.
- Test AI failure does not block complaint.
- Test low-confidence flag.
- Test priority floor beats lower AI suggestion.

    ### Regression Rule
    Any change to a shared domain type, taxonomy, lifecycle status, design token, locale key or mock service contract requires regression testing of every consuming screen.


    ## Definition of Done for This Phase

    - [ ] Real recording works.
- [ ] Prompt playback works.
- [ ] MockAIService implemented.
- [ ] Failure and confidence states implemented.
- [ ] Original audio preserved.
- [ ] AI labels follow governance rules.

    The phase is not complete until all checklist items are met, blocking defects are closed and the phase exit review is signed off by the FOS product/technical owner.
