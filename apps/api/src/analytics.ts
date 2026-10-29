import type { DatabaseClient } from "@kapas/database";

export interface AnalyticsQuery {
  from?: string;
  to?: string;
  status?: string;
  priority?: string;
  category?: string;
  subcategory?: string;
  province?: string;
  district?: string;
}

export interface AnalyticsRows {
  readonly id: string;
  readonly categoryCode: string;
  readonly subcategoryCode: string | null;
  readonly status: string;
  readonly priority: string;
  readonly privacyMode: string;
  readonly submittedAt: Date;
  readonly dueAt: Date;
  readonly location: { province: string; district: string } | null;
  readonly history: readonly { actionType: string; occurredAt: Date }[];
  readonly feedback: readonly { outcome: string }[];
  readonly aiRuns: readonly {
    confidence: unknown;
    humanReviewState: string;
    failureState: string | null;
  }[];
}

export function parseAnalyticsQuery(
  query: AnalyticsQuery,
): AnalyticsQuery & { fromDate: Date; toDate: Date } {
  const toDate = query.to ? new Date(query.to) : new Date();
  const fromDate = query.from
    ? new Date(query.from)
    : new Date(toDate.getTime() - 365 * 86_400_000);
  if (
    !Number.isFinite(fromDate.getTime()) ||
    !Number.isFinite(toDate.getTime()) ||
    fromDate >= toDate
  )
    throw new Error("Invalid analytics date range");
  if (toDate.getTime() - fromDate.getTime() > 366 * 86_400_000)
    throw new Error("Analytics date range exceeds 366 days");
  return { ...query, fromDate, toDate };
}

function split(value?: string): string[] | undefined {
  const values = value
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return values?.length ? values.slice(0, 20) : undefined;
}

export async function loadAnalyticsRows(
  client: DatabaseClient,
  query: AnalyticsQuery,
): Promise<readonly AnalyticsRows[]> {
  const parsed = parseAnalyticsQuery(query);
  return client.complaint.findMany({
    where: {
      submittedAt: { gte: parsed.fromDate, lt: parsed.toDate },
      status: { in: split(parsed.status) },
      priority: { in: split(parsed.priority) },
      categoryCode: { in: split(parsed.category) },
      subcategoryCode: { in: split(parsed.subcategory) },
      location: {
        province: { in: split(parsed.province) },
        district: { in: split(parsed.district) },
      },
    },
    select: {
      id: true,
      categoryCode: true,
      subcategoryCode: true,
      status: true,
      priority: true,
      privacyMode: true,
      submittedAt: true,
      dueAt: true,
      location: { select: { province: true, district: true } },
      history: { select: { actionType: true, occurredAt: true }, orderBy: { occurredAt: "asc" } },
      feedback: { select: { outcome: true } },
      aiRuns: {
        select: { confidence: true, humanReviewState: true, failureState: true },
        orderBy: { startedAt: "desc" },
        take: 1,
      },
    },
    take: 10_000,
  }) as unknown as readonly AnalyticsRows[];
}

function counts(values: readonly string[], minimum = 3): { key: string; count: number }[] {
  const map = new Map<string, number>();
  for (const value of values) map.set(value, (map.get(value) ?? 0) + 1);
  const visible: { key: string; count: number }[] = [];
  let suppressed = 0;
  for (const [key, count] of map) {
    if (count < minimum) suppressed += count;
    else visible.push({ key, count });
  }
  if (suppressed) visible.push({ key: "suppressed", count: suppressed });
  return visible.sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

export function buildAnalyticsSnapshot(rows: readonly AnalyticsRows[]) {
  const now = new Date();
  const closed = new Set(["Closed"]);
  const open = rows.filter((row) => !closed.has(row.status));
  const resolved = rows.filter((row) => closed.has(row.status));
  const critical = rows.filter(
    (row) => row.priority === "Critical" || row.priority === "Emergency",
  );
  const overdue = open.filter((row) => row.dueAt < now);
  const firstActionHours = rows.flatMap((row) => {
    const action = row.history.find(
      (item) => item.actionType === "Triage Completed" || item.actionType === "Review Started",
    );
    return action ? [(action.occurredAt.getTime() - row.submittedAt.getTime()) / 3_600_000] : [];
  });
  const resolutionHours = rows.flatMap((row) => {
    const action = row.history.find(
      (item) => item.actionType === "Complaint Closed" || item.actionType === "Resolved",
    );
    return action ? [(action.occurredAt.getTime() - row.submittedAt.getTime()) / 3_600_000] : [];
  });
  const feedback = rows.flatMap((row) => row.feedback);
  const ai = rows.flatMap((row) => row.aiRuns);
  const average = (values: readonly number[]) =>
    values.length
      ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1))
      : null;
  const reopened = rows.filter((row) =>
    row.history.some(
      (item) => item.actionType === "Complaint Reopened" || item.actionType === "Reopened",
    ),
  ).length;
  return {
    generatedAt: now.toISOString(),
    total: rows.length,
    newCount: rows.filter((row) => row.status === "Received").length,
    criticalCount: critical.length,
    inProgressCount: rows.filter((row) => row.status === "Action in Progress").length,
    overdueCount: overdue.length,
    resolvedCount: resolved.length,
    openCount: open.length,
    resolutionRate: rows.length ? resolved.length / rows.length : null,
    criticalRate: rows.length ? critical.length / rows.length : null,
    reopenRate: rows.length ? reopened / rows.length : null,
    positiveOutcomeRate: feedback.length
      ? feedback.filter((item) => item.outcome === "satisfied").length / feedback.length
      : null,
    averageFirstActionHours: average(firstActionHours),
    averageResolutionHours: average(resolutionHours),
    aiLowConfidenceShare: ai.length
      ? ai.filter((item) => Number(item.confidence ?? 0) < 0.65 || item.failureState).length /
        ai.length
      : null,
    aiHumanReviewShare: ai.length
      ? ai.filter((item) => item.humanReviewState === "required").length / ai.length
      : null,
    byCategory: counts(
      rows.map((row) => row.categoryCode),
      3,
    ),
    byStatus: counts(
      rows.map((row) => row.status),
      1,
    ),
    byProvince: counts(
      rows.map((row) => row.location?.province ?? "unknown"),
      3,
    ),
    byPriority: counts(
      rows.map((row) => row.priority),
      1,
    ),
    byPrivacy: counts(
      rows.map((row) => row.privacyMode),
      3,
    ),
    byGender: [],
    byOutcome: counts(
      feedback.map((item) => item.outcome),
      3,
    ),
    byAiConfidence: counts(
      ai.map((item) =>
        Number(item.confidence ?? 0) >= 0.8
          ? "high"
          : Number(item.confidence ?? 0) >= 0.65
            ? "medium"
            : "low",
      ),
      3,
    ),
    byHumanReview: counts(
      ai.map((item) => item.humanReviewState),
      3,
    ),
    trend: counts(
      rows.map((row) => row.submittedAt.toISOString().slice(0, 7)),
      1,
    ),
  };
}
