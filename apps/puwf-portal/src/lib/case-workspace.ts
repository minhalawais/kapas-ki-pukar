import { getWorkflowNode, type CaseAction, type CaseActionType, type Complaint, type GroupImpact } from "@kapas/domain";
import type { MessageKey } from "@kapas/localization";

const EVENT_KEYS: Record<CaseActionType, MessageKey> = {
  "Triage Completed": "portal.case.event.reviewStarted",
  "Contact Attempted": "portal.case.event.contactAttempted",
  "Contact Successful": "portal.case.event.contactSuccessful",
  "Emergency Contact Override": "portal.case.event.contactAttempted",
  "Verified Fact Recorded": "portal.case.event.findingAdded",
  "Investigation Finding Recorded": "portal.case.event.findingAdded",
  "Action Planned": "portal.case.event.actionTaken",
  "Action Updated": "portal.case.event.actionTaken",
  "External Referral Recorded": "portal.case.event.referral",
  "Outcome Recorded": "portal.case.event.proposed",
  "Complaint Closed": "portal.case.event.closed",
  "Complaint Reopened": "portal.case.event.reopened",
  "Assignment Changed": "portal.case.event.noteAdded",
  "Complaint Received": "portal.case.event.received",
  "Review Started": "portal.case.event.reviewStarted",
  "Priority Changed": "portal.case.event.priorityChanged",
  "Internal Note Added": "portal.case.event.noteAdded",
  "Worker Contact Attempted": "portal.case.event.contactAttempted",
  "Worker Contact Successful": "portal.case.event.contactSuccessful",
  "More Information Requested": "portal.case.event.infoRequested",
  "Evidence Added": "portal.case.event.evidenceAdded",
  "Investigation Finding Added": "portal.case.event.findingAdded",
  "Action Taken": "portal.case.event.actionTaken",
  "Referral Recorded": "portal.case.event.referral",
  Escalated: "portal.case.event.escalated",
  "Proposed Resolution": "portal.case.event.proposed",
  Resolved: "portal.case.event.resolved",
  Closed: "portal.case.event.closed",
  Reopened: "portal.case.event.reopened",
  "Worker Feedback Recorded": "portal.case.event.feedback",
};

const IMPACT_KEYS: Record<GroupImpact, MessageKey> = {
  individual: "others.no",
  "2-5": "range.2-5",
  "6-20": "range.6-20",
  "more-than-20": "range.20+",
  "not-sure": "range.unsure",
};

export function protectedAudioSrc(localUri: string | undefined): string | undefined {
  if (!localUri) return undefined;
  if (localUri.startsWith("http://") || localUri.startsWith("https://") || localUri.startsWith("/")) return localUri;
  return undefined;
}

