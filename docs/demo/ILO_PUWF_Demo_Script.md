# ILO / PUWF Flagship Demo Script

**Product:** Kapas ki Pukaar  
**Audience:** PUWF Grievance Manager and ILO observers  
**Surfaces:** worker mobile app and PUWF web portal  
**Limitation:** Product Phase 1 has no backend. Mobile and web do not live-sync. Use the deterministic scenario bridge only.

---

## Before you start

Complete `docs/demo/Demo_Reset_Checklist.md`.

Do not say that the phone and the portal share a live connection. Say that both apps load the same seeded scenario locally.

Golden reference for this script:

- Scenario: **GS-01 — Wage underpayment / Confidential**
- Tracking ID: **KP-26-000101**

---

## What this script proves

Worker reports in Urdu by voice → simulated AI structures the case → worker chooses privacy → tracking ID → PUWF listens to original audio → PUWF acts → worker tracking updates.

AI is assistive. Original audio remains the worker statement. Deterministic safety/priority rules beat AI suggestions.

---

## Part A — Worker mobile (Urdu, voice-first)

1. Open the worker app. Confirm Urdu and RTL.
2. Home shows four actions only: Report a Problem, Track My Complaint, Know Your Rights, Listen to This Screen.
3. Optional microphone proof: tap Listen to This Screen, then start Report a Problem and record a short Urdu answer. Playback must work on this device.
4. For the repeatable flagship story, open hidden demo controls:
   - long-press the small **Demo build** line under the greeting; or
   - open `/demo`.
5. Reset data if the checklist was not already run on this phone.
6. Load **GS-01**. Confirm tracking ID **KP-26-000101**.
7. If time allows, walk Report a Problem instead of loading:
   - one question at a time;
   - wage underpayment;
   - voice recording;
   - simulated AI summary (Suggested Category, not a verdict);
   - privacy = Confidential;
   - submit and show the tracking ID.
8. If a live intake was used, still **Inject GS-01** on the portal for the matching cross-app ID. Do not claim the live intake travelled to the web.

Hidden demo controls must not appear in ordinary worker screenshots.

---

## Part B — Scenario bridge (not live sync)

On the PUWF portal, open supporting route `/demo` (de-emphasized in the sidebar).

1. Select **GS-01**.
2. **Inject into this app.** Portal and this browser’s local store now hold **KP-26-000101**.
3. Say: “Mobile and web each loaded the same scenario definition. This is not live synchronisation.”
4. Open the case from the demo panel.

If the presenter also advanced the case on the phone, advance it on the portal separately. Each runtime writes only to its own stores.

---

## Part C — PUWF case workspace

1. Open **KP-26-000101**.
2. Play original audio. This is the worker statement.
3. Show the simulated AI summary as assistive only.
4. GS-01 starts **Under Review**. Use the case workspace (or Demo → Advance case) to:
   - record action → **Action in Progress**;
   - propose resolution → **Proposed Resolution**;
   - resolve and close according to lifecycle rules.
5. Do not skip confirmation on consequential actions.

---

## Part D — Worker tracking

On the **same phone** used in Part A:

1. Open hidden demo controls.
2. Advance tracking for GS-01, or open Track My Complaint and show **KP-26-000101**.
3. Worker-facing status text must match the status on this phone, not a live portal feed.

---

## Alternate golden scenarios (if asked)

| ID | Tracking ID | Use |
|---|---|---|
| GS-01 | KP-26-000101 | Flagship wage / confidential |
| GS-02 | KP-26-000102 | Pesticide emergency |
| GS-03 | KP-26-000103 | Confidential harassment |
| GS-04 | KP-26-000104 | Child labour / anonymous |
| GS-05 | KP-26-000105 | Forced labour / escalated |
| GS-06 | KP-26-000106 | Group wage / action in progress |
| GS-07 | KP-26-000107 | Sanitation |
| GS-08 | KP-26-000108 | AI low confidence |
| GS-09 | KP-26-000109 | AI failure |
| GS-10 | KP-26-000110 | Reopened case |

For GS-08 / GS-09, use demo toggles: Simulate low confidence, Simulate AI failure. Reset those toggles before the next run.

---

## Phrases to avoid

- live sync, real-time update, connected backend, production AI, SMS/OTP, Unified Workforce integration.

---

## After the demo

Reset both surfaces using the reset checklist so the next run starts from the canonical 200-record seed.
