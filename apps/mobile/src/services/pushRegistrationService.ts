import * as SecureStore from "expo-secure-store";

import { getApiUrl } from "./apiUrl";
import { productionSyncService } from "./productionSyncService";

const SECRET_PREFIX = "kapas.tracking-secret.";

async function createWorkerSession(referenceNumber: string, secret: string): Promise<string> {
  const response = await fetch(`${getApiUrl()}/api/v1/worker-sessions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ referenceNumber, trackingSecret: secret }),
  });
  if (!response.ok) throw new Error("worker_authentication_failed");
  const body = (await response.json()) as { sessionToken?: string };
  if (!body.sessionToken) throw new Error("worker_session_missing");
  return body.sessionToken;
}

export async function registerPushForReference(referenceNumber: string): Promise<boolean> {
  const secret = await SecureStore.getItemAsync(`${SECRET_PREFIX}${referenceNumber}`);
  if (!secret) return false;
  let payload: Awaited<
    ReturnType<(typeof import("./expoPushService"))["pushRegistrationPayload"]>
  > | null;
  try {
    const { pushRegistrationPayload } = await import("./expoPushService");
    payload = await pushRegistrationPayload();
  } catch {
    return false;
  }
  if (!payload) return false;
  if (!payload) return false;
  const sessionToken = await createWorkerSession(referenceNumber, secret);
  const response = await fetch(
    `${getApiUrl()}/api/v1/worker/complaints/${encodeURIComponent(referenceNumber)}/push-token`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify(payload),
    },
  );
  return response.ok;
}

export async function syncPushRegistrationsForRegistry(): Promise<void> {
  const registry = await productionSyncService.listRegistry();
  await Promise.allSettled(registry.map((entry) => registerPushForReference(entry.referenceNumber)));
}
