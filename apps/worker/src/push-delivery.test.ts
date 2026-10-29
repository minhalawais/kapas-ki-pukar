import { describe, expect, it, vi } from "vitest";

import type { NotificationAdapter } from "./notification";
import { deliverComplaintPushNotifications } from "./push-delivery";

describe("deliverComplaintPushNotifications", () => {
  it("sends to each active registration and records deliveries", async () => {
    const send = vi.fn(async () => ({ state: "accepted" as const, providerMessageId: "t1" }));
    const adapter: NotificationAdapter = { send, reconcile: async () => ({}) };
    const create = vi.fn(async () => ({}));
    const database = {
      workerPushRegistration: {
        findMany: vi.fn(async () => [
          {
            id: "reg-1",
            expoPushToken: "ExpoPushToken[a]",
            locale: "ur",
          },
        ]),
      },
      reporter: {
        findUnique: vi.fn(async () => ({ contactAllowed: true, preferredLanguage: "ur-PK" })),
      },
      notificationDelivery: {
        findFirst: vi.fn(async () => null),
        create,
      },
    } as unknown as Parameters<typeof deliverComplaintPushNotifications>[0];

    await deliverComplaintPushNotifications(database, adapter, {
      eventId: "evt-1",
      complaintId: "cmp-1",
      payload: { auditAction: "case.closed", actionType: "Complaint Closed" },
    });

    expect(send).toHaveBeenCalledOnce();
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        destinationRef: "ExpoPushToken[a]",
        locale: "ur",
      }),
    );
    expect(create).toHaveBeenCalledOnce();
  });

  it("skips when no registrations exist", async () => {
    const send = vi.fn();
    const adapter: NotificationAdapter = { send, reconcile: async () => ({}) };
    const database = {
      workerPushRegistration: { findMany: vi.fn(async () => []) },
      reporter: { findUnique: vi.fn() },
      notificationDelivery: { findFirst: vi.fn(), create: vi.fn() },
    } as unknown as Parameters<typeof deliverComplaintPushNotifications>[0];

    await deliverComplaintPushNotifications(database, adapter, {
      eventId: "evt-2",
      complaintId: "cmp-2",
      payload: {},
    });

    expect(send).not.toHaveBeenCalled();
  });
});