export function formatDuration(durationMs: number): string {
  const total = Math.max(0, Math.round(durationMs / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = String(total % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function formatDate(value: string): string {
  return value.slice(0, 10);
}

export function formatPortalDate(value: string, locale: "en" | "ur"): string {
  return new Intl.DateTimeFormat(locale === "ur" ? "ur-PK" : "en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function fullLocationLabel(complaint: Complaint): string {
  return complaint.location.formattedAddress ?? [
    complaint.location.placeLabel ?? complaint.location.field,
    complaint.location.villageLabel ?? complaint.location.village,
    complaint.location.tehsil,
    complaint.location.district,
    complaint.location.province,
  ].filter(Boolean).join(", ");
}

export interface StructuredAnswerRow {
  id: string;
  promptKey: MessageKey;
  answerKeys: MessageKey[];
  rawValues: string[];
}

/** Workflow answer ids already shown in the worker report summary grid. */
export const WORKER_REPORT_PROMOTED_ANSWER_IDS = new Set([
  "when",
  "others",
  "others-range",
  "where-province",
  "where-city",
  "where-place",
  "where-current",
  "danger",
  "privacy",
  "category",
  "category-more",
  "intro",
  "identity",
  "contact",
  "contactPreference",
  "representative-contact",
  "contact-language",
  "contact-window",
  "contact-voicemail",
  "subcategory",
  "pesticideSymptoms",
  "harassmentThreat",
  "priorityFloor",
  "_history",
]);

const WHEN_LABEL_CODES = new Set(["today", "yesterday", "week", "older", "unsure"]);

export function whenLabelMessageKey(whenLabel: string): MessageKey | null {
  return WHEN_LABEL_CODES.has(whenLabel) ? (`when.${whenLabel}` as MessageKey) : null;
}

export function structuredAnswerRows(complaint: Complaint): StructuredAnswerRow[] {
  return Object.entries(complaint.incident.structuredAnswers).flatMap(([id, raw]) => {
    if (WORKER_REPORT_PROMOTED_ANSWER_IDS.has(id)) return [];
    const node = getWorkflowNode(id);
    if (!node || !["details", "facts", "safety"].includes(node.section)) return [];
    const values = Array.isArray(raw) ? raw.map(String) : raw === undefined || raw === null ? [] : [String(raw)];
    if (values.length === 0) return [];
    const answerKeys: MessageKey[] = [];
    const rawValues: string[] = [];
    values.forEach((value) => {
      const key = node.options?.find((option) => option.value === value)?.labelKey;
      if (key) answerKeys.push(key as MessageKey);
      else rawValues.push(value);
    });
    return [{ id, promptKey: node.promptKey as MessageKey, answerKeys, rawValues }];
  });
}

export function identityLabel(complaint: Complaint): { label: string | null; last4: string | null; verified: boolean } {
  if (complaint.privacyMode === "ANON") return { label: null, last4: null, verified: false };
  const identity = complaint.reporterIdentity;
  return {
    label: complaint.reporter.displayName ?? null,
    last4: identity?.mode === "cnic" ? identity.cnicLast4 : identity?.mode === "phone" ? identity.phoneLast4 : null,
    verified: identity?.cnicVerified ?? false,
  };
}

export function eventLabelKey(type: CaseActionType): MessageKey {
  return EVENT_KEYS[type];
}

export function actorLabelKey(role: CaseAction["actorRole"]): MessageKey {
  if (role === "puwf-grievance-manager") {
    return "portal.case.actor.puwf";
  }
  if (role === "worker") {
    return "portal.case.actor.worker";
  }
  return "portal.case.actor.system";
}

export function impactLabelKey(value: string | undefined): MessageKey | null {
  if (!value || !(value in IMPACT_KEYS)) {
    return null;
  }
  return IMPACT_KEYS[value as GroupImpact];
}

export function reporterLabel(complaint: Complaint): string | null {
  if (complaint.privacyMode === "ANON") {
    return null;
  }
  return complaint.reporter.displayName ?? null;
}

function hideCorrectiveAttachmentTimelineRow(action: CaseAction): boolean {
  if (action.type !== "Evidence Added") return false;
  const reason = action.reason as Record<string, unknown> | undefined;
  if (reason?.source === "staff-corrective-upload") return true;
  if (reason?.targetType === "corrective-action") return true;
  return false;
}

export type TimelineAttachment = {
  id: string;
  label: string;
  href: string;
  kind: "photo" | "document";
};

function attachmentKind(
  row: { kind?: string; fileName: string; mimeType?: string } | undefined,
): "photo" | "document" {
  if (row?.kind === "photo" || row?.kind === "document") return row.kind;
  const lower = row?.fileName.toLowerCase() ?? "";
  if (lower.endsWith(".pdf")) return "document";
  return "photo";
}

export function timelineAttachmentsForAction(
  action: CaseAction,
  evidence: readonly { id: string; fileName: string; localUri?: string; kind?: string; mimeType?: string }[],
  caseKey: string,
): TimelineAttachment[] {
  const reason = action.reason;
  const ids = reason?.attachedEvidenceIds;
  if (Array.isArray(ids) && ids.length > 0) {
    return ids
      .filter((id): id is string => typeof id === "string" && id.length > 0)
      .map((id) => {
        const row = evidence.find((item) => item.id === id);
        const label = row?.fileName ?? id;
        const href =
          row?.localUri ??
          `/api/v1/cases/${encodeURIComponent(caseKey)}/evidence/${encodeURIComponent(id)}/content`;
        return { id, label, href, kind: attachmentKind(row) };
      });
  }
  const names = reason?.attachedDocuments;
  if (!Array.isArray(names)) return [];
  return names
    .filter((name): name is string => typeof name === "string" && name.trim().length > 0)
    .map((name) => {
      const row = evidence.find((item) => item.fileName === name);
      if (!row) return null;
      return {
        id: row.id,
        label: row.fileName,
        href:
          row.localUri ??
          `/api/v1/cases/${encodeURIComponent(caseKey)}/evidence/${encodeURIComponent(row.id)}/content`,
        kind: attachmentKind(row),
      };
    })
    .filter((row): row is TimelineAttachment => row !== null);
}

export function sortedTimeline(actions: CaseAction[]): CaseAction[] {
  return [...actions]
    .filter((action) => !hideCorrectiveAttachmentTimelineRow(action))
    .sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id));
}
