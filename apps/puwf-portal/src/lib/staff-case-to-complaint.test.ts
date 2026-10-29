import { describe, expect, it } from "vitest";

import { structuredAnswerRows } from "./case-workspace";
import { staffCaseRowToComplaint } from "./staff-case-to-complaint";

describe("staffCaseRowToComplaint", () => {
  it("maps incident, location, and contact fields from staff case JSON", () => {
    const complaint = staffCaseRowToComplaint({
      id: "c1",
      referenceNumber: "KP-TEST-0001",
      categoryCode: "PES",
      subcategoryCode: "PES-EXP",
      status: "Action in Progress",
      priority: "Standard",
      privacyMode: "IDEN",
      province: "Punjab",
      district: "Lahore",
      villageLabel: "Village A",
      descriptivePlace: "Near canal",
      locationSource: "manual",
      submittedAt: "2026-10-28T10:00:00.000Z",
      updatedAt: "2026-10-28T11:00:00.000Z",
      dueAt: "2026-11-04T10:00:00.000Z",
      whenLabel: "older",
      currentDanger: false,
      immediateDanger: false,
      othersAffected: "2-5",
      contactAllowed: true,
      contactPreference: "call",
      safeContactWindow: "After 4 pm",
      preferredLanguage: "ur",
      safeVoicemail: true,
      phoneLast4: "5888",
      structuredAnswers: {
        when: "older",
        others: "yes",
        "pes-sym": ["vomit"],
      },
      incidentDescription: "No mask provided.",
      evidence: [],
      actions: [],
    });

    expect(complaint.incident.whenLabel).toBe("older");
    expect(complaint.incident.othersAffected).toBe("2-5");
    expect(complaint.incident.immediateDanger).toBe(false);
    expect(complaint.location.villageLabel).toBe("Village A");
    expect(complaint.location.placeLabel).toBe("Near canal");
    expect(complaint.reporter.contactPreference).toBe("call");
    expect(complaint.reporter.safeContactWindow).toBe("After 4 pm");
    expect(complaint.incident.description).toBe("No mask provided.");

    const rows = structuredAnswerRows(complaint);
    expect(rows.some((row) => row.id === "when")).toBe(false);
    expect(rows.some((row) => row.id === "others")).toBe(false);
    expect(rows.some((row) => row.id === "pes-sym")).toBe(true);
  });

  it("maps decrypted exact coordinates from staff case JSON", () => {
    const complaint = staffCaseRowToComplaint({
      id: "c2",
      referenceNumber: "KP-TEST-0002",
      categoryCode: "PES",
      status: "Received",
      priority: "Standard",
      privacyMode: "ANON",
      province: "Punjab",
      district: "Lahore",
      locationSource: "device",
      locationAccuracyMeters: 12,
      exactCoordinates: { latitude: 31.5204, longitude: 74.3587 },
      submittedAt: "2026-10-28T10:00:00.000Z",
      updatedAt: "2026-10-28T10:00:00.000Z",
      dueAt: "2026-11-04T10:00:00.000Z",
      whenLabel: "today",
      currentDanger: false,
      immediateDanger: false,
      othersAffected: "individual",
      contactAllowed: false,
      contactPreference: "do-not-initiate",
      safeVoicemail: false,
      structuredAnswers: {},
      evidence: [],
      actions: [],
    });

    expect(complaint.location.exactCoordinates).toEqual({
      latitude: 31.5204,
      longitude: 74.3587,
    });
    expect(complaint.location.accuracyMeters).toBe(12);
    expect(complaint.location.source).toBe("device");
  });
});
