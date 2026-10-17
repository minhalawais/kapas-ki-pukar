# 07 — Voice Prompt + AI Simulation Specification

**Document ID:** KKP-AI-007  
**Product:** Kapas ki Pukaar — Voice-Enabled Smart Grievance Reporting Application for Cotton Farm Workers  
**Prepared for:** Pakistan United Workers Federation (PUWF)  
**Technical Partner:** Fruit of Sustainability (FOS)  
**Version:** 1.1  
**Date:** 19 August 2026  
**Status:** Frontend Development Baseline  
**Phase:** Phase 1 — Complete Frontend with Dummy Data  
**Purpose:** Define the frontend-only speech experience, voice asset governance and deterministic simulated AI behaviours used in Phase 1.

**Revision Note:** v1.1 updates the product visual identity to a balanced FOS + PUWF + Kapas system with neutral surfaces dominant, PUWF green used as an institutional anchor, FOS teal used for voice/AI/technology, Kapas green used selectively for primary actions and Cotton Gold used for agricultural highlights. It explicitly prohibits green-heavy page composition.

---

## 1. Document Context

Kapas ki Pukaar is being developed as a **standalone product**. It has no runtime, database, API or authentication integration with the PUWF Unified Workforce & Digital Operations Platform. The existing PUWF platform may be used only as a reference for prior FOS learning on worker-centred grievance design, Urdu/RTL interfaces and grievance-management patterns.

The current delivery phase is **frontend only**. It must provide a complete, realistic and testable product experience using dummy/local data. Real production backend services, a production database, server-side authentication, live SMS, production AI inference and cloud infrastructure are explicitly outside this phase.

The Phase 1 experience must nevertheless feel complete from the user perspective:
- mobile microphone recording and audio playback are functional;
- Urdu voice prompts are bundled locally and playable;
- AI transcription, categorisation, summarisation and translation are simulated through deterministic frontend services and curated scenarios;
- grievance workflows, branching, validation, case actions, analytics and local persistence are fully functional in the frontend;
- the PUWF portal is intentionally lean, with one operational role and 2–3 primary work pages;
- all architecture is designed so the mock service layer can later be replaced by real backend APIs without rewriting the UI.

---

## 2. Phase 1 AI and Speech Principle

Phase 1 does not deploy a production AI model or server-side speech service.

The frontend shall provide:
- real microphone capture;
- local audio playback;
- bundled voice prompts;
- deterministic simulated transcription;
- deterministic simulated translation;
- deterministic simulated categorisation;
- deterministic simulated summarisation;
- deterministic simulated priority recommendation;
- AI delay/failure/low-confidence demo states.

The architecture shall preserve provider interfaces for later integration.

## Visual Styling Requirement — v1.1

The speech and AI experience is where FOS visual identity should be most visible.

- recording/listening microphone: FOS Teal `#2D9480`;
- waveform/progress: FOS Teal / Deep Teal;
- AI insight background: Soft Teal `#E7F4F1`;
- AI text remains Ink/neutral;
- primary confirmation CTA remains Kapas Green;
- Cotton Gold may be used for progress milestones;
- do not render AI as a dark-green panel;
- do not use generic purple AI gradients;
- do not use PUWF deep green as the standard voice state.

This colour-role separation is mandatory so the app visually expresses both PUWF and FOS rather than reading as a green-only institutional interface.

## 3. Voice Interaction Goals

Voice must:
- reduce dependence on literacy;
- make the worker feel guided;
- use short, clear Pakistani Urdu;
- avoid bureaucratic language;
- allow replay;
- remain optional where a user prefers visual interaction.

## 4. Voice Prompt Asset Standard

Each prompt record shall include:
- prompt ID;
- screen ID;
- locale;
- final approved script;
- English meaning;
- audio file name;
- speaker;
- duration;
- approval status;
- revision version.

Example:

| ID | Screen | Urdu Script Summary | File |
|---|---|---|---|
| VP-001 | Welcome | Assalam-o-Alaikum, main Kapas ki Pukaar hoon... | `ur_welcome_001.mp3` |
| VP-002 | Issue Type | Aap ko kis qisam ka masla pesh aya? | `ur_issue_002.mp3` |
| VP-003 | Voice | Apne alfaaz mein batayein ke kya hua... | `ur_voice_003.mp3` |
| VP-004 | Danger | Kya kisi ko is waqt foran khatra hai? | `ur_danger_004.mp3` |
| VP-005 | Privacy | Aap apni pehchan kis tarah rakhna chahtay hain? | `ur_privacy_005.mp3` |
| VP-006 | Submit | Aap ki shikayat jama ki ja rahi hai... | `ur_submit_006.mp3` |
| VP-007 | Success | Aap ki shikayat receive ho gayi hai... | `ur_success_007.mp3` |

Final Urdu wording must be linguistically reviewed before recording.

