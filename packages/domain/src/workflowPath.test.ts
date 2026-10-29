import { describe, expect, it } from "vitest";

import { CATEGORY_ENTRY, REVIEW_NODE_ID } from "./workflow";
import { categoryDetailNodeIds, walkWorkflowPath } from "./workflowPath";

describe("workflowPath", () => {
  it("orders pesticide detail nodes before voice", () => {
    const ids = categoryDetailNodeIds("PES", {
      category: "PES",
      "pes-what": "spray",
      "pes-sym": ["breath"],
      "pes-med": "no",
      "pes-nearby": ["workers"],
    });
    expect(ids).toEqual(["pes-what", "pes-sym", "pes-med", "pes-nearby"]);
  });

  it("walks anonymous reporters from evidence to review", () => {
    expect(walkWorkflowPath("evidence", { privacy: "ANON" })).toEqual(["evidence", REVIEW_NODE_ID]);
  });

  it("maps every category to a detail entry node", () => {
    for (const category of Object.keys(CATEGORY_ENTRY)) {
      expect(CATEGORY_ENTRY[category as keyof typeof CATEGORY_ENTRY]).toMatch(/-/);
    }
  });
});
