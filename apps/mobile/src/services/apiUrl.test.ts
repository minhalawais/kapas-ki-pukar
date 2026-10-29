import { afterEach, describe, expect, it, vi } from "vitest";

import { getApiUrl } from "./apiUrl";

describe("getApiUrl", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("uses the explicitly configured HTTP endpoint and removes a trailing slash", () => {
    vi.stubEnv("EXPO_PUBLIC_API_URL", "http://192.168.1.28:4000/");
    expect(getApiUrl()).toBe("http://192.168.1.28:4000");
  });

  it("fails clearly instead of silently targeting the physical device", () => {
    vi.stubEnv("EXPO_PUBLIC_API_URL", "");
    expect(getApiUrl).toThrow(/apps\/mobile\/\.env\.local/u);
  });

  it("rejects non-HTTP endpoints", () => {
    vi.stubEnv("EXPO_PUBLIC_API_URL", "file:///tmp/api");
    expect(getApiUrl).toThrow(/valid HTTP\(S\) URL/u);
  });
});
