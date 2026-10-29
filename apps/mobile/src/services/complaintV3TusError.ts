type TusHttpResponse = {
  getStatus(): number;
  getBody(): string;
};

export function classifyTusError(error: unknown): { code: string; retryable: boolean } {
  const message = error instanceof Error ? error.message : String(error);
  if (/source is done after/u.test(message)) {
    return { code: "media_unavailable", retryable: false };
  }
  const response = (error as { originalResponse?: TusHttpResponse | null } | null)
    ?.originalResponse;
  const status = response?.getStatus() ?? 0;
  let serverCode: string | undefined;
  try {
    serverCode = JSON.parse(response?.getBody() ?? "")?.code as string | undefined;
  } catch {
    serverCode = undefined;
  }

  // An absent upload and an invalid grant both require a fresh allocation.
  // Reallocation is idempotent and also repairs a locally corrupted token.
  if (status === 404 || status === 410 || serverCode === "upload_authorization_invalid") {
    return { code: "upload_grant_expired", retryable: false };
  }
  if (status === 409) return { code: "upload_offset_conflict", retryable: true };
  if (status === 0 || status === 408 || status === 429 || status >= 500) {
    return { code: "network_unavailable", retryable: true };
  }
  return { code: serverCode ?? "upload_rejected", retryable: false };
}
