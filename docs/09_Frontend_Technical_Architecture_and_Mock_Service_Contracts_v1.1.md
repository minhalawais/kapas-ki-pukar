# 09 — Frontend Technical Architecture + Mock Service Contracts

**Document ID:** KKP-ARCH-009  
**Product:** Kapas ki Pukaar — Voice-Enabled Smart Grievance Reporting Application for Cotton Farm Workers  
**Prepared for:** Pakistan United Workers Federation (PUWF)  
**Technical Partner:** Fruit of Sustainability (FOS)  
**Version:** 1.1  
**Date:** 19 August 2026  
**Status:** Frontend Development Baseline  
**Phase:** Phase 1 — Complete Frontend with Dummy Data  
**Purpose:** Define the frontend-only technical architecture, repository structure, state model, persistence strategy and backend-ready mock service interfaces.

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

## 2. Architecture Decision

Phase 1 shall use a **frontend-only monorepo** with shared domain packages and mock service abstractions.

Recommended stack:

| Layer | Technology |
|---|---|
| Mobile | React Native + Expo + TypeScript |
| Web | Next.js + TypeScript |
| Mobile styling | NativeWind |
| Web styling | Tailwind CSS + shadcn/ui |
| State | Zustand |
| Async/service state | TanStack Query |
| Forms | React Hook Form + Zod |
| Mobile persistence | AsyncStorage or SQLite |
| Web persistence | IndexedDB/localStorage |
| Charts | Recharts |
| Icons | Lucide |
| Mobile motion | Reanimated |
| Web motion | Framer Motion |
| Testing | Vitest + Playwright |
| Workspace | pnpm/Turborepo |

## Design Token Architecture — v1.1

The codebase must separate **brand tokens**, **surface tokens** and **semantic aliases** so developers or AI coding tools cannot make every component directly depend on green hex values.

Required files:

```text
packages/design-tokens/src/
  colors.ts
  surfaces.ts
  semantic.ts
  charts.ts
  typography.ts
  spacing.ts
  radius.ts
```

Recommended semantic aliases:

```ts
export const semanticColors = {
  pageWorker: "#F7F3E8",
  pageAdmin: "#F4F6F4",
  surface: "#FFFFFF",
  institutionalAnchor: "#004027",
  actionPrimary: "#0B5D3B",
  actionSecondary: "#2D9480",
  voiceActive: "#2D9480",
  aiAccent: "#2D9480",
  aiSurface: "#E7F4F1",
  progressAccent: "#E5A62E",
  info: "#2877B8",
  critical: "#C83B3B",
}
```

Rules:
- UI components should consume semantic aliases rather than arbitrary hex values.
- Web sidebar may consume `institutionalAnchor`.
- Normal page surfaces must consume `pageWorker`, `pageAdmin` or `surface`.
- Voice/AI components must consume `voiceActive`, `aiAccent` and `aiSurface`.
- Chart components must use the shared mixed palette from `charts.ts`, not hand-selected green shades.

## 3. Monorepo Structure

```text
kapas-ki-pukaar/
├── apps/
│   ├── mobile/
│   └── puwf-portal/
├── packages/
│   ├── domain/
│   ├── validation/
│   ├── mock-data/
│   ├── mock-services/
│   ├── ai/
│   ├── speech/
│   ├── design-tokens/
│   └── localization/
├── assets/
│   ├── audio/
│   ├── illustrations/
│   └── demo-evidence/
├── tooling/
│   ├── eslint/
│   └── tsconfig/
└── docs/
```

## 4. Architecture Layers

```text
UI Components
↓
Feature Hooks / View Models
↓
Service Interfaces
↓
Repository Interfaces
↓
Mock Implementations
↓
Seed Data / Local Persistence
```

Components must not directly import raw dummy arrays.

## 5. Domain Package

Canonical types:
- Complaint
- Reporter
- Incident
- Location
- Evidence
- VoiceEvidence
- AIAnalysis
- CaseAction
- Resolution
- WorkerFeedback
- RightsTopic
- AnalyticsSnapshot
- DemoScenario

All apps consume the same domain definitions.

## 6. Validation Package

Use Zod for:
- complaint draft;
- evidence metadata;
- case actions;
- status transitions;
- resolution forms;
- analytics filters;
- demo scenario config.

## 7. State Boundaries

### Zustand
Use for:
- locale;
- active complaint wizard state;
- demo flags;
- UI preferences;
- connectivity simulation;
- current session/demo identity.

### TanStack Query
Use for:
- complaint list;
- complaint detail;
- analytics;
- mutations through services;
- future API-compatible cache flow.

### Local Persistence
Use for:
- complaint drafts;
- submitted local mobile complaints;
- web case mutations;
- demo configuration where appropriate.

## 8. Mobile Service Contracts

```ts
interface ComplaintService {
  listMine(): Promise<Complaint[]>
  getById(id: string): Promise<Complaint | null>
  createFromDraft(draft: ComplaintDraft): Promise<Complaint>
  saveDraft(draft: ComplaintDraft): Promise<void>
  getDraft(): Promise<ComplaintDraft | null>
  discardDraft(): Promise<void>
  submitWorkerFeedback(id: string, feedback: WorkerFeedback): Promise<void>
}
```

```ts
interface EvidenceService {
  pickPhoto(): Promise<LocalEvidence | null>
  pickDocument(): Promise<LocalEvidence | null>
  removeEvidence(id: string): Promise<void>
}
```

