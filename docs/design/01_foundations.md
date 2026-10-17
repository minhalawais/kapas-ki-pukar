# 01 — Foundations

Token source: `docs/design/tokens/`. Hex lives only there and in doc 06.

## Identity

Warm/light canvas first. PUWF green = sidebar/ownership. FOS teal = voice/AI. Kapas green = worker primary action. Gold/orange = accent only.

## Type

- English/UI: Inter  
- Urdu headings (welcome, editorial): Noto Nastaliq Urdu  
- Urdu controls, answers, tables, chips: Noto Naskh Arabic  
- Complaint IDs: Inter + LTR isolate + optional mono  

Do not put Nastaliq in the complaint table.

Mobile scale: `mobileType` (question 26px, CTA 18px).  
Portal scale: `webType` (H1 22px, table 13px, KPI 28px). Compact ops density per FOS-UI-UX-INSTRUCTIONS.md.

## Space and shape

Spacing scale 4–64. Prefer border over shadow. Elevation `sm`/`md` only.

| Context | Radius | Control height |
|---|---|---|
| Mobile card / answer | 16 | CTA 56–64, mic 72–88 |
| Portal card | 12 | Button 36, input 40 |

## Motion

Use `motion` tokens. Recording pulse only while recording/processing. Idle is static. Honour `prefers-reduced-motion`.

## Contrast notes

Pass (expected AA):

- `textPrimary` on `pageWorker` / `surface`
- `onPrimary` on `actionPrimary` and `institutionalAnchor` for large CTA text

Caution:

- White label on `actionSecondary` (`#2D9480`) — use `voiceActiveStrong` for small white text
- `textSecondary` on cream — verify at 200% zoom; darken if QA fails

Icons: Lucide only. No emoji as UI.

## Charts

`chartSeriesOrder`. Max two green-family series. Category mix = sorted horizontal bar (not an 11-slice donut). Line = trend. Legend or direct labels required.
