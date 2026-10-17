# 04 — Screen templates

## Mobile — one-question template

Used by M-006–M-021, M-037–M-040. Not a multi-field form.

```text
[ light top bar + ProgressIndicator ]
[ illustration — optional ]
[ VoiceQuestion ]
[ answer area: AnswerCards | amount | date shortcuts | location list | VoiceRecorder ]
[ AudioReplayButton ]
[ Back | Continue PrimaryCTA ]
[ safe-area inset ]
```

Continue enabled only when the required answer is valid.

## Mobile — home (M-004)

```text
[ greeting — short ]
[ PrimaryCTA — Report a Problem ]
[ Track My Complaint ]
[ Know Your Rights ]
[ Listen to This Screen ]
```

No KPI dashboard.

## Mobile — splash / language / welcome (M-001–M-003)

- Splash: Kapas mark, PUWF initiative line, FOS partner line, ILO support if approved. Cream canvas.
- Language: two large cards, Urdu first.
- Welcome: illustration, short copy, Play Audio, Continue.

## Mobile — success (M-026)

Cream page. Success icon in `success`. Reference `KP-26-######` LTR. Primary: Track complaint. Not a full green page.

## Mobile — voice / AI (M-014, M-022, M-023)

Teal system. Processing delay visual 0.8–3s (configurable). Failure: continue without blocking submit.

## Portal — dashboard + complaints (W-001)

FOS ops recipe:

```text
title + scope
KPI row (6 compact MetricCards)
2–3 charts (category bar, trend line, status)
FilterBar
ComplaintTable
pagination / empty / error
```

## Portal — case workspace (W-002)

```text
breadcrumb
CaseHeader
[ 55–60% facts + VoiceEvidenceCard + AIInsightCard + evidence ]
[ 20–25% CaseTimeline ]
[ 20–25% sticky ActionRail ]
```

Stack on tablet.

## Portal — analytics (W-003)

```text
filters
KPI summary (resolution time lives here, not as a sixth painted ops KPI)
charts
CSV export (one action)
```

## Portal — demo (W-004)

Utilitarian. Marked Demo. Not in primary nav. Not in ILO screenshots of the worker flow.
