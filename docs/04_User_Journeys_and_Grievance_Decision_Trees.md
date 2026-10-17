# 04 — User Journeys + Grievance Conversation / Decision Trees

**Document ID:** KKP-UJ-004  
**Product:** Kapas ki Pukaar — Voice-Enabled Smart Grievance Reporting Application for Cotton Farm Workers  
**Prepared for:** Pakistan United Workers Federation (PUWF)  
**Technical Partner:** Fruit of Sustainability (FOS)  
**Version:** 1.0  
**Date:** 2026-08-18  
**Status:** Frontend Development Baseline  
**Phase:** Phase 1 — Complete Frontend with Dummy Data  
**Purpose:** Define complete worker and PUWF journeys plus deterministic grievance conversation branching for the frontend prototype.

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

## 2. Journey Design Principles

- Ask only what is needed.
- Prefer tap choices over typing.
- Preserve the worker's original voice.
- Never require a low-literacy worker to edit a long transcript.
- Sensitive categories use shorter, safer flows.
- Critical risk is detected by deterministic rules before AI suggestions.
- The worker can go back without losing the draft.
- The worker can stop and resume later.

## 3. Primary Worker Journey

```text
Launch
→ Select Language
→ Welcome / Audio Guidance
→ Home
→ Report a Problem
→ Select Issue
→ Answer Category Questions
→ Record Voice Description
→ When?
→ Where?
→ Others Affected?
→ Immediate Danger?
→ Privacy Choice
→ Evidence
→ Safe Contact Preference
→ Simulated AI Understanding
→ Worker Confirmation
→ Review
→ Submit
→ Complaint Reference
→ Track Complaint
```

## 4. Worker Journey — Detailed States

### Stage 1: Entry
Goal: establish trust quickly.

Worker sees:
- Kapas ki Pukaar branding;
- PUWF initiative line;
- clear Urdu option;
- short audio welcome.

Do not require:
- account creation;
- CNIC;
- profile completion.

### Stage 2: Issue Selection
Worker sees 6–8 simple illustrated categories, with More/Other if needed.

### Stage 3: Guided Questions
Questions adapt to selected issue.

### Stage 4: Voice Narrative
Worker records what happened in their own words.

### Stage 5: Safety and Privacy
Immediate danger and privacy are treated as explicit steps.

### Stage 6: AI Understanding
The app simulates understanding and presents a short plain-language summary.

### Stage 7: Submission
Worker confirms, submits and receives reference.

### Stage 8: Tracking
Worker sees simple status language and timeline.

## 5. PUWF Journey

```text
Open Portal
→ Review KPI Summary
→ Filter New/Critical Complaints
→ Open Complaint
→ Review Worker Voice
→ Review Transcript / AI Summary
→ Start Review
→ Add Note / Contact / Finding
→ Record Action
→ Update Status
→ Propose Resolution
→ Resolve / Close
→ Timeline Updated
→ Analytics Updated
```

## 6. Cross-Interface Demo Journey

Because Phase 1 has no backend:

1. FOS loads Golden Scenario `GS-01`.
2. Mobile user completes that scenario and receives a deterministic reference.
3. Demo Control Panel on web injects the matching case using the same reference/seed.
4. PUWF handles the case.
5. Worker-side tracking can be advanced through the same scenario state manually/demo-control assisted.
6. This demonstrates the intended end-to-end product without claiming real network synchronisation.

## 7. Common Conversation Backbone

```text
START
├─ Is this a workplace/cotton-work concern?
├─ What type of issue?
├─ Category-specific questions
├─ Optional open voice description
├─ When did it happen?
├─ Where did it happen?
├─ Are other workers affected?
├─ Is anyone in immediate danger?
├─ How should your identity be handled?
├─ Is it safe to contact you?
├─ Do you want to attach evidence?
├─ AI understanding
├─ Worker confirms
└─ Submit
```

## 8. Wage Decision Tree

```text
WAGES
├─ What happened?
│  ├─ Not paid
│  ├─ Paid less
│  ├─ Paid late
│  └─ Deduction / other
├─ How were you supposed to be paid?
│  ├─ Daily
│  ├─ Per kg / piece-rate
│  ├─ Lump sum
│  └─ Not sure
├─ Optional agreed amount
├─ Optional amount received
├─ Who handled payment?
│  ├─ Contractor
│  ├─ Farm owner/manager
│  ├─ Other intermediary
│  └─ Not sure
└─ Are other workers affected?
```

Derived internal examples:
- unpaid wages;
- delayed wages;
- underpayment;
- illegal deduction;
- piece-rate/weighing dispute.

## 9. Pesticide Decision Tree

