# 02 — Mobile components

Canvas: `pageWorker` or `surface`. Default top bar light. Max one large Kapas-green surface per normal screen.

Every component: **default, pressed, selected (if selectable), disabled, loading, error (if it can fail).**

Locale keys only. No raw dummy arrays.

## PrimaryCTA

- Height 56–64. Radius 14–16. Fill `actionPrimary`. Label `onPrimary`. Type `mobileType.button`.
- One per screen section.
- Loading: keep width, spinner `onPrimary`.
- Disabled: 40% opacity, not grey-on-grey unreadable.
- FRS: MOB-006, GRV-002, GLB-008

## SecondaryCTA

- Outline `border` + `textPrimary`, or text button.
- Voice/listen actions may use `actionSecondary` outline, not a second filled green.

## VoiceQuestion

- One question, `mobileType.question`, Naskh for functional Urdu.
- Optional illustration above (2–3 colours).
- Listen control below question (`AudioReplayButton`).
- FRS: GRV-002, MOB-009

## AnswerCard

- Min height 96–120. Radius 16. White + `border`.
- Icon + short label. Selected: 2px `actionPrimary` outline + check icon (not fill-only).
- No tiny radios.
- FRS: GRV-003, GLB-002

## VoiceRecorder

- Mic 72–88 circle.
- Idle: `aiSurface` fill, `voiceActive` border.
- Recording: `voiceActive` fill, waveform, timer. Pulse allowed.
- Playing / stopped / error as distinct states.
- Error: neutral panel + `critical` icon, not a red screen.
- FRS: VOC-001–006, GLB-011

## AudioReplayButton

- Teal icon button, 56 min touch.
- `accessibilityLabel` required.
- Does not block completing the screen (VOC-008).

## ProgressIndicator

- Section progress, not fake exact %.
- Track `border`, fill `progressAccent`.
- RTL: fill grows toward start edge.
- IDs in the chrome stay LTR.

## PrivacyCard

- Three cards: ANON / CONF / IDEN.
- Default white. Selected: `aiSurface` or cream + outline + icon.
- Audio help per card.
- FRS: GRV-012, GRV-013

## EvidenceCard

- Optional. Preview + remove.
- White, not alarming.
- FRS: GRV-017

## EmergencyNotice

- Only when danger = yes or Emergency priority.
- `critical` icon + text. Calm cream page, not a full red canvas.
- Ordinary “No” on danger question is a neutral AnswerCard (GLB-003).

## ComplaintStatusCard

- Reference (LTR), plain-language status, date.
- Status = text + icon + colour.
- FRS: SUB-006, SUB-008

## RightsTopicCard

- Illustration + short title. No legal essay.
- FRS: RGT-003

## AIUnderstandingCard

- Surface `aiSurface`. Labels: AI Summary, Suggested Category, Suggested Priority.
- Never Verdict / Proven.
- Confirm / Go back.
- FRS: AI-008, AI-012, GLB-011

## Shared states

| State | Pattern |
|---|---|
| Empty | One fact + one next step |
| Loading | Inline spinner or skeleton, not a branded splash loop |
| Error | Neutral card, retry/back |
| Offline | Warning/neutral banner, not critical red |
| Draft recovery | Resume / Discard — never silent discard |
