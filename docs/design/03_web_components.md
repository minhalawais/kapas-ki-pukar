# 03 — Web components

Canvas: `pageAdmin`. Sidebar only uses `institutionalAnchor`. Compact density: title ~22px, table 13px, buttons 36px, card padding 16px. Copy: nouns and verbs. One primary CTA per section.

Portal language default: English LTR. Tables stay LTR.

## PortalSidebar

- Width 232. Fill `institutionalAnchor`. Text `onInstitutional`.
- Items: Dashboard & Complaints, Analytics. Demo is hidden.
- Active: light inset, not a second green brand.
- FRS: WEB-001, WEB-003, GLB-010

## PortalTopbar

- White. Search. Demo identity. Optional quiet notifications control (no marketing banner).
- Height compact (~56).

## MetricCard

- White. Small icon chip (not a colour-filled card). Label 11–12px. Number `webType.kpi`.
- Optional delta as text.
- KPIs: Total, New, Critical, In Progress, Overdue, Resolved.
- FRS: DSH-001, GLB-012

## FilterBar

- Horizontal `text-sm` controls. Category, status, priority, location, privacy, date, search.
- FRS: DSH-006–009

## ComplaintTable

- Columns: ID, Category, Location, Date, Privacy, Priority, Status, Last Action, Action.
- Compact rows. Sticky header. Pagination.
- Sensitive categories: short label in list, no graphic detail.
- FRS: DSH-011–013

## StatusBadge / PriorityBadge

- Text + icon + token colour. Never colour alone.
- Priority: Emergency, Critical, High, Standard.
- Emergency/Critical may use `critical` / `warning`. Standard uses neutral.
- FRS: GLB-002, GLB-003

## CaseHeader

- Reference (mono/LTR), category, status, priority, privacy, location, date.
- FRS: CASE-001, CASE-002

## VoiceEvidenceCard

- Original audio first. Teal player. Duration. Transcript. Translation if present.
- FRS: CASE-003, CASE-004, VOC-010, GLB-011

## AIInsightCard

- `aiSurface`. Suggested/AI labels only. Confidence + Human Review Required when flagged.
- FRS: CASE-006, CASE-007, AI-008

## EvidenceGallery

- Dummy thumbs. Restrained for sensitive cases.
- FRS: CASE-008 (S)

## CaseTimeline

- Chronological. Actor, action, time, note.
- FRS: CASE-009

## ActionRail

- Sticky. Actions from Phase 10 list. Destructive = confirm.
- Primary rail action: Start Review or next valid lifecycle action (one filled Kapas green).
- FRS: CASE-010–022

## ActionModal

- Reason, note, confirm. Dialog not a full-page takeover for short confirms.
- FRS: CASE-022

## AnalyticsCard / ChartContainer

- Title required. Mixed `chartSeriesOrder`. Empty/zero state.
- FRS: ANL-001, GLB-013

## EmptyState / ErrorState

- One line + optional retry. No illustration essay on ops pages.
