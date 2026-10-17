import { describe, expect, it } from "vitest";

import { trackingIdSchema } from "./complaint.schema";

describe("trackingIdSchema", () => {
  it("accepts KP-26-######", () => {
    expect(trackingIdSchema.parse("KP-26-000001")).toBe("KP-26-000001");
    expect(() => trackingIdSchema.parse("KP-26-1")).toThrow();
  });
});
