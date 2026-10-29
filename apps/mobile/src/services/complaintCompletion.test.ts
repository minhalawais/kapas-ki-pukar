import { describe, expect, it } from "vitest";

import { complaintCompletionStatus } from "./complaintCompletion";

describe("complaint completion status", () => {
  it("does not report completion merely because intake returned a reference", () => {
    expect(complaintCompletionStatus("KP-1", false, [{ state: "processing" }])).toBe("evidence_pending");
  });

  it("completes only when every retained attachment is available", () => {
    expect(complaintCompletionStatus("KP-1", false, [{ state: "uploaded" }, { state: "uploaded" }])).toBe("completed");
    expect(complaintCompletionStatus("KP-1", false, [])).toBe("completed");
  });

  it("surfaces rejected or blocked delivery as action required", () => {
    expect(complaintCompletionStatus("KP-1", false, [{ state: "rejected" }])).toBe("action_required");
    expect(complaintCompletionStatus(undefined, true, [])).toBe("action_required");
  });
});
