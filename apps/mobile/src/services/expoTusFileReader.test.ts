import { describe, expect, it } from "vitest";

import { tusReadableChunk, tusSliceDone } from "./tusSliceLogic";

describe("tusSliceDone", () => {
  const fileSize = 2_069_701;

  it("is false after a full 1 MiB first chunk", () => {
    expect(tusSliceDone(0, 1_048_576, fileSize)).toBe(false);
  });

  it("is true after the final partial chunk", () => {
    expect(tusSliceDone(1_048_576, fileSize - 1_048_576, fileSize)).toBe(true);
  });

  it("is false when end index exceeds size but bytes were not read yet", () => {
    expect(tusSliceDone(1_048_576, 0, fileSize)).toBe(false);
  });
});

describe("tusReadableChunk", () => {
  it("exposes tus-js-client size from byteLength", () => {
    const chunk = tusReadableChunk(new Uint8Array(146_081));
    expect(chunk.byteLength).toBe(146_081);
    expect(chunk.size).toBe(146_081);
  });
});
