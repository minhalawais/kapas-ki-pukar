import { describe, expect, it } from "vitest";

import { classifyRetry } from "./retry";

describe("worker retry classification", () => {
  it("does not retry permanent validation/version failures", () => {
    expect(classifyRetry({ code: "invalid_job_payload" })).toBe("discard");
    expect(classifyRetry({ code: "unsupported_job_version" })).toBe("discard");
  });

  it("retries unknown and transient failures", () => {
    expect(classifyRetry(new Error("connection reset"))).toBe("retry");
    expect(classifyRetry({ code: "dependency_unavailable" })).toBe("retry");
  });
});
