# Kapas ki Pukaar Mobile UI/UX Refactoring Specification v2.1

**Status:** Design and engineering refactoring brief  
**Scope:** Worker-facing Expo mobile app only  
**Prepared:** 20 August 2026  
**Primary locale:** Urdu, right-to-left  
**Secondary locale:** English  
**Revision:** 2.1 adds a fresh 2026 competitor review, worker mental-state model, stricter screen-differentiation rules, implementation blueprints and a generated visual exemplar.  

## 1. Executive verdict

The current app has a sound functional concept but does not yet present a credible, usable product interface. The problem is not simply a conservative colour palette or insufficient decoration. Three layers are failing at the same time:

1. **A rendering defect removes most interactive styling.** In the running Android build, styles passed as callback functions to `Pressable` are not applied. Buttons, answer cards, complaint cards and navigation controls therefore lose backgrounds, borders, padding, minimum heights and pressed states.
2. **The visual system is specified but not operational.** The token package contains a reasonable brand palette, but the app does not load the named Urdu or Latin fonts, uses web-style font fallback strings that React Native cannot resolve as intended, and relies on border colours that are almost invisible on the cream canvas.
3. **Screens are differentiated by content only.** Most routes use the same `ScreenShell`, the same vertical gap and the same text/card stack. They do not change composition according to the worker's goal: orientation, reporting, privacy, emergency, confirmation, tracking or learning.

The redesign direction should be **“trusted field guide + private helpline”**: calm and institutional enough to feel legitimate, direct and visual enough for a first-time smartphone user, and familiar enough to borrow the successful mental model of voice notes without looking like a generic chat or AI product.

## 2. Audit evidence

### 2.1 Captured Android screens

The current build was inspected on Android emulator `emulator-5554`, 1080 x 2400 physical pixels, 411 x 914 dp logical viewport. Accepted captures are stored in:

`/.artifacts/mobile-ux-audit/current/`

Representative evidence:

- `01-home.png`: primary CTA is white text on the cream canvas; all three actions appear as floating labels.
- `02-grievance-intro.png`: almost the entire screen is empty while the invisible Continue CTA sits at the bottom edge.
- `03-categories.png`: answer-card containers are missing, leaving a long ungrouped list of text.
- `05-rights-list.png`: blank gold strips stand in for illustrations; topic containers have no visible boundaries.
- `07-complaints-empty.png`: an empty message exists but there is no direct next action.
- `09-complaints-list.png`: complaint card styling is missing, causing mixed Urdu, dates and tracking ID to float without grouping.
- `10-complaint-detail.png`: summary, evidence and timeline have no section containers or status visualization; English content breaks the Urdu reading flow.

![Current Android audit contact sheet](../../.artifacts/mobile-ux-audit/current/contact-sheet.png)

Contact-sheet order is left to right: Home, Grievance Introduction, Category Selection, Pesticide Follow-up, Rights List, Rights Detail, Complaints Empty, Demo Controls, Complaint List and Complaint Detail.

### 2.2 Flow health

| Step | Screen or task | General health | Main evidence |
|---:|---|---|---|
| 1 | Home and task entry | Critical | Primary action is visually invisible; page hierarchy is weak. |
| 2 | Grievance introduction | Poor | Severe dead space; action is far from content and invisible. |
| 3 | Choose complaint category | Critical | Answer-card styling is absent; categories have no icons or selected affordance. |
| 4 | Category follow-up | Critical | Same unstructured text list repeats; no category identity or guidance. |
| 5 | Rights topic list | Poor | Placeholder strips look unfinished; cards and topic recognition are weak. |
| 6 | Rights detail | Poor | Blank pseudo-illustration and two text blocks leave most of the screen unused. |
| 7 | Complaints empty state | Poor | Message is understandable but offers no CTA to create a report. |
| 8 | Demo controls | Critical for demo use | Long ungrouped control list; enabled, disabled and destructive actions are indistinguishable. |
| 9 | Complaint list | Critical | Card container is absent; date, ID and status have no readable grouping. |
| 10 | Complaint detail | Critical | No status header, no visual timeline, mixed-language content and weak evidence treatment. |

### 2.3 Evidence limits

This is a combined visual, UX and code audit. It does not claim full WCAG conformance. Screen-reader reading order, switch access, physical-device glare, microphone use in farm noise, large-font reflow and colour perception still require device and field testing.

## 3. Research synthesis

### 3.1 Evidence-backed context

