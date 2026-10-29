import { describe, expect, it } from "vitest";

import { buildAnalyticsSnapshot, parseAnalyticsQuery, type AnalyticsRows } from "./analytics";

const row = (overrides: Partial<AnalyticsRows> = {}): AnalyticsRows => ({
  id: crypto.randomUUID(),
  categoryCode: "wages",
  subcategoryCode: "unpaid",
  status: "Closed",
  priority: "Standard",
  privacyMode: "ANON",
  submittedAt: new Date("2026-01-01T00:00:00Z"),
  dueAt: new Date("2026-01-02T00:00:00Z"),
  location: { province: "Punjab", district: "Lahore" },
  history: [
    { actionType: "Triage Completed", occurredAt: new Date("2026-01-01T01:00:00Z") },
    { actionType: "Complaint Closed", occurredAt: new Date("2026-01-02T00:00:00Z") },
  ],
  feedback: [{ outcome: "satisfied" }],
  aiRuns: [],
  ...overrides,
});

describe("analytics governance", () => {
  it("bounds the default and explicit date interval", () => {
    const parsed = parseAnalyticsQuery({ from: "2026-01-01", to: "2026-01-10" });
    expect(parsed.fromDate.toISOString()).toContain("2026-01-01");
    expect(() => parseAnalyticsQuery({ from: "2024-01-01", to: "2026-01-01" })).toThrow(/366/);
  });

  it("reconciles totals and suppresses small breakdown cells", () => {
    const snapshot = buildAnalyticsSnapshot([
      row(),
      row({ status: "Received" }),
      row({ status: "Received" }),
      row({ status: "Received" }),
    ]);
    expect(snapshot.total).toBe(4);
    expect(snapshot.openCount).toBe(3);
    expect(snapshot.resolvedCount).toBe(1);
    expect(snapshot.byCategory).toEqual([{ key: "wages", count: 4 }]);
    expect(snapshot.byProvince).toEqual([{ key: "Punjab", count: 4 }]);
  });
});
