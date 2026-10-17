# Complaint Registration Alignment Audit and Refactoring Plan

Date: 2026-08-21

## Implementation update — 21 August 2026

The first identity and location refactoring slice is implemented:

- The journey begins with a validated 13-digit CNIC input and an explicit anonymous-reporting alternative.
- Full CNIC values are stored separately in Expo SecureStore. Draft JSON contains only the last four digits and an unverified status. Choosing anonymous reporting deletes a previously entered CNIC.
- Location permission is requested only after the worker taps the current-location action, and the detected address must be confirmed.
- GPS lookup has a 12-second timeout and never blocks manual entry.
- Manual entry follows province/territory, city/district, then village, farm, camp, place, or landmark.
- Punjab, Sindh, Khyber Pakhtunkhwa, Balochistan, Islamabad Capital Territory, Gilgit-Baltistan, and Azad Jammu and Kashmir are covered.
- Submission now requires identity choice, core incident facts, danger status, privacy mode, and either confirmed coordinates or a complete manual location.
- Identity and the complete location label appear on the review screen.

The findings below preserve the original audit baseline. Items 1 and 6 are addressed by this implementation slice; the remaining P0/P1 controls still apply.

## 1. Executive verdict

The complaint registration module is directionally aligned with the concept note, but it is not yet fully aligned or production-ready.

The current implementation successfully provides an Urdu-first, one-question-at-a-time journey; cotton-specific complaint categories; category branching; optional voice, photo, and document evidence; anonymous/confidential/identified modes; offline draft handling; and complaint tracking.

The largest gaps are:

1. CNIC is not collected or represented anywhere in the domain, validation, review, or submission model.
2. Making CNIC mandatory would directly conflict with anonymous reporting. The first substantive step should therefore be an identity gate that offers `Enter CNIC`, `Report anonymously`, and `I do not have/know my CNIC`.
3. Only a small subset of questions has automatic audio prompts. Most custom complaint questions remain text-only.
4. Category-specific questions are collected but are not shown in the final review.
5. An emergency answer only displays a notice. There is no one-touch immediate-help action or verified referral pathway.
6. Submission validation only requires category and privacy mode. A materially incomplete complaint can be submitted.
7. Sensitive drafts, media references, and case data are persisted through unencrypted AsyncStorage in the current prototype runtime.
8. Confidential and identified modes do not collect real contact or identity information; placeholder values are stored instead.
9. Smart branching is limited. Most category workflows are linear regardless of risk or answer.
10. Discrimination and contractor complaints receive only one tailored question before the generic flow.

The module should not be represented as a secure production grievance mechanism until the P0 controls in this plan are implemented.

## 2. Audit scope

This review covered:

- The complete concept note.
- The live Urdu complaint journey from introduction through review.
- All common and category-specific workflow definitions.
- Draft mapping, submission validation, complaint construction, offline queueing, media handling, privacy modes, and priority calculation.
- Current mobile unit tests and workflow-path tests.
- International grievance-mechanism, safeguarding, labour, pesticide, forced-labour, and privacy guidance.

Captured audit screens are stored in `/tmp/kapas-grievance-audit/` for this audit run.

## 3. Concept-note alignment

