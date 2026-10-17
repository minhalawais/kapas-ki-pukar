# How to Run Kapas ki Pukaar

**Product:** Kapas ki Pukaar  
**Delivery:** Product Phase 1 — frontend with dummy data  
**Surfaces:** worker mobile app and PUWF web portal

This is a standalone frontend. There is no login, no production API, and no live sync between the phone and the portal.

Use **two terminals**: one for the portal, one for the mobile app.

Related files:

- `docs/demo/Demo_Reset_Checklist.md`
- `docs/demo/ILO_PUWF_Demo_Script.md`

---

## 1. What you get

| Surface | Who | How you run it | URL / entry |
|---|---|---|---|
| PUWF portal | Grievance Manager | Next.js | `http://localhost:3000` → `/dashboard` |
| Worker mobile | Cotton worker | Expo | Splash → language → welcome → Home |

Portal pages:

- Dashboard + Complaints — `/dashboard`
- Case workspace — `/complaints/[id]`
- Analytics — `/analytics`
- Hidden demo — `/demo`

Mobile Home actions:

- Report a Problem
- Track My Complaint
- Know Your Rights
- Listen to This Screen

---

## 2. Prerequisites

- Windows 10/11, PowerShell
- Node.js 20 LTS (18.18+ can work; 20 is safer for Next 15 + Expo 53)
- pnpm **9.15.0** (pinned in the repo)
- For real voice recording: an Android phone with **Expo Go**, or an Android emulator. Microphone on Expo web is limited.

Check Node:

```powershell
node -v
```

The project path has spaces. Quote it, or `cd` into it first:

```powershell
cd "d:\Minhal Code Backup\Kapas ki Pukaar"
```

On some Windows machines Corepack fails with `EPERM`. Do not rely on `pnpm` or `corepack enable`. Use:

```powershell
npx pnpm@9.15.0
```

In PowerShell, join commands with `;` not `&&`.

---

## 3. First-time setup

From the repo root:

```powershell
cd "d:\Minhal Code Backup\Kapas ki Pukaar"
npx pnpm@9.15.0 install
```

Optional env (names only; no API keys):

```powershell
Copy-Item .env.example .env
```

`.env.example` only sets:

```text
NEXT_PUBLIC_APP_NAME=Kapas ki Pukaar
EXPO_PUBLIC_APP_NAME=Kapas ki Pukaar
```

You can skip this. The apps still run.

---

## 4. Start the PUWF web portal

**Terminal 1:**

```powershell
cd "d:\Minhal Code Backup\Kapas ki Pukaar"
npx pnpm@9.15.0 --filter @kapas/puwf-portal dev
```

Or:

```powershell
npx pnpm@9.15.0 dev:portal
```

Open **http://localhost:3000**. It redirects to **http://localhost:3000/dashboard**.

There is no sign-in. You are already the PUWF Grievance Manager.

| Route | What you see |
|---|---|
| `/dashboard` | KPIs, charts, complaint table (200 dummy cases) |
| `/complaints/KP-26-000101` | Case workspace (click a row, or inject GS-01 first) |
| `/analytics` | Programme analytics and CSV export |
| `/demo` | Hidden demo tools (also a small link at the bottom of the sidebar) |

Language is switched in the portal chrome (English / Urdu). Data is stored in **this browser’s local storage** (`kkp:v1:*`). Clearing site data resets the portal independently of the phone.

Set browser zoom to **100%** for demos.

---

## 5. Start the worker mobile app

**Terminal 2** (leave the portal running):

```powershell
cd "d:\Minhal Code Backup\Kapas ki Pukaar"
npx pnpm@9.15.0 --filter @kapas/mobile dev
```

Or:

```powershell
npx pnpm@9.15.0 dev:mobile
```

Expo starts Metro. In that terminal:

- `a` — Android emulator
- `w` — Expo web (UI only; prefer a phone for microphone)
- Scan the QR code with **Expo Go** on a physical Android phone (same Wi‑Fi as the PC)

First launch:

1. Splash (Kapas ki Pukaar / PUWF / FOS / ILO)
2. Choose language (Urdu-first)
3. Welcome / onboarding
4. Home

For voice:

1. Allow microphone when Android asks
2. Home → **Listen to This Screen** (bundled Urdu prompt)
3. **Report a Problem** → record answers on the device

Data is stored on **that device** (AsyncStorage). It does not appear on the portal until you use the demo bridge.

