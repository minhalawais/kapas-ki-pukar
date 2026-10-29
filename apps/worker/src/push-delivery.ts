import type { DatabaseClient } from "@kapas/database";
import { pushDeliveryPermitted, resolveNotificationLocale } from "@kapas/domain";

import type { NotificationAdapter, NotificationRequest, NotificationResult } from "./notification";
import { neutralNotificationTemplate } from "./notification";

export interface PushDeliveryInput {
  readonly eventId: string;
  readonly complaintId: string;
  readonly payload: Record<string, unknown>;
}

export async function deliverComplaintPushNotifications(
  database: DatabaseClient,
  adapter: NotificationAdapter,
  input: PushDeliveryInput,
): Promise<void> {
  const registrations = await database.workerPushRegistration.findMany({
    where: { complaintId: input.complaintId, revokedAt: null },
    orderBy: { lastSeenAt: "desc" },
    take: 10,
  });
  if (!pushDeliveryPermitted({ activeRegistrationCount: registrations.length })) return;

  const reporter = await database.reporter.findUnique({
    where: { complaintId: input.complaintId },
    select: { contactAllowed: true, preferredLanguage: true },
  });

  const templateId =
    typeof input.payload.templateId === "string" ? input.payload.templateId : "case-update";
  const reason =
    typeof input.payload.reason === "string"
      ? input.payload.reason.slice(0, 120)
      : typeof input.payload.auditAction === "string"
        ? input.payload.auditAction.slice(0, 120)
        : "case-update";

  const explicitDestination =
    typeof input.payload.destinationRef === "string" ? input.payload.destinationRef : undefined;

  const targets = explicitDestination
    ? [{ expoPushToken: explicitDestination, locale: "en" as string }]
    : registrations.map((row) => ({
        expoPushToken: row.expoPushToken,
        locale: row.locale,
        registrationId: row.id,
      }));

  for (const target of targets) {
    const locale = resolveNotificationLocale(
      reporter?.preferredLanguage,
      "locale" in target ? target.locale : "en",
    );
    const deliveryEventId =
      "registrationId" in target && target.registrationId
        ? `${input.eventId}:${target.registrationId}`
        : input.eventId;
    const existing = await database.notificationDelivery.findFirst({
      where: { eventId: deliveryEventId },
    });
    if (existing) continue;

    const request: NotificationRequest = {
      channel: "push",
      templateId,
      templateVersion: "v1",
      locale,
      destinationRef: target.expoPushToken,
      reason,
      contactAllowed: true,
      safeChannel: true,
      optional: true,
    };
    const result = await adapter.send(request);
    await database.notificationDelivery.create({
      data: {
        complaintId: input.complaintId,
        eventId: deliveryEventId,
        templateId: request.templateId,
        templateVersion: request.templateVersion,
        locale: request.locale,
        channel: request.channel,
        destinationRef: request.destinationRef,
        reason: request.reason,
        state: result.state,
        providerMessageId: result.providerMessageId,
        attemptCount: 1,
        consentSnapshot: {
          contactAllowed: request.contactAllowed,
          safeChannel: request.safeChannel,
          optional: request.optional,
          registrationCount: registrations.length,
        },
      },
    });
  }
}

export function previewPushBody(templateId: string, locale: string): string {
  return neutralNotificationTemplate(templateId, locale);
}

export type { NotificationResult };
