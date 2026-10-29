import { describe, expect, it } from "vitest";

import { canTransitionAttachment } from "./complaintV3StateMachine";

describe("V3 attachment delivery state machine", () => {
  it.each([
    ["staged", "pending_allocation"],
    ["pending_allocation", "allocated"],
    ["allocated", "uploading"],
    ["uploading", "server_processing"],
    ["server_processing", "available"],
    ["action_required", "omitted"],
  ] as const)("allows %s -> %s", (from, to) => {
    expect(canTransitionAttachment(from, to)).toBe(true);
  });

  it.each([
    ["available", "uploading"],
    ["omitted", "pending_allocation"],
    ["staged", "available"],
    ["action_required", "uploading"],
  ] as const)("rejects %s -> %s", (from, to) => {
    expect(canTransitionAttachment(from, to)).toBe(false);
  });
});
