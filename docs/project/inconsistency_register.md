# Inconsistency Register — Phase 0

Conflicts found while freezing the documentation baseline. Resolutions are in `decision_log.md`.

| ID | Topic | Conflict | Resolution | Status |
|---|---|---|---|---|
| INC-001 | Implementation phase numbers | `12_Frontend_Development_Roadmap...` §3 calls Phase 8 “PUWF Dashboard” and splits QA/UAT as 12/13. End-to-End Plan and phase-guide folder: 08 Offline, 09 Dashboard, 10 Case, 11 Analytics, 12 Demo, 13 QA/UAT. | DEC-009: folder + End-to-End Plan win. Doc 12 sprint names remain valid; phase numbers in §3 are not canonical. | Closed |
| INC-002 | Source filenames | Phase guides cite `01_Product_Requirements_Document_PRD.md` without `_v1.1`. Repo files use `_v1.1` for several docs. | DEC-010: use actual filenames. | Closed |
| INC-003 | Repository creation | End-to-End Phase 0 lists “project repository created”. Phase 02 creates the monorepo. | DEC-013: Phase 0 = governance; Phase 2 = apps. | Closed |
| INC-004 | Category screen IDs | Taxonomy: 11 codes including CON, HRS, SAN, DIS. IA named branches stop at Other (M-013). | DEC-014: M-037–M-040 added to IA in Phase 01. | Closed |
| INC-005 | Privacy / evidence ownership | Phase 5 common tail includes privacy/evidence/review. Phase 7 implements those screens. | DEC-015. | Closed |
| INC-006 | Complaint ID examples | Concept OCR/mock: `KKP-2024-000123`, `KP-25-0001234`. FRS: `KP-26-001248`. | DEC-006. | Closed |
| INC-007 | Dashboard KPIs | Client board: Avg Resolution Time. FRS DSH-001: Overdue. | DEC-007. | Closed |
| INC-008 | Privacy option count | One client board shows 2 options; FRS/taxonomy show 3. | DEC-005. | Closed |
| INC-009 | Charts | Client donut for many categories. FOS visualisation standard prefers sorted bar. | Follow FOS-DATA-VISUALIZATION-STANDARD.md and doc 06 mixed palette in Impl. Phase 9. Donut only if ≤5 slices. | Open — design in Impl. Phase 1/9 |
| INC-010 | Maps | End-to-End stack lists MapLibre. Location requirement is simple district/area choices. | DEC-012. | Closed |
| INC-011 | Phase-guide README names | README lists phase files without `_v1.1` suffixes. | Cosmetic. Update README when convenient; not a product blocker. | Open — docs hygiene |
| INC-012 | Doc 12 Phase 7 vs 8 mobile offline | End-to-End Phase 7 completes worker app including tracking; Phase 8 is offline. Doc 12 Phase 7 “Submission, Tracking & Rights” also lists offline simulation. | Offline UX is Implementation Phase 8. Phase 7 may persist locally without the demo offline toggle. | Closed |

No remaining **blocker** for Implementation Phase 2 (repository). Open items are owned and dated to later phases.