| Concept requirement | Current health | Finding |
| --- | --- | --- |
| Urdu-first experience | Strong | The complete primary journey is available in Urdu with RTL presentation. |
| One simple question at a time | Strong | The wizard generally presents one decision per screen. |
| Voice-guided conversation | Partial | Automatic audio IDs exist for only intro, category, narrative, danger, and privacy. Custom questions are not consistently spoken. |
| Minimal reading and typing | Partial | Most answers are one-tap, but long privacy and review screens remain text-heavy. There is no voice replay control on every question. |
| Icons and illustrations | Partial | Category selection is highly visual. Most subsequent answer screens use text-only cards. |
| Smart branching | Partial | Category, group impact, danger, and privacy branch. Most category answers do not alter the next question or urgency route. |
| Cotton-specific categories | Strong | All concept-note categories are represented, including other concerns. |
| Anonymous reporting | Present but fragile | Anonymous mode exists, but privacy guarantees are not backed by a production identity/data-isolation design. |
| Confidential reporting | Prototype only | The UI offers confidentiality, but no real identity vault, access policy, contact capture, or disclosure-consent record exists. |
| Voice/photo/document evidence | Strong prototype | All three channels exist and are optional. Optional typed narrative from the concept note is missing. |
| Immediate help | Not aligned | Emergency reports receive a notice but no one-touch call, referral, safe-exit, or urgent dispatch action. |
| Structured report review | Partial | Generic fields are reviewable; answers to custom category questions are omitted. |
| Case tracking | Strong prototype | Tracking ID, status, offline saved state, and complaint detail views exist. |
| Offline functionality | Partial | Draft and queue behavior exist, but sensitive data is stored in AsyncStorage without application-layer encryption. |
| Data security and privacy | Not production-ready | The concept requires encrypted storage, role-based access, audit trails, and consent-based sharing. The mobile prototype does not enforce these controls. |

## 4. End-user mental model

The target worker is likely to approach this flow with five concerns before thinking about form completion:

1. `Will the landlord or contractor find out?`
2. `Will using this phone leave visible evidence?`
3. `Can I complete this without reading or typing?`
4. `Will anyone actually help me?`
5. `What happens after I press submit?`

The design must therefore establish safety and control before asking for identifying data. Shared phones, low literacy, intermittent connectivity, fear of retaliation, and limited time in the field should be treated as normal operating conditions, not edge cases.

CNIC collection creates an especially high trust barrier. A worker may be undocumented, under 18, reporting on behalf of someone else, afraid of official systems, or worried that a contractor has access to identity records. A mandatory CNIC gate would suppress precisely the reports the concept is designed to enable.

## 5. CNIC-first design decision

### Required product interpretation

The first substantive intake step should be an identity gate, not an unconditional mandatory CNIC field:

1. `Enter CNIC securely`
2. `Report anonymously`
3. `I do not have or do not know my CNIC`

This satisfies the requirement to address CNIC first while preserving the concept note's anonymous channel and access for children, witnesses, migrants, and workers without documents.

### CNIC interaction

- Show a short spoken privacy notice before collection: why CNIC is requested, who can access it, and whether it will be shared.
- Accept 13 digits using a numeric keypad and visually format as `#####-#######-#`.
- Provide digit-by-digit audio read-back only through headphones or an explicit replay action. Never auto-speak a CNIC aloud.
- Mask the value after entry and display only the last four digits during review.
- Provide `Change`, `Remove identity`, and `Continue anonymously` actions.
- Do not require a CNIC photo. A card image creates unnecessary exposure and document-retention risk.
- Do not claim NADRA verification unless the application has an authorized integration and captures explicit OTP-based consent.

### CNIC storage architecture

Raw CNIC must not be stored in `incident.structuredAnswers`, analytics, logs, notification payloads, AI prompts, or the general complaint object.

Use a separate identity vault:

```text
ComplaintIdentity
- complaintId
- identityMode: ANON | CONF | IDEN
- cnicCiphertext: optional
- cnicHash: optional, keyed HMAC for duplicate detection
- cnicLast4: optional
- verificationStatus: NOT_REQUESTED | PENDING | VERIFIED | FAILED
- verificationConsentAt: optional
- disclosureConsent: scoped recipients and purposes
- retentionExpiresAt
- accessAuditId
```

Required controls:

- Envelope encryption with keys outside the application database.
- Separate authorization policy from ordinary case access.
- No identity access for analytics roles.
- Audited reveal action with reason and user attribution.
- Configurable retention and verified deletion.
- Device-side encrypted draft storage and protected media files.
- Anonymous selection must prevent collection, upload, or retention of CNIC.

## 6. Recommended complaint journey

### Step 1: Safe start

- Explain that the worker can stop at any time.
- Offer a discreet quick-exit action.
- Ask whether it is safe to continue and safe for the phone to make sound.
- Allow headphone/audio mode or silent visual mode.

