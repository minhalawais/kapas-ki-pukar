# 06 — UI/UX Design System + Localization / RTL Guidelines

**Document ID:** KKP-UX-006  
**Product:** Kapas ki Pukaar — Voice-Enabled Smart Grievance Reporting Application for Cotton Farm Workers  
**Prepared for:** Pakistan United Workers Federation (PUWF)  
**Technical Partner:** Fruit of Sustainability (FOS)  
**Version:** 1.1  
**Date:** 19 August 2026  
**Status:** Frontend Development Baseline  
**Phase:** Phase 1 — Complete Frontend with Dummy Data  
**Purpose:** Define the shared visual language, accessibility-oriented interaction patterns and Urdu/RTL implementation rules for the mobile app and PUWF web portal.

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

## 2. Design Direction

Kapas ki Pukaar should feel:
- human;
- agricultural;
- trustworthy;
- voice-first;
- calm;
- institutionally credible.

Mobile emotional quality:
**safe, friendly, guided, accessible**

Web emotional quality:
**controlled, credible, operational, data-driven**

The two products must feel related through colour, typography, component language and iconography without forcing the same layout style.

## 3. Brand Architecture

Kapas ki Pukaar is not a PUWF-only green interface and is not a generic sustainability-green application.

The visual identity must deliberately combine three sources:

- **PUWF** — institutional trust and ownership;
- **FOS** — technology, voice and AI capability;
- **Kapas** — cotton/agriculture warmth and worker accessibility.

The interface must therefore be built around **warm neutral space first**, then use colour according to function.

## 4. Core Colour System

| Token | Hex | Functional Role |
|---|---:|---|
| Cotton Cream | `#F7F3E8` | Primary warm worker-facing background |
| Surface White | `#FFFFFF` | Cards, web content, forms, modals |
| Soft Neutral | `#F4F6F4` | Portal page background and subtle groups |
| PUWF Sovereign Green | `#004027` | Institutional anchor, web sidebar, limited emphasis |
| PUWF Emerald | `#0B4F37` | Secondary institutional detail |
| FOS Teal | `#2D9480` | Voice, audio, AI processing, secondary actions |
| FOS Deep Teal | `#206E71` | Teal emphasis where stronger contrast is required |
| Kapas Green | `#0B5D3B` | Primary worker CTA and selected high-value actions |
| Cotton Gold | `#E5A62E` | Progress, cotton/agriculture detail, milestone highlight |
| FOS Orange | `#E48424` | Small illustration/data-viz accent |
| Soft Teal | `#E7F4F1` | AI/voice assistive card backgrounds |
| Soft Gold | `#FBF3DF` | Agriculture/progress highlight backgrounds |
| Soft Blue | `#EAF2F9` | Information card backgrounds |
| Ink | `#17231E` | Primary text |
| Secondary Text | `#66736D` | Supporting text |
| Border | `#DCE5E0` | Dividers and card borders |
| Success | `#27845A` | Success/resolved |
| Warning | `#D88416` | Warning/overdue |
| Critical | `#C83B3B` | Emergency/destructive only |
| Info | `#2877B8` | Information/reference and data visualisation |

A partner/ILO reference blue must only be used after the current official ILO brand value is verified. Until then, `#2877B8` is the product information blue, not an asserted official ILO colour.

## 5. Colour Composition and Usage Rules

### 5.1 Recommended Composition

Typical screen/dashboard viewport:
- **60–70%** cream/white/light neutral;
- **10–15%** PUWF institutional green;
- **8–12%** FOS teal;
- **3–7%** Kapas green;
- **2–5%** Cotton Gold/FOS Orange;
- semantic colours only when needed.

### 5.2 Mobile Rules

- Default background: Cotton Cream or White.
- Default top bar: Cream/White/light neutral.
- Primary worker CTA: Kapas Green.
- Voice/audio/AI controls: FOS Teal.
- Progress/accent: Cotton Gold.
- Dark PUWF Green may appear in logo/brand areas and exceptional high-emphasis states, not as the default header/background on every screen.
- Normal mobile screens should contain no more than one large saturated-green surface.
- Privacy cards, evidence cards and complaint cards default to white/cream with borders; selected state may use a light tint plus outline/icon.
- Success screens use neutral background with a green success icon/button rather than a full green page.

### 5.3 Web Rules

