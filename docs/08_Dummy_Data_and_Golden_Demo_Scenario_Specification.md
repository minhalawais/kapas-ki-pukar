# 08 — Dummy Data + Golden Demo Scenario Specification

**Document ID:** KKP-DATA-008  
**Product:** Kapas ki Pukaar — Voice-Enabled Smart Grievance Reporting Application for Cotton Farm Workers  
**Prepared for:** Pakistan United Workers Federation (PUWF)  
**Technical Partner:** Fruit of Sustainability (FOS)  
**Version:** 1.0  
**Date:** 2026-08-18  
**Status:** Frontend Development Baseline  
**Phase:** Phase 1 — Complete Frontend with Dummy Data  
**Purpose:** Define realistic seed data, data distributions, scenario structure and repeatable donor/client demonstration cases for the frontend-only release.

---

## 1. Document Context

Kapas ki Pukaar is being developed as a **standalone product**. It has no runtime, database, API or authentication integration with the PUWF Unified Workforce & Digital Operations Platform. The existing PUWF platform may be used only as a reference for prior FOS learning on worker-centred grievance design, Urdu/RTL interfaces and grievance-management patterns.

The current delivery phase is **frontend only**. It must provide a complete, realistic and testable product experience using dummy/local data. Real production backend services, a production database, server-side authentication, live SMS, production AI inference and cloud infrastructure are explicitly outside this phase.

The Phase 1 experience must nevertheless feel complete from the user perspective:
- mobile microphone recording and audio playback are functional;
- Urdu voice prompts are bundled locally and playable;
- AI transcription, categorisation, summarisation and translation are simulated through deterministic frontend services and curated scenarios;
- grievance workflows, branching, validation, case actions, analytics and local persistence are fully functional in the frontend;
- the PUWF portal is intentionally lean, with one operational role and 2–3 primary work pages;
- all architecture is designed so the mock service layer can later be replaced by real backend APIs without rewriting the UI.

---

## 2. Objectives

Dummy data must:
- make the portal look operational;
- produce credible analytics;
- exercise all statuses and priorities;
- represent realistic cotton-worker complaint patterns;
- avoid real personal data;
- support deterministic QA;
- support repeatable PUWF/ILO demonstrations.

## 3. Seed Dataset Size

Recommended baseline:
**200 complaint records**

Minimum acceptable:
**150**

The dataset shall be generated from deterministic seed logic so every reset returns the same data.

## 4. Complaint Record Shape

```ts
type Complaint = {
  id: string
  referenceNumber: string
  createdAt: string
  submittedAt: string
  updatedAt: string

  categoryCode: string
  subcategoryCode?: string
  priority: "Emergency" | "Critical" | "High" | "Standard"
  status: string
  privacyMode: "ANON" | "CONF" | "IDEN"

  reporterType: string
  affectedWorkerType?: string
  gender?: "Female" | "Male" | "Other" | "Not Stated"

  location: {
    province: string
    district: string
    tehsil?: string
    villageLabel?: string
    exactCoordinates?: null
  }

  othersAffected: boolean
  affectedRange?: string

  incident: {
    whenLabel: string
    currentDanger: boolean
    structuredAnswers: Record<string, unknown>
  }

  voice?: VoiceEvidence
  attachments?: Evidence[]
  aiAnalysis?: AIAnalysis

  actions: CaseAction[]
  resolution?: Resolution
  workerFeedback?: WorkerFeedback
}
```

## 5. Dummy Data Privacy Rules

- no real CNIC;
- no real phone numbers;
- no real worker names unless clearly fictional;
- no exact real farm coordinates;
- village labels may be fictional or generic;
- evidence images must be dummy/licensed;
- demo audio must use actors or synthetic non-identifying recordings.

## 6. Suggested Category Distribution

Illustrative target:
- Wages: 30%
- Contractor: 15%
- Health & Safety: 12%
- Pesticide: 12%
- Working Hours: 8%
- Sanitation: 6%
- Harassment: 6%
- Discrimination: 4%
- Child Labour: 3%
- Forced Labour: 2%
- Other: 2%

Exact percentages may vary, but totals must sum to 100%.

## 7. Suggested Status Distribution

- New: 15%
- Under Review: 20%
- Awaiting Worker: 8%
- Action in Progress: 20%
- Escalated: 5%
- Proposed Resolution: 7%
- Resolved: 15%
- Closed: 10%

## 8. Suggested Priority Distribution

- Emergency: 3%
- Critical: 10%
- High: 32%
- Standard: 55%

## 9. Privacy Distribution