### Step 2: Identity gate and CNIC

- Offer identified, anonymous, and no-CNIC paths.
- Collect CNIC only for the identified/confidential path and only after the privacy notice.
- Ask whether the reporter is the affected worker, a witness, family member, guardian, union representative, or field worker.

### Step 3: Issue category

- Preserve the current visual category map.
- Add pregnancy/maternity discrimination and retaliation as visible subcategories.
- Keep `Other` available without forcing the worker to classify a legal issue.

### Step 4: Immediate-risk triage

- Move category-specific danger checks before long evidence and location sequences.
- For severe pesticide symptoms, violence, child danger, forced confinement, or life-threatening injury, show immediate-help actions before continuing the report.
- Let the worker continue reporting after using or declining immediate help.

### Step 5: Category-specific conversation

- Ask three to five high-value questions, branching from prior answers.
- Always offer `Not sure`, `Prefer not to say`, and voice explanation where appropriate.
- Avoid demanding names of alleged perpetrators or children.

### Step 6: Worker narrative

- Keep voice recording optional.
- Add optional typed text for users who prefer it.
- Show recording privacy and deletion controls before recording.
- Allow playback, re-record, and delete.

### Step 7: Common facts

- Ask when, where, responsible-person role, whether others are affected, and whether the problem is ongoing.
- Support landmark/manual location and `I do not know`, not only demo villages.
- Avoid precise GPS by default because it can identify a worker or household.

### Step 8: Privacy, contact, and consent

- Reconfirm identity mode after the facts are known.
- Ask whether calls, SMS, WhatsApp, or no contact are safe.
- Capture safe days/times and whether lock-screen messages are safe.
- Explain mandatory safeguarding disclosures before submission, where applicable.
- Record consent separately for each recipient or referral.

### Step 9: Evidence

- Preserve optional photo/document upload.
- Add a safety warning not to confront an alleged offender or enter danger to collect evidence.
- Strip image metadata unless the worker explicitly consents to retain location/time metadata.
- Allow evidence descriptions by voice.

### Step 10: Full review

- Display every category-specific answer in plain language.
- Group the review into identity, incident, safety, location, contact, and evidence.
- Mask CNIC and contact information.
- Let the worker edit each section without losing later answers.
- Speak the complete summary and ask for explicit confirmation.

### Step 11: Submission and remedy expectations

- Explain who receives the report, expected acknowledgement time, escalation path, and how to appeal.
- Provide tracking ID plus a private PIN for anonymous reports.
- Permit a trusted representative to track a case with consent.
- Never expose category or identity in push/SMS notification previews.

## 7. Required custom question sets

These are minimum viable sets. Each answer should drive branching and priority rather than merely being stored.

### Wages

1. What happened: unpaid, underpaid, delayed, unauthorized deduction, unequal pay, or missing overtime.
2. Payment basis: daily, hourly, per kilogram/piece, seasonal, or lump sum.
3. Expected amount and amount received, with `Not sure` and voice alternatives.
4. Work period, days worked, or quantity picked.
5. Who controlled payment: contractor, owner, supervisor, buyer, or other.
6. Was the worker threatened, prevented from leaving, or told payment depends on more work?

### Pesticide exposure

1. Exposure event: spraying, mixing, spill, spray drift, early re-entry, or missing PPE.
2. Route: skin, eyes, breathing, swallowing, or unknown.
3. Current symptoms and number of exposed people.
4. Was the worker moved away, washed, or given medical help?
5. Chemical/product name or safe photo of the label, if available.
6. Active breathing difficulty, unconsciousness, seizure, or severe symptoms must trigger immediate medical referral before the remaining form.

### Health and safety

1. Type: injury, dangerous tool/machine, heat, transport, animal/insect hazard, or unsafe field condition.
2. Injury severity/body area or near-miss.
3. Medical help needed/received and lost work time.
4. Is the hazard still present, and are others exposed?
5. Was the employer/contractor informed, and what happened next?
6. Is compensation, treatment cost, or wage replacement needed?