## 5. Recording UX States

`idle → permission-check → recording → stopped → playback-ready → processing-demo → accepted`

Error branches:
- permission denied;
- no audio;
- recording failed;
- playback failed.

## 6. Recommended Audio Rules

- mono voice is sufficient;
- compressed audio for prototype;
- bundled prompts preloaded;
- file names versioned;
- no sensitive real worker recordings used in dummy/demo content without explicit governance;
- demo voice samples should use actors or synthetic non-identifying examples.

## 7. Mock AI Service Interface

```ts
interface AIService {
  transcribe(input: AudioInput, context?: ScenarioContext): Promise<TranscriptResult>
  translate(text: string, from: string, to: string): Promise<TranslationResult>
  classify(input: ComplaintInput): Promise<ClassificationResult>
  summarize(input: ComplaintInput): Promise<SummaryResult>
  extractFacts(input: ComplaintInput): Promise<ExtractedFactsResult>
  suggestPriority(input: ComplaintInput): Promise<PrioritySuggestion>
}
```

## 8. AI Output Schema

```ts
type AIAnalysis = {
  transcriptUrdu?: string
  translationEnglish?: string
  categoryCode?: string
  subcategoryCode?: string
  summary?: string
  extractedFacts?: {
    actor?: string
    amountExpected?: number
    amountReceived?: number
    affectedWorkers?: string
    symptoms?: string[]
    locationText?: string
  }
  suggestedPriority?: "Emergency" | "Critical" | "High" | "Standard"
  confidence?: number
  humanReviewRequired?: boolean
  warnings?: string[]
}
```

## 9. Deterministic Scenario Mapping

Mock AI must not return random content.

Example mapping:
- scenario `GS-WAG-01`
  - transcript: worker reports 1,200 agreed and 800 paid;
  - category: `WAG`;
  - subcategory: `WAG-UND`;
  - priority: High;
  - facts: expected=1200, received=800;
  - confidence=0.94.

## 10. Priority Guardrails

A separate frontend rules engine applies after AI simulation:

```text
if immediateDanger == true → Emergency
if category == CHL → minimum Critical
if category == FOL → minimum Critical
if severePesticideSymptoms && immediateDanger → Emergency
```

Mock AI may not lower the deterministic priority floor.

## 11. Worker AI Presentation

Worker sees a simple understanding, not internal metadata.

Example:
- "Aap ne bataya ke aap ko tay shuda mazdoori se kam paisay mile."
- "Kya yeh sahi hai?"

Buttons:
- Yes, correct
- Go back

The worker does not need to edit a long transcript.

## 12. PUWF AI Presentation

Portal may show:
- Urdu transcript;
- English translation;
- AI summary;
- suggested category;
- suggested priority;
- key facts;
- confidence;
- human review flag.

Original audio stays accessible.

## 13. AI Simulation States

### Normal
High-confidence result.

### Low Confidence
- confidence 0.50–0.65;
- banner: Human Review Required.

### Partial Extraction
Transcript available but some facts unknown.

### Failure
- "AI summary unavailable";
- complaint remains accessible;
- original voice preserved;
- PUWF can still proceed.

### Delay
Configurable 0.8–3 seconds for demo realism.

## 14. Voice Prompt Tone

Speaker direction:
- calm;
- respectful;
- neutral;
- not robotic;
- not overly cheerful;
- moderate pace;
- short sentences;
- everyday Urdu.

Avoid:
- legal jargon;
- donor language;
- accusatory language;
- leading questions.

## 15. Sensitive Prompt Principles

For harassment/forced labour/child protection:
- ask minimum necessary;
- do not pressure user to disclose names;
- remind that voice details are optional;
- allow exit/back;
- emphasise safety and privacy.

## 16. Frontend-Only Speech Experimentation

Optional experiments may use:
- browser/device speech synthesis;
- on-device/browser speech models;
- WebAssembly/WebGPU.

These are **not** acceptance dependencies for Phase 1 unless separately approved.

## 17. Future Production Integration Boundary

The UI must not depend on a specific future provider.

Future implementations may use:
- Whisper/faster-whisper;
- an Urdu-capable LLM;
- a self-hosted TTS model;
- commercial services if later approved.

The contract in Section 7 remains stable while the implementation changes.

## 18. AI Safety Labels

UI language:
- AI Summary
- Suggested Category
- Suggested Priority
- Human Review Required

Avoid:
- AI Verdict
- AI Confirmed
- Fraud Detected
- Complaint Proven

## 19. AI Simulation Acceptance

Phase 1 passes when:
- at least 10 curated voice scenarios produce distinct outputs;
- low-confidence and failure states are demoable;
- priority guardrails work;
- original audio remains accessible;
- AI outputs reconcile with taxonomy;
- no component directly hard-codes provider-specific calls.