The 2025 GSMA AgriTech UX Design Guidebook describes the realities that should govern this app: shared or worn devices, data-cost sensitivity, poor signal, glare in bright sunlight, varied confidence with tapping and typing, and familiarity with WhatsApp-style voice notes. It recommends short visual tutorials, familiar local imagery, less typing, clear offline state, preserved drafts and highly visible common tasks. See [GSMA AgriTech UX Design Guidebook](https://www.gsma.com/solutions-and-impact/connectivity-for-good/mobile-for-development/wp-content/uploads/2025/10/AgriTech-UX-Design-Guidebook.pdf).

Ulula's worker grievance platform validates anonymous, multilingual and voice-capable reporting across low-connectivity channels. Its strongest transferable pattern is ongoing two-way status communication, not its corporate dashboard styling. See [Ulula Grievance Mechanism](https://ulula.com/technology/grievance-mechanism/) and [Ulula OWL App](https://ulula.com/technology/owl-app/).

Pakistan Citizen Portal demonstrates that complaint IDs, explicit status, a complaint diary and a visible new-complaint action matter in a local grievance product. Its dense registration and form model should not be copied for this audience. See [official Pakistan Citizen Portal](https://www.citizenportal.gov.pk/) and [Google Play listing](https://play.google.com/store/apps/details?id=com.govpk.citizensportal).

Plantix demonstrates a useful agricultural pattern: task-led home composition, locally recognizable imagery and visual categories. Kapas ki Pukaar should borrow that recognition strategy, not Plantix's feature density.

Google Fonts notes that Nastaliq is the preferred Urdu writing style but requires more vertical space and stronger rendering support than Naskh. This supports using Nastaliq selectively for brand/editorial moments and Naskh for functional UI. See [Google Fonts on digital Nastaliq Urdu](https://fonts.googleblog.com/2023/03/why-are-there-so-few-digital-nastaliq.html).

Android recommends at least 48 x 48 dp touch targets, preferably separated by 8 dp. See [Android touch target guidance](https://support.google.com/accessibility/android/answer/7101858) and [Android accessibility guidance](https://developer.android.com/guide/topics/ui/accessibility/views/apps-views).

### 3.2 Product-specific user hypotheses

These are design hypotheses derived from the concept note and comparative research. They must be validated with cotton workers rather than treated as proven facts.

- A worker may fear retaliation more than they fear a complicated interface. Identity choices therefore need plain explanations and reassurance before data collection.
- A shared phone changes the meaning of “anonymous.” The app should avoid revealing sensitive category names in notifications, recent-screen previews and home-page draft summaries.
- The worker's most important question after submission is “Did it reach someone?” The tracking experience should emphasize received state, next step and last update, not internal case-management language.
- In pesticide, injury, forced-labour and child-labour cases, the user may be distressed or hurried. Screens should reduce choices and expose an immediate safety message without alarming full-screen colour.
- Voice recording is likely more familiar than typing, but the microphone still needs a visible explanation, timer, playback and safe deletion because recording can feel risky.
- Icons are not automatically universal. Every icon must remain paired with a short Urdu label until field testing proves recognition.

### 3.3 Field research required before final visual sign-off

Recruit 12-18 cotton workers across Punjab and Sindh, including women, different age groups, different literacy levels, shared-phone users and both confident and first-time smartphone users.

Test in the real context where possible:

- direct sunlight and shade;
- dusty hands or reduced touch precision;
- weak or absent connectivity;
- farm noise during recording and playback;
- phone font scale at 100%, 130% and 200%;
- private phone and shared phone scenarios.

Measure:

- first-tap success on Home;
- category recognition without facilitator help;
- comprehension of Anonymous, Confidential and Identified;
- ability to start, stop, play and delete a recording;
- whether offline-saved versus submitted is understood;
- whether the worker can repeat or find the tracking ID;
- completion time, abandonment point and requests for help;
- icon comprehension and emotional comfort for sensitive categories.

### 3.4 Comparative product and design intelligence

The comparators below are pattern references, not visual templates. Kapas ki Pukaar serves a narrower, more vulnerable audience than a general agricultural or government service app, so every borrowed pattern must be simplified and privacy-reviewed.

| Product or standard | Observed strength | Transfer to Kapas ki Pukaar | Do not copy |
|---|---|---|---|
| GSMA AgriTech UX Guidebook (2025) | Research and co-creation methods for agricultural users with low digital literacy; emphasis on context, field constraints and simple flows. | Design for bright light, intermittent connectivity, limited typing confidence, assisted onboarding and visible offline state. | Do not treat "farmer" as one universal persona or assume smartphone ownership equals app fluency. |
| GSMA Traderex case study | Field research changed the service model after low digital literacy and limited confidence were observed; offline capability and reduced onboarding were prioritized. | Reduce variables, avoid long onboarding, provide assisted/listenable explanations and preserve work offline. | Do not force workers through a profile or registration funnel before they can report. |
| Plantix | A concrete first task, recognizable agricultural imagery, photo/voice-oriented interaction and localized knowledge make value immediately visible. | Use one dominant task on Home, category illustrations and actionable visual summaries. | Do not copy feature density, commercial promotion, crop dashboards or community-feed complexity. |
| Ulula Grievance Mechanism / OWL | Anonymous, multilingual, two-way grievance communication across voice, SMS and apps; visible human follow-up. | Treat reporting as the beginning of a relationship. Show receipt, assignment, updates and safe worker response. | Do not copy corporate risk-dashboard language or chatbot styling that could make a sensitive report feel automated and impersonal. |
| Pakistan Citizen Portal | Familiar complaint diary, prominent new-complaint action, tracking references and visible status history. | Keep tracking ID, current state, last update and next action highly visible. | Do not copy dense registration, bureaucratic categories, long form entry or status labels that can be marked resolved without worker comprehension. |
| ILO grievance examples | Local-language voice, two-way union communication, anonymity and access without membership are central to reach. | Make voice, language, confidentiality and PUWF follow-up visible as service guarantees. | Do not make the app the only channel or imply that a digital submission alone guarantees remedy. |
| OHCHR UN Guiding Principles | Effective grievance mechanisms must be legitimate, accessible, predictable, equitable, transparent, rights-compatible and dialogue-based. | Convert those principles into interface evidence: ownership, plain procedure, expected time, understandable status, response channel and privacy explanation. | Do not use trust claims as decorative slogans without matching product behavior. |

Current public feedback on Pakistan Citizen Portal reinforces a crucial distinction: users judge the product by whether they can submit, see progress and trust the handling process, not by visual polish alone. Reviews on the June 2026 app listing report sign-in/submission failures and dissatisfaction when evidence or negative feedback appears ignored. This is anecdotal public feedback, not representative worker research, but it raises the priority of recoverable submission, evidence visibility and worker-confirmed resolution.

### 3.5 Worker mental-state model

The same card stack cannot support every stage because the worker's emotional and cognitive state changes across the journey.

| Journey moment | Likely worker question | Design response | Visual tone |
|---|---|---|---|
| First launch | "Is this really for me, and who will hear me?" | Show PUWF ownership, one adult-worker illustration, language choice and a listen option. | Familiar, calm, credible. |
| Home | "Where do I start?" | One unmistakable report action; tracking and rights remain secondary. | Decisive, task-led. |
| Reporting introduction | "Is it safe to say this?" | Reassurance before collection, privacy cue, short explanation and immediate Continue. | Private, supportive. |
| Category selection | "Which of these matches my problem?" | Recognition-first illustrated categories with examples and an Other route. | Practical field guide. |
| Sensitive follow-up | "Will choosing this put me at risk?" | Minimal questions, neutral copy, no dramatic imagery, easy back/change. | Protective, non-judgmental. |
| Voice recording | "Is it recording, and can I undo it?" | Explicit state, timer, playback, delete and on-device reassurance. | Familiar voice-note behavior. |
| Privacy choice | "Who will know my name?" | Consequence-based options, not abstract labels; no least-private default. | Serious, transparent. |
| Review | "Did the app understand me?" | Recognition-based summary, audio replay, section edits and localized AI wording. | Confirming, reversible. |
| Offline save | "Has PUWF received it?" | Distinguish saved-on-phone from received with a three-state explanation. | Cautious, factual. |
| Submitted | "Did it reach someone?" | Receipt panel, reference ID, next step and expected update. | Reassuring, not celebratory. |
| Tracking | "What happened, and what should I do?" | Current state, last update, next step and two-way response. | Predictable, accountable. |
| Rights learning | "Is this wrong, and what can I do?" | Situation-led examples, listen action and contextual reporting. | Educational, empowering. |

### 3.6 Evidence versus design inference

**Observed in the running build:** missing interactive surfaces, severe empty space, weak grouping, raw/mixed-language data, missing illustration content and undifferentiated screens.

**Supported by external research:** low-literacy agricultural interfaces benefit from reduced text entry, local language, audio/visual support, offline resilience, field testing and clear feedback; grievance mechanisms require accessibility, predictability, transparency, confidentiality and dialogue.

**Still a hypothesis until worker testing:** exact icon recognition, preferred category order, acceptable illustration style, comprehension of the three privacy modes, willingness to use voice in shared-phone conditions and whether a two-column category grid is easier than a single-column list.

## 4. Root-cause debugging

### P0.1 `Pressable` callback styles are dropped

Affected components include `PrimaryCta`, `AnswerCard`, `LanguageCard`, `PrivacyCard`, `ComplaintStatusCard`, `RightsTopicCard`, `LightTopBar`, `EvidenceCard`, `VoiceRecorder`, draft actions and the error boundary.

The project uses NativeWind `4.1.23`, `react-native-css-interop` `0.1.22`, Expo 53 and a Babel `jsxImportSource: "nativewind"`. NativeWind has a documented open defect where React Native `Pressable` style callback functions are not called, causing exactly the observed loss of backgrounds and layout. See [NativeWind issue #1105](https://github.com/nativewind/nativewind/issues/1105) and [proposed fix #1383](https://github.com/nativewind/nativewind/pull/1383).

**Recommended resolution:** remove NativeWind from the mobile Babel transform and mobile runtime. The app currently uses `className` in only one loading container and otherwise uses React Native styles. Replace that one `className` with a normal style, remove the mobile `global.css` import and NativeWind Babel preset, and keep the web portal decision separate. This is lower risk than preserving a styling interop layer that the mobile app does not materially use.

**Temporary alternative:** convert every `Pressable` to stable `StyleSheet.create` base styles and manage pressed state without a callback. This has a larger maintenance cost and should only be used if NativeWind must remain.

**Acceptance test:** every callback-styled control must display background, border, radius, padding, min-height and pressed opacity on Android and iOS. Assert measured touch bounds, not only snapshots.

### P0.2 Urdu and Inter fonts are not loaded

The token package declares CSS fallback lists such as `"Noto Naskh Arabic", "Noto Nastaliq Urdu", sans-serif`, but React Native expects a registered native font family. There are no `.ttf` or `.otf` assets and no `useFonts`/`expo-font` loading gate. The runtime therefore falls back to the device font.

**Resolution:** bundle local font files and register explicit family names:

- `KapasNaskh-Regular`, `KapasNaskh-Semibold`, `KapasNaskh-Bold` for body, controls and questions;
- `KapasNastaliq-Regular` and optionally `KapasNastaliq-Bold` for brand and short editorial headings;
- `KapasInter-Regular`, `KapasInter-Medium`, `KapasInter-Semibold`, `KapasInter-Bold` for English and Latin data.

Do not pass CSS comma-separated fallback lists to native `fontFamily`. Gate the first route until fonts are loaded, with a neutral splash fallback.

### P0.3 RTL top navigation is visually wrong

The captured back control appears on the left while Urdu title alignment is on the right. Its accessibility bounds were approximately 19 physical pixels wide in the broken build. The current implementation also uses a text glyph (`‹`) instead of a platform icon.

**Resolution:** use a proper icon library, a 48 dp icon button and logical `start/end` placement. In Urdu, back should appear at the right/start edge with a right-pointing arrow. Keep title truncation and spacing stable at 200% text size.

### P0.4 Current colours pass on paper but several pairs fail in use

Calculated contrast against Cotton Cream:

| Pair | Ratio | Decision |
|---|---:|---|
| Ink / Cream | 14.62:1 | Keep. |
| Secondary text / Cream | 4.47:1 | Borderline below 4.5:1; darken. |
| Border / Cream | 1.16:1 | Too weak for essential boundaries. |
| White / Kapas Green | 7.95:1 | Keep for primary CTA. |
| White / FOS Teal | 3.71:1 | Do not use for normal-size text on a filled teal button. |
| White / Deep Teal | 5.95:1 | Use for filled voice CTA. |
| Gold / Cream | 1.93:1 | Too weak as the only progress cue. |

**Resolution:** introduce accessible semantic aliases rather than changing brand primitives indiscriminately.

### P0.5 Placeholder blocks look like unfinished loading states

`WelcomeIllustration`, rights cards and rights detail use empty rounded views as visual placeholders. They attract attention without communicating meaning.

**Resolution:** replace all placeholder blocks with real, bundled assets. Never ship blank colour bars as illustrations.

### P0.6 Mixed-language and bidi content is not controlled

The Urdu complaint detail displays an English AI summary, raw ISO date strings and Latin filenames inside RTL flow. Tracking ID isolation exists, but dates, currency values, filenames and English summaries need the same discipline.

**Resolution:** localize summaries or visibly label them as English; isolate Latin blocks LTR; format dates in a worker-friendly localized form; present currency as a structured wage comparison rather than one English sentence.

## 5. New visual direction

### 5.1 Design character

Use a **Field Guide + Trusted Helpline** visual language:

- **Field Guide:** recognizable cotton, tools, wages, water, spray equipment and work settings; structured topics; practical, calm visual explanations.
- **Trusted Helpline:** clear voice control, privacy reassurance, receipt-like submission confirmation, human-readable status and visible next actions.
- **Institutional proof:** PUWF ownership appears consistently but quietly; it should never resemble surveillance, enforcement or a generic government form.

Avoid:

- decorative farm photography behind text;
- generic AI gradients, glowing orbs or neon waveforms;
- childlike mascots for harassment, forced labour or child labour;
- full-screen green, red or orange states;
- large empty canvases whose only purpose is spaciousness;
- repeated stacks of identical cards on every route.

### 5.2 Screen families

Each family receives its own composition while sharing tokens and controls.

| Family | Routes/states | Visual identity |
|---|---|---|
| Orientation | Splash, language, welcome | Brand-led, illustrated, centred or staged composition. |
| Action | Home | Task tiles with strong icons and one dominant report action. |
| Guided report | Grievance questions | Compact step chrome, prominent question, category-aware visual, fixed action dock. |
| Safety and trust | Danger, privacy, permission | Reassuring explanation panels, shield/identity visuals, explicit consequences. |
| Voice and AI | Record, process, confirm | Teal recording surface, waveform, timer, transcript/summary confirmation. |
| Confirmation | Submitted, offline saved | Receipt composition, large state icon, tracking ID, one next action. |
| Tracking | Complaint list/detail/feedback | Status-led cards, timeline, dates, progress and next step. |
| Learning | Rights list/detail | Editorial topic covers, step illustrations, “what this means / what to do” structure. |
| Utility | Demo, errors, recovery | Dense but grouped operational panels, clearly marked as non-worker/demo UI. |

### 5.3 Screen-differentiation contract

Each route must differ through task structure, not random decoration. A screen is sufficiently differentiated only when at least three of the following change to match its task:

1. **Primary composition:** hero task tile, question flow, trust panel, recorder, receipt, timeline, editorial guide or utility control group.
2. **Information density:** orientation and success are intentionally sparse; category, review and tracking are structured and denser.
3. **Visual anchor:** one purposeful illustration, status icon, waveform, category symbol or timeline. Blank decorative rectangles do not count.
4. **Action placement:** immediate content action, selected-answer continuation, sticky dock, record control, feedback choice or contextual report action.
5. **Surface treatment:** neutral canvas, voice panel, safety notice, receipt, list card or article band according to function.
6. **State feedback:** selected, recording, saved offline, submitted, waiting, resolved and error states have different icon-plus-label treatments.

Shared chrome remains predictable: 20 dp page inset, RTL-aware top bar, consistent type roles, 48 dp minimum targets, familiar button variants and one semantic colour system.

### 5.4 Density and empty-space rules

- Empty space is useful only when it protects comprehension around one high-value message or action.
- On a 411 x 914 dp device, task content should normally occupy 55-75% of the usable viewport before scrolling. Orientation and success screens may use 45-65% when a purposeful illustration or receipt structure balances the canvas.
- A normal task screen must not leave more than approximately 240 dp of uninterrupted blank space between the last meaningful content and the primary action.
- Do not stretch cards simply to fill a tall phone. Add useful explanation, visual recognition, state feedback or contextual action instead.
- Sticky actions must sit in a real surface/action dock with top border or elevation, never as floating white text on the cream canvas.
- Lists should expose the start of the next item where practical so the user understands that more content is available.

## 6. Refined design system

### 6.1 Colour aliases

Retain the approved brand primitives and add functional mobile aliases:

| Alias | Proposed value | Use |
|---|---:|---|
| `canvas.worker` | `#F7F3E8` | Main warm canvas. |
| `surface.primary` | `#FFFFFF` | Cards, action dock, receipt and modal. |
| `surface.muted` | `#F1F4F1` | Grouped secondary sections. |
| `surface.voice` | `#E7F4F1` | Voice and AI supporting areas. |
| `surface.gold` | `#FBF3DF` | Progress and agriculture context. |
| `text.primary` | `#17231E` | Main text. |
| `text.secondary` | `#55645D` | Supporting text; 5.62:1 on cream. |
| `border.subtle` | `#C8D5CF` | Decorative division only. |
| `border.essential` | `#789388` | Input/card boundary; approximately 3:1 on cream. |
| `action.primary` | `#0B5D3B` | Main report/continue action. |
| `action.voice` | `#206E71` | Filled voice action with white text. |
| `accent.voice` | `#2D9480` | Icons, waveform and outlines. |
| `accent.progress` | `#A86F00` | Progress fill and gold icon details. |
| `state.success` | `#27845A` | Submitted/resolved icon and status. |
| `state.warningText` | `#996800` | Offline/attention text and border. |
| `state.critical` | `#C83B3B` | Immediate danger and destructive action only. |

Rules:

- Use colour to identify function, not entire pages.
- A normal screen may have one strong green surface and one strong teal control, not a collection of saturated cards.
- Status must always include icon + label + explanatory text where needed.
- Essential boundaries must reach approximately 3:1 against their adjacent surface.

### 6.2 Typography

| Role | Urdu family | Size / line height | Notes |
|---|---|---:|---|
| Brand name | Nastaliq | 30 / 50 | One line where possible. |
| Page title | Naskh Bold | 24 / 38 | Use in top bar; stable and compact. |
| Main question | Naskh Bold | 28 / 44 | Maximum three lines before copy review. |
| Answer title | Naskh Semibold | 20 / 34 | Pair with icon. |
| Body | Naskh Regular | 18 / 32 | Do not use condensed line height. |
| Helper | Naskh Regular | 16 / 28 | Use darker secondary token. |
| Button | Naskh Semibold | 19 / 30 | Minimum 56 dp container. |
| Label | Naskh Semibold | 15 / 26 | Status and field labels. |
| Tracking/data | Inter Semibold | 17 / 24 | LTR isolate. |

Use Nastaliq only for brand moments and short editorial titles. Use Naskh for questions, buttons, long text, rights content, status and all dense functional areas. This preserves Urdu character without sacrificing scanning speed or vertical stability.

### 6.3 Grid and spacing

- Standard horizontal inset: 20 dp; 16 dp on screens narrower than 360 dp.
- Top-bar content height: 56 dp plus safe area.
- Question-to-answer gap: 20-24 dp.
- Standard component gaps: 12 dp within groups, 24 dp between sections.
- Bottom action dock: 88-104 dp including safe-area padding.
- Scroll content must include bottom padding equal to action dock height.
- Cards: 12 dp radius for utility/status cards, 16 dp for answer and education cards.
- Do not vertically centre task content on tall phones. Anchor important content near the top and use the lower area for supporting visuals or actions.

### 6.4 Icons and illustrations

Use a consistent rounded icon set for controls. Use generated bitmap illustrations only where they add comprehension or emotional reassurance.

Category icon concepts:

| Category | Visual concept |
|---|---|
| Wages | Hand with rupee notes and a small calendar. |
| Pesticide | Sprayer beside shield/mask. |
| Health and safety | Glove/boot with first-aid cross. |
| Harassment | Open palm inside a protective circle. |
| Child labour | Child silhouette beside schoolbook; no distress imagery. |
| Forced labour | Open gate or released lock; avoid chains. |
| Contractor | Two worker figures with a clipboard. |
| Working hours | Sun and clock. |
| Sanitation | Water tap and cup. |
| Discrimination | Equal-height worker figures with balance mark. |
| Other | Two speech bubbles with three dots. |

Asset style:

- transparent-background PNG or WebP, bundled offline;
- 2x and 3x sizes where required;
- dark ink/PUWF outlines, teal functional accents and restrained gold cotton details;
- adult, locally credible dress and work context;
- no text inside images;
- no identifiable real worker photographs on sensitive routes;
- illustration alt text supplied through localization.

### 6.5 Component geometry and visual hierarchy

| Component | Geometry | Hierarchy requirement |
|---|---|---|
| Primary action | 56-64 dp height, 12 dp radius, 20 dp horizontal padding | One filled primary action per decision area. Use Deep Teal for voice and Kapas Green for progress/reporting. |
| Secondary action | Minimum 52 dp, white/neutral surface, 1-2 dp essential border | Must read as a control, not ordinary text. |
| Icon button | 48 x 48 dp stable frame | Use a familiar icon with localized accessibility label and no layout shift on press. |
| Answer tile | Minimum 104 dp in grid or 72 dp in list, 14-16 dp radius | Icon, title, optional example and selected check. State cannot rely on tint alone. |
| Status chip | 32-36 dp high | Icon + short worker-facing label; never expose raw internal state codes. |
| Complaint card | 16 dp padding, 12 dp radius, essential border | Category and status dominate; tracking ID and dates are secondary LTR data. |
| Trust notice | 16-20 dp padding, icon aligned to first text line | Explain one consequence in plain language; avoid legal copy. |
| Action dock | 88-104 dp including safe area | Opaque surface, stable button position, visible separation from scroll content. |
| Illustration slot | Stable aspect ratio, usually 4:3 or 1:1 | Must add recognition, reassurance or state meaning; otherwise omit it. |

### 6.6 Motion, haptics and sound

- Use 180-250 ms state transitions for selection, status expansion and button feedback.
- Use 250-350 ms only for welcome illustration reveal, recorder transition or success receipt entrance.
- Voice waveform motion represents real recording/playback state; never animate it while idle.
- Haptic feedback is appropriate for recording start/stop, successful selection and submission receipt, not every tap.
- Never use confetti, bouncing mascots or celebratory sound for sensitive grievances.
- Respect reduced motion and preserve the same semantic state without animation.

## 7. Navigation and interaction model

### 7.1 Home navigation

Keep Home as the main hub. A persistent bottom tab bar is unnecessary for a three-task app and would consume space and add an unfamiliar navigation model. Every secondary route needs a reliable back control and a visible Home action only at terminal states.

### 7.2 Grievance navigation

Use a sticky bottom action dock with:

- secondary Back action when needed;
- primary Continue/Submit action;
- safe-area padding;
- disabled explanation when the required answer is missing.

The current full-width progress line should become a segmented section indicator with a plain label such as “حصہ 2 از 5”. Do not imply an exact percentage when branching changes the path.

### 7.3 Audio help

Do not auto-play every route indefinitely. Auto-play only during first-use onboarding or when explicitly enabled. Place a consistent 48-56 dp “listen” icon button beside each question title. The icon always has a visible Urdu label until comprehension testing proves an icon-only control is safe.

## 8. Page-by-page refactoring specification

### 8.1 Splash

**Goal:** establish legitimacy and load fonts/data without feeling like a blank delay.

**Composition:** centred Kapas mark; app name; one concise PUWF ownership line; small FOS technology line; optional ILO support line only when approved. Use a subtle cotton-boll texture or one cotton-stem illustration at the lower edge, not a generic gradient.

**Motion:** 250-350 ms mark reveal and waveform draw; disabled under reduced motion. Route as soon as hydration and fonts complete; do not hold for decorative animation.

### 8.2 Language selection

**Goal:** make the first decision immediately understandable.

**Composition:** short title, two large language rows, each with native-script sample and a radio/check state. Urdu appears first. Add a speaker button to hear each language name. Continue remains in the bottom dock.

**Do not:** use flags, generic globe imagery or small text-only options.

### 8.3 Welcome

**Goal:** explain voice reporting, one-question flow and privacy in less than ten seconds.

**Composition:** upper 38-42% contains a real illustration of an adult cotton worker holding a phone near their face with a restrained teal waveform. Lower section has the headline “آواز سے بتائیں”, two icon+text promises (“ایک وقت میں ایک سوال”, “آپ نام چھپا سکتے ہیں”), Listen and Continue.

**Asset brief:** adult worker in a cotton field, calm neutral expression, phone clearly visible, cotton plants recognizable, dark ink outlines, teal waveform and gold cotton detail, transparent background, no text.

### 8.4 Home

**Goal:** support three tasks with unmistakable priority.

**Composition:**

1. Compact brand bar with Kapas mark, greeting and a small language/settings icon.
2. Dominant report tile, 144-176 dp high, green border or green lower action band, microphone/speech illustration, clear label and reassurance “نام چھپا سکتے ہیں”.
3. Two equal secondary tiles in a two-column row when width allows: Track Complaint and Know Your Rights. Each gets a distinct icon and soft surface colour.
4. Small Listen-to-screen row and offline state at the bottom.

Do not place version/demo text in the normal reading order. Keep the hidden long-press target but make the visible version a subtle footer.

### 8.5 Microphone permission

**Goal:** reduce fear before the native system prompt.

**Composition:** microphone + lock illustration, one-sentence purpose, a three-point local-data explanation, primary “مائیکروفون کی اجازت دیں” and a real secondary “بغیر آواز کے آگے بڑھیں”. The current “آگے بڑھیں” label is too vague for a permission decision.

Show the native prompt only after the user explicitly taps Allow. If denied, explain that recording is optional and provide a Settings action only when the OS permits it.

### 8.6 Grievance shell

**Goal:** keep the worker oriented without making the flow look like a form.

**Composition:** compact RTL top bar; section label and segmented progress; scrollable question area; sticky action dock. Use subtle category colour/icon only after a category is selected.

The question area should begin within 24 dp of progress. Do not push Continue to the absolute bottom of a mostly empty 914 dp screen without a supporting visual or explanation.

### 8.7 Grievance introduction

**Goal:** reassure and start quickly.

**Composition:** small speech/ear illustration, large question, two reassurance chips with icons, and Continue immediately after the content on short screens while still pinned to the dock. Add a clear “سنیں” action beside the prompt.

### 8.8 Category selection

**Goal:** let a low-literacy worker recognize the issue before reading every label.

**Composition:** two-column grid of six common categories with 48 dp illustrations and short labels. “More” opens a bottom sheet or second grid for contractor, hours, sanitation and discrimination. “Other” remains visible at the bottom as a full-width speech tile.

Use a selected outline + check icon + soft tint. Never rely on colour alone. Keep tiles at least 104-120 dp tall and stable when labels wrap.

Category ordering should be validated in field research; do not assume current taxonomy order is the user's mental order.

### 8.9 Category-specific follow-ups

The flow can share a component system without sharing one visual treatment.

- Wages: rupee and calendar visual; amount choices can use large numerals and wage comparison rows.
- Pesticide: sprayer/shield visual; symptom multi-select uses body-region or symptom icons; immediate danger remains prominent.
- Safety: tool/first-aid visual; injury and unsafe condition choices are distinct groups.
- Harassment: protective shield visual; copy is neutral, private and non-blaming; no person photography.
- Child labour: schoolbook/protection visual; avoid infantilizing illustration.
- Forced labour: open gate visual; surface the safety notice earlier.
- Hours: sun/clock visual; use time-of-day shortcuts instead of dense time inputs.
- Sanitation: tap/water visual; simple yes/no condition illustrations.
- Discrimination: equal-worker visual; respectful neutral figures.

Use small visuals above or beside the question; never create a new decorative hero on every step.

### 8.10 Voice recording

**Goal:** make recording feel familiar, private and reversible.

**Composition:** a single soft-teal recording panel with:

- 88 dp microphone button;
- visible state label: Ready, Recording, Recorded, Playing or Error;
- timer using Latin digits in an LTR isolate;
- live waveform during recording and playback;
- large Play/Pause after capture;
- duration and “saved on this phone” reassurance;
- Delete as a separate text/destructive action with confirmation.

Use Deep Teal for filled microphone states so white icon/text passes contrast. Stop bundled prompt audio before recording. Preserve layout dimensions between states to avoid jumps.

### 8.11 When, location and workers affected

**When:** use visually distinct calendar shortcuts (Today, Yesterday, This week, Earlier, Not sure). Show a localized date only when necessary.

**Province/location:** first show Punjab and Sindh as large region tiles. Then show recent/nearby places if available, followed by a searchable list only for confident users. Keep search optional because typing Urdu place names is a high-friction task.

**Others affected:** use person-group illustrations for one, 2-5, 6-20 and 20+. Pair visual quantity with a text label and keep “Not sure” neutral.

### 8.12 Immediate danger

**Goal:** identify urgency without turning the app into an emergency service it is not.

Use two large answer tiles. If Yes is selected, reveal a calm critical-outline panel stating what the demo/product can and cannot do. Red is limited to shield/alert icon, border and key phrase. Do not imply that emergency services have been contacted.

### 8.13 Privacy choice

**Goal:** make consequences understandable, not merely label three modes.

Each privacy option needs:

- distinct icon: hidden face, shielded identity, visible ID;
- plain title;
- “PUWF can know / cannot know” statement;
- “Your name may / may not appear during the case” statement;
- audio explanation button;
- selected check and soft tint.

Do not preselect the least private option. Add a short shared-phone warning that is visible but not alarming.

### 8.14 Evidence

**Goal:** make optional evidence useful and safe.

Use two action tiles: Add Photo and Add Document, with a visible “Optional” label. After selection, show thumbnail/file icon, filename, size, local-only/saved state and Remove. Explain that the worker can submit without evidence. Permission denial must not look like report failure.

### 8.15 AI processing and understanding

**Goal:** show assistance without overstating authority.

Processing uses a restrained waveform and “آپ کی آواز سمجھی جا رہی ہے”. The result screen presents “ہم نے یہ سمجھا” rather than an English “AI Summary” label. Show short Urdu summary, suggested category and a confidence-sensitive prompt.

Actions are explicit: Correct, Change, or Continue without AI. Low confidence and failure must preserve the original recording and never block submission. Avoid robot icons, sparkles and generic AI gradients.

### 8.16 Review

**Goal:** let the worker verify the report by recognition, not read a long form.

Group the review into four sections:

1. What happened: category and voice playback.
2. When and where.
3. Safety and people affected.
4. Privacy, contact and evidence.

Each section is a compact summary card with an icon and one Edit action. Show the AI summary as assistive content, not a fact. Keep Submit in the sticky action dock. Add a final privacy sentence above Submit.

### 8.17 Submitted success

**Goal:** create trust and make the tracking ID memorable.

Use a receipt-style white panel on cream with a real check icon, “رپورٹ مل گئی”, a large LTR tracking ID, copy/share affordance where safe, and a short next-step status. Primary action opens this complaint; secondary action returns Home.

The current blank green circle must become an icon. Do not use celebration confetti for sensitive grievances.

### 8.18 Offline saved

**Goal:** clearly distinguish saved-on-phone from received-by-PUWF.

Use a phone-with-check icon in warning/gold, a bold “اس فون پر محفوظ”, one sentence saying it has not yet been received, and a two-step state strip:

`فون پر محفوظ -> انٹرنیٹ ملا تو بھیجے گی -> پی یو ڈبلیو ایف کو ملی`

When submission later succeeds, update the screen and complaint card to green received state. Never use “success” styling while the report is only queued.

### 8.19 Complaints empty state

**Goal:** explain the empty list and immediately provide the next action.

Use a small folder/receipt illustration, one sentence and a primary Report a Problem CTA. The current screen tells the user what to do but gives no control to do it.

### 8.20 Complaint list

**Goal:** answer “Which report, what is happening, when did it change?” at a glance.

Each complaint card contains:

- tracking ID and category icon;
- prominent worker-facing status chip;
- one-line next-step explanation;
- submitted date and last-updated date in localized display;
- chevron at logical end.

Use status colour as a narrow accent/icon, not a full card fill. If there are more than five complaints, add filter chips for Active, Waiting, Completed and Saved Offline.

### 8.21 Complaint detail and feedback

**Goal:** make the report feel actively handled and understandable.

Composition:

1. Status hero panel: current status icon, plain-language status, last update and “what happens next”.
2. Tracking ID receipt row.
3. Voice/evidence panel with playback and thumbnails.
4. Summary panel, localized into the current language.
5. Vertical timeline with connected nodes, date, action title and worker-facing detail.
6. Resolution panel and three feedback options only when eligible.

Feedback options should use recognizable face/check/alert icons and full labels. “Not resolved” explains that the case will reopen before submission. Do not present raw internal status names.

### 8.22 Rights list

**Goal:** make rights education feel useful and browseable, not like a list of reports.

Use a two-column illustrated topic library where width permits. Each card has a real 64-80 dp topic illustration, short title and one-line promise. Apply soft category surfaces selectively: gold for wages, teal for pesticide/safety, blue for safe reporting, neutral/green for general rights.

The current blank gold strips must be removed.

### 8.23 Rights detail

**Goal:** move from a one-sentence placeholder to an actionable mini-guide.

Each topic should include:

- editorial illustration;
- short title and plain-language right;
- “یہ آپ کا حق ہے” fact block;
- 2-4 examples of a violation;
- “آپ کیا کر سکتے ہیں” action steps;
- Listen action;
- contextual Report This Problem CTA that preselects the appropriate category.

Keep legal citations behind an optional “مزید معلومات” disclosure. Do not place a legal essay on the first view.

### 8.24 Draft recovery dialog

Use a true dimmed scrim rather than a full cream replacement. Show draft icon, last saved time and current step. Primary Resume; secondary Keep for later; destructive Discard requires confirmation. On shared phones, do not reveal the sensitive category in the modal title.

### 8.25 Offline banner

Use a compact, persistent status strip below the top bar only when needed. Show icon, short state and queued count. Expand on tap for details. Do not consume a full card's height on every page.

### 8.26 Error and loading states

Loading skeletons should preserve final component dimensions. Errors need a concrete recovery action: Retry, Continue without audio/AI, or Back. Never show only “Something went wrong.”

### 8.27 Demo controls

This route is utility UI, not worker UI. Mark it with a visible Demo badge and group controls into sections:

- Scenario;
- Connectivity and queue;
- AI states;
- Tracking state;
- Reset.

Use toggles for binary simulation states, segmented controls for scenario selection, numeric queue status and a destructive red-outline reset button. Do not render fifteen identical full-width CTAs.

## 9. Component refactoring map

| Current component | Refactor target |
|---|---|
| `ScreenShell` | `WorkerScreen`, `ScrollWorkerScreen`, optional sticky `ActionDock`, configurable family background. |
| `LightTopBar` | RTL-aware `WorkerTopBar` with real icon, 48 dp target, title and optional status/action. |
| `PrimaryCta` | `ActionButton` variants: primary, secondary, voice, destructive, text; icon support; stable pressed/loading states. |
| `AnswerCard` | `AnswerTile` with icon/illustration slot, title, helper, selected check and grid/list layouts. |
| `ProgressIndicator` | `SectionProgress` with segments and text label. |
| `VoiceRecorder` | State-machine-driven recording panel with fixed geometry, waveform and explicit privacy status. |
| `ScreenNotice` | `InlineNotice` variants with icon, title, body and optional action. |
| `ComplaintStatusCard` | Status-led card with category icon, chip, next step and dates. |
| `RightsTopicCard` | Illustrated editorial topic tile. |
| `AIUnderstandingCard` | Localized assistive summary panel with category, confidence state and correction actions. |

Use `StyleSheet.create` for stable styles, semantic tokens for variants and a small variant helper. Keep business branching out of visual components.

## 10. Asset production briefs

Generate and approve a coherent set rather than page-by-page unrelated images.

### 10.1 Generated visual exemplar

A production-direction onboarding illustration was generated and visually reviewed for this refactoring brief:

![Generated onboarding illustration direction](assets/mobile/welcome-voice-worker-v1.png)

Project asset: `docs/design/assets/mobile/welcome-voice-worker-v1.png`

The image demonstrates the intended adult, dignified, cotton-specific, voice-and-privacy visual language. It is an art-direction exemplar, not automatic production approval. Validate clothing, cotton-work context, gender representation and worker comfort before shipping. If approved, derive the remaining illustration system from the same palette, texture, silhouette quality and mature tone rather than generating unrelated images per page.

### 10.2 Production image rules

- Generate transparent PNG/WebP assets without embedded text, logos or UI controls.
- Reserve editorial worker scenes for Welcome, Rights and selected trust moments. Operational grievance questions use smaller category/state illustrations.
- Sensitive categories use symbolic protection imagery, not literal depictions of harm.
- Crop and scale from a designed slot. Never stretch, darken or blur an arbitrary image to fill empty space.
- Provide `@2x` and `@3x` raster variants or use an asset pipeline that preserves detail at 48-96 dp display sizes.
- Keep a single style reference and generation brief for the complete family so faces, clothing, line quality and palette remain coherent.

### Set A: onboarding

- 1 welcome illustration at 1200 x 900 transparent PNG/WebP.
- 1 microphone + lock permission illustration at 800 x 600.
- 1 compact cotton-stem splash detail at 600 x 320.

### Set B: category recognition

- 11 square transparent category illustrations at 384 x 384.
- Readable at 48-64 dp.
- Same stroke, face style, perspective and palette.

### Set C: rights education

- 6 editorial illustrations at 960 x 640.
- Each derives from the category set but adds one simple work scene.
- No embedded text and no identifiable real people.

### Set D: system states

- Submitted receipt/check.
- Saved on phone/offline.
- Empty complaint folder.
- AI low confidence.
- Safe/private identity.

All assets need art review for cultural fit, safeguarding tone, gender representation, clothing, cotton-work accuracy and legibility in sunlight.

## 11. Accessibility acceptance criteria

- Every interactive target is at least 48 x 48 dp; primary choices are preferably 56-64 dp high.
- Adjacent compact targets have at least 8 dp separation.
- Normal text contrast is at least 4.5:1; large text is at least 3:1.
- Essential component boundaries and state indicators reach approximately 3:1 against adjacent surfaces.
- Status, error, selected and urgency states are not communicated by colour alone.
- Urdu reading order is correct in screen reader traversal.
- Tracking IDs, dates, times, currency values and filenames are deliberately isolated LTR.
- Every illustration has localized alt text or is intentionally hidden when decorative.
- Font scale at 200% does not clip controls, overlap text or hide the action dock.
- Screen content reflows at 320 dp width without horizontal scrolling.
- Reduced-motion setting stops pulse, waveform simulation and route decoration without removing state feedback.
- Audio is never the only way to receive an instruction.
- Recording, playback and AI failures do not block report submission.
- Shared-phone privacy is reviewed for notifications, app switcher previews, persisted draft labels and complaint history.

## 12. Engineering implementation plan

### Phase 0: restore styling integrity

1. Remove or isolate NativeWind from mobile and replace the single mobile `className` usage.
2. Add a regression screen/test for every `Pressable` visual state.
3. Bundle and load Urdu/Inter fonts.
4. Correct RTL top-bar placement and touch bounds.
5. Add accessible colour aliases and automated contrast tests.

**Gate:** no redesign implementation starts until CTA, answer tile, card and back-button styles render correctly on Android and iOS.

### Phase 1: foundations

1. Implement refined mobile tokens.
2. Build `WorkerTopBar`, `ActionDock`, `ActionButton`, `AnswerTile`, `InlineNotice`, `SectionProgress`, icon wrapper and LTR data primitives.
3. Add Storybook-equivalent component gallery or a hidden visual QA route with all states.

### Phase 2: primary journey

1. Splash, language, welcome and Home.
2. Grievance shell, category grid and common question types.
3. Voice recorder, AI, privacy, evidence and review.
4. Submitted and offline receipt screens.

### Phase 3: return journeys

1. Complaint empty/list/detail/timeline/feedback.
2. Rights library and richer content template.
3. Draft recovery, offline banner, errors and demo controls.

### Phase 4: assets and polish

1. Generate three visual directions for the illustration system and select one with stakeholders.
2. Produce the complete asset family in the selected direction.
3. Add motion, haptics and sound feedback only after static comprehension is validated.

### Phase 5: verification

1. Emulator/device screenshots at 360 x 800, 393 x 873 and 411 x 914 dp.
2. Urdu and English, online/offline, AI success/failure and every grievance category.
3. Android Accessibility Scanner plus screen-reader walkthrough.
4. Physical-device sunlight, farm-noise and shared-phone testing.
5. Moderated worker usability sessions and revision.

## 13. Definition of done

The mobile redesign is not complete merely when new colours or illustrations are visible. It is complete when:

- a first-time worker can identify Report, Track and Rights without facilitator explanation;
- every primary action is visually obvious and reliably tappable;
- the worker understands whether a report is only on the phone or has reached PUWF;
- privacy choices are correctly understood in comprehension testing;
- category recognition and voice recording succeed under realistic field conditions;
- no route looks like an unfinished placeholder;
- screen families feel distinct while controls remain predictable;
- Urdu typography, RTL order and mixed-script data are correct;
- all critical states are verified on physical Android devices, not only screenshots.

## 14. Recommended product decision

Do not begin with isolated page beautification. Approve the new visual direction and repair Phase 0 first, then redesign the primary reporting journey as one coherent system. Once Home, Category, Voice, Privacy, Review and Submission are validated, apply the same foundations to Tracking and Rights. This order removes the renderer defect, establishes trustworthy interaction patterns and prevents a second round of inconsistent page-by-page styling.

## 15. Executive screen handoff matrix

This matrix is the compact implementation check. The detailed behavior remains in Section 8.

| Screen/state | Above-the-fold structure | Visual anchor | Primary action | Distinctive character |
|---|---|---|---|---|
| Splash | Mark, product name, ownership line | Cotton stem/mark detail | Automatic route after readiness | Brand-led and quiet. |
| Language | Title, two large native-language rows | Speaker icons and selected check | Continue | Choice-led, not decorative. |
| Welcome | Illustration, one promise, two short benefits | Adult cotton worker using voice note | Continue | Reassuring orientation. |
| Home | Brand bar, dominant report tile, two secondary tasks | Voice/report illustration | Report a problem | Strong task hierarchy. |
| Permission | Purpose, privacy explanation, microphone/lock | Microphone + shield | Allow microphone | Trust and consent. |
| Report intro | Progress, reassurance, first prompt | Speech/ear symbol | Start/continue | Private helpline. |
| Category | Progress, question, recognition grid | Category illustrations | Select category | Field-guide index. |
| Follow-up | Category cue, one question, answer group | Small category-specific symbol | Select/continue | Guided decision. |
| Voice | Recorder panel, state, timer, privacy line | Real waveform and microphone | Record/stop/play | Familiar voice note. |
| Time/location/group | One input question, visual shortcuts | Calendar/map/people icon | Select/continue | Practical shortcuts. |
| Danger | Direct question and conditional warning | Alert shield | Choose yes/no | Calm urgency. |
| Privacy | Three consequence-based choices | Identity/shield symbols | Select privacy | Transparent protection. |
| Evidence | Optional explanation and two capture actions | Photo/document symbols | Add or skip | Safe optional evidence. |
| AI understanding | Localized summary and correction choices | Teal waveform/assist symbol | Correct/change/continue | Assistive, not authoritative. |
| Review | Four recognition-based summary groups | Section icons and audio replay | Submit | Verification receipt preview. |
| Submitted | Receipt panel, tracking ID, next step | Check/received icon | Track this report | Received and accountable. |
| Offline saved | Local-only state and send sequence | Phone + queued icon | Return/try send | Explicitly not submitted. |
| Complaints empty | Explanation and direct creation path | Folder/receipt illustration | Report a problem | Helpful empty state. |
| Complaint list | Status-led records and last update | Category/status icons | Open complaint | Scan-friendly tracking. |
| Complaint detail | Current status, next step, evidence, timeline | Connected timeline | Respond/feedback when eligible | Predictable case story. |
| Rights list | Illustrated topic library | Topic scenes | Open topic | Editorial learning. |
| Rights detail | Right, examples, action steps and listen | One work-situation illustration | Report this issue | Actionable mini-guide. |
| Draft recovery | Saved time, current step, privacy-safe summary | Draft icon | Resume | Recoverable and discreet. |
| Offline banner | Short status and queued count | Offline icon | Expand details | Persistent system state. |
| Error | What failed, what remains safe, recovery | Specific state icon | Retry/continue without | Concrete recovery. |
| Demo controls | Labeled operational groups | Demo badge only | Contextual controls | Dense utility surface. |

## 16. Research source register

Sources were accessed on 20 August 2026. Official and primary sources are preferred for design decisions; public reviews are treated as anecdotal signals.

1. [GSMA AgriTech UX Design Guidebook](https://www.gsma.com/solutions-and-impact/connectivity-for-good/mobile-for-development/gsma_resources/agritech-ux-design-guidebook/) - low-digital-literacy agricultural UX and co-creation context.
2. [GSMA: user-centred agri e-commerce for smallholder farmers](https://www.gsma.com/solutions-and-impact/connectivity-for-good/mobile-for-development/programme/agritech/how-user-centred-design-can-improve-agri-e-commerce-interfaces-that-cater-to-the-needs-and-literacy-levels-of-smallholder-farmers/) - field research, assisted use, reduced onboarding and offline needs.
3. [Plantix official product](https://plantix.net/en/) - task-first agricultural recognition, photo diagnosis and knowledge library.
4. [Ulula Grievance Mechanism](https://ulula.com/technology/grievance-mechanism/) - anonymous multilingual reporting, voice channels and two-way remediation.
5. [Ulula OWL technology overview](https://ulula.com/technology/) - worker engagement, rights resources, complaints and offline field collection.
6. [Official Pakistan Citizen Portal](https://citizenportal.gov.pk/) - local complaint lodging and tracking model.
7. [Pakistan Citizen Portal Google Play listing](https://play.google.com/store/apps/details?id=com.govpk.citizensportal) - current product description and anecdotal public feedback.
8. [ILO: No call to go unanswered](https://www.ilo.org/resource/article/no-call-go-unanswered-unique-initiative-domestic-workers) - local-language voice grievance intake and union response.
9. [ILO Grievance Redressal Mechanism](https://www.ilo.org/publications/grievance-redressal-mechanism) - timely response, transparency and right to information.
10. [OHCHR Guiding Principles on Business and Human Rights](https://www.ohchr.org/documents/publications/guidingprinciplesbusinesshr_en.pdf) - grievance mechanism effectiveness criteria and access barriers.
11. [Android accessibility guidance](https://developer.android.com/guide/topics/ui/accessibility/apps.html) - at least 48 x 48 dp touch targets and descriptive controls.
12. [WCAG 2.2](https://www.w3.org/TR/WCAG22/) - contrast, resize, target size and non-colour-dependent state communication.
13. [Expo Fonts guide](https://docs.expo.dev/develop/user-interface/fonts/) - bundle or explicitly load native font assets and use registered family names.
14. [Google Fonts: digital Nastaliq Urdu](https://fonts.googleblog.com/2023/03/why-are-there-so-few-digital-nastaliq.html) - Nastaliq cultural fit, vertical requirements and rendering complexity.
15. [Digital extension tools: developer and farmer perspectives](https://pmc.ncbi.nlm.nih.gov/articles/PMC8907870/) - language, literacy, connectivity, trust and actionability barriers across agricultural tools.

## 17. Final design position

Modernization for this product does not mean more gradients, more cards or filling every blank area. It means making the service visibly trustworthy and every state unmistakable. The visual system should feel authored for cotton workers in Pakistan: adult, calm, local-language, voice-familiar, privacy-aware and specific about what happens next. Variety comes from the task model of each screen family; consistency comes from typography, controls, tokens, icon language and predictable interaction behavior.