### Harassment and violence

1. Ask whether the worker is alone and safe to continue; offer silent mode and quick exit.
2. Type: verbal abuse, sexual harassment, physical violence, stalking, threats, coercion, or retaliation.
3. Is the alleged person nearby or able to contact/harm the worker now?
4. Reporter relationship: survivor, witness, or reporting for another person.
5. Alleged actor role, not mandatory name.
6. Preferred support: female case worker, health service, legal help, union representative, or no referral yet.
7. Ask consent before sharing details or initiating a referral.

### Child labour and child safeguarding

1. Is the child in immediate danger now?
2. Reporter relationship and approximate age.
3. Work type, hours, night work, heavy loads, machinery, pesticide exposure, or abuse.
4. Is work preventing school attendance?
5. Who arranged or controls the work?
6. Safe location and safe adult contact, without requiring the child's name.
7. Explain any mandatory referral or safeguarding duty before submission.

### Forced labour and bonded labour

1. Can the worker refuse work or leave freely?
2. Threats against the worker or family, violence, confinement, or surveillance.
3. Debt/advance amount, changing debt, recruitment fee, or inherited debt.
4. Withheld wages or identity documents.
5. Isolation, restricted communication, or transport control.
6. Safe contact method/time and whether the alleged controller can see the phone.
7. Immediate safe referral path; do not send visible notifications by default.

### Contractor misconduct

1. Type: payment, abuse, recruitment fee/debt, false promise, unsafe condition, document retention, or retaliation.
2. Contractor name or description, optional.
3. Farm/landowner or enterprise connected to the contractor.
4. Promised terms versus actual terms.
5. Amount paid/owed or recruitment fee.
6. Threat, debt, freedom-to-leave, and withheld-document checks.

### Working hours and rest

1. Approximate start/end time or total-hours range.
2. Number of workdays per week and length of the problem.
3. Meal, water, shade, toilet, and rest breaks available.
4. Overtime voluntary or forced; consequences for refusal.
5. Overtime paid or unpaid.
6. Current heat illness, exhaustion, injury, or other health impact.

### Sanitation and facilities

1. Missing/unsafe facility: drinking water, toilet, washing, shade/rest, first aid, or menstrual needs.
2. Facility absent, unusable, contaminated, too far away, unsafe, or access denied.
3. Privacy and separate/safe access for women.
4. Duration and approximate workers affected.
5. Need to wash after pesticide exposure.
6. Current illness or immediate health risk.

### Discrimination and retaliation

1. Basis: gender, pregnancy/maternity, ethnicity/community/language, migration status, age, disability, religion, union activity, or other.
2. Harm: lower pay, denied work, dismissal, denied facility/break, abuse, promotion/benefit denial, or retaliation.
3. Who made the decision and whether treatment is repeated.
4. Was another comparable worker treated differently?
5. Was the worker threatened or punished for reporting, organizing, or refusing unsafe work?
6. Requested remedy and safe support preference.

### Other concern

1. Broad visual issue chips plus `I am not sure`.
2. Immediate danger check.
3. Voice or optional text narrative.
4. Responsible-person role and workers affected.
5. Human triage required when categorization confidence is low.

## 8. Technical refactoring plan

### Domain and validation

- Add `identityMode`, reporter relationship, identity reference, contact safety, disclosure consent, safe-contact windows, and emergency referral fields.
- Add a first-class typed answer schema per category instead of an unrestricted `Record<string, unknown>` as the only representation.
- Add CNIC format validation, but keep anonymous/no-CNIC paths valid.
- Strengthen `canSubmitDraft` to validate the selected path, required common facts, category-specific minimum facts, consent, and emergency acknowledgement.
- Version and migrate persisted drafts safely.

### Workflow engine

- Add input types for masked numeric identity, numeric amounts, optional text, safe contact, and emergency actions.
- Add conditional rules based on multiple answers, not only a single node value.
- Add a terminal `referred for immediate help` state without preventing report completion.
- Track answered/skipped/not-applicable distinctly.
- Recalculate progress from the actual reachable path instead of broad sections.

