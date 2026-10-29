import { createHash } from "node:crypto";

import { isValidExpoPushToken } from "@kapas/domain";

export function expoPushTokenFingerprint(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function parseWorkerPushRegistrationBody(body: unknown):
  | {
      expoPushToken: string;
      platform: "ios" | "android" | "web";
      locale?: string;
      deviceInstallId?: string;
      requestId: string;
    }
  | { error: string } {
  if (!body || typeof body !== "object") return { error: "body is required" };
  const record = body as Record<string, unknown>;
  const expoPushToken = typeof record.expoPushToken === "string" ? record.expoPushToken.trim() : "";
  const platform = record.platform;
  const requestId = typeof record.requestId === "string" ? record.requestId.trim() : "";
  if (!isValidExpoPushToken(expoPushToken)) return { error: "expoPushToken is invalid" };
  if (platform !== "ios" && platform !== "android" && platform !== "web")
    return { error: "platform is invalid" };
  if (!requestId || requestId.length > 120) return { error: "requestId is required" };
  const locale =
    typeof record.locale === "string" && record.locale.length <= 12 ? record.locale : undefined;
  const deviceInstallId =
    typeof record.deviceInstallId === "string" && record.deviceInstallId.length <= 64
      ? record.deviceInstallId
      : undefined;
  return { expoPushToken, platform, locale, deviceInstallId, requestId };
}
