import { describe, expect, it } from "vitest";

import {
  directionalRow,
  iconScaleX,
  isolateComplaintId,
  isolateLtr,
  isRTL,
  shouldMirrorIcon,
} from "./rtl";

describe("rtl helpers", () => {
  it("marks Urdu as RTL and English as LTR", () => {
    expect(isRTL("ur")).toBe(true);
    expect(isRTL("en")).toBe(false);
    expect(directionalRow("ur")).toBe("row");
  });

  it("mirrors directional chevrons and leaves microphone unmirrored", () => {
    expect(shouldMirrorIcon("chevron-back")).toBe(true);
    expect(shouldMirrorIcon("microphone")).toBe(false);
    expect(iconScaleX("chevron-back", "ur")).toBe(-1);
    expect(iconScaleX("microphone", "ur")).toBe(1);
    expect(shouldMirrorIcon("kapas-mark")).toBe(false);
    expect(iconScaleX("kapas-mark", "ur")).toBe(1);
    expect(iconScaleX("chevron-back", "en")).toBe(1);
  });

  it("isolates complaint IDs as LTR", () => {
    expect(isolateLtr("KP-26-000101")).toBe("\u2066KP-26-000101\u2069");
    expect(isolateComplaintId("KP-26-000101")).toBe("\u2066KP-26-000101\u2069");
    expect(isolateComplaintId("not-an-id")).toBe("not-an-id");
  });
});
