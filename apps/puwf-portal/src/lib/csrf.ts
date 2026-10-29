/** Reads the non-HttpOnly CSRF cookie set at staff login (required on cookie-authenticated mutations). */
export function readStaffCsrfToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = /(?:^|;\s*)kapas_csrf=([^;]*)/.exec(document.cookie);
  if (!match?.[1]) return undefined;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

export function staffMutationHeaders(
  extra?: HeadersInit,
): Record<string, string> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    ...(extra instanceof Headers
      ? Object.fromEntries(extra.entries())
      : Array.isArray(extra)
        ? Object.fromEntries(extra)
        : (extra ?? {})),
  };
  const csrf = readStaffCsrfToken();
  if (csrf) headers["x-csrf-token"] = csrf;
  return headers;
}

/** Multipart staff uploads (browser sets Content-Type with boundary). */
export function staffFormHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const csrf = readStaffCsrfToken();
  if (csrf) headers["x-csrf-token"] = csrf;
  return headers;
}
