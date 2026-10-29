export const QUEUES = {
  media: "media-processing",
  ai: "ai-processing",
  notifications: "notifications",
  exports: "exports",
  maintenance: "maintenance",
} as const;

export const EVENT_TO_QUEUE: Readonly<Record<string, keyof typeof QUEUES>> = {
  "complaint.submitted.v1": "media",
  "complaint.created": "media",
  "evidence.scan.requested.v1": "media",
  "evidence.scan.requested.v3": "media",
  "ai.voice-enrichment.requested.v3": "ai",
  "evidence.attached": "media",
  "ai.analysis.requested.v1": "ai",
  "worker.notification.requested.v1": "notifications",
  "case.information-requested.v1": "notifications",
  "case.resolution-proposed.v1": "notifications",
  "case.status-changed.v1": "notifications",
  "worker.information_received": "notifications",
  "export.requested.v1": "exports",
  "retention.review-due.v1": "maintenance",
  "storage.integrity-check.requested.v1": "maintenance",
};

export function queueForEvent(eventType: string): string {
  const key = EVENT_TO_QUEUE[eventType];
  return key ? QUEUES[key] : QUEUES.maintenance;
}
