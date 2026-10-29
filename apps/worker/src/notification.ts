export type NotificationChannel = "push";

export interface NotificationRequest {
  readonly channel: NotificationChannel;
  readonly templateId: string;
  readonly templateVersion: string;
  readonly locale: string;
  readonly destinationRef?: string;
  readonly reason: string;
  readonly contactAllowed: boolean;
  readonly safeChannel: boolean;
  readonly optional: boolean;
}

export interface NotificationResult {
  readonly state: "accepted" | "unknown";
  readonly providerMessageId?: string;
}

export interface NotificationAdapter {
  send(request: NotificationRequest): Promise<NotificationResult>;
  reconcile(
    ids: readonly string[],
  ): Promise<Readonly<Record<string, "delivered" | "failed" | "unknown">>>;
}

/** Safe local adapter. It records intent without sending live messages. */
export class DisabledNotificationAdapter implements NotificationAdapter {
  async send(request: NotificationRequest): Promise<NotificationResult> {
    if (!request.contactAllowed || !request.safeChannel || !request.destinationRef) {
      return { state: "unknown" };
    }
    return { state: "unknown" };
  }

  async reconcile(
    _ids: readonly string[],
  ): Promise<Readonly<Record<string, "delivered" | "failed" | "unknown">>> {
    return {};
  }
}

export interface ExpoPushAdapterOptions {
  readonly enabled: boolean;
  readonly accessToken?: string;
  readonly endpoint?: string;
}

export class ExpoPushNotificationAdapter implements NotificationAdapter {
  private readonly endpoint: string;

  public constructor(private readonly options: ExpoPushAdapterOptions) {
    this.endpoint = options.endpoint ?? "https://exp.host/--/api/v2/push/send";
  }

  async send(request: NotificationRequest): Promise<NotificationResult> {
    if (
      !this.options.enabled ||
      !request.contactAllowed ||
      !request.safeChannel ||
      !request.destinationRef
    )
      return { state: "unknown" };
    if (!request.destinationRef.startsWith("ExpoPushToken[")) return { state: "unknown" };
    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        ...(this.options.accessToken
          ? { Authorization: `Bearer ${this.options.accessToken}` }
          : {}),
      },
      body: JSON.stringify({
        to: request.destinationRef,
        title: request.locale.toLowerCase().startsWith("ur") ? "محفوظ کیس" : "Secure case",
        body: neutralNotificationTemplate(request.templateId, request.locale),
        data: { reason: request.reason },
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return { state: "unknown" };
    const result = (await response.json()) as { data?: { status?: string; id?: string } };
    if (result.data?.status !== "ok") return { state: "unknown" };
    return { state: "accepted", providerMessageId: result.data.id };
  }

  async reconcile(
    ids: readonly string[],
  ): Promise<Readonly<Record<string, "delivered" | "failed" | "unknown">>> {
    if (!this.options.enabled || ids.length === 0) return {};
    const response = await fetch("https://exp.host/--/api/v2/push/getReceipts", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        ...(this.options.accessToken
          ? { Authorization: `Bearer ${this.options.accessToken}` }
          : {}),
      },
      body: JSON.stringify({ ids: ids.slice(0, 100) }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return {};
    const result = (await response.json()) as { data?: Record<string, { status?: string }> };
    return Object.fromEntries(
      Object.entries(result.data ?? {}).map(([id, receipt]) => [
        id,
        receipt.status === "ok" ? "delivered" : receipt.status === "error" ? "failed" : "unknown",
      ]),
    );
  }
}

export function neutralNotificationTemplate(templateId: string, locale: string): string {
  void templateId;
  return locale.toLowerCase().startsWith("ur")
    ? "آپ کے محفوظ کیس میں نئی معلومات موجود ہیں۔ ٹریکنگ کوڈ کے ذریعے محفوظ پورٹل کھولیں۔"
    : "There is an update in your secure case. Open the secure portal with your tracking code.";
}
