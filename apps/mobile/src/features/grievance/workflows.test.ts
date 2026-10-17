import { dictionaries } from "@kapas/localization";
import { describe, expect, it } from "vitest";

import { allWorkflowNodes } from "./workflows";

describe("grievance locale keys", () => {
  it("has every workflow prompt and option in both catalogs", () => {
    const keys = new Set<string>();
    for (const node of allWorkflowNodes) {
      keys.add(node.promptKey);
      if (node.helperKey) {
        keys.add(node.helperKey);
      }
      for (const option of node.options ?? []) {
        keys.add(option.labelKey);
      }
    }
    const en = new Set(Object.keys(dictionaries.en));
    const ur = new Set(Object.keys(dictionaries.ur));
    const missingEn = [...keys].filter((key) => !en.has(key));
    const missingUr = [...keys].filter((key) => !ur.has(key));
    expect(missingEn).toEqual([]);
    expect(missingUr).toEqual([]);
  });
});