- PUWF sidebar: Sovereign Green.
- Main page background: Soft Neutral/White.
- Cards: White.
- Primary action: Kapas Green.
- Voice/AI: FOS Teal + Soft Teal background.
- Filters/selected states: soft teal or soft neutral.
- KPI cards stay neutral/white.
- Charts use mixed palette: Teal, Gold, Info Blue, PUWF Emerald, FOS Orange, neutral grey.
- Never build a dashboard from five shades of green.

### 5.4 Semantic Rules

- Red = emergency, critical safeguarding, destructive action.
- Warning amber = overdue/attention.
- Blue = information.
- Green = primary action/success/institutional context depending token.
- Ordinary **No** = neutral outline, not red.
- Status always includes text/icon, not colour alone.

## 5.5 Design Tokens

```css
:root {
  --surface-warm: #F7F3E8;
  --surface-default: #FFFFFF;
  --surface-neutral: #F4F6F4;
  --surface-soft-teal: #E7F4F1;
  --surface-soft-gold: #FBF3DF;
  --surface-soft-blue: #EAF2F9;

  --brand-puwf: #004027;
  --brand-puwf-emerald: #0B4F37;
  --brand-fos-teal: #2D9480;
  --brand-fos-teal-dark: #206E71;
  --brand-kapas: #0B5D3B;
  --brand-cotton-gold: #E5A62E;
  --brand-fos-orange: #E48424;

  --text-primary: #17231E;
  --text-secondary: #66736D;
  --border: #DCE5E0;

  --success: #27845A;
  --warning: #D88416;
  --critical: #C83B3B;
  --info: #2877B8;
}
```

### 5.6 Semantic Alias Tokens

Components should consume semantic aliases where practical:

```css
--action-primary: var(--brand-kapas);
--action-secondary: var(--brand-fos-teal);
--voice-active: var(--brand-fos-teal);
--ai-accent: var(--brand-fos-teal);
--institutional-anchor: var(--brand-puwf);
--progress-accent: var(--brand-cotton-gold);
--page-worker: var(--surface-warm);
--page-admin: var(--surface-neutral);
```

## 6. Typography

### English
Preferred: **Inter**

Weights:
- 400 body
- 500 label
- 600 button
- 700 heading

### Urdu
Preferred approach:
- brand/editorial headings: Noto Nastaliq Urdu where visually appropriate;
- UI controls and longer functional text: highly legible Urdu/Naskh-compatible font such as Noto Naskh Arabic.

Do not force Nastaliq into dense tables, small chips or narrow controls.

## 7. Suggested Mobile Type Scale

| Element | Size |
|---|---:|
| Main Urdu question | 24–28 px |
| Answer label | 18–21 px |
| Body/helper | 16–18 px |
| Button | 18–20 px |
| Complaint reference | 18 px |
| English equivalent | 16–18 px |

If Urdu wraps, increase container height rather than shrinking below the agreed minimum.

## 8. Spacing System

Base system:
`4 / 8 / 12 / 16 / 24 / 32 / 48 / 64`

Typical:
- card padding: 16–24;
- section gap: 24–32;
- label/value gap: 8;
- major mobile screen side padding: 16–20.

## 9. Radius

Mobile:
- cards: 16–20
- buttons: 14–16
- answer cards: 16
- microphone: circular

Web:
- large cards: 12–14
- inputs/buttons: 8–10
- chips: pill where useful

## 10. Shadow Rules

Prefer borders and spacing.

Use only subtle shadows:
- small elevation: `0 1px 2px rgba(...)`
- card emphasis: `0 4px 12px rgba(... low opacity)`

Avoid floating-everything aesthetics.

## 11. Mobile Interaction Rules

- one question per screen;
- no dense forms;
- primary action height 56–64 px;
- answer card height roughly 96–120 px where possible;
- microphone target 72–88 px;
- strong contrast for outdoor use;
- simple illustrations;
- no decorative complexity near critical actions.

## 12. Voice Visual Language

### Idle
White or Soft Teal microphone circle with FOS Teal border.

### Listening/Recording
FOS Teal filled microphone + pulse/waveform.

### Processing
FOS Teal animated waveform/dots.

### Complete
Green confirmation.

### Error
Neutral error panel with red icon only where necessary.

Voice should look calm and trustworthy, not like a neon consumer AI assistant.

## 13. Illustration Style

