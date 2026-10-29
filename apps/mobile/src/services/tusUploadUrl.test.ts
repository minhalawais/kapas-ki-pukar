import { afterEach, describe, expect, it, vi } from "vitest";

import { getMobileTusFilesEndpoint, resolveTusUploadUrl } from "./tusUploadUrl";

describe("tusUploadUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("derives /files/ from EXPO_PUBLIC_API_URL", () => {
    vi.stubEnv("EXPO_PUBLIC_API_URL", "http://192.168.1.7:4000");
    expect(getMobileTusFilesEndpoint()).toBe("http://192.168.1.7:4000/files/");
  });

  it("honours EXPO_PUBLIC_TUSD_URL override", () => {
    vi.stubEnv("EXPO_PUBLIC_API_URL", "http://192.168.1.7:4000");
    vi.stubEnv("EXPO_PUBLIC_TUSD_URL", "http://127.0.0.1:1080/files/");
    expect(getMobileTusFilesEndpoint()).toBe("http://127.0.0.1:1080/files/");
  });

  it("rewrites legacy :1080 grant URLs to the API host", () => {
    vi.stubEnv("EXPO_PUBLIC_API_URL", "http://192.168.1.7:4000");
    expect(
      resolveTusUploadUrl("http://192.168.1.7:1080/files/"),
    ).toBe("http://192.168.1.7:4000/files/");
    expect(
      resolveTusUploadUrl("http://192.168.1.7:1080/files/665951d8-c180-4181-b8e5-255c803b09bf"),
    ).toBe("http://192.168.1.7:4000/files/665951d8-c180-4181-b8e5-255c803b09bf");
  });
});
