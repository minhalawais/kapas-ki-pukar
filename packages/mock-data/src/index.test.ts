import { caseStatuses, privacyModes, workerCategoryCodes } from "@kapas/domain";
import { complaintSchema } from "@kapas/validation";
import { describe, expect, it } from "vitest";

import { generateComplaints, SEED_SIZE } from "./generateComplaints";
import { getGoldenComplaint } from "./scenarios";

const CNIC = /\b\d{5}-\d{7}-\d\b/;
const PHONE = /\b03\d{9}\b/;

describe("dummy data engine", () => {
  it("produces a deterministic 200-record seed", () => {
    const a = generateComplaints();
    const b = generateComplaints();
    expect(a).toHaveLength(SEED_SIZE);
    expect(a.map((row) => row.trackingId)).toEqual(b.map((row) => row.trackingId));
  });

  it("validates every generated complaint", () => {
    for (const row of generateComplaints()) {
      expect(() => complaintSchema.parse(row)).not.toThrow();
    }
  });

  it("covers every category, portal status, and privacy mode", () => {
    const rows = generateComplaints();
    for (const code of workerCategoryCodes) {
      expect(rows.some((row) => row.categoryCode === code)).toBe(true);
    }
    for (const status of caseStatuses.filter((s) => s !== "Draft")) {
      expect(rows.some((row) => row.status === status)).toBe(true);
    }
    for (const mode of privacyModes) {
      expect(rows.some((row) => row.privacyMode === mode)).toBe(true);
    }
  });

  it("contains Punjab and Sindh locations and no real CNIC/phone", () => {
    const rows = generateComplaints();
    expect(rows.some((row) => row.location.province === "Punjab")).toBe(true);
    expect(rows.some((row) => row.location.province === "Sindh")).toBe(true);
    const blob = JSON.stringify(rows);
    expect(blob).not.toMatch(CNIC);
    expect(blob).not.toMatch(PHONE);
  });

  it("keeps golden scenario IDs stable", () => {
    expect(getGoldenComplaint("GS-01").trackingId).toBe("KP-26-000101");
    expect(getGoldenComplaint("GS-02").priority).toBe("Emergency");
    expect(getGoldenComplaint("GS-09").ai?.failed).toBe(true);
    expect(getGoldenComplaint("GS-10").status).toBe("Reopened");
  });
});
