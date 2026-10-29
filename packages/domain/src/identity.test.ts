import { describe, expect, it } from "vitest";

import { normalizePakistanCnic, normalizePakistanPhone } from "./identity";

describe("Pakistan identity normalization", () => {
  it.each([
    ["0300-1234567", "+923001234567"],
    ["+92 300 1234567", "+923001234567"],
    ["0092-300-1234567", "+923001234567"],
  ])("canonicalizes %s", (input, expected) => {
    expect(normalizePakistanPhone(input)).toBe(expected);
  });

  it.each(["3001234567", "04001234567", "0300123456", "030012345678"])(
    "rejects invalid mobile %s",
    (input) => {
      expect(() => normalizePakistanPhone(input)).toThrow("invalid_phone");
    },
  );

  it("normalizes a formatted CNIC", () => {
    expect(normalizePakistanCnic("35202-1234567-1")).toBe("3520212345671");
  });

  it.each(["35202-1234567", "35202123456712", "not-a-cnic"])("rejects invalid CNIC %s", (input) => {
    expect(() => normalizePakistanCnic(input)).toThrow("invalid_cnic");
  });
});
