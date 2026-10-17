# Canonical Terminology

Use these names in code, tickets and UI keys. Do not mix synonyms in the same context.

## Product

| Term | Use |
|---|---|
| Kapas ki Pukaar | Product name |
| Complainant / cotton worker | Mobile user |
| PUWF Grievance Manager | Only web role in Product Phase 1 |
| Complaint / Shikayat | Worker-facing label |
| Grievance case | Internal PUWF label |
| Product Phase 1 | Frontend with dummy data |
| Product Phase 2 | Production backend (out of current contract unless CR) |
| Implementation Phase 0–13 | Delivery phases in the phase-guide folder |

## Privacy

| Code | Label |
|---|---|
| ANON | Anonymous |
| CONF | Confidential |
| IDEN | Identified |

## Priority

Emergency · Critical · High · Standard

## Lifecycle (internal)

Draft → Submitted → New → Under Review → Action in Progress → Proposed Resolution → Resolved → Closed  

Conditional: Awaiting Worker · Escalated · Reopened

## Categories (worker-facing / code)

| Code | Worker-facing |
|---|---|
| WAG | Wages / Mazdoori |
| PES | Pesticide / Spray |
| HSE | Health & Safety |
| HAR | Harassment / Threatening Behaviour |
| CHL | Child Labour |
| FOL | Forced Labour / Coercion |
| CON | Contractor Issue |
| HRS | Working Hours / Rest |
| SAN | Water & Sanitation |
| DIS | Discrimination |
| OTH | Other Concern |

## Complaint reference

Format: `KP-26-######` (example `KP-26-001248`).

## Architecture path

`UI → feature hook → service → repository → mock repository → dummy data`
