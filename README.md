# Kapas ki Pukaar

Kapas ki Pukaar is a voice-first grievance reporting and case management product for Pakistan's cotton sector. It is designed for cotton pickers, seasonal workers, tenant farmers, migrant labourers, and other rural workers who may have limited literacy, limited trust in formal complaint channels, or limited access to typed digital services.

## Current runtime

The application runtime uses the live API and PostgreSQL database. The portal and mobile complaint flows do not use seeded complaint/demo records. Local drafts and an offline outbox are device storage used only until the API is reachable.

The product has two connected surfaces:

- **Mobile app:** Urdu-first worker experience for reporting complaints, learning rights, and tracking complaint progress.
- **PUWF web portal:** grievance manager workspace for reviewing cases, listening to worker statements, managing follow-up, and monitoring trends.

The current implementation is a production-grade frontend and demo system with realistic mock data, offline-friendly mobile flows, visual rights education, bundled voice prompts, and a PUWF case operations portal. It does not include a production backend integration yet.

## Project Context

Pakistan's cotton value chain depends on large numbers of informal and seasonal workers. Common reported risks include delayed or underpaid wages, unsafe pesticide exposure, heat stress, injuries, harassment, discrimination, child labour risks, lack of rest, and fear of retaliation. Kapas ki Pukaar is built around that reality: simple questions, voice guidance, privacy-aware reporting, local-language content, and worker-facing status updates.

This repository is prepared for:

- **Programme context:** ILO-supported cotton-sector labour rights work
- **Worker representation / operations:** Pakistan United Workers Federation (PUWF)
- **Technical partner:** Fruit of Sustainability (FOS)

## Current Scope

Included in this phase:

- Expo mobile app with Urdu/English localization
- Next.js PUWF grievance manager portal
- Shared design tokens, localization, domain models, validation, mock data, mock services, and speech utilities
- Voice-first complaint registration with CNIC/anonymous entry, location capture, evidence attachment, privacy choices, and worker review
- Rights education pages with visual learning modules for wage, pesticide, heat, safety, harassment, child labour, discrimination, sanitation, contracts, and more
- Worker complaint tracking with simplified lifecycle states
- Web dashboard, complaint list, complaint detail workspace, timeline, escalation actions, audio evidence, and analytics
- Realistic dummy data and demo scenarios
- Bundled mobile audio prompt registry and voice generation tooling
- Unit tests, linting, type checking, and release documentation

Not included in this phase:

- Production backend API
- Live SMS/OTP delivery
- Live identity verification
- Live Gemini or AI calls from the mobile app
- Production user authentication
- Production deployment configuration

## Repository Structure

```text
.
├── apps/
│   ├── mobile/              # Expo / React Native worker app
│   └── puwf-portal/         # Next.js PUWF grievance manager portal
├── packages/
│   ├── ai/                  # Simulated AI helpers and contracts
│   ├── design-tokens/       # Shared color, typography, spacing, and semantic tokens
│   ├── domain/              # Complaint lifecycle, worker-facing models, and shared domain types
│   ├── localization/        # Urdu, English, Sindhi, and Saraiki message catalogs
│   ├── mock-data/           # Realistic demo data and golden scenarios
│   ├── mock-services/       # Frontend service layer backed by mock data
│   ├── speech/              # Audio and speech-domain utilities
│   └── validation/          # Zod schemas and validation contracts
├── assets/                  # Brand assets and generated logo outputs
├── docs/                    # Product, technical, design, QA, release, and planning documentation
├── tooling/                 # Voice prompt generation and asset tooling
└── package.json             # Monorepo scripts
```

## Tech Stack

- **Monorepo:** pnpm workspaces and Turborepo
- **Mobile:** Expo, React Native, Expo Router, Zustand, TanStack Query
- **Web portal:** Next.js, React, Tailwind CSS, Recharts, Lucide icons, TanStack Query/Table
- **Shared packages:** TypeScript, Vitest, ESLint
- **Localization:** shared JSON catalogs consumed by mobile and web
- **Voice assets:** generated and bundled offline for the mobile app

## Prerequisites

- Node.js 20 or newer
- Corepack enabled
- pnpm 9.15.0, as pinned in `package.json`
- Expo development tooling for mobile work

Enable the pinned package manager:

```bash
corepack enable
corepack pnpm --version
```

Install dependencies:

```bash
corepack pnpm install
```

## Running the live local stack

Run each command in a separate PowerShell window. Docker Desktop must be running with the Linux engine enabled.

### 1. Install dependencies

```powershell
corepack pnpm install
```

### 2. Start PostgreSQL and Redis

```powershell
docker compose --env-file deploy/compose/.env.local -f deploy/compose/compose.local.yml up -d --wait
```

The local database is exposed on port `5433` and Redis on `6380`.

### 3. Configure the API environment

Add the backend values from `.env.example` to `.env` without removing your existing secrets. For the local Docker services use:

```text
NODE_ENV=development
APP_VERSION=0.1.0
API_HOST=0.0.0.0
API_PORT=4000
PUBLIC_API_URL=http://192.168.1.28:4000
PORTAL_ORIGIN=http://localhost:3000,http://192.168.1.28:3000
DATABASE_URL=postgresql://kapas_app:local-app-password@127.0.0.1:5433/kapas_local?schema=public&connection_limit=10
MIGRATION_DATABASE_URL=postgresql://kapas_migrator:local-migration-password@127.0.0.1:5433/kapas_local?schema=public
REDIS_URL=redis://:local-redis-password@127.0.0.1:6380/0
EVIDENCE_ROOT=./apps/api/storage/evidence
QUARANTINE_ROOT=./apps/api/storage/quarantine
ENCRYPTION_KEY_ID=local-development-key
SESSION_SECRET=replace-with-at-least-32-characters-for-local-use
INTERNAL_METRICS_TOKEN=local-metrics-token-change-me
QUEUE_PREFIX=kapas-local
```

