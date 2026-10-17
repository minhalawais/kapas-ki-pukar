# Verification Evidence and Exit Criteria

## Baseline changes made in Phase 01

- Added explicit mobile `development`, `demo` and `production` profiles. Demo controls require opt-in and production forces them off.
- Server-gated the portal `/demo` route with non-public environment flags.
- Removed hard-coded demo login defaults unless an explicit public demo-credential flag is enabled.
- Added anonymous-submission sanitization and regression coverage for identity/direct-contact fields.
- Updated CI from Node 22 to Node 24, added a 30-minute bound and a real production Expo export.
- Bounded root Turbo build/lint/typecheck/test concurrency to two.

## Verification matrix

| Check | Expected | Evidence/state |
|---|---|---|
| `pnpm typecheck` | All workspaces pass | Passed, 10/10 workspaces (sequential final run) |
| `pnpm lint` | No warnings/errors | Passed, 10/10 workspaces |
| `pnpm test` | All unit tests pass, including anonymous regression and 10 scenarios | Passed, 10/10 workspaces; mobile 33/33 and mock-services 31/31 |
| Portal production build | `/demo` returns 404; no prefilled credentials | Passed; HTTP smoke test: demo 404, login 200, both credential strings absent |
| Expo production export | Android/iOS/web bundles export with demo controls disabled | Passed for all three platforms |
| `pnpm voice:verify` / `pnpm build` | Full release gate | Correctly blocked: six stale/unapproved prompts listed below; gate remains fail-closed |
| Expo Doctor | Dependency/config compatibility | Passed 21/21 from `apps/mobile` |

## Exit criteria

- [x] Required specifications and live routes/services/packages reviewed.
- [x] Architecture diagram and module/trust boundaries documented.
- [x] Twelve ADRs contain context, decision, alternatives, consequences, security, rollback and approver/status.
- [x] API operation inventory and error catalogue documented.
- [x] Frontend/domain-to-production model gap analysis documented.
- [x] Threat model and risk owners drafted.
- [x] Environment, CI/CD, secret, rollback, backup and capacity plans drafted.
- [x] Demo credentials/controls isolated behind explicit non-production configuration.
- [x] Anonymous privacy regression added.
- [x] Typecheck, lint, unit tests, portal production build, production route smoke test, Expo export and Expo Doctor pass.
- [ ] Voice release approvals resolve the existing fail-closed build gate.
- [x] ADR-001 through ADR-012 approved by the project owner for implementation.
- [x] Interim retention, AI/provider processing, capacity and RPO/RTO decisions approved for implementation/planning.
- [x] Phase 02 scope and role-based ownership approved; sequencing exception recorded for the unrelated voice gate.
- [ ] Named PUWF reviewers formally ratify applicable decisions before staging/production.

Phase 01 remains **Partially complete** for release governance while the two unchecked items remain. Phase 02 foundation implementation is authorized by the project owner and does not weaken either gate.

## Known release-gate blocker

`SC-complaint-detail`, `WF-identity`, `WF-privacy`, `RT-child-labour-guidance`, `RT-worker-voice-guidance` and `RT-migrant-tenant-guidance` are stale after approved/source copy changed. They must be regenerated and explicitly validated/approved through the existing voice workflow; bypassing the verifier would weaken the release control.

The production export used `apps/mobile/dist-phase01` as temporary output; that generated directory was removed after verification.

