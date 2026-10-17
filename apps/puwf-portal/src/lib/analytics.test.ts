import { describe, expect, it } from "vitest";

import { formatHours, formatRate, toAnalyticsFilters, emptyAnalyticsFilters, privacySafeRows } from "./analytics";

describe("analytics display helpers", () => {
  it("omits empty filter values", () => {
    expect(toAnalyticsFilters(emptyAnalyticsFilters())).toEqual({
      category: undefined,
      status: undefined,
      priority: undefined,
      province: undefined,
      privacyMode: undefined,
      gender: undefined,
      from: undefined,
      to: undefined,
    });
    expect(toAnalyticsFilters({ ...emptyAnalyticsFilters(), gender: "Female", category: "WAG" })).toEqual({
      category: ["WAG"],
      status: undefined,
      priority: undefined,
      province: undefined,
      privacyMode: undefined,
      gender: ["Female"],
      from: undefined,
      to: undefined,
    });
  });

  it("formats rates and hours without inventing totals", () => {
    expect(formatRate(12.4, "n/a", "%")).toBe("12%");
    expect(formatRate(null, "n/a", "%")).toBe("n/a");
    expect(formatHours(24.16, "n/a", "h")).toBe("24.2 h");
    expect(formatHours(null, "n/a", "h")).toBe("n/a");
  });

  it("groups small sensitive segments without exposing their labels", () => {
    expect(privacySafeRows([{ key: "Punjab", count: 5 }, { key: "Sindh", count: 2 }, { key: "Balochistan", count: 1 }])).toEqual([{ key: "Punjab", count: 5 }, { key: "suppressed", count: 3 }]);
  });
});
