import type { AnalyticsFilters, NamedCount } from "@kapas/domain";
import { persistenceKeys } from "@kapas/domain";

import type { AnalyticsFilterDraft } from "@/components/analytics/AnalyticsFilterBar";

export const emptyAnalyticsFilters = (): AnalyticsFilterDraft => ({
  category: "",
  status: "",
  priority: "",
  province: "",
  privacy: "",
  gender: "",
  from: "",
  to: "",
});

export function toAnalyticsFilters(draft: AnalyticsFilterDraft): AnalyticsFilters {
  return {
    category: draft.category ? [draft.category] : undefined,
    status: draft.status ? [draft.status] : undefined,
    priority: draft.priority ? [draft.priority] : undefined,
    province: draft.province ? [draft.province] : undefined,
    privacyMode: draft.privacy ? [draft.privacy] : undefined,
    gender: draft.gender ? [draft.gender] : undefined,
    from: draft.from || undefined,
    to: draft.to || undefined,
  };
}

export function hasAnalyticsFilters(draft: AnalyticsFilterDraft): boolean {
  return Object.values(draft).some((value) => value.length > 0);
}

export function readStoredAnalyticsFilters(): AnalyticsFilterDraft {
  if (typeof window === "undefined") {
    return emptyAnalyticsFilters();
  }
  try {
    const raw = window.localStorage.getItem(persistenceKeys.analyticsFilters);
    if (!raw) {
      return emptyAnalyticsFilters();
    }
    return { ...emptyAnalyticsFilters(), ...(JSON.parse(raw) as Partial<AnalyticsFilterDraft>) };
  } catch {
    return emptyAnalyticsFilters();
  }
}

export function writeStoredAnalyticsFilters(draft: AnalyticsFilterDraft): void {
  window.localStorage.setItem(persistenceKeys.analyticsFilters, JSON.stringify(draft));
}

export function formatRate(value: number | null, na: string, suffix: string): string {
  if (value === null) {
    return na;
  }
  return `${Math.round(value)}${suffix}`;
}

export function formatHours(value: number | null, na: string, unit: string): string {
  if (value === null) {
    return na;
  }
  return `${value.toFixed(1)} ${unit}`;
}

export function prioritySeriesColor(key: string, index: number): string {
  if (key === "Emergency") {
    return "var(--critical)";
  }
  if (key === "Critical") {
    return "var(--warning)";
  }
  const series = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
    "var(--chart-6)",
  ];
  return series[index % series.length]!;
}

export function privacySafeRows(rows: NamedCount[], minimum = 3): NamedCount[] {
  const visible = rows.filter((row) => row.count >= minimum);
  const suppressed = rows.filter((row) => row.count < minimum).reduce((sum, row) => sum + row.count, 0);
  return suppressed > 0 ? [...visible, { key: "suppressed", count: suppressed }] : visible;
}
