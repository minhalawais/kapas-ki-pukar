"use client";

import { t, type MessageKey } from "@kapas/localization";
import { AlertTriangle, CalendarDays, CheckCircle2, ClockAlert, FolderOpen, Inbox, RotateCcw, TimerReset } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { DonutChart, ExecutiveTrendChart, RankedList, SignalCard } from "@/components/dashboard/DashboardCharts";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { PageHeader } from "@/components/shell/page-header";
import { ErrorState } from "@/components/states/error-state";
import { LoadingState } from "@/components/states/loading-state";
import { Button } from "@/components/ui/button";
import { prioritySeriesColor, privacySafeRows } from "@/lib/analytics";
import { emptyFilters, readStoredFilters, toComplaintFilters, writeStoredFilters } from "@/lib/dashboard";
import { useDashboardData } from "@/lib/use-complaints";
import { useLocaleStore } from "@/stores/locale-store";

interface DateRangeDraft {
  from: string;
  to: string;
}

type DatePreset = "7d" | "30d" | "90d" | "all";

const dateInputClass = "h-input rounded-control border border-border bg-surface px-3 text-sm text-ink outline-none transition-colors focus:border-action focus:ring-2 focus:ring-[rgba(11,112,75,0.14)]";

function percent(value: number | null): string {
  return value == null ? "—" : `${Math.round(value)}%`;
}

function hours(value: number | null): string {
  if (value == null) return "—";
  if (value < 24) return `${Math.round(value)}h`;
  return `${Math.round(value / 24)}d`;
}

function numberText(value: number): string {
  return new Intl.NumberFormat("en-PK").format(value);
}

function geographyLabel(locale: "en" | "ur", key: string): string {
  return key === "suppressed" ? t(locale, "portal.analytics.suppressed") : t(locale, `province.${key}` as MessageKey);
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function presetRange(preset: DatePreset): DateRangeDraft {
  if (preset === "all") {
    return { from: "", to: "" };
  }
  const days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90;
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (days - 1));
  return { from: isoDate(start), to: isoDate(end) };
}

function activePreset(range: DateRangeDraft): DatePreset | "custom" {
  for (const preset of ["7d", "30d", "90d", "all"] as DatePreset[]) {
    const candidate = presetRange(preset);
    if (candidate.from === range.from && candidate.to === range.to) {
      return preset;
    }
  }
  return "custom";
}

