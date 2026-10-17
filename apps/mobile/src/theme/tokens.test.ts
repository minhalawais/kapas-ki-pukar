import { describe, expect, it } from "vitest";

import { semanticColors } from "./tokens";

describe("mobile theme tokens", () => {
  it("consumes shared semantic aliases", () => {
    expect(semanticColors.pageWorker).toBe("#F7F3E8");
    expect(semanticColors.actionPrimary).toBe("#0B5D3B");
  });
});
