import { describe, expect, it } from "vitest";

import {
  assertCaseTransition,
  assertTransitionReason,
  canTransitionCase,
  InvalidCaseTransitionError,
} from "./caseLifecycle";
import { complaintSla } from "./caseWorkflow";
import {
  COMPLAINT_ID_PATTERN,
  COMPLAINT_REFERENCE_PATTERN,
  demoPinFromTrackingId,
  isComplaintReference,
  LEGACY_COMPLAINT_REFERENCE_PATTERN,
  nextComplaintTrackingId,
  parseReadableComplaintReference,
} from "./ids";
import { isOverdue } from "./models";
import { persistenceKeys } from "./persistence";
import { getMinimumPriority, reconcilePriority } from "./priorityRules";
import { privacyModes } from "./privacy";
import { canSubmitDraft, validateComplaintDraft } from "./submitRules";
import { workerCategoryCodes } from "./taxonomy";
import { assertTaxonomySelection, categoryForSubcategory, isSubcategoryOf } from "./taxonomyRules";

describe("domain", () => {
  it("accepts readable and legacy reference formats", () => {
    expect(COMPLAINT_ID_PATTERN.test("KP-26-000123")).toBe(true);
    expect(COMPLAINT_ID_PATTERN.test("KP-25-000123")).toBe(true);
    expect(LEGACY_COMPLAINT_REFERENCE_PATTERN.test("KP-527C-C888-044A")).toBe(true);
    expect(COMPLAINT_REFERENCE_PATTERN.test("KP-26-000123")).toBe(true);
    expect(COMPLAINT_REFERENCE_PATTERN.test("KP-527C-C888-044A")).toBe(true);
    expect(isComplaintReference("KP-INVALID")).toBe(false);
    expect(parseReadableComplaintReference("KP-26-001248")).toEqual({
      prefix: "KP-26",
      serial: "001248",
      supportPin: "1248",
    });
  });

  it("keeps three privacy modes and eleven worker categories", () => {
    expect(privacyModes).toEqual(["ANON", "CONF", "IDEN"]);
    expect(workerCategoryCodes).toHaveLength(11);
  });

  it("marks active cases overdue after dueAt", () => {
    expect(
      isOverdue(
        { dueAt: "2026-08-01T00:00:00.000Z", status: "Received" },
        "2026-08-19T12:00:00.000Z",
      ),
    ).toBe(true);
    expect(
      isOverdue(
        { dueAt: "2026-08-01T00:00:00.000Z", status: "Closed" },
        "2026-08-19T12:00:00.000Z",
      ),
    ).toBe(false);
  });

  it("versions the onboarding persistence key", () => {
    expect(persistenceKeys.onboarding).toBe("kkp:v1:onboarding");
    expect(persistenceKeys.offlineQueue).toBe("kkp:v1:offlineQueue");
    expect(persistenceKeys.schema).toBe("kkp:v1:schema");
    expect(persistenceKeys.draft).toBe("kkp:v1:complaintDraft");
    expect(persistenceKeys.voiceGuidance).toBe("kkp:v1:voiceGuidance");
  });

  it("enforces deterministic priority floors", () => {
    expect(getMinimumPriority({ immediateDanger: true })).toBe("Emergency");
    expect(getMinimumPriority({ immediateDanger: false, category: "CHL" })).toBe("Critical");
    expect(getMinimumPriority({ immediateDanger: false, category: "FOL" })).toBe("Critical");
    expect(
      getMinimumPriority({
        immediateDanger: true,
        pesticideSymptoms: true,
        category: "PES",
      }),
    ).toBe("Emergency");
    expect(
      getMinimumPriority({
        immediateDanger: true,
        harassmentThreat: true,
        category: "HAR",
      }),
    ).toBe("Emergency");
    expect(getMinimumPriority({ immediateDanger: false, category: "WAG" })).toBe("Standard");
    expect(reconcilePriority("Standard", "Critical")).toBe("Critical");
    expect(reconcilePriority("Emergency", "Critical")).toBe("Emergency");
  });

  it("allocates unique KP-26 tracking ids", () => {
    expect(nextComplaintTrackingId(["KP-26-000001", "KP-26-000002"])).toBe("KP-26-000003");
    expect(COMPLAINT_ID_PATTERN.test(nextComplaintTrackingId([]))).toBe(true);
    expect(demoPinFromTrackingId("KP-26-001248")).toBe("1248");
  });

  it("enforces the complete authoritative lifecycle", () => {
    expect(canTransitionCase("Received", "Triage")).toBe(true);
    expect(canTransitionCase("Triage", "Verification")).toBe(true);
    expect(canTransitionCase("Investigation", "Escalated")).toBe(true);
    expect(canTransitionCase("Closed", "Triage")).toBe(false);
    expect(() => assertCaseTransition("Closed", "Triage")).toThrow(InvalidCaseTransitionError);
    expect(() => assertTransitionReason("Closed", undefined)).toThrow();
    expect(() =>
      assertTransitionReason("Closed", { reason: "resolved and confirmed" }),
    ).not.toThrow();
  });

  it("calculates priority-specific workflow targets", () => {
    const accepted = new Date("2026-10-28T00:00:00.000Z");
    expect(complaintSla("Emergency", accepted).triageDueAt.toISOString()).toBe(
      "2026-10-28T00:15:00.000Z",
    );
    expect(complaintSla("Critical", accepted).contactDueAt.toISOString()).toBe(
      "2026-10-28T08:00:00.000Z",
    );
    expect(complaintSla("Standard", accepted).nextUpdateDueAt.toISOString()).toBe(
      "2026-11-02T00:00:00.000Z",
    );
  });

  it("enforces canonical category and subcategory ownership", () => {
    expect(isSubcategoryOf("WAG", "WAG-UND")).toBe(true);
    expect(isSubcategoryOf("WAG", "PES-EXP")).toBe(false);
    expect(categoryForSubcategory("CHL-HAZ")).toBe("CHL");
    expect(() => assertTaxonomySelection("WAG", "PES-EXP")).toThrow();
    expect(() => assertTaxonomySelection("WAG", "WAG-UND")).not.toThrow();
  });

  it("blocks submit until identity, complaint facts and location are complete", () => {
    expect(
      canSubmitDraft({
        id: "d",
        stepId: "review",
        incident: {},
        location: {},
        evidence: [],
        voice: null,
        updatedAt: "2026-08-19T12:00:00.000Z",
      }),
    ).toBe(false);
    expect(
      canSubmitDraft({
        id: "complete",
        stepId: "review",
        category: "WAG",
        privacyMode: "CONF",
        reporterIdentity: {
          mode: "cnic",
          cnicLast4: "4567",
          phoneLast4: "4567",
          cnicVerified: false,
        },
        incident: {
          whenLabel: "today",
          othersAffected: "individual",
          immediateDanger: false,
          structuredAnswers: { contactPreference: "call" },
        },
        location: {
          province: "Balochistan",
          district: "Quetta",
          placeLabel: "Cotton market",
          source: "manual",
        },
        evidence: [],
        voice: null,
        updatedAt: "2026-08-19T12:00:00.000Z",
      }),
    ).toBe(true);
  });

  it("accepts a complete anonymous complaint without contact details", () => {
    const result = validateComplaintDraft({
      id: "anonymous",
      stepId: "review",
      category: "WAG",
      privacyMode: "ANON",
      reporterIdentity: { mode: "anonymous", cnicVerified: false },
      incident: { whenLabel: "today", othersAffected: "individual", immediateDanger: false },
      location: {
        province: "Punjab",
        district: "Multan",
        placeLabel: "Cotton market",
        source: "manual",
      },
      evidence: [],
      voice: null,
      updatedAt: "2026-10-27T00:00:00.000Z",
    });
    expect(result).toEqual({ valid: true });
  });

  it("returns the exact recovery step for incomplete drafts", () => {
    const result = validateComplaintDraft({
      id: "missing-location",
      stepId: "review",
      category: "WAG",
      privacyMode: "ANON",
      reporterIdentity: { mode: "anonymous", cnicVerified: false },
      incident: { whenLabel: "today", othersAffected: "individual", immediateDanger: false },
      location: { source: "manual" },
      evidence: [],
      voice: null,
      updatedAt: "2026-10-27T00:00:00.000Z",
    });
    expect(result).toEqual({
      valid: false,
      code: "location_required",
      stepId: "where-province",
      field: "location",
    });
  });
});
