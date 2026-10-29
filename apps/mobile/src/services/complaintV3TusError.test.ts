import { describe, expect, it } from "vitest";

import { classifyTusError } from "./complaintV3TusError";

const failure = (status: number, body = "") => ({
  originalResponse: { getStatus: () => status, getBody: () => body },
});

describe("classifyTusError", () => {
  it.each([404, 410])("reallocates an absent upload (%s)", (status) => {
    expect(classifyTusError(failure(status))).toEqual({
      code: "upload_grant_expired",
      retryable: false,
    });
  });

  it("reallocates a server-rejected grant", () => {
    expect(
      classifyTusError(failure(403, JSON.stringify({ code: "upload_authorization_invalid" }))),
    ).toEqual({
      code: "upload_grant_expired",
      retryable: false,
    });
  });

  it("reconciles offset conflicts on a later pass", () => {
    expect(classifyTusError(failure(409))).toEqual({
      code: "upload_offset_conflict",
      retryable: true,
    });
  });

  it("maps truncated file reads to media_unavailable", () => {
    expect(
      classifyTusError(
        new Error(
          "upload was configured with a size of 2069701 bytes, but the source is done after 1048576 bytes",
        ),
      ),
    ).toEqual({ code: "media_unavailable", retryable: false });
  });

  it("does not endlessly retry permanent rejections", () => {
    expect(
      classifyTusError(failure(400, JSON.stringify({ code: "upload_metadata_mismatch" }))),
    ).toEqual({
      code: "upload_metadata_mismatch",
      retryable: false,
    });
  });
});
