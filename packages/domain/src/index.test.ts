import { describe, expect, it } from "vitest";

import { COMPLAINT_ID_PATTERN, demoPinFromTrackingId, nextComplaintTrackingId } from "./ids";
import { isOverdue } from "./models";
import { persistenceKeys } from "./persistence";
import { getMinimumPriority, reconcilePriority } from "./priorityRules";
import { privacyModes } from "./privacy";
import { canSubmitDraft } from "./submitRules";
import { workerCategoryCodes } from "./taxonomy";

describe("domain", () => {
  it("accepts the approved tracking ID format", () => {
    expect(COMPLAINT_ID_PATTERN.test("KP-26-000123")).toBe(true);
    expect(COMPLAINT_ID_PATTERN.test("KP-25-000123")).toBe(false);
  });

  it("keeps three privacy modes and eleven worker categories", () => {
    expect(privacyModes).toEqual(["ANON", "CONF", "IDEN"]);
    expect(workerCategoryCodes).toHaveLength(11);
  });

  it("marks active cases overdue after dueAt", () => {
    expect(
      isOverdue(
        { dueAt: "2026-08-01T00:00:00.000Z", status: "Submitted" },
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
        reporterIdentity: { mode: "cnic", cnicLast4: "4567", cnicVerified: false },
        incident: {
          whenLabel: "today",
          othersAffected: "individual",
          immediateDanger: false,
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
});