function DateRangeScopeBar({
  value,
  onChange,
  onReset,
}: {
  value: DateRangeDraft;
  onChange: (next: DateRangeDraft) => void;
  onReset: () => void;
}) {
  const locale = useLocaleStore((s) => s.locale);
  const selectedPreset = activePreset(value);
  const presets: { id: DatePreset; label: string }[] = [
    { id: "7d", label: t(locale, "portal.dashboard.range.7d") },
    { id: "30d", label: t(locale, "portal.dashboard.range.30d") },
    { id: "90d", label: t(locale, "portal.dashboard.range.90d") },
    { id: "all", label: t(locale, "portal.dashboard.range.all") },
  ];

  return (
    <div className="rounded-card border border-border bg-surface shadow-[0_12px_28px_rgba(19,42,33,0.05)]">
      <div className="flex flex-col gap-4 p-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-[var(--surface-ai)] text-[var(--brand-fos-teal-dark)]">
            <CalendarDays size={19} aria-hidden />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-ink">{t(locale, "portal.dashboard.dateScopeTitle")}</h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-muted">{t(locale, "portal.dashboard.dateScopeNote")}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="inline-grid rounded-control border border-border bg-page p-1 sm:grid-cols-4">
            {presets.map((preset) => {
              const selected = selectedPreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  className={`h-8 rounded-[6px] px-3 text-xs font-semibold transition-colors ${selected ? "bg-action text-[color:var(--on-primary)] shadow-sm" : "text-muted hover:bg-surface hover:text-ink"}`}
                  onClick={() => onChange(presetRange(preset.id))}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(150px,1fr)_minmax(150px,1fr)_auto] sm:items-end">
            <label className="text-xs font-semibold text-muted">
              {t(locale, "portal.filters.from")}
              <input
                type="date"
                className={`${dateInputClass} mt-1 w-full`}
                value={value.from}
                max={value.to || undefined}
                onChange={(event) => onChange({ ...value, from: event.target.value })}
              />
            </label>
            <label className="text-xs font-semibold text-muted">
              {t(locale, "portal.filters.to")}
              <input
                type="date"
                className={`${dateInputClass} mt-1 w-full`}
                value={value.to}
                min={value.from || undefined}
                onChange={(event) => onChange({ ...value, to: event.target.value })}
              />
            </label>
            <Button type="button" variant="secondary" className="h-input px-3" onClick={onReset}>
              <RotateCcw size={15} />
              {t(locale, "portal.dashboard.range.reset")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const locale = useLocaleStore((s) => s.locale);
  const [range, setRange] = useState<DateRangeDraft>(() => presetRange("30d"));
  const [filtersReady, setFiltersReady] = useState(false);
  const filters = useMemo(() => toComplaintFilters({ ...emptyFilters(), from: range.from, to: range.to }), [range.from, range.to]);
  const query = useDashboardData(filters, filtersReady);

  useEffect(() => {
    const stored = readStoredFilters();
    setRange({
      from: stored.from || presetRange("30d").from,
      to: stored.to || presetRange("30d").to,
    });
    setFiltersReady(true);
  }, []);

  function updateRange(next: DateRangeDraft) {
    setRange(next);
    writeStoredFilters({ ...emptyFilters(), from: next.from, to: next.to });
  }

  const snapshot = query.data?.snapshot;
  const safeGeography = snapshot ? privacySafeRows(snapshot.byProvince) : [];
  const safeGender = snapshot ? privacySafeRows(snapshot.byGender) : [];
  const topCategory = snapshot?.byCategory[0];
  const topProvince = safeGeography[0];

  return (
    <section className="space-y-5">
      <PageHeader
        title={t(locale, "portal.dashboard.title")}
        description={t(locale, "portal.dashboard.note")}
        action={
          <div className="flex items-center gap-2 rounded-card border border-border/80 bg-surface px-3 py-1.5 shadow-sm">
            <img
              src="/brand/puwf_logo.png"
              alt="PUWF Logo"
              className="h-12 w-auto max-w-[180px] object-contain sm:h-14"
            />
          </div>
        }
      />
      {query.isLoading || !filtersReady ? <LoadingState label={t(locale, "common.loading")} /> : null}
      {query.isError ? <ErrorState title={t(locale, "common.error")} retryLabel={t(locale, "common.retry")} onRetry={() => void query.refetch()} /> : null}

      <DateRangeScopeBar value={range} onChange={updateRange} onReset={() => updateRange(presetRange("30d"))} />

      {snapshot ? (
        <>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
            <MetricCard label={t(locale, "portal.kpi.total")} value={numberText(snapshot.total)} icon={FolderOpen} tone="neutral" helper={t(locale, "portal.kpi.helper.total")} />
            <MetricCard label={t(locale, "portal.kpi.open")} value={numberText(snapshot.openCount)} icon={Inbox} tone="info" helper={t(locale, "portal.kpi.helper.open")} />
            <MetricCard label={t(locale, "portal.kpi.critical")} value={numberText(snapshot.criticalCount)} icon={AlertTriangle} tone="critical" helper={t(locale, "portal.kpi.helper.critical")} />
            <MetricCard label={t(locale, "portal.kpi.overdue")} value={numberText(snapshot.overdueCount)} icon={ClockAlert} tone="warning" helper={t(locale, "portal.kpi.helper.overdue")} />
            <MetricCard label={t(locale, "portal.kpi.resolutionRate")} value={percent(snapshot.resolutionRate)} icon={CheckCircle2} tone="success" helper={t(locale, "portal.kpi.helper.resolutionRate")} />
          </div>

          <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
            <ExecutiveTrendChart title={t(locale, "portal.dashboard.reportingTrend")} rows={snapshot.trend} emptyLabel={t(locale, "common.empty")} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-1">
              <SignalCard label={t(locale, "portal.dashboard.firstAction")} value={hours(snapshot.averageFirstActionHours)} helper={t(locale, "portal.dashboard.firstActionNote")} tone={snapshot.averageFirstActionHours != null && snapshot.averageFirstActionHours > 48 ? "warning" : "success"} />
              <SignalCard label={t(locale, "portal.dashboard.resolutionTime")} value={hours(snapshot.averageResolutionHours)} helper={t(locale, "portal.dashboard.resolutionTimeNote")} tone="neutral" />
              <SignalCard label={t(locale, "portal.dashboard.topIssue")} value={topCategory ? t(locale, `category.${topCategory.key}` as MessageKey) : "—"} helper={t(locale, "portal.dashboard.topIssueNote")} tone="neutral" />
              <SignalCard label={t(locale, "portal.dashboard.topProvince")} value={topProvince ? geographyLabel(locale, topProvince.key) : "—"} helper={t(locale, "portal.dashboard.topProvinceNote")} tone="neutral" />
            </div>
          </div>

          <section aria-labelledby="access-heading" className="space-y-3">
            <div>
              <h2 id="access-heading" className="text-lg font-semibold text-ink">{t(locale, "portal.dashboard.accessTitle")}</h2>
              <p className="text-xs text-muted">{t(locale, "portal.dashboard.accessNote")}</p>
            </div>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <RankedList title={t(locale, "portal.chart.category")} rows={snapshot.byCategory} emptyLabel={t(locale, "common.empty")} labelFor={(key) => t(locale, `category.${key}` as MessageKey)} />
              <RankedList title={t(locale, "portal.chart.geography")} rows={safeGeography} emptyLabel={t(locale, "common.empty")} labelFor={(key) => geographyLabel(locale, key)} />
              <RankedList title={t(locale, "portal.chart.gender")} rows={safeGender} emptyLabel={t(locale, "common.empty")} labelFor={(key) => key === "suppressed" ? t(locale, "portal.analytics.suppressed") : t(locale, `portal.gender.${key}` as MessageKey)} />
            </div>
          </section>

          <section aria-labelledby="risk-heading" className="space-y-3">
            <div>
              <h2 id="risk-heading" className="text-lg font-semibold text-ink">{t(locale, "portal.dashboard.riskTitle")}</h2>
              <p className="text-xs text-muted">{t(locale, "portal.dashboard.riskNote")}</p>
            </div>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <DonutChart title={t(locale, "portal.chart.priority")} rows={snapshot.byPriority} emptyLabel={t(locale, "common.empty")} labelFor={(key) => t(locale, `portal.priority.${key}` as MessageKey)} colorFor={prioritySeriesColor} />
              <DonutChart title={t(locale, "portal.chart.status")} rows={snapshot.byStatus} emptyLabel={t(locale, "common.empty")} labelFor={(key) => t(locale, `portal.status.${key}` as MessageKey)} />
            </div>
          </section>

          <section aria-labelledby="quality-heading" className="space-y-3">
            <div>
              <h2 id="quality-heading" className="text-lg font-semibold text-ink">{t(locale, "portal.dashboard.qualityTitle")}</h2>
              <p className="text-xs text-muted">{t(locale, "portal.dashboard.qualityNote")}</p>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_320px]">
              <DonutChart title={t(locale, "portal.chart.privacy")} rows={snapshot.byPrivacy} emptyLabel={t(locale, "common.empty")} labelFor={(key) => t(locale, `privacy.${key}` as MessageKey)} />
              <DonutChart title={t(locale, "portal.chart.outcome")} rows={snapshot.byOutcome} emptyLabel={t(locale, "common.empty")} labelFor={(key) => t(locale, `portal.analytics.outcome.${key}` as MessageKey)} />
              <div className="grid grid-cols-1 gap-3">
                <SignalCard label={t(locale, "portal.chart.humanReview")} value={percent(snapshot.aiHumanReviewShare)} helper={t(locale, "portal.dashboard.humanReviewNote")} tone={snapshot.aiHumanReviewShare != null && snapshot.aiHumanReviewShare > 25 ? "warning" : "success"} />
                <SignalCard label={t(locale, "portal.chart.aiConfidence")} value={percent(snapshot.aiLowConfidenceShare)} helper={t(locale, "portal.dashboard.lowConfidenceNote")} tone={snapshot.aiLowConfidenceShare != null && snapshot.aiLowConfidenceShare > 20 ? "warning" : "success"} />
                <SignalCard label={t(locale, "portal.dashboard.reopenRate")} value={percent(snapshot.reopenRate)} helper={t(locale, "portal.dashboard.reopenRateNote")} tone="neutral" />
              </div>
            </div>
          </section>

          <div className="flex items-center gap-2 rounded-card border border-border bg-surface px-4 py-3 text-xs text-muted">
            <TimerReset size={16} className="text-action" />
            <span>{t(locale, "portal.dashboard.generatedAt")} {new Date(snapshot.generatedAt).toLocaleString(locale === "ur" ? "ur-PK" : "en-PK")}</span>
          </div>
        </>
      ) : null}
    </section>
  );
}