### Audio and accessibility

- Give every prompt and important option an audio asset or reliable TTS fallback.
- Add a consistent replay button and speaking-state announcement on every question.
- Do not automatically announce CNIC, contact details, harassment details, or child identity.
- Test with Android TalkBack, large font, reduced motion, no audio permission, and one-handed operation.
- Keep tap targets at least 48dp and avoid answer meaning that depends only on colour.

### Privacy and security

- Replace AsyncStorage for sensitive drafts with encrypted storage and encrypted media files.
- Separate identity, case facts, and analytics storage.
- Strip EXIF/location metadata by default.
- Prohibit CNIC and sensitive narrative content in logs, crash reports, push payloads, analytics, and AI prompts.
- Add role-based identity reveal, audit logs, retention rules, deletion workflows, and breach handling.
- Perform threat modelling for shared phones, coercive partners/employers, lost devices, offline queues, screenshots, notification previews, and support staff misuse.

### Case-management integration

- Preserve every tailored answer in a typed case payload.
- Display the same worker-confirmed summary to the case manager.
- Route emergencies by category to configured and verified services.
- Add conflict-of-interest routing so a complaint is not sent only to the person or organization accused.
- Add acknowledgement SLA, owner, due date, escalation, appeal, referral consent, and outcome tracking.

## 9. Testing strategy

### Automated tests

- One complete path test for every category.
- Separate paths for anonymous, confidential, identified, and no-CNIC reports.
- Emergency tests for pesticide poisoning, child danger, forced confinement, violence, and serious injury.
- Tests proving custom answers appear in review and final complaint payload.
- Tests proving CNIC never enters ordinary case data, logs, analytics, AI requests, or notification content.
- Migration tests for existing drafts without identity fields.
- Offline encryption, duplicate submission, retry, media removal, and secure deletion tests.
- Property-based tests that every reachable required node can complete and every route reaches review or an intentional terminal state.

### UX and field testing

- Moderated Urdu sessions with women cotton pickers, seasonal workers, migrants, tenants, adolescents, and union/field representatives.
- Separate women-only sessions with a female facilitator for harassment and sanitation flows.
- Test on low-cost Android devices, shared phones, sunlight, low bandwidth, no network, and noisy field conditions.
- Measure completion without help, comprehension of anonymous versus confidential, abandonment at CNIC, time to urgent help, and ability to correct the final summary.
- Conduct safeguarding review before testing child or harassment scenarios; do not collect real traumatic disclosures during usability exercises.

### Accessibility tests

- TalkBack reading order and selected-state announcements.
- Urdu pronunciation and audio clarity with native speakers.
- 200 percent text scaling and narrow screens.
- Colour contrast, focus order, keyboard/numeric input, and error recovery.
- Silent mode and headphone-safe mode.

## 10. Delivery phases

### Phase 0: Governance decisions

- Confirm CNIC is optional for anonymous/no-document pathways.
- Name the identity-data controller and authorized roles.
- Approve retention, deletion, disclosure, safeguarding, emergency, and referral policies.
- Verify helplines/services and operating hours for Punjab and Sindh.
- Obtain Pakistan privacy, labour, child-protection, and harassment legal review.

### Phase 1: P0 production foundation

- Identity gate and encrypted identity vault.
- Strong submission schema and validation.
- Encrypted drafts/media and secure offline queue.
- Real contact capture and safe-contact controls.
- Complete worker review of all answers.
- Immediate-help action framework.

### Phase 2: Category conversation rebuild

- Implement the tailored question sets and branching above.
- Add audio to every question.
- Add typed narrative and safer location alternatives.
- Add survivor-centred harassment and child-safeguarding pathways.

### Phase 3: Remedy and trust

- Verified referrals, acknowledgement SLAs, appeal/reopen, representative access, and non-retaliation reporting.
- Privacy-safe notifications and anonymous tracking recovery.
- Case-manager conflict checks and identity reveal audits.

