# 05 — Grievance Taxonomy + Case Lifecycle Specification

**Document ID:** KKP-TAX-005  
**Product:** Kapas ki Pukaar — Voice-Enabled Smart Grievance Reporting Application for Cotton Farm Workers  
**Prepared for:** Pakistan United Workers Federation (PUWF)  
**Technical Partner:** Fruit of Sustainability (FOS)  
**Version:** 1.0  
**Date:** 2026-08-18  
**Status:** Frontend Development Baseline  
**Phase:** Phase 1 — Complete Frontend with Dummy Data  
**Purpose:** Provide one canonical grievance classification model, priority framework and lifecycle used consistently across mobile, PUWF portal, mock AI and analytics.

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

## 2. Taxonomy Design Principles

- Worker categories are simple and visual.
- Internal categories may be more detailed.
- One canonical taxonomy feeds mobile, web, mock AI, dummy data and analytics.
- Sensitive categories are not treated as ordinary generic complaints.
- Categories describe the concern, not whether the allegation is proven.

## 3. Primary Worker-Facing Categories

| Code | Worker-Facing Category | Example Icon Concept |
|---|---|---|
| WAG | Wages / Mazdoori | Money / hand |
| PES | Pesticide / Spray | Spray bottle + shield |
| HSE | Health & Safety | Helmet / first aid |
| HAR | Harassment / Threatening Behaviour | Protective shield/person |
| CHL | Child Labour | Child + protective hand |
| FOL | Forced Labour / Coercion | Open hand / broken chain |
| CON | Contractor Issue | Worker + intermediary |
| HRS | Working Hours / Rest | Clock |
| SAN | Water & Sanitation | Tap / toilet |
| DIS | Discrimination | Equal people / balance |
| OTH | Other Concern | Speech bubble / dots |

## 4. Internal Subcategories

### WAG — Wages
- WAG-UNP — Unpaid wages
- WAG-DEL — Delayed wages
- WAG-UND — Underpayment
- WAG-DED — Unexplained/illegal deduction
- WAG-PIE — Piece-rate / weighing dispute
- WAG-OVT — Overtime payment concern
- WAG-OTH — Other wage concern

### PES — Pesticide
- PES-EXP — Direct exposure
- PES-REI — Unsafe re-entry after spraying
- PES-PPE — Lack of PPE
- PES-SYM — Poisoning symptoms
- PES-INF — Lack of chemical/safety information
- PES-OTH — Other pesticide concern

### HSE — Health & Safety
- HSE-INJ — Injury
- HSE-HEA — Heat stress
- HSE-EQP — Unsafe equipment/tool
- HSE-TRN — Unsafe transport
- HSE-MED — Lack of medical response
- HSE-OTH — Other safety concern

### HAR — Harassment / Threats
- HAR-VER — Verbal abuse
- HAR-SEX — Sexual harassment
- HAR-INT — Intimidation/threat
- HAR-RET — Retaliation after complaint
- HAR-OTH — Other harassment

### CHL — Child Labour
- CHL-WRK — Child working below legal minimum age concern
- CHL-HAZ — Hazardous child work
- CHL-HRS — Excessive child working hours
- CHL-OTH — Other child labour concern

### FOL — Forced Labour
- FOL-FOR — Forced work
- FOL-DEB — Debt-related coercion
- FOL-MOV — Restriction on movement
- FOL-THR — Threat for refusing/leaving work
- FOL-DOC — Document retention if relevant
- FOL-OTH — Other coercion

### CON — Contractor / Intermediary
- CON-PAY — Payment withholding
- CON-ABU — Abusive behaviour
- CON-FEE — Recruitment fee/debt
- CON-MIS — Misrepresentation/false promise
- CON-CON — Working-condition misconduct
- CON-OTH — Other

### HRS — Hours
- HRS-EXC — Excessive hours
- HRS-RST — Lack of rest break
- HRS-FOT — Forced overtime
- HRS-OTH — Other

### SAN — Water & Sanitation
- SAN-WAT — Drinking water
- SAN-TLT — Toilets
- SAN-WAS — Washing facility
- SAN-WOM — Women-specific sanitation
- SAN-OTH — Other

### DIS — Discrimination
- DIS-GEN — Gender
- DIS-ETH — Ethnicity/community
- DIS-MIG — Migrant status
- DIS-AGE — Age
- DIS-OTH — Other

## 5. Reporter Type

- Self
- Co-worker
- Family member
- PUWF field representative
- Community representative
- Other

The affected person and reporter are conceptually separate in the domain model.

## 6. Worker Relationship / Employment Type

Frontend demo options:
- seasonal picker;
- daily-wage worker;
- piece-rate worker;
- migrant worker;
- contractor/intermediary worker;
- tenant-associated worker;
- other/not sure.