Use:
- flat vector;
- rounded line style;
- 2–3 colours per illustration;
- warm off-white or transparent background;
- dark neutral or PUWF-green outlines with FOS-teal and Cotton-Gold details.

Avoid:
- random emoji as final product graphics;
- childish 3D characters;
- alarming imagery for sensitive grievances.

## 14. Mobile Home Structure

Recommended:
1. brand + welcome
2. large **Report a Problem** card
3. Track My Complaint
4. Know Your Rights
5. Listen to This Screen

No dashboard charts.

## 15. Web Layout

### Sidebar
- 224–240 px
- `#004027`
- Kapas ki Pukaar
- PUWF Grievance Portal
- Dashboard & Complaints
- Analytics
- minimal support items only

### Top Bar
- white
- search
- notifications demo
- PUWF account/demo identity

### Dashboard
- white cards on light neutral background
- operational data before decorative charts

## 16. KPI Cards

Use white cards with:
- small icon badge;
- label;
- number;
- helper/trend.

Do not fill entire KPI cards with semantic colours.

## 17. Complaint Table

Rows should be compact but readable.

Columns:
- ID
- Category
- Location
- Date
- Privacy
- Priority
- Status
- Last Action

Priority chips:
- Emergency
- Critical
- High
- Standard

Status chips should use limited colours.

## 18. Complaint Workspace

Recommended desktop proportions:
- 55–60% case content
- 20–25% timeline
- 20–25% action rail

Action rail remains sticky where appropriate.

## 19. AI Visual Treatment

Use soft teal/neutral card.

Labels:
- AI Case Summary
- Suggested Category
- Suggested Priority
- AI-Extracted Facts
- Human Review Required

Never use:
- AI Decision
- AI Verdict
- Proven

## 20. Localization Architecture

Suggested locale keys:
```text
locales/
  ur.json
  en.json
  sd.json        # future
  skr.json       # future
```

UI strings must never be scattered as hard-coded Urdu/English across components.

## 21. RTL Rules

- use locale-aware layout helpers;
- text alignment follows language;
- directional arrows flip;
- progress navigation must be tested in RTL;
- microphone/camera/lock/location icons do not flip;
- complaint IDs and phone numbers may require LTR isolation inside RTL context;
- mixed Urdu/English lines require bidi testing;
- table columns on PUWF portal may remain LTR if the portal language is English.

## 22. Translation Governance

Create one approved translation sheet with:
- key;
- English;
- Urdu;
- notes;
- audio prompt ID;
- approval status.

Developers do not invent translations.

## 23. Accessibility Baseline

Target WCAG AA-oriented practice:
- sufficient contrast;
- visible focus states;
- no colour-only status;
- screen-reader labels;
- keyboard-accessible web actions;
- large mobile touch targets;
- text scaling support;
- reduced-motion consideration;
- audio is supplementary to visual control, not exclusive.

## 24. Prohibited Design Patterns

Avoid:
- glassmorphism;
- neumorphism;
- excessive gradients;
- dark-first worker UI;
- tiny radio buttons;
- generic purple AI gradients;
- excessive animation;
- stock-photo-heavy complaint flows;
- overcrowded admin dashboards;
- turning the mobile grievance journey into a form.

## 25. Co-Branding

### Splash / About
- Kapas ki Pukaar primary
- An initiative of PUWF
- Technology Partner: FOS
- Supported by ILO

### Inside mobile
Primarily Kapas branding.

### PUWF portal
Kapas ki Pukaar + PUWF Grievance Portal.

Partner acknowledgements remain restrained.


## 25. Visual Balance Acceptance Rules

A screen fails visual QA if any of the following occurs:
- dark/medium green covers most of a normal mobile screen;
- more than one large saturated-green panel competes on the same mobile screen;
- voice/AI states are green instead of teal;
- dashboard KPI cards are filled with green;
- charts are predominantly shades of green;
- the web content canvas is dark green outside the sidebar;
- Cotton Gold or FOS Orange is used as a primary CTA;
- partner branding overwhelms Kapas product identity.

A screen passes visual QA when:
- the eye first perceives a warm/light canvas;
- PUWF green clearly anchors institutional ownership;
- FOS teal clearly signals voice/AI/technology;
- Kapas green clearly identifies the main worker action;
- cotton-gold details add agricultural warmth without clutter.