```text
PESTICIDE / SPRAY
├─ What happened?
│  ├─ Worker exposed during spraying
│  ├─ Worker entered field soon after spraying
│  ├─ No protective equipment
│  ├─ Chemical touched skin/eyes
│  └─ Other
├─ Do you have symptoms?
│  ├─ Breathing difficulty
│  ├─ Dizziness
│  ├─ Vomiting
│  ├─ Burning/irritation
│  ├─ Other
│  └─ No symptoms
├─ Did you receive medical help?
├─ Is anyone currently in danger?
└─ Are other workers affected?
```

Rule examples:
- severe symptoms + current danger → Emergency
- exposure without severe symptoms → High
- PPE complaint without exposure → Standard/High based on scenario

## 10. Health & Safety Decision Tree

```text
HEALTH & SAFETY
├─ Injury / unsafe equipment / heat / transport / other
├─ Did anyone get injured?
├─ Is medical help needed?
├─ Is the unsafe condition still present?
├─ Is anyone currently in danger?
└─ Others affected?
```

## 11. Harassment Decision Tree

Design principle: minimum necessary disclosure.

```text
HARASSMENT
├─ Do you want to continue privately?
├─ Is the concern about behaviour toward you?
├─ Is the person still around you / can they harm you now?
├─ Would you prefer a female PUWF representative? [demo option]
├─ Is it safe to contact you?
├─ Optional voice description
└─ Privacy mode
```

Do not force:
- perpetrator name;
- graphic details;
- public evidence upload.

## 12. Child Labour Decision Tree

```text
CHILD LABOUR
├─ Are you reporting about yourself or someone else?
├─ Approximate age band
├─ What type of work?
├─ Is the child doing dangerous work?
├─ Is the child currently at risk?
├─ Location
└─ Optional voice description
```

Rule:
- minimum priority = Critical
- if immediate danger = Emergency

## 13. Forced Labour / Coercion Decision Tree

```text
FORCED LABOUR
├─ Is someone being forced to work?
├─ Threats or punishment?
├─ Debt / withheld payment / restriction?
├─ Can the person leave freely?
├─ Is anyone in immediate danger?
├─ Safe contact?
└─ Privacy mode
```

Rule:
- minimum priority = Critical
- immediate physical danger = Emergency

## 14. Contractor Misconduct Decision Tree

```text
CONTRACTOR ISSUE
├─ Payment
├─ Threats / abusive behaviour
├─ Recruitment fee / debt
├─ False promise
├─ Working condition
├─ Other
└─ Others affected?
```

## 15. Working Hours Decision Tree

```text
WORKING HOURS
├─ Excessive hours?
├─ No rest break?
├─ Forced overtime?
├─ How often?
├─ Others affected?
└─ Current health/safety risk?
```

## 16. Sanitation / Water Decision Tree

```text
SANITATION / WATER
├─ Drinking water
├─ Toilets
├─ Washing facilities
├─ Women-specific facility concern
├─ How long has it continued?
└─ Others affected?
```

## 17. Other Issue Decision Tree

```text
OTHER
├─ Record your concern in your own words
├─ When?
├─ Where?
├─ Others affected?
├─ Immediate danger?
└─ Privacy
```

## 18. Immediate Danger Rule

The question is independent of AI:

> Is anyone currently in immediate danger?

If Yes:
- priority becomes Emergency;
- worker sees a clearly worded urgent notice;
- the interface must not promise a real-time human response in Phase 1 unless PUWF operational arrangements are defined;
- demo portal highlights case as Emergency.

## 19. Privacy Conversation

Three modes:

### Anonymous
- no identity required;
- worker-facing explanation: PUWF will not know who you are from information you intentionally do not provide;
- demo case shows identity withheld.

### Confidential
- PUWF may know worker identity/contact;
- identity is not intended to be shared outside authorised handling.

### Identified
- worker agrees identity may be used for case handling.

Frontend Phase 1 simulates these behaviours only. Production data-access enforcement is a later backend requirement.

## 20. Worker AI Confirmation

Do not show a long editable transcript as the only confirmation.

Show a short understanding:
- issue type;
- key fact;
- location if provided;
- privacy mode;
- danger status.

Buttons:
- **Yes, this is correct**
- **Go back / change something**

## 21. Case Closure Journey

PUWF:
`Proposed Resolution → Resolved → Closed`

Worker scenario:
- sees resolution update;
- optionally provides:
  - Satisfied
  - Partially satisfied
  - Not satisfied

If Not satisfied:
- demo scenario can move to Reopened/Escalated.

## 22. Edge Journeys

Document and test:
- user denies microphone;
- user records no audio;
- user stops mid-complaint;
- user returns to draft;
- user has no evidence;
- user is offline;
- AI simulation fails;
- AI confidence low;
- user selects Other Issue;
- PUWF closes case with required reason;
- PUWF reopens case;
- no complaints match filter.
