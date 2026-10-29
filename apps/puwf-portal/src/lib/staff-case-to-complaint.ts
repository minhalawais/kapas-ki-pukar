import type { Complaint, GeoCoordinates, GroupImpact } from "@kapas/domain";

const WHEN_CODES = new Set(["today", "yesterday", "week", "older", "unsure"]);

function exactCoordinatesFromRow(row: Record<string, unknown>): GeoCoordinates | null {
  const raw = row.exactCoordinates;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const latitude = (raw as { latitude?: unknown }).latitude;
  const longitude = (raw as { longitude?: unknown }).longitude;
  if (
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude)
  ) {
    return { latitude, longitude };
  }
  return null;
}

function asGroupImpact(value: unknown): GroupImpact {
  const allowed: GroupImpact[] = ["individual", "2-5", "6-20", "more-than-20", "not-sure"];
  return typeof value === "string" && allowed.includes(value as GroupImpact)
    ? (value as GroupImpact)
    : "individual";
}

function contactPreferenceFromRow(row: Record<string, unknown>): Complaint["reporter"]["contactPreference"] {
  const structured = row.structuredAnswers;
  if (structured && typeof structured === "object" && !Array.isArray(structured)) {
    const fromAnswers = (structured as Record<string, unknown>).contactPreference;
    if (typeof fromAnswers === "string") {
      return fromAnswers as Complaint["reporter"]["contactPreference"];
    }
  }
  const top = row.contactPreference;
  if (typeof top === "string") {
    return top as Complaint["reporter"]["contactPreference"];
  }
  return "do-not-initiate";
}

