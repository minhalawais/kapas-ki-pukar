# 06 — Accessibility review (Phase 01)

Reviewed against doc 06, doc 10, FOS-UI-UX-INSTRUCTIONS.md, FOS-COMPONENT-STANDARDS.md, FOS-MOTION-STANDARD.md.

## Passes designed in

- Touch: CTA 56–64, mic 72–88, answer cards ≥96.
- Meaning not colour-only (badge + icon + text; selected card uses outline + icon).
- Red only for danger/destructive.
- Audio is extra, not the only path (VOC-008).
- Web: visible focus, semantic table, labelled dialogs (to be implemented Phase 09–10).
- Reduced motion: pulse/waveform off; instant state still visible.
- Worker empty/error copy is one fact + next step.
- Outdoor: dark ink on cream; large type.

## Contrast

| Pair | Use | Note |
|---|---|---|
| textPrimary on pageWorker/surface | Body | Expected AAA |
| onPrimary on actionPrimary | Mobile CTA | Expected AA |
| onInstitutional on institutionalAnchor | Sidebar | Expected AA |
| onPrimary on voiceActive | Small teal buttons | Use voiceActiveStrong if QA < 4.5 |
| textSecondary on surface | Meta | Recheck at 200% zoom |

## Low-literacy checks (must remain true in Figma/code)

- Report a Problem identifiable without a paragraph
- Answers = icon + short label + audio
- Success shows the ID clearly
- No multi-field grievance form

## Residual risks

- Nastaliq line-height clipping at 200% — use Naskh on controls
- Chart colour + label required
- ANON gender analytics: unknown bucket (OQ-005)

## Scorecard (design, not running UI)

Visual quality gate cannot pass from code/docs alone. After Phase 04/09 screens exist, run fos-visual-quality-gate on the live apps. Design intent is aligned with a passing composition if templates are followed.