### Phase 4: Validation and pilot

- Security review and penetration test.
- Accessibility audit.
- Field usability and safeguarding pilot.
- Operational simulation with case handlers and referral partners.
- Limited rollout with monitored completion, referral, response-time, and retaliation indicators.

## 11. Release acceptance criteria

The complaint module is fully aligned only when:

1. Every complaint type has a tested tailored path and all answers reach review and case management.
2. Every question is usable by listening and one-tap response, with a silent alternative.
3. Anonymous reporting requires no CNIC or other personal information.
4. Identified CNIC data is encrypted, separated, masked, access-controlled, audited, and excluded from analytics/AI/logs.
5. Every emergency class provides an immediate, verified action without blocking complaint submission.
6. Privacy/contact consequences are explained before collection and confirmed before submission.
7. Offline drafts and evidence receive production-grade encryption and deletion.
8. The worker receives a predictable acknowledgement, tracking method, expected timeline, escalation route, and appeal option.
9. Field testing demonstrates that target workers understand the flow and privacy modes without staff coaching.
10. Legal, safeguarding, security, accessibility, and operational owners sign off before production release.

## 12. Research basis

- [Kapas ki Pukaar Concept Note](../Kapas%20ki%20Pukaar%20Concept%20Note.md)
- [UN Guiding Principles on Business and Human Rights, Principle 31](https://www.ohchr.org/sites/default/files/Documents/Publications/GuidingPrinciplesBusinessHR_EN.pdf)
- [ILO grievance handling and access to remedy](https://www.ilo.org/topics-and-sectors/labour-dispute-prevention-and-resolution/grievance-handling-and-access-remedy)
- [IFC Guidance Note 2: Labor and Working Conditions](https://www.ifc.org/content/dam/ifc/doc/2010/2012-ifc-ps-guidance-note-2-en.pdf)
- [IFC good-practice note on retaliation risks](https://www.ifc.org/content/dam/ifc/doc/mgrt/idb-invest-and-ifc-reprisals-gpn.pdf)
- [ILO mapping of Pakistan's cotton supply chain](https://www.ilo.org/publications/mapping-cotton-supply-chain-community-level-pakistan-report-selected)
- [ILO: A voice for women cotton workers in Pakistan](https://www.ilo.org/about/newsroom/voice-women-cotton-workers-pakistan)
- [ILO child labour in agriculture](https://www.ilo.org/child-labour-agriculture)
- [ILO indicators of forced labour](https://www.ilo.org/publications/ilo-indicators-forced-labour)
- [ILO Violence and Harassment Recommendation No. 206](https://www.ilo.org/resource/other/r206-violence-and-harassment-recommendation-2019-no-206)
- [UNICEF safeguarding](https://www.unicef.org/who-we-are/safeguarding)
- [UN Women victim-centred approach to sexual harassment](https://shknowledgehub.unwomen.org/sites/default/files/2024-02/A%20Victim-centred%20Approach%20to%20Sexual%20Harassment%20%20.pdf)
- [WHO pesticide poisoning management resource](https://www.who.int/publications/m/item/sound-management-of-pesticides-and-diagnosis-and-treatment-of-pesticide-poisoing-a-resource-tool)
- [NADRA consent-based CNIC verification services](https://www.nadra.gov.pk/verification)
- [Pakistan MoITT draft personal data protection legislation](https://moitt.gov.pk/Detail/YjVmNzU0MWMtYzBkMC00Yjg5LTk1ODktOTJiODYzZTY5ZWRk)

## 13. Evidence limits

- This is a product, code, and desk-research audit, not legal advice or a security certification.
- The current services are mock implementations; production backend controls could not be assessed because they do not yet exist in this workspace.
- Screenshot review cannot establish TalkBack compatibility, audio comprehension, encryption, or real-world safeguarding effectiveness.
- Pakistan's personal-data legislation was still represented inconsistently across official sources at the review date. Product decisions should follow strong data-minimization and security standards regardless, and production release requires current local legal advice.
