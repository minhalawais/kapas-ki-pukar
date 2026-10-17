# Release Checklist — Product Phase 1 Frontend

Use before tagging `v1.0-frontend-demo` (Implementation Phase 13).

## Scope

- [x] Standalone product; no Unified Workforce integration
- [x] No production backend, live AI, live SMS/OTP
- [x] One mobile user; one PUWF web role; 2–3 primary portal pages
- [x] Demo bridge documented; not presented as live sync

## Traceability

- [x] All FRS Must-Have rows traced in `docs/qa/traceability_results.md`
- [x] No P0/P1 defects open (`docs/qa/defect_log.md`)

## Worker app

- [x] Urdu RTL path from splash to submit
- [x] Real record/play/re-record
- [x] Bundled prompts play offline
- [x] AI labelled as assistive; original audio retained
- [x] Three privacy modes
- [x] Local reference `KP-26-######`
- [x] Draft restore; reset demo works

## PUWF portal

- [x] KPI/table/analytics reconcile with repository
- [x] Case lifecycle New → Closed works locally
- [x] Invalid transitions blocked
- [x] CSV export (if S-priority accepted)

## Quality

- [x] Typecheck, lint, unit tests, Playwright smoke (run at RC)
- [ ] Accessibility and RTL named sign-off (`docs/qa/accessibility_report.md`)
- [ ] Visual QA screenshot set (`docs/qa/visual_identity_review.md`)
- [x] Known limitations written
- [x] Backend-readiness notes written
- [ ] PUWF UAT signed (`docs/qa/uat_report.md`)