### Hidden demo menu

On Home, long-press the small **Demo build** line under the greeting (~0.8s). That opens `/demo`. Do not show this in worker-facing screenshots.

---

## 6. Run both for a PUWF/ILO demo

1. Start portal (terminal 1) and mobile (terminal 2).
2. Complete `docs/demo/Demo_Reset_Checklist.md`.
3. Present using `docs/demo/ILO_PUWF_Demo_Script.md`.

Flagship story (repeatable):

| Step | Where | Action |
|---|---|---|
| Reset | Both | Portal `/demo` → Reset data; phone demo screen → Reset data |
| Load | Phone | Load **GS-01** |
| Inject | Portal `/demo` | Inject **GS-01** |
| Case | Portal | Open **KP-26-000101**, play original audio, act on the case |
| Track | Phone | Track My Complaint, or Advance tracking on the demo screen |

Say this in the room: each app loads the same seeded scenario locally. This is not live sync. If you advance the case on the portal, advance tracking on the phone separately.

Golden IDs:

- GS-01 → `KP-26-000101` (wage / confidential — flagship)
- GS-02 → `KP-26-000102` through GS-10 → `KP-26-000110`

After reset, the portal seed is **200** complaints. “Add five complaints” makes it **205** until the next reset.

---

## 7. Daily commands (from repo root)

```powershell
# Install / refresh deps
npx pnpm@9.15.0 install

# Portal
npx pnpm@9.15.0 --filter @kapas/puwf-portal dev

# Mobile
npx pnpm@9.15.0 --filter @kapas/mobile dev

# Checks
npx pnpm@9.15.0 typecheck
npx pnpm@9.15.0 lint
npx pnpm@9.15.0 test

# Portal Playwright (starts or reuses localhost:3000)
npx pnpm@9.15.0 test:e2e
```

Filter a single package:

```powershell
npx pnpm@9.15.0 --filter @kapas/mock-services test
npx pnpm@9.15.0 --filter @kapas/mobile typecheck
```

---

## 8. What not to expect

- No production backend, database, SMS, OTP, or live AI
- No Unified Workforce login
- No extra portal roles
- Submitting a complaint on the phone does not create a row on the web until you inject a golden scenario on the portal

---

## 9. Troubleshooting

**`pnpm` / Corepack `EPERM`**  
Use `npx pnpm@9.15.0 …` as above.

**Portal port in use**  
Something else is on 3000. Stop it, or start Next on another port and open that URL.

**Expo cannot reach the phone**  
Phone and PC on the same Wi‑Fi. Windows Firewall must allow Node. Use USB plus `a` with an emulator if LAN fails.

**Microphone denied**  
Android Settings → Apps → Expo Go → Permissions → Microphone. Then reopen Report a Problem.

**Stale dummy data**  
Portal: `/demo` → Reset data.  
Phone: long-press Demo build → Reset data.  
Or clear browser site data / Expo Go storage. Resetting one does not reset the other.

**Expo asks for `react-native-web`:** that package lives in `apps/mobile`. Do not run `npx expo install` from the repo root (pnpm will refuse to add it there). From `apps/mobile` run `npx expo install react-native-web`, or start the app again with `npx pnpm@9.15.0 --filter @kapas/mobile dev`.

**Expo web: Cannot find module `react-native-worklets/plugin`:** Expo 53 uses Reanimated 3. Stop Metro (`Ctrl+C`) and start again with `npx pnpm@9.15.0 --filter @kapas/mobile dev`. Do not install `react-native-worklets` (that is for Expo 54 / Reanimated 4). Prefer Expo Go on a phone for voice.

**Metro / Next cache**  
Stop the process (`Ctrl+C`), then start again. For Expo, `r` reloads; a full restart of `dev:mobile` is enough in most cases.

**Install failed after a pull**  
From root: `npx pnpm@9.15.0 install`, then start both apps again.

---

## 10. Suggested first walkthrough (10 minutes)

1. Open **http://localhost:3000/dashboard** — 200 cases, filters, open any row.
2. Open **http://localhost:3000/analytics** — KPIs change with filters.
3. On the phone: Urdu → Home → Listen to This Screen → Report a Problem (one question at a time).
4. Portal `/demo` → Inject **GS-01** → open **KP-26-000101** → play audio.
5. Phone: long-press **Demo build** → Load **GS-01** → Track My Complaint.

That is the Product Phase 1 loop on dummy data.
