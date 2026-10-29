import { describe, expect, it } from "vitest";

import { staffDocumentMimeCheck } from "./staff-case-evidence.mime";

describe("staff corrective document mime check", () => {
  it("accepts pdf and jpeg signatures", () => {
    const pdf = Buffer.from("%PDF-1.4\n%test");
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0x00, 0x00]);
    expect(staffDocumentMimeCheck("report.pdf", "application/pdf", pdf)).toEqual({
      kind: "document",
      mime: "application/pdf",
    });
    expect(staffDocumentMimeCheck("photo.jpg", "image/jpeg", jpeg)).toEqual({
      kind: "photo",
      mime: "image/jpeg",
    });
  });

  it("rejects empty and eicar payloads", () => {
    expect(() => staffDocumentMimeCheck("x.pdf", "application/pdf", Buffer.alloc(0))).toThrow();
    expect(() =>
      staffDocumentMimeCheck(
        "x.pdf",
        "application/pdf",
        Buffer.from("EICAR-STANDARD-ANTIVIRUS-TEST-FILE"),
      ),
    ).toThrow();
  });
});