Replace `192.168.1.28` with the computer's current Wi-Fi IPv4 address (`ipconfig`). A physical phone must never use `127.0.0.1` for the API.

### 4. Generate the client and apply migrations

```powershell
corepack pnpm db:generate
corepack pnpm db:migrate:deploy
```

### 5. Start the API

```powershell
corepack pnpm dev:api
```

Verify it before opening the clients:

```powershell
Invoke-RestMethod http://localhost:4000/api/v1/health/ready
```

### 6. Start the PUWF web portal

```bash
corepack pnpm --filter @kapas/puwf-portal dev
```

The portal runs on:

```text
http://localhost:3000
```

The portal requires a staff session. For a disposable local administrator, set `BOOTSTRAP_ADMIN_LOGIN`, `BOOTSTRAP_ADMIN_NAME`, `BOOTSTRAP_ADMIN_PASSWORD`, and `BOOTSTRAP_ADMIN_CONFIRM=YES` in `.env`, then run:

```powershell
corepack pnpm --filter @kapas/database db:bootstrap-admin
```

### 7. Start the mobile app

```powershell
corepack pnpm --filter @kapas/mobile exec expo start --lan --clear
```

Open the QR code in Expo Go. The phone and computer must be on the same Wi-Fi network, and Windows Firewall must allow inbound TCP `4000`. The mobile build reads `EXPO_PUBLIC_API_URL` from `.env`; rebuild/restart Expo after changing it.

For an Android emulator, use `http://10.0.2.2:4000` instead of the Wi-Fi address. For iOS Simulator, `http://127.0.0.1:4000` is valid.

To stop local infrastructure:

```powershell
docker compose --env-file deploy/compose/.env.local -f deploy/compose/compose.local.yml down
```

## Quality Commands

Run everything through Turborepo:

```bash
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm test
```

Run checks for one app:

```bash
corepack pnpm --filter @kapas/mobile typecheck
corepack pnpm --filter @kapas/mobile lint
corepack pnpm --filter @kapas/mobile test

corepack pnpm --filter @kapas/puwf-portal typecheck
corepack pnpm --filter @kapas/puwf-portal lint
corepack pnpm --filter @kapas/puwf-portal test
```

Build the mobile app export:

```bash
corepack pnpm --filter @kapas/mobile build
```

Build the web portal:

```bash
corepack pnpm --filter @kapas/puwf-portal build
```

## Voice Prompt Tooling

The mobile app is designed to use bundled offline audio rather than runtime text-to-speech calls. Voice generation tooling lives in `tooling/voice-prompts`.

Useful commands:

```bash
corepack pnpm voice:status
corepack pnpm voice:validate
corepack pnpm voice:generate -- --limit 5
corepack pnpm voice:verify
```

Voice credentials must stay local. Do not commit `.env`, API keys, generated staging files, or account identifiers.

## Environment Variables

Local environment files are intentionally ignored:

```text
.env
.env.*
```

For voice generation, use local-only credentials such as:

```text
GEMINI_TTS_API_KEY=...
```

Do not expose Gemini, Google, Expo, or deployment credentials in source control, Expo configuration, public assets, manifests, logs, or generated documentation.

## Documentation

High-value documents:

- [Concept Note](docs/Kapas%20ki%20Pukaar%20Concept%20Note.md)
- [Product Requirements](docs/01_Product_Requirements_Document_PRD_v1.1.md)
- [Functional Requirements](docs/02_Functional_Requirements_Specification_FRS_v1.1.md)
- [Information Architecture](docs/03_Information_Architecture_and_Screen_Inventory.md)
- [User Journeys](docs/04_User_Journeys_and_Grievance_Decision_Trees.md)
- [Technical Architecture](docs/09_Frontend_Technical_Architecture_and_Mock_Service_Contracts_v1.1.md)
- [QA / UAT Plan](docs/11_QA_UAT_Test_Plan_and_Definition_of_Done_v1.1.md)
- [Project Governance](docs/project/README.md)
- [Release Notes](docs/release/known_limitations.md)
- [Production Backend Development Plan](docs/backend/README.md)

The phased implementation plan is in:

```text
docs/Phases Implementatoin Plan/
```

## Design Principles

The product is intentionally not a generic case-management interface. Its UX priorities are:

- Worker-first language and low-literacy comprehension
- Urdu-first interaction with careful grammar and local phrasing
- Visual recognition over dense reading
- Voice guidance where it helps, silence where privacy matters
- One decision at a time in complaint registration
- Respectful handling of sensitive complaints
- Clear worker-facing status updates without exposing internal workflow complexity
- Professional PUWF staff workflows on the portal

## Demo Data

The app and portal use realistic dummy complaints for cotton-sector scenarios. Demo records include worker statements, location details, privacy modes, affected worker ranges, status history, evidence metadata, and case timelines.

Dummy data is for product development and demonstrations only. It should not be treated as production evidence or real worker data.

## Security And Privacy Notes

- The current build is a frontend/demo implementation.
- Do not collect real worker complaints in this repository state.
- Do not submit personal complaint data to third-party generation services.
- CNIC handling in the mobile app is simulated/prototype-level and must be reviewed before production use.
- A production backend must add authentication, authorization, audit logs, encrypted storage, secure evidence handling, consent flows, data retention controls, and escalation procedures.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

Before opening a pull request or handoff build, run:

```bash
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm test
```

Do not add production backend, live AI, live SMS, or external case-system integrations without a documented change request.

## License

This repository does not currently declare an open-source license. Treat the code, documentation, visuals, and generated assets as private project material unless a license is added by the project owners.
