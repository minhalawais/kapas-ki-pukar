export type RetryDisposition = "retry" | "discard";

const permanentErrorCodes = new Set([
  "invalid_job_payload",
  "unsupported_job_version",
  "authorization_denied",
]);

export function classifyRetry(error: unknown): RetryDisposition {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = String(error.code);
    if (permanentErrorCodes.has(code)) {
      return "discard";
    }
  }
  return "retry";
}
