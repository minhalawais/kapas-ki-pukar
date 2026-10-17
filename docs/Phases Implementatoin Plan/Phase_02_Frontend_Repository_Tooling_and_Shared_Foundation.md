# Phase 2 — Frontend Repository, Tooling and Shared Foundation

    **Document Type:** Phase Implementation Guide  
    **Product:** Kapas ki Pukaar  
    **Prepared for:** Pakistan United Workers Federation (PUWF)  
    **Technical Partner:** Fruit of Sustainability (FOS)  
    **Version:** 1.0  
    **Date:** 18 August 2026  
    **Phase Duration:** 3–4 working days  
    **Delivery Mode:** Frontend-only functional product with dummy data  
    **Purpose:** Create the monorepo, shared packages, framework configuration, quality tooling and base application shells.

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

- create a stable monorepo;
- establish shared TypeScript/domain boundaries;
- configure mobile and web frameworks;
- configure styling systems;
- configure state/query/form tools;
- configure testing and CI;
- make all future feature work consistent.

## 4. Step-by-Step Implementation

### Step 1 — Create Workspace

Recommended:
- pnpm workspace
- Turborepo

Root files:
- `package.json`
- `pnpm-workspace.yaml`
- `turbo.json`
- `tsconfig.base.json`
- `.editorconfig`
- `.gitignore`
- `.env.example`

### Step 2 — Create Apps

```text
apps/
  mobile/
  puwf-portal/
```

Mobile:
- Expo
- React Native
- TypeScript
- Expo Router

Web:
- Next.js
- TypeScript
- App Router

### Step 3 — Create Shared Packages

```text
packages/
  domain/
  validation/
  localization/
  design-tokens/
  mock-data/
  mock-services/
  ai/
  speech/
```

Each package should have its own:
- `package.json`
- `tsconfig.json`
- `src/index.ts`

### Step 4 — Configure Styling

Mobile:
- NativeWind
- `apps/mobile/tailwind.config.js`
- `apps/mobile/src/theme/tokens.ts`

Web:
- Tailwind CSS
- shadcn/ui
- `apps/puwf-portal/src/app/globals.css`
- shared CSS variables sourced from design tokens

### Step 5 — Configure State/Data Libraries

Install/configure:
- Zustand
- TanStack Query
- React Hook Form
- Zod

Create:
- query client
- base stores
- error boundary patterns

### Step 6 — Configure Routing

Mobile routes:
- onboarding
- home
- grievance
- complaints
- rights

Web routes:
- `/dashboard`
- `/complaints/[id]`
- `/analytics`
- `/demo`

### Step 7 — Configure Testing

- Vitest
- Playwright
- React Testing Library or framework-equivalent
- test scripts at root

### Step 8 — Configure Code Quality

- ESLint
- Prettier/formatter
- strict TypeScript
- no implicit any
- no unresolved imports
- import ordering

### Step 9 — Configure CI

GitHub Actions workflow:
- install
- typecheck
- lint
- unit test
- build web
- build/check Expo project

Suggested file:
`.github/workflows/ci.yml`

### Step 10 — Create App Shells

Mobile:
- theme provider
- query provider
- locale provider
- safe-area handling

Web:
- root layout
- theme CSS
- query provider
- error boundary
- shell layout

## 5. Relevant Technical/Reference Files

References:
- `09_Frontend_Technical_Architecture_and_Mock_Service_Contracts.md`
- `06_UI_UX_Design_System_and_Localization_RTL_Guidelines.md`

Repository files:
- `apps/mobile/app/_layout.tsx`
- `apps/mobile/src/theme/tokens.ts`
- `apps/mobile/src/theme/layout.ts`
- `apps/puwf-portal/src/app/layout.tsx`
- `apps/puwf-portal/src/app/globals.css`
- `packages/domain/src/index.ts`
- `packages/design-tokens/src/index.ts`
- `packages/localization/src/index.ts`
- `.github/workflows/ci.yml`

## 6. Technical Rules

- Use absolute/shared package imports where configured.
- Keep framework-specific code inside app packages.
- Shared domain types must not import UI frameworks.
- Shared packages must remain testable independently.
- Do not add backend server packages in this phase.

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

    - Run root typecheck.
- Run lint across all packages.
- Build web production bundle.
- Launch Expo app and verify route shell.
- Verify shared token import works in mobile and web.
- Verify CI fails intentionally on a seeded type error before removing it.

    ### Regression Rule
    Any change to a shared domain type, taxonomy, lifecycle status, design token, locale key or mock service contract requires regression testing of every consuming screen.


    ## Definition of Done for This Phase

    - [ ] Monorepo structure created.
- [ ] Mobile and web apps boot successfully.
- [ ] Shared packages compile.
- [ ] Design tokens consumed by both apps.
- [ ] CI pipeline passes.
- [ ] Routing shells exist.

    The phase is not complete until all checklist items are met, blocking defects are closed and the phase exit review is signed off by the FOS product/technical owner.