## 7. Group Impact

- Individual only
- 2–5 workers
- 6–20 workers
- More than 20
- Not sure

## 8. Privacy Modes

### ANON — Anonymous
No identity required in the complaint flow.

### CONF — Confidential
Identity/contact may be known to PUWF in a future production system but not intended for external disclosure.

### IDEN — Identified
Worker agrees identity may be used in the case process.

Phase 1 simulates the visibility outcome only.

## 9. Priority Model

| Priority | Meaning | Frontend Use |
|---|---|---|
| Emergency | Immediate or imminent danger | Red, strongest attention |
| Critical | Severe safeguarding/rights concern | Red/orange |
| High | Serious issue requiring timely review | Amber |
| Standard | Normal grievance handling | Neutral/green |

### Deterministic Minimum Rules
- immediate danger = Emergency;
- child labour = minimum Critical;
- forced labour = minimum Critical;
- severe pesticide symptoms + danger = Emergency;
- severe harassment/threat with present danger = Emergency;
- AI mock may increase but never decrease a deterministic floor.

## 10. Case Lifecycle

Canonical internal lifecycle:

```text
Draft
→ Submitted
→ New
→ Under Review
→ Action in Progress
→ Proposed Resolution
→ Resolved
→ Closed
```

Conditional statuses:
- Awaiting Worker
- Escalated
- Reopened

## 11. Status Definitions

| Status | Definition | Entry Condition | Exit Examples |
|---|---|---|---|
| Draft | Worker has not submitted | Complaint started | Submit/Discard |
| Submitted | Worker completed local submission | Submit action | New |
| New | Case not yet reviewed | Portal intake | Under Review |
| Under Review | PUWF review started | Start Review | Awaiting Worker/Action/ Escalated |
| Awaiting Worker | More information needed | Request Info | Under Review/Action |
| Action in Progress | PUWF is recording or following action | Record Action | Proposed Resolution/Escalated |
| Escalated | Case moved to higher/special attention | Escalate | Under Review/Action |
| Proposed Resolution | Remedy/action proposed | Propose Resolution | Resolved/Action |
| Resolved | Case marked resolved | Resolve action | Closed/Reopened |
| Closed | Case lifecycle completed | Close action with reason | Reopened |
| Reopened | Closed/resolved case reactivated | Reopen action | Under Review |

## 12. Worker-Facing Status Language

| Internal | Worker-Facing Meaning |
|---|---|
| Submitted/New | Your complaint has been received |
| Under Review | Your complaint is being reviewed |
| Awaiting Worker | PUWF needs more information |
| Action in Progress | Action is being taken |
| Escalated | Your complaint needs additional review |
| Proposed Resolution | A proposed resolution is ready |
| Resolved | A resolution has been recorded |
| Closed | Your complaint has been completed |
| Reopened | Your complaint is being reviewed again |

Urdu text shall be maintained in the localisation file, not hard-coded in this document.

## 13. Allowed Transitions

- New → Under Review
- Under Review → Awaiting Worker
- Awaiting Worker → Under Review
- Under Review → Action in Progress
- Under Review → Escalated
- Escalated → Under Review
- Escalated → Action in Progress
- Action in Progress → Proposed Resolution
- Proposed Resolution → Resolved
- Proposed Resolution → Action in Progress
- Resolved → Closed
- Resolved → Reopened
- Closed → Reopened
- Reopened → Under Review

Invalid transitions should be blocked by the frontend mock lifecycle service.

## 14. Case Action Types

- Review Started
- Priority Changed
- Internal Note Added
- Worker Contact Attempted
- Worker Contact Successful
- More Information Requested
- Evidence Added
- Investigation Finding Added
- Action Taken
- Referral Recorded
- Escalated
- Proposed Resolution
- Resolved
- Closed
- Reopened
- Worker Feedback Recorded

## 15. Closure Rules

To close a case in Phase 1:
- case must be Resolved unless a special demo closure reason is used;
- closure reason required;
- closing action creates timeline event;
- closed status updates analytics.

## 16. Reopen Rules

Reopen requires:
- reason;
- user confirmation;
- timeline event;
- return to Reopened then Under Review.

## 17. Analytics Classification Rules

All analytics must use canonical codes, never visual labels.

Example:
- Mobile card "Mazdoori" → `WAG`
- AI suggestion "Underpayment" → `WAG-UND`
- Dashboard category chart groups by `WAG`
- Detailed report may use `WAG-UND`

## 18. Taxonomy Governance

Any new category must update:
1. taxonomy;
2. mobile label/icon;
3. workflow config;
4. mock AI mapping;
5. dummy data generator;
6. portal filter;
7. analytics grouping;
8. QA cases.
