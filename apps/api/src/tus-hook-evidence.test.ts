import { describe, expect, it } from "vitest";

import {
  postFinishLengthMatches,
  postReceiveShouldMutateStatus,
  postReceiveUpdateWhere,
} from "./tus-hook-evidence";

describe("tus-hook-evidence", () => {
  it("post-receive filter only touches declared/uploading rows", () => {
    expect(postReceiveUpdateWhere("ev-1", 9088n)).toEqual({
      id: "ev-1",
      uploadedBytes: { lte: 9088n },
      status: { in: ["declared", "uploading"] },
    });
    expect(postReceiveShouldMutateStatus("uploading")).toBe(true);
    expect(postReceiveShouldMutateStatus("declared")).toBe(true);
    expect(postReceiveShouldMutateStatus("quarantined")).toBe(false);
    expect(postReceiveShouldMutateStatus("scanning")).toBe(false);
    expect(postReceiveShouldMutateStatus("available")).toBe(false);
  });

  it("post-finish compares upload offset to total bytes as BigInt", () => {
    expect(postFinishLengthMatches(9088, 9088n)).toBe(true);
    expect(postFinishLengthMatches(undefined, 0n)).toBe(true);
    expect(postFinishLengthMatches(9088, 9089n)).toBe(false);
  });
});
