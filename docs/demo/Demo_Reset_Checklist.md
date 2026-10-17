# Demo Reset Checklist

Use this list before every external PUWF/ILO demo. Reset is local to each surface. Resetting the portal does not reset the phone.

## 1. Reset data

- Portal: `/demo` → Reset data → confirm.
- Mobile: long-press **Demo build** → Reset data.
- Confirm demo flags are clear (no active scenario, offline off, AI failure off, AI delay off).

Expected after reset:

- Portal complaint list returns to the canonical **200** seed.
- Analytics totals match that seed (no extra generated complaints).
- Saved filters and analytics filters are cleared.
- Mobile draft and offline queue are cleared.

## 2. Set scenario

- Flagship: **GS-01** / **KP-26-000101**.
- Load on mobile.
- Inject on the portal.
- Do not describe this as live sync.

## 3. Microphone

- Grant microphone permission on the demo phone.
- Record a short Urdu clip in Report a Problem (or the voice control used in the script).
- Confirm the recording indicator and stop control work.

## 4. Audio

- Play a bundled Urdu prompt from Home → Listen to This Screen.
- On the portal, open GS-01 and play the original case audio.

## 5. Portal totals

- Dashboard and Complaints still show the seed dataset after reset.
- After inject, GS-01 is **KP-26-000101** (overwrite of that seed row, not a second live feed).
- After “Add five complaints”, count is 205 until the next reset.

## 6. Browser zoom

- Portal zoom 100%.
- Window wide enough for the complaints table.
- No demo-control screenshot in worker-facing slides.

## 7. Internet-independent assets

- Bundled voice prompts, demo audio, and demo evidence load without a network.
- Simulated AI runs locally.
- If the room network is unreliable, keep demo offline simulation **off** unless that scenario is planned.

## 8. Repeatability check

Run the flagship script twice consecutively from a clean reset. Both runs must reach **KP-26-000101** without manual JSON edits.
