import type {
  AnalyticsFilters,
  AnalyticsSnapshot,
  Complaint,
  ComplaintFilters,
  Gender,
  NamedCount,
} from "@kapas/domain";
import { DEMO_NOW_ISO, isOverdue, priorityRank, type CaseStatus, type Priority } from "@kapas/domain";

const inProgress: CaseStatus[] = [
  "Submitted",
  "Under Review",
  "Action in Progress",
  "Proposed Resolution",
  "Reopened",
];

const openStatuses: CaseStatus[] = [...inProgress];

const statusRank: Record<CaseStatus, number> = {
  Draft: 0,
  Submitted: 1,
  "Under Review": 2,
  "Action in Progress": 3,
  "Proposed Resolution": 4,
  Resolved: 5,
  Reopened: 6,
  Closed: 7,
};

function countsBy(rows: Complaint[], keyOf: (row: Complaint) => string): NamedCount[] {
  const tally = new Map<string, number>();
  for (const row of rows) {
    const key = keyOf(row);
    tally.set(key, (tally.get(key) ?? 0) + 1);
  }
  return [...tally.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

function ratio(numerator: number, denominator: number): number | null {
  if (denominator === 0) {
    return null;
  }
  return (numerator / denominator) * 100;
}

function mean(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function hoursBetween(from: string, to: string): number {
  return (Date.parse(to) - Date.parse(from)) / 3_600_000;
}

export function analyticsGender(row: Complaint): Gender {
  if (row.privacyMode === "ANON") {
    return "Not Stated";
  }
  return row.gender ?? "Not Stated";
}

export function filterComplaints(rows: Complaint[], filters?: ComplaintFilters): Complaint[] {
  if (!filters) {
    return rows.filter((row) => row.status !== "Draft");
  }
  return rows.filter((row) => {
    if (row.status === "Draft") {
      return false;
    }
    if (filters.status && filters.status.length > 0 && !filters.status.includes(row.status)) {
      return false;
    }
    if (filters.priority && filters.priority.length > 0 && !filters.priority.includes(row.priority)) {
      return false;
    }
    if (filters.category && filters.category.length > 0 && !filters.category.includes(row.categoryCode)) {
      return false;
    }
    if (filters.privacyMode && filters.privacyMode.length > 0 && !filters.privacyMode.includes(row.privacyMode)) {
      return false;
    }
    if (filters.province && filters.province.length > 0 && !filters.province.includes(row.location.province)) {
      return false;
    }
    if (filters.gender && filters.gender.length > 0 && !filters.gender.includes(analyticsGender(row))) {
      return false;
    }
    if (filters.from && row.submittedAt < filters.from) {
      return false;
    }
    if (filters.to && row.submittedAt > `${filters.to}T23:59:59.999Z`) {
      return false;
    }
    if (filters.search) {
      const q = filters.search.trim().toLowerCase();
      if (q.length > 0) {
        const hay = [
          row.trackingId,
          row.categoryCode,
          row.status,
          row.priority,
          row.privacyMode,
          row.location.province,
          row.location.district,
          row.location.villageLabel ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) {
          return false;
        }
      }
    }
    return true;
  });
}

export function totalComplaints(rows: Complaint[]): number {
  return rows.length;
}

export function openCases(rows: Complaint[]): number {
  return rows.filter((row) => openStatuses.includes(row.status)).length;
}

export function resolutionRate(rows: Complaint[]): number | null {
  return ratio(
    rows.filter((row) => row.status === "Resolved" || row.status === "Closed").length,
    rows.length,
  );
}

export function criticalRate(rows: Complaint[]): number | null {
  return ratio(
    rows.filter((row) => row.priority === "Emergency" || row.priority === "Critical").length,
    rows.length,
  );
}

export function reopenRate(rows: Complaint[]): number | null {
  return ratio(
    rows.filter((row) => row.status === "Reopened").length,
    rows.filter((row) => row.status === "Resolved" || row.status === "Closed").length,
  );
}

export function positiveOutcomeRate(rows: Complaint[]): number | null {
  const responses = rows.filter((row) => row.workerFeedback);
  return ratio(responses.filter((row) => row.workerFeedback?.outcome === "satisfied").length, responses.length);
}

export function averageFirstActionHours(rows: Complaint[]): number | null {
  return mean(
    rows.flatMap((row) => {
      const first = [...row.actions]
        .sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id))
        .find((item) => item.type !== "Complaint Received");
      return first ? [hoursBetween(row.submittedAt, first.at)] : [];
    }),
  );
}

export function averageResolutionHours(rows: Complaint[]): number | null {
  return mean(
    rows.flatMap((row) => {
      const at =
        row.resolution?.resolvedAt ??
        row.actions.find((item) => item.type === "Resolved" || item.type === "Closed")?.at;
      return at ? [hoursBetween(row.submittedAt, at)] : [];
    }),
  );
}

export function selectKpis(rows: Complaint[]): Omit<
  AnalyticsSnapshot,
  | "generatedAt"
  | "byCategory"
  | "byStatus"
  | "byProvince"
  | "byPriority"
  | "byPrivacy"
  | "byGender"
  | "byOutcome"
  | "byAiConfidence"
  | "byHumanReview"
  | "trend"
> {
  const withAi = rows.filter((row) => row.ai);
  return {
    total: totalComplaints(rows),
    newCount: rows.filter((row) => row.status === "Submitted").length,
    criticalCount: rows.filter((row) => row.priority === "Emergency" || row.priority === "Critical").length,
    inProgressCount: rows.filter((row) => inProgress.includes(row.status)).length,
    overdueCount: rows.filter((row) => isOverdue(row)).length,
    resolvedCount: rows.filter((row) => row.status === "Resolved" || row.status === "Closed").length,
    openCount: openCases(rows),
    resolutionRate: resolutionRate(rows),
    criticalRate: criticalRate(rows),
    reopenRate: reopenRate(rows),
    positiveOutcomeRate: positiveOutcomeRate(rows),
    averageFirstActionHours: averageFirstActionHours(rows),
    averageResolutionHours: averageResolutionHours(rows),
    aiLowConfidenceShare: ratio(
      withAi.filter((row) => row.ai?.failed || row.ai?.confidence === "low").length,
      withAi.length,
    ),
    aiHumanReviewShare: ratio(withAi.filter((row) => row.ai?.humanReviewRequired).length, withAi.length),
  };
}

export function selectCategoryDistribution(rows: Complaint[]): NamedCount[] {
  return countsBy(rows, (row) => row.categoryCode);
}

export function selectStatusDistribution(rows: Complaint[]): NamedCount[] {
  return countsBy(rows, (row) => row.status);
}

export function selectProvinceDistribution(rows: Complaint[]): NamedCount[] {
  return countsBy(rows, (row) => row.location.province);
}

export function selectPriorityDistribution(rows: Complaint[]): NamedCount[] {
  return countsBy(rows, (row) => row.priority);
}

export function selectPrivacyDistribution(rows: Complaint[]): NamedCount[] {
  return countsBy(rows, (row) => row.privacyMode);
}

export function selectGenderDistribution(rows: Complaint[]): NamedCount[] {
  return countsBy(rows, analyticsGender);
}

export function selectOutcomeDistribution(rows: Complaint[]): NamedCount[] {
  return countsBy(rows, (row) => row.workerFeedback?.outcome ?? "none");
}

export function selectAiConfidenceDistribution(rows: Complaint[]): NamedCount[] {
  return countsBy(rows, (row) => {
    if (!row.ai) {
      return "none";
    }
    return row.ai.failed ? "failed" : row.ai.confidence;
  });
}

export function selectHumanReviewDistribution(rows: Complaint[]): NamedCount[] {
  return countsBy(rows, (row) => (row.ai?.humanReviewRequired ? "yes" : "no"));
}

export function selectMonthlyTrend(rows: Complaint[]): NamedCount[] {
  if (rows.length === 0) return [];
  const dates = rows.map((r) => r.submittedAt.slice(0, 10)).sort();
  const minDate = new Date(`${dates[0]}T00:00:00.000Z`);
  const maxDate = new Date(`${dates[dates.length - 1]}T00:00:00.000Z`);
  const diffDays = Math.round((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 45 && diffDays >= 2) {
    const countsMap = new Map<string, number>();
    for (const row of rows) {
      const dayKey = row.submittedAt.slice(0, 10);
      countsMap.set(dayKey, (countsMap.get(dayKey) ?? 0) + 1);
    }
    const result: NamedCount[] = [];
    const cur = new Date(minDate);
    while (cur <= maxDate) {
      const key = cur.toISOString().slice(0, 10);
      result.push({ key, count: countsMap.get(key) ?? 0 });
      cur.setDate(cur.getDate() + 1);
    }
    return result;
  }

  return countsBy(rows, (row) => row.submittedAt.slice(0, 7)).sort((a, b) => a.key.localeCompare(b.key));
}

export function snapshotFrom(rows: Complaint[], filters?: AnalyticsFilters): AnalyticsSnapshot {
  const ranged = filterComplaints(rows, filters);
  return {
    generatedAt: DEMO_NOW_ISO,
    ...selectKpis(ranged),
    byCategory: selectCategoryDistribution(ranged),
    byStatus: selectStatusDistribution(ranged),
    byProvince: selectProvinceDistribution(ranged),
    byPriority: selectPriorityDistribution(ranged),
    byPrivacy: selectPrivacyDistribution(ranged),
    byGender: selectGenderDistribution(ranged),
    byOutcome: selectOutcomeDistribution(ranged),
    byAiConfidence: selectAiConfidenceDistribution(ranged),
    byHumanReview: selectHumanReviewDistribution(ranged),
    trend: selectMonthlyTrend(ranged),
  };
}

export function comparePriority(a: Priority, b: Priority): number {
  return priorityRank[a] - priorityRank[b];
}

export function compareStatus(a: CaseStatus, b: CaseStatus): number {
  return statusRank[a] - statusRank[b];
}

export function complaintsToCsv(rows: Complaint[]): string {
  const header = [
    "trackingId",
    "categoryCode",
    "priority",
    "status",
    "privacyMode",
    "province",
    "district",
    "gender",
    "submittedAt",
    "dueAt",
    "overdue",
    "aiConfidence",
    "humanReviewRequired",
    "workerOutcome",
  ];
  const lines = rows.map((row) =>
    [
      row.trackingId,
      row.categoryCode,
      row.priority,
      row.status,
      row.privacyMode,
      row.location.province,
      row.location.district,
      analyticsGender(row),
      row.submittedAt,
      row.dueAt,
      row.overdue ? "true" : "false",
      row.ai?.failed ? "failed" : (row.ai?.confidence ?? ""),
      row.ai?.humanReviewRequired ? "true" : "false",
      row.workerFeedback?.outcome ?? "",
    ]
      .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
      .join(","),
  );
  return [header.join(","), ...lines].join("\n");
}