/** Maps staff case API JSON into the portal `Complaint` view model. */
export function staffCaseRowToComplaint(row: Record<string, unknown>, apiBase = ""): Complaint {
  const referenceNumber = String(row.referenceNumber ?? "");
  const contactPreference = contactPreferenceFromRow(row);
  const othersAffected = asGroupImpact(row.othersAffected);
  const whenLabel =
    typeof row.whenLabel === "string" && row.whenLabel.length > 0
      ? row.whenLabel
      : typeof row.structuredAnswers === "object" &&
          row.structuredAnswers &&
          !Array.isArray(row.structuredAnswers)
        ? String((row.structuredAnswers as Record<string, unknown>).when ?? "")
        : "";
  const resolvedWhen =
    whenLabel.length > 0
      ? whenLabel
      : WHEN_CODES.has(String((row.structuredAnswers as Record<string, unknown> | undefined)?.when ?? ""))
        ? String((row.structuredAnswers as Record<string, unknown>).when)
        : "";

  const villageLabel =
    typeof row.villageLabel === "string" ? row.villageLabel : undefined;
  const descriptivePlace =
    typeof row.descriptivePlace === "string" ? row.descriptivePlace : undefined;
  const placeLabel = descriptivePlace ?? villageLabel;

  const locationSource =
    row.locationSource === "device" || row.locationSource === "manual"
      ? row.locationSource
      : undefined;

  const location: Complaint["location"] = {
    province: String(row.province ?? ""),
    district: String(row.district ?? ""),
    tehsil: typeof row.tehsil === "string" ? row.tehsil : undefined,
    villageLabel,
    placeLabel,
    formattedAddress: descriptivePlace,
    source: locationSource,
    accuracyMeters:
      typeof row.locationAccuracyMeters === "number" ? row.locationAccuracyMeters : undefined,
    exactCoordinates: exactCoordinatesFromRow(row),
  };

  const evidenceRows = Array.isArray(row.evidence)
    ? (row.evidence as Record<string, unknown>[])
    : [];
  const evidence = evidenceRows.map((item) => ({
    id: String(item.id),
    kind: item.kind,
    fileName: String(item.originalName),
    mimeType: String(item.mimeType),
    capturedAt: String(item.capturedAt ?? row.submittedAt),
    localUri: `${apiBase}/api/v1/cases/${encodeURIComponent(referenceNumber)}/evidence/${encodeURIComponent(String(item.id))}/content`,
  }));

  const voiceRow =
    row.voice && typeof row.voice === "object" ? (row.voice as Record<string, unknown>) : null;
  const voice = voiceRow
    ? {
        id: String(voiceRow.id),
        localUri: `${apiBase}/api/v1/cases/${encodeURIComponent(referenceNumber)}/evidence/${encodeURIComponent(String(voiceRow.id))}/content`,
        durationMs: Number(voiceRow.durationMs ?? 0),
        recordedAt: String(voiceRow.recordedAt ?? row.submittedAt),
        locale: "ur" as const,
      }
    : null;

  const structuredAnswers =
    row.structuredAnswers && typeof row.structuredAnswers === "object" && !Array.isArray(row.structuredAnswers)
      ? { ...(row.structuredAnswers as Record<string, unknown>) }
      : {};

  if (contactPreference && structuredAnswers.contactPreference === undefined) {
    structuredAnswers.contactPreference = contactPreference;
  }

  const reporterType = (row.reporterType ?? "self") as Complaint["reporterType"];

  return {
    id: String(row.id),
    trackingId: referenceNumber,
    referenceNumber,
    createdAt: String(row.submittedAt),
    submittedAt: String(row.submittedAt),
    updatedAt: String(row.updatedAt),
    dueAt: String(row.dueAt),
    categoryCode: row.categoryCode as Complaint["categoryCode"],
    subcategoryCode: row.subcategoryCode as Complaint["subcategoryCode"],
    category: row.categoryCode as Complaint["category"],
    priority: row.priority as Complaint["priority"],
    status: row.status as Complaint["status"],
    privacyMode: (row.privacyMode ?? "ANON") as Complaint["privacyMode"],
    reporterType,
    reporter: {
      type: reporterType,
      displayName:
        typeof row.reporterDisplayName === "string" ? row.reporterDisplayName : undefined,
      contactAllowed: Boolean(row.contactAllowed),
      contactPreference,
      safeContactWindow:
        typeof row.safeContactWindow === "string" ? row.safeContactWindow : undefined,
      preferredLanguage:
        row.preferredLanguage === "ur" || row.preferredLanguage === "en"
          ? row.preferredLanguage
          : undefined,
      safeVoicemail: Boolean(row.safeVoicemail),
      representativeContact:
        typeof row.representativeContact === "string" ? row.representativeContact : undefined,
    },
    phoneLast4: typeof row.phoneLast4 === "string" ? row.phoneLast4 : undefined,
    cnicLast4: typeof row.cnicLast4 === "string" ? row.cnicLast4 : undefined,
    affectedWorkerType:
      typeof row.affectedWorkerType === "string"
        ? (row.affectedWorkerType as Complaint["affectedWorkerType"])
        : undefined,
    gender: typeof row.gender === "string" ? (row.gender as Complaint["gender"]) : undefined,
    location,
    othersAffected: othersAffected !== "individual",
    affectedRange: othersAffected,
    incident: {
      whenLabel: resolvedWhen,
      currentDanger: Boolean(row.currentDanger),
      immediateDanger: Boolean(row.immediateDanger),
      othersAffected,
      structuredAnswers,
      description:
        typeof row.incidentDescription === "string" ? row.incidentDescription : undefined,
    },
    evidence: evidence as Complaint["evidence"],
    evidenceStatus: (row.evidenceStatus ?? "none") as Complaint["evidenceStatus"],
    voice,
    ai: null,
    actions: (Array.isArray(row.actions) ? row.actions : []).map((event, index) => {
      const rowEvent = event as Record<string, unknown>;
      const actorType = String(rowEvent.actorType ?? "system");
      return {
        id: String(rowEvent.id ?? `${String(row.id)}-action-${index}`),
        type: rowEvent.type,
        at: String(rowEvent.at),
        actorRole:
          actorType === "staff"
            ? "puwf-grievance-manager"
            : actorType === "worker"
              ? "worker"
              : "system",
        note: typeof rowEvent.note === "string" ? rowEvent.note : undefined,
        visibility: rowEvent.visibility,
        reason: rowEvent.reason as Complaint["actions"][number]["reason"],
      };
    }) as Complaint["actions"],
    resolution: null,
    workerFeedback: null,
    overdue: Boolean(row.overdue),
    version: typeof row.version === "number" ? row.version : undefined,
  };
}
