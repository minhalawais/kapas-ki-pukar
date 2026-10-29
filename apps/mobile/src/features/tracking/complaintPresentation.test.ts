import type { CaseStatus } from "@kapas/domain";
import { describe, expect, it } from "vitest";

import type { TrackedComplaint } from "../../services/workerApi";

import {
  complaintNeedsAttention,
  complaintProgress,
  filterComplaints,
  isComplaintComplete,
} from "./complaintPresentation";

function complaint(status: CaseStatus, overdue = false): TrackedComplaint {
  const timestamp = "2026-10-20T00:00:00.000Z";
  return {
    draftId: "draft-1",
    referenceNumber: "KP-TEST",
    status,
    categoryCode: "WAG",
    priority: "Standard",
    privacyMode: "ANON",
    submittedAt: timestamp,
    updatedAt: timestamp,
    dueAt: timestamp,
    overdue,
    version: 1,
    location: { province: "Punjab", district: "Lahore" },
    incident: {
      whenLabel: "Today",
      currentDanger: false,
      immediateDanger: false,
      othersAffected: "individual",
      structuredAnswers: {},
    },
    evidence: [] as TrackedComplaint["evidence"],
    actions: [],
  };
}

describe("complaint presentation", () => {
  it("groups worker attention, active and completed cases", () => {
    const cases = [complaint("Investigation", true), complaint("Action in Progress"), complaint("Closed")];

    expect(filterComplaints(cases, "attention")).toHaveLength(1);
    expect(filterComplaints(cases, "active")).toHaveLength(2);
    expect(filterComplaints(cases, "complete")).toHaveLength(1);
    expect(complaintNeedsAttention(cases[0])).toBe(true);
    expect(isComplaintComplete(cases[2])).toBe(true);
  });

  it("maps complaint history onto simplified worker stages", () => {
    expect(complaintProgress(complaint("Received"))).toBe(0);
    expect(complaintProgress(complaint("Closed"))).toBe(3);
  });
});
