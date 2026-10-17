import { describe, expect, it } from "vitest";

import { assertSafeDestructiveEnvironment, redactUnknown } from "./index";

describe("security helpers", () => {
  it("redacts sensitive nested properties", () => {
    expect(
      redactUnknown({
        actorId: "staff-1",
        authorization: "Bearer secret",
        nested: { phone: "0300" },
      }),
    ).toEqual({ actorId: "staff-1", authorization: "[REDACTED]", nested: { phone: "[REDACTED]" } });
  });

  it("allows reset only for non-production test databases", () => {
    expect(() =>
      assertSafeDestructiveEnvironment("test", "postgresql://user:pass@localhost:5432/kapas_test"),
    ).not.toThrow();
    expect(() =>
      assertSafeDestructiveEnvironment(
        "development",
        "postgresql://user:pass@localhost:5432/kapas_local",
      ),
    ).toThrow(/ending in _test/);
    expect(() =>
      assertSafeDestructiveEnvironment(
        "production",
        "postgresql://user:pass@localhost:5432/kapas_test",
      ),
    ).toThrow(/disabled in production/);
  });
});
