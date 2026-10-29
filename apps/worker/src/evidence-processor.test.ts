import { describe, expect, it } from "vitest";

import { detectMime } from "./evidence-processor";

describe("evidence content detection", () => {
  it.each([
    ["document", "application/pdf", Buffer.from("%PDF-1.7")],
    ["photo", "image/jpeg", Buffer.from([0xff, 0xd8, 0xff, 0xe0])],
    ["photo", "image/png", Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
    ["voice", "audio/mp4", Buffer.from([0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70])],
    ["voice", "audio/wav", Buffer.from("RIFF0000WAVE")],
    ["voice", "audio/ogg", Buffer.from("OggS")],
    ["voice", "audio/mpeg", Buffer.from("ID3")],
    ["voice", "audio/webm", Buffer.from([0x1a, 0x45, 0xdf, 0xa3])],
  ] as const)("detects %s content as %s", (kind, expected, bytes) => {
    expect(detectMime(kind, bytes, expected)).toBe(expected);
  });

  it("does not trust a declared audio MIME type without a supported signature", () => {
    expect(detectMime("voice", Buffer.from("MZ executable"), "audio/mp4")).toBeNull();
  });
});
