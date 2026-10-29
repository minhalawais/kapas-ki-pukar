function normalizeFilesEndpoint(value: string): string {
  const trimmed = value.trim().replace(/\/$/u, "");
  return trimmed.endsWith("/files") ? `${trimmed}/` : `${trimmed}/files/`;
}

function configuredApiUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/$/u, "");
  if (!configured) {
    throw Object.assign(
      new Error("EXPO_PUBLIC_API_URL is required; set it in apps/mobile/.env.local and restart Expo"),
      { code: "api_configuration_invalid" },
    );
  }
  return configured;
}

/** TUS endpoint the device should use for v3 evidence uploads. */
export function getMobileTusFilesEndpoint(): string {
  const override = process.env.EXPO_PUBLIC_TUSD_URL?.trim();
  if (override) return normalizeFilesEndpoint(override);
  return normalizeFilesEndpoint(configuredApiUrl());
}

/** Align grant/resume URLs with the mobile API host (avoids stale :1080 grants). */
export function resolveTusUploadUrl(grantUrl: string): string {
  const preferredBase = new URL(getMobileTusFilesEndpoint());
  try {
    const current = new URL(grantUrl);
    if (!current.pathname.startsWith("/files")) return grantUrl;
    return new URL(`${current.pathname}${current.search}${current.hash}`, preferredBase).toString();
  } catch {
    return getMobileTusFilesEndpoint();
  }
}
