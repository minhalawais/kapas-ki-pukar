# CHANGELOG

All notable Product Phase 1 frontend changes.

## 1.0.0-frontend-demo — 19 August 2026

Release candidate for the standalone Kapas ki Pukaar frontend (dummy data, mock services, real local audio, simulated AI, demo scenario bridge).

### Added

- Worker mobile app: Urdu-first RTL home, voice grievance intake, privacy, tracking, rights, offline queue, hidden demo controls
- PUWF portal: Dashboard + Complaints, case workspace, analytics + CSV, hidden `/demo`
- Shared domain, dummy seed (200 records), golden scenarios GS-01–GS-10
- Deterministic demo bridge (not live sync)
- Phase 13 QA/handover pack under `docs/qa/` and `docs/release/`

### Accessibility

- Portal skip-to-content, labelled filters, table caption and sort semantics, dialog focus trap, chart text summaries, LTR isolation for tracking IDs

### Known limits

See `docs/release/known_limitations.md`. No production backend, live AI, SMS/OTP, or Unified Workforce integration.
