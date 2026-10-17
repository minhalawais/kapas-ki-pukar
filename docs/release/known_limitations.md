# Known Limitations — Product Phase 1 Frontend

**Product:** Kapas ki Pukaar  
**Release:** `v1.0-frontend-demo` (when tagged)  
**Date:** 19 August 2026

This build is a complete **frontend demonstration** with dummy data. It is not a production grievance system.

## Explicitly out of scope (no change request)

- Production backend, production database, cloud file storage
- Live authentication, OTP, SMS
- Production AI / speech-to-text / translation
- Runtime integration with the PUWF Unified Workforce & Digital Operations Platform
- Extra portal roles, worker registry, donor MIS, contractor app
- Live mobile ↔ web synchronisation

## Product behaviour that can be misread in a demo

| Topic | What is true |
|---|---|
| Cross-app story | Deterministic scenario bridge only. Load/inject the same GS-ID on each surface. |
| AI | Simulated and assistive. Original audio is the worker statement. Safety/priority rules beat AI. |
| Identity | Dummy names and locations. No real CNIC/phone in the seed. |
| Analytics | Derived from the local mock repository, not a warehouse. |
| Offline | Simulated connectivity flags plus a real local queue on the phone. |
| Auth | No login. Portal opens as PUWF Grievance Manager. |

## Open product questions (do not block this frontend RC)

| ID | Topic |
|---|---|
| OQ-001 | Named owners for sign-off |
| OQ-002 | Figma URL |
| OQ-003 | ILO blue in the palette |
| OQ-004 | Mobile E2E tool choice |
| OQ-005 | Anonymous × gender analytics bucket (`Not Stated`) |

## QA not finished by humans

- Named PUWF UAT (`docs/qa/uat_report.md`)
- Physical Android size matrix
- Visual-balance screenshot archive
- Git tag (owner applies after UAT)

## Should-Have FRS

Should-Have items (for example English as alternate language, group range, live contact fields, some analytics slices, AI delay UX) may be present in part. They are not release blockers. See `docs/02_Functional_Requirements_Specification_FRS_v1.1.md`.
