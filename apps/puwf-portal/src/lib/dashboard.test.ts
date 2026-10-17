import { describe, expect, it } from "vitest";

import { emptyFilters, hasActiveFilters, toComplaintFilters } from "./dashboard";

describe("dashboard filters", () => {
  it("omits empty values from the service filter object", () => {
    expect(toComplaintFilters(emptyFilters())).toEqual({
      search: undefined,
      category: undefined,
      status: undefined,
      priority: undefined,
      province: undefined,
      privacyMode: undefined,
      from: undefined,
      to: undefined,
    });
    expect(hasActiveFilters(emptyFilters())).toBe(false);
    const next = { ...emptyFilters(), search: "KP-26", category: "WAG" as const };
    expect(hasActiveFilters(next)).toBe(true);
    expect(toComplaintFilters(next).search).toBe("KP-26");
    expect(toComplaintFilters(next).category).toEqual(["WAG"]);
  });
});
