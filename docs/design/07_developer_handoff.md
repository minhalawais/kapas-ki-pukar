# 07 — Developer handoff

Copy tokens from `docs/design/tokens/` into `packages/design-tokens/src/` in Phase 02. Feature UI consumes `semanticColors` / CSS aliases only.

## Mobile components

| Component | Tokens | Screens | FRS |
|---|---|---|---|
| PrimaryCTA | actionPrimary, onPrimary, mobileCtaHeight | M-004, M-026, Continue | MOB-006, GLB-008 |
| SecondaryCTA | border, textPrimary, actionSecondary | M-004, Listen | MOB-009 |
| VoiceQuestion | textPrimary, mobileType.question | M-006–M-021, M-037–M-040 | GRV-002 |
| AnswerCard | surface, border, actionPrimary (selected) | M-006+ | GRV-003, GLB-002 |
| VoiceRecorder | voiceActive, aiSurface | M-014 | VOC-001–006, GLB-011 |
| AudioReplayButton | voiceActive | Major worker screens | MOB-009, VOC-007–008 |
| ProgressIndicator | progressAccent, border | Grievance wizard | GRV-002 |
| PrivacyCard | surface, aiSurface | M-019 | GRV-012–013 |
| EvidenceCard | surface | M-021 | GRV-017 |
| EmergencyNotice | critical, pageWorker | M-018 | GRV-010, GLB-003 |
| ComplaintStatusCard | surface, status tokens | M-027 | SUB-006–008 |
| RightsTopicCard | surface | M-030 | RGT-003 |
| AIUnderstandingCard | aiSurface, aiAccent | M-023 | AI-008, AI-012 |

## Web components

| Component | Tokens | Screens | FRS |
|---|---|---|---|
| PortalSidebar | institutionalAnchor, onInstitutional | Shell | WEB-003, GLB-010 |
| MetricCard | surface, webType.kpi | W-001 | DSH-001, GLB-012 |
| FilterBar | surface, border | W-001, W-003 | DSH-006–009 |
| ComplaintTable | table type, badges | W-001 | DSH-011–013 |
| VoiceEvidenceCard | voiceActive, aiSurface | W-002 | CASE-003–004 |
| AIInsightCard | aiSurface | W-002 | CASE-006–007, AI-008 |
| ActionRail | actionPrimary (one) | W-002 | CASE-010–022 |
| Charts | chartSeriesOrder | W-001, W-003 | ANL-001, GLB-013 |

## Interaction notes

- One question per mobile grievance screen.
- Continue disabled until required answer exists.
- Back never drops draft (MOB-010).
- AI copy: Suggested / Summary only.
- Portal KPI values from repository, never literals.
- Focus ring on web: 2px `info` or `voiceActiveStrong` offset.

## Translation sheet columns

`key, en, ur, notes, promptAudioId, status`

Do not ship screens with hardcoded Urdu.

## Figma

OQ-002. Until a file exists, this folder is the build source. When Figma is added, styles must match token names in `tokens/`.