Suggested:
- Anonymous: 35%
- Confidential: 45%
- Identified: 20%

## 10. Geography

Seed data should include relevant cotton/agriculture regions across Punjab and Sindh, with enough distribution for meaningful charts.

Frontend geography is for demonstration and must not imply that the dummy complaints are real field incidents.

## 11. Gender Representation

Ensure strong representation of women cotton workers in the dummy dataset because women pickers are a core target population.

Suggested example:
- Female 55%
- Male 40%
- Not stated/other 5%

## 12. Timeline Generation

Each complaint should include a plausible series of case events depending on status.

Example New:
- Complaint Received

Example Under Review:
- Complaint Received
- Review Started

Example Action in Progress:
- Complaint Received
- Review Started
- Worker Contacted
- Action Recorded

Example Closed:
- Complaint Received
- Review Started
- Finding Added
- Action Taken
- Resolution Proposed
- Resolved
- Closed

## 13. Golden Demo Scenarios

### GS-01 — Wage Underpayment / Confidential

Worker:
- female seasonal cotton picker
- Southern Punjab
- agreed PKR 1,200
- received PKR 800
- multiple workers affected
- confidential
- no immediate danger

AI simulation:
- `WAG-UND`
- High
- confidence 0.94

Demo story:
worker reports → PUWF reviews → contacts worker → records payment verification → proposes remedy.

### GS-02 — Pesticide Exposure / Emergency

Worker:
- seasonal picker
- pesticide exposure
- breathing difficulty/dizziness
- immediate danger = Yes
- confidential

Rules:
- Emergency regardless of AI.

Demo story:
urgent visual priority → PUWF opens immediately → records emergency response/referral demo action.

### GS-03 — Harassment / Confidential / Female Handler Preference

Worker:
- female
- sensitive complaint
- confidential
- safe contact window limited
- no message preference

AI:
- `HAR`
- High/Critical depending scenario
- human review flag

Demo story:
privacy-sensitive workflow and safe contact.

### GS-04 — Child Labour / Anonymous

Reporter:
- adult reporting another worker
- approximate age below legal minimum
- anonymous
- hazardous field work
- no direct contact

Rules:
- minimum Critical.

Demo story:
restricted sensitive classification in future production; Phase 1 shows warning/high-priority portal treatment.

### GS-05 — Forced Labour / Critical

Worker:
- contractor threats
- inability to leave freely
- debt/withheld wages
- confidential

Rules:
- minimum Critical.

### GS-06 — Group Wage Complaint

Worker:
- representative reporter
- 20+ workers affected
- delayed wages
- confidential

Demo value:
group grievance functionality and aggregate impact.

### GS-07 — Sanitation / Standard

Worker:
- no safe drinking water
- many workers affected
- standard priority

Demo value:
normal non-emergency handling.

### GS-08 — AI Low Confidence

Voice sample:
- noisy/mixed-language style demo
- AI confidence 0.55
- category suggestion uncertain

Portal:
- Human Review Required
- original audio prominent.

### GS-09 — AI Failure

- transcription unavailable
- complaint still submits
- PUWF can listen to audio and manually proceed.

### GS-10 — Reopened Case

- originally resolved;
- worker not satisfied;
- case reopened;
- analytics update.

## 14. Scenario Bridge

For cross-interface demos, use:
- `scenarioId`
- deterministic `referenceNumber`
- same case content on mobile and web mock repositories.

Example:
`GS-01 → KP-26-000101`

The web Demo Control Panel can inject or activate `KP-26-000101`.

## 15. Demo Control Panel Functions

- reset all seed data;
- load scenario;
- inject complaint;
- change scenario status;
- simulate AI failure;
- simulate offline;
- advance worker tracking;
- generate additional complaints.

## 16. Data Reset Contract

`resetDemoData()` must:
- clear local mutations;
- reload canonical seed;
- reset filters;
- reset scenario flags;
- reset demo connectivity;
- reset AI delay/failure toggles.

## 17. Analytics Consistency

All charts and KPIs must derive from the live in-memory/local persisted dataset after user mutations.

Never maintain separate hard-coded KPI totals.

## 18. Dummy Evidence Library

Include safe example assets:
- generic wage slip;
- generic pesticide container illustration;
- generic field image;
- generic water point;
- generic injury illustration;
- generic contractor note.

Avoid using identifiable real people without permission.

## 19. QA Data Fixtures

Create small fixed fixtures in addition to the large seed:
- one complaint per category;
- one per status;
- one per priority;
- one per privacy mode;
- one with no audio;
- one with no evidence;
- one with AI failure;
- one reopened case.

These enable unit/integration tests.
