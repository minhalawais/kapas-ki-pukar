import { describe, expect, it } from "vitest";

import { semanticColors, chartSeriesOrder, controlSize, layout } from "./index";

describe("design tokens", () => {
  it("exposes semantic aliases rather than requiring raw brand hex in UI", () => {
    expect(semanticColors.pageWorker).toBe("#F7F3E8");
    expect(semanticColors.pageAdmin).toBe("#F4F6F4");
    expect(semanticColors.institutionalAnchor).toBe("#004027");
    expect(semanticColors.actionPrimary).toBe("#0B5D3B");
    expect(semanticColors.voiceActive).toBe("#2D9480");
  });

  it("keeps a mixed chart series order", () => {
    expect(chartSeriesOrder).toHaveLength(6);
    expect(chartSeriesOrder[0]).toBe("#2D9480");
    expect(chartSeriesOrder[1]).toBe("#E5A62E");
  });

  it("keeps mobile and portal control sizes from the design spec", () => {
    expect(controlSize.mobileCtaHeight).toBe(56);
    expect(controlSize.webButtonHeight).toBe(36);
    expect(layout.webSidebarWidth).toBe(232);
  });
});
