import { getMobileTusFilesEndpoint } from "./tusUploadUrl";

/** Resolve the API endpoint supplied at Expo build/start time. Physical devices
 * must receive the developer machine LAN address or a deployed HTTPS URL. */
export function getApiUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/$/u, "");
  if (!configured) {
    throw Object.assign(
      new Error("EXPO_PUBLIC_API_URL is required; set it in apps/mobile/.env.local and restart Expo"),
      { code: "api_configuration_invalid" },
    );
  }

  try {
    const url = new URL(configured);
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("unsupported protocol");
    return url.toString().replace(/\/$/u, "");
  } catch {
    throw Object.assign(new Error("EXPO_PUBLIC_API_URL must be a valid HTTP(S) URL"), {
      code: "api_configuration_invalid",
    });
  }
}

export async function assertApiReady(timeoutMs = 5_000): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${getApiUrl()}/api/v1/health/ready`, { signal: controller.signal });
    if (!response.ok) throw Object.assign(new Error("API dependencies are unavailable"), { code: "network_unavailable" });
    const tusResponse = await fetch(getMobileTusFilesEndpoint(), {
      method: "HEAD",
      signal: controller.signal,
    });
    if (tusResponse.status >= 500) {
      throw Object.assign(new Error("Evidence upload endpoint is unavailable"), { code: "network_unavailable" });
    }
  } catch (error) {
    if ((error as { code?: string }).code === "api_configuration_invalid") throw error;
    throw Object.assign(new Error("API is unreachable"), { code: "network_unavailable", cause: error });
  } finally {
    clearTimeout(timer);
  }
}
