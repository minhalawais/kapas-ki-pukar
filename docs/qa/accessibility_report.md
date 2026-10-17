# Accessibility Report — Phase 13

**Product:** Kapas ki Pukaar  
**Target:** WCAG AA-oriented practice (doc 10 §§14–22)  
**Date:** 19 August 2026  
**Status:** Engineering review complete. Named accessibility sign-off still required from FOS QA.

## Web (PUWF portal)

| Check | Result | Notes |
|---|---|---|
| Keyboard | Pass (code + Playwright skip-link) | Tab order: skip link → nav → main. Dialogs trap Tab and close on Escape. |
| Visible focus | Pass | `*:focus-visible` uses FOS teal outline token |
| Headings | Pass | Page `h1` via `PageHeader` / case `h1` |
| Labelled controls | Pass | Filter labels wrap inputs; language buttons have `aria-pressed` |
| Dialogs | Pass | `role="dialog"`, `aria-modal`, unique title id, restore focus |
| Tables | Pass | `<caption>`, `scope="col"`, `aria-sort` |
| Charts | Pass | Count text next to bars; `aria-label` summary |
| Status not colour-only | Pass | Status/priority text labels |
| Contrast | Pass (token review) | Cream/white canvas, dark text `#17231E`; critical red reserved |
| Reduced motion | Pass | `packages/design-tokens` `prefers-reduced-motion` |
| RTL IDs | Pass | Tracking IDs `dir="ltr"` |

Skip-to-content is the first focusable control. Main landmark: `#main-content`.

## Mobile (worker app)

| Check | Result | Notes |
|---|---|---|
| Screen-reader labels | Pass | `PrimaryCta` and icon controls use `accessibilityLabel` |
| Touch size | Pass | CTA min height from `controlSize.mobileCtaHeight` (doc 06: 56–64px) |
| Contrast / cream canvas | Pass | `pageWorker` cream; PUWF green not used as full-screen mobile chrome |
| Non-colour meaning | Pass | Labels + selected state copy (`a11y.selected`) |
| Large Urdu text | Pass (layout) | Urdu font families; physical large-text farm not run this pass |
| Reduced motion | Pass | Splash delay respects reduced-motion hook |
| Mic permission | Pass | Dedicated recovery screen |

## Visual identity (doc 11 v1.1)

Code uses semantic tokens: Kapas green for primary CTA, FOS teal for voice/AI, PUWF green in portal sidebar only, mixed chart palette (`--chart-1`…`--chart-6`). Screenshot set listed in the phase guide was **not** captured in this pass; reviewer still needs to answer the five visual-balance questions on device.

## Gaps (not P0)

- Full VoiceOver / TalkBack script with a worker tester is UAT, not automated.
- Large-text clipping on every grievance node needs a physical Android pass.
- Portal skip-link copy is English until locale hydrates if the first Tab happens before hydrate (default locale is English).