```ts
interface SpeechService {
  requestPermission(): Promise<PermissionState>
  startRecording(): Promise<void>
  stopRecording(): Promise<VoiceEvidence>
  play(uri: string): Promise<void>
  stopPlayback(): Promise<void>
  playPrompt(promptId: string, locale: string): Promise<void>
}
```

## 9. AI Service Contract

```ts
interface AIService {
  transcribe(input: VoiceEvidence, context?: ScenarioContext): Promise<TranscriptResult>
  translate(text: string, from: string, to: string): Promise<TranslationResult>
  classify(input: ComplaintContext): Promise<ClassificationResult>
  summarize(input: ComplaintContext): Promise<SummaryResult>
  extractFacts(input: ComplaintContext): Promise<ExtractedFactsResult>
  suggestPriority(input: ComplaintContext): Promise<PrioritySuggestion>
}
```

Phase 1 implementation:
`MockAIService`

Future:
`ProductionAIService`

## 10. PUWF Portal Service Contract

```ts
interface CaseManagementService {
  list(filters?: ComplaintFilters): Promise<Complaint[]>
  get(id: string): Promise<Complaint | null>
  startReview(id: string): Promise<Complaint>
  changePriority(id: string, priority: Priority, reason?: string): Promise<Complaint>
  addNote(id: string, note: string): Promise<Complaint>
  recordContact(id: string, data: ContactAction): Promise<Complaint>
  requestInformation(id: string, note: string): Promise<Complaint>
  addFinding(id: string, finding: string): Promise<Complaint>
  recordAction(id: string, action: ActionInput): Promise<Complaint>
  escalate(id: string, reason: string): Promise<Complaint>
  proposeResolution(id: string, resolution: ResolutionInput): Promise<Complaint>
  resolve(id: string): Promise<Complaint>
  close(id: string, reason: string): Promise<Complaint>
  reopen(id: string, reason: string): Promise<Complaint>
}
```

## 11. Analytics Contract

```ts
interface AnalyticsService {
  getSnapshot(filters?: AnalyticsFilters): Promise<AnalyticsSnapshot>
  exportCsv(filters?: AnalyticsFilters): Promise<Blob>
}
```

Analytics derives from current complaint repository state.

## 12. Demo Service Contract

```ts
interface DemoService {
  reset(): Promise<void>
  loadScenario(id: string): Promise<DemoScenario>
  injectScenarioComplaint(id: string): Promise<Complaint>
  setOffline(value: boolean): void
  setAiFailure(value: boolean): void
  setAiDelay(ms: number): void
  advanceScenario(id: string, step: string): Promise<void>
}
```

## 13. Repository Interface

```ts
interface ComplaintRepository {
  list(): Promise<Complaint[]>
  get(id: string): Promise<Complaint | null>
  save(complaint: Complaint): Promise<void>
  remove(id: string): Promise<void>
  reset(): Promise<void>
}
```

Implementations:
- `MobileLocalComplaintRepository`
- `WebLocalComplaintRepository`
- future `ApiComplaintRepository`

## 14. Lifecycle Rules Engine

Keep status transitions out of UI components.

```ts
interface CaseLifecycleService {
  canTransition(from: CaseStatus, to: CaseStatus): boolean
  transition(complaint: Complaint, to: CaseStatus, meta: TransitionMeta): Complaint
}
```

## 15. Priority Rules Engine

Separate deterministic rules from AI:

```ts
interface PriorityRulesService {
  getMinimumPriority(context: ComplaintContext): Priority
  reconcile(aiSuggested: Priority, minimum: Priority): Priority
}
```

## 16. Routing

### Mobile
Expo Router recommended.

### Web
Next.js App Router:
- `/dashboard`
- `/complaints/[id]`
- `/analytics`
- `/demo`

## 17. Persistence Strategy

### Mobile
Store:
- locale;
- active draft;
- local complaint list;
- demo state.

Audio remains local for prototype.

### Web
Store:
- mutated complaint seed;
- case actions;
- selected demo scenario;
- optional filters.

Provide versioned persistence keys so schema changes can invalidate old state safely.

## 18. Error Handling

Create standard result/error shapes.

No service error should crash the app.

UI error classes:
- permission;
- validation;
- persistence;
- media;
- mock AI;
- unknown.

## 19. Logging

Development-only logs:
- service calls;
- state transitions;
- scenario injection;
- AI simulation events.

Do not log sensitive real data if the prototype later begins using real testing data.

## 20. Environment Configuration

Example:
- `APP_MODE=demo`
- `ENABLE_DEMO_PANEL=true`
- `DEFAULT_LOCALE=ur`
- `MOCK_AI_DELAY=1200`
- `SEED_VERSION=1`

## 21. Backend-Readiness Requirements

When Phase 2 begins:
- mock service interfaces remain;
- only implementations change;
- TanStack Query hooks remain;
- UI components should not need major refactor;
- Zod schemas can support API validation;
- route structure remains stable.

## 22. Prohibited Technical Shortcuts

Do not:
- import dummy arrays directly into pages;
- hard-code analytics totals;
- encode workflow transitions inside button handlers;
- place Urdu strings directly in components;
- call a future AI provider directly from UI;
- use one giant global store for all data;
- couple mobile and web through fragile shared file assumptions.

## 23. Build Quality

- strict TypeScript;
- linting;
- formatting;
- reusable components;
- typed service contracts;
- deterministic mock data;
- unit tests for rules;
- integration tests for critical flows.
