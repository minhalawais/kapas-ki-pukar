# Kapas ki Pukaar — Implementation Phase 01 Design System

**Status:** Developer handoff baseline  
**Date:** 19 August 2026  
**Sources:** `docs/06_..._v1.1.md`, Phase 01 guide, FOS-UI-UX-INSTRUCTIONS.md, doc 09 token architecture, doc 10 a11y/KPI

This folder is the **approved visual system for coding** until a Figma file URL is recorded (OQ-002). Do not invent a parallel look.

## Density split

| Surface | Density source | Colour/identity source |
|---|---|---|
| Worker mobile | Doc 06 (large targets, one question) | Doc 06 tokens |
| PUWF portal | FOS-UI-UX-INSTRUCTIONS.md (compact ops) | Doc 06 tokens |

Do not apply ESG pillar colours or IBM Plex as the Kapas face.

## Files

| File | Purpose |
|---|---|
| `tokens/` | Framework-free token source. Copy into `packages/design-tokens/` in Phase 02. |
| `01_foundations.md` | Type, space, radius, elevation, motion, contrast |
| `02_mobile_components.md` | Worker components + states |
| `03_web_components.md` | Portal components + states |
| `04_templates.md` | Screen templates (no long forms) |
| `05_rtl_and_localization.md` | RTL, bidi, locale keys |
| `06_accessibility_review.md` | Phase 01 a11y review |
| `07_developer_handoff.md` | Component → token → screen → FRS |
| `phase_01_exit_review.md` | DoD record |

## Phase 02 copy list

```text
docs/design/tokens/*  →  packages/design-tokens/src/*
tokens/globals.css    →  apps/puwf-portal/src/app/globals.css (seed)
```
