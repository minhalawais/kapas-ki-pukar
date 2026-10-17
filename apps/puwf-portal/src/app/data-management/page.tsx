"use client";

import { t } from "@kapas/localization";
import { analyticsService } from "@kapas/mock-services";
import { Download, Files } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ComplaintTable } from "@/components/complaints/ComplaintTable";
import { FilterBar, type DashboardFilterDraft } from "@/components/complaints/FilterBar";
import { PageHeader } from "@/components/shell/page-header";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { LoadingState } from "@/components/states/loading-state";
import { Button } from "@/components/ui/button";
import { emptyFilters, hasActiveFilters, readStoredFilters, toComplaintFilters, writeStoredFilters } from "@/lib/dashboard";
import { useDashboardData, useProvinces } from "@/lib/use-complaints";
import { useLocaleStore } from "@/stores/locale-store";

export default function DataManagementPage() {
  const locale = useLocaleStore((s) => s.locale);
  const [draft, setDraft] = useState<DashboardFilterDraft>(emptyFilters);
  const [filtersReady, setFiltersReady] = useState(false);
  const [exporting, setExporting] = useState(false);
  const filters = useMemo(() => toComplaintFilters(draft), [draft]);
  const query = useDashboardData(filters, filtersReady);
  const provinces = useProvinces();
  const rows = useMemo(() => [...(query.data?.rows ?? [])].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [query.data?.rows]);

  useEffect(() => {
    const stored = readStoredFilters();
    const globalSearch = new URLSearchParams(window.location.search).get("search");
    setDraft(globalSearch ? { ...stored, search: globalSearch } : stored);
    setFiltersReady(true);
  }, []);

  function updateFilters(next: DashboardFilterDraft) {
    setDraft(next);
    writeStoredFilters(next);
  }

  async function onExport() {
    if (rows.length === 0 || exporting) {
      return;
    }
    setExporting(true);
    try {
      const blob = await analyticsService.exportCsv(filters);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "kapas-complaints.csv";
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <section className="space-y-5">
      <PageHeader
        title={t(locale, "portal.data.title")}
        description={t(locale, "portal.data.note")}
        action={
          <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
            <Button type="button" disabled={rows.length === 0 || exporting} onClick={() => void onExport()}>
              <Download size={16} />{t(locale, "portal.analytics.export")}
            </Button>
            <div className="flex items-center gap-2 rounded-card border border-border/80 bg-surface px-3 py-1.5 shadow-sm">
              <img
                src="/brand/puwf_logo.png"
                alt="PUWF Logo"
                className="h-12 w-auto max-w-[180px] object-contain sm:h-14"
              />
            </div>
          </div>
        }
      />

      <div className="overflow-hidden rounded-card border border-border bg-surface">
        <div className="flex items-center gap-3 border-b border-border px-4 py-4">
          <div className="grid h-9 w-9 place-items-center rounded-control bg-[var(--surface-soft-teal)] text-action">
            <Files aria-hidden size={18} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-ink">{t(locale, "portal.data.recordsTitle")}</h2>
            <p className="text-xs text-muted">{t(locale, "portal.data.recordsNote")}</p>
          </div>
        </div>
        <FilterBar value={draft} provinces={provinces.data ?? []} onChange={updateFilters} onClear={() => updateFilters(emptyFilters())} />
        {query.isLoading || !filtersReady ? <LoadingState label={t(locale, "common.loading")} /> : null}
        {query.isError ? <ErrorState title={t(locale, "common.error")} retryLabel={t(locale, "common.retry")} onRetry={() => void query.refetch()} /> : null}
        {query.isSuccess && rows.length === 0 ? <div className="p-6"><EmptyState title={t(locale, hasActiveFilters(draft) ? "portal.filters.empty" : "portal.data.empty")} actionLabel={hasActiveFilters(draft) ? t(locale, "portal.filters.clear") : undefined} onAction={hasActiveFilters(draft) ? () => updateFilters(emptyFilters()) : undefined} /></div> : null}
        {query.isSuccess && rows.length > 0 ? <ComplaintTable rows={rows} /> : null}
      </div>
    </section>
  );
}
