# Performance Notes — Phase 13

**Product:** Kapas ki Pukaar  
**Date:** 19 August 2026  
**Scope:** Frontend-only. No production CDN or backend.

## What was already in place

- Portal table paginates **20** rows (200-seed dataset is not fully rendered)
- Charts are CSS bars/columns with mixed tokens, not a heavy chart library
- Next.js Inter via `next/font` with `display: swap`
- Design-token `prefers-reduced-motion` short-circuits animation/transition
- Dummy audio/evidence use bundled `asset://` URIs (no network fetch in Phase 1)
- Mock repositories cache in memory after first load

## Phase 13 changes

- No new looping animation
- Dialog focus work does not add motion
- Skip-link is CSS-only
- Handover docs do not change runtime bundles

## Remaining (not blockers)

| Item | Note |
|---|---|
| Urdu webfont subsetting | System/bundled families; no extra subset pass this phase |
| Expo bundle size | Not measured with a production EAS build in this pass |
| Image compression | Few demo stills; factory uses shared `field-demo.png` |
| Virtualised table | Pagination meets DSH-012; virtualisation not required for 200 rows |

## Guidance for demos

Use the reset checklist. Extra generated complaints (205) are for demo scale only; reset before presenting baseline totals.
