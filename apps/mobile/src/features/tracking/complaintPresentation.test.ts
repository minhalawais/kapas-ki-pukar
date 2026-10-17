import type { Complaint } from "@kapas/domain";
import { describe, expect, it } from "vitest";

import {
  complaintNeedsAttention,
  complaintProgress,
  filterComplaints,
  isComplaintComplete,
} from "./complaintPresentation";

function complaint(status: Complaint["status"], overdue = false): Complaint {
  return {
    status,
    overdue,
    incident: { currentDanger: false },
  } as Complaint;
}

describe("complaint presentation", () => {
  it("groups worker attention, active and completed cases", () => {
    const cases = [complaint("Under Review", true), complaint("Action in Progress"), complaint("Closed")];

    expect(filterComplaints(cases, "attention")).toHaveLength(1);
    expect(filterComplaints(cases, "active")).toHaveLength(2);
    expect(filterComplaints(cases, "complete")).toHaveLength(1);
    expect(complaintNeedsAttention(cases[0])).toBe(true);
    expect(isComplaintComplete(cases[2])).toBe(true);
  });

  it("maps every case phase onto the four worker-facing stages", () => {
    expect(complaintProgress("Submitted")).toBe(0);
    expect(complaintProgress("Under Review")).toBe(1);
    expect(complaintProgress("Action in Progress")).toBe(2);
    expect(complaintProgress("Resolved")).toBe(3);
  });
});
