# Visual Identity Review — Phase 13

**Spec:** doc 06 v1.1, doc 11 Visual Identity Regression, Phase 13 Visual Balance Screenshot Set  
**Date:** 19 August 2026  
**Method:** Code/token review. Screenshot archive is still a QA capture task (KKP-13-03).

## Token mapping (must remain)

| Role | Token | Use |
|---|---|---|
| Worker canvas | `--page-worker` cream | Mobile content |
| Portal canvas | `--page-admin` / `--surface-default` | Main content |
| PUWF green | `--institutional-anchor` | Portal sidebar only |
| Kapas green | `--action-primary` | Primary CTA |
| FOS teal | `--voice-active` / `--ai-accent` | Voice, AI, skip/focus outline |
| Cotton gold | `--progress-accent` / `--chart-2` | Accent, not CTA |
| Charts | `--chart-1`…`--chart-6` mixed | Not green-only |

## Reviewer questions (answer on screenshots)

For each of: Mobile Home, Issue Category, Voice Recording, Privacy, AI Summary, Submission Success, PUWF Dashboard, Complaint Workspace, Analytics:

1. Does the screen look green-heavy?
2. Is FOS Teal visible where voice/AI/technology is involved?
3. Is PUWF Green clearly institutional rather than universal?
4. Is Cotton Gold used only as a restrained agriculture/progress accent?
5. Is the content canvas predominantly light?

Engineering expectation from tokens: **1 = no, 2–5 = yes**, except Voice/AI screens where teal is intentional.

## Code checks done

- Portal sidebar is the dark institutional strip
- KPI cards use white/neutral `Card` / `MetricCard`
- Primary mobile CTA uses `semanticColors.actionPrimary`
- Voice CTA tone uses `semanticColors.voiceActive`
- Critical red only on destructive/overdue copy
