"use client";

import type { CaseStatus, Priority, PrivacyMode, WorkerCategoryCode } from "@kapas/domain";
import { caseStatuses, priorities, privacyModes, workerCategoryCodes } from "@kapas/domain";
import { t, type MessageKey } from "@kapas/localization";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useLocaleStore } from "@/stores/locale-store";

export interface DashboardFilterDraft {
  search: string;
  category: WorkerCategoryCode | "";
  status: CaseStatus | "";
  priority: Priority | "";
  province: string;
  privacy: PrivacyMode | "";
  from: string;
  to: string;
}

const fieldClass = "h-input w-full rounded-control border border-border bg-surface px-3 text-sm text-ink";

export function FilterBar({ value, provinces, onChange, onClear }: {
  value: DashboardFilterDraft;
  provinces: string[];
  onChange: (next: DashboardFilterDraft) => void;
  onClear: () => void;
}) {
  const locale = useLocaleStore((s) => s.locale);
  const [advanced, setAdvanced] = useState(false);
  const statuses = caseStatuses.filter((status) => status !== "Draft");
  const activeCount = Object.values(value).filter(Boolean).length;

  return (
    <form className="border-b border-border bg-surface px-3 py-3" aria-label={t(locale, "portal.filters.title")} onSubmit={(event) => event.preventDefault()}>
      <div className="flex flex-col gap-2 xl:flex-row">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">{t(locale, "portal.filters.search")}</span>
          <Search aria-hidden className="absolute start-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
          <input className={`${fieldClass} ps-9`} value={value.search} onChange={(event) => onChange({ ...value, search: event.target.value })} placeholder={t(locale, "portal.filters.searchHint")} />
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:flex xl:w-auto">
          <label><span className="sr-only">{t(locale, "portal.filters.category")}</span><select className={fieldClass} value={value.category} onChange={(event) => onChange({ ...value, category: event.target.value as WorkerCategoryCode | "" })}><option value="">{t(locale, "portal.filters.category")}: {t(locale, "portal.filters.all")}</option>{workerCategoryCodes.map((code) => <option key={code} value={code}>{t(locale, `category.${code}` as MessageKey)}</option>)}</select></label>
          <label><span className="sr-only">{t(locale, "portal.filters.status")}</span><select className={fieldClass} value={value.status} onChange={(event) => onChange({ ...value, status: event.target.value as CaseStatus | "" })}><option value="">{t(locale, "portal.filters.status")}: {t(locale, "portal.filters.all")}</option>{statuses.map((status) => <option key={status} value={status}>{t(locale, `portal.status.${status}` as MessageKey)}</option>)}</select></label>
          <label><span className="sr-only">{t(locale, "portal.filters.priority")}</span><select className={fieldClass} value={value.priority} onChange={(event) => onChange({ ...value, priority: event.target.value as Priority | "" })}><option value="">{t(locale, "portal.filters.priority")}: {t(locale, "portal.filters.all")}</option>{priorities.map((priority) => <option key={priority} value={priority}>{t(locale, `portal.priority.${priority}` as MessageKey)}</option>)}</select></label>
        </div>
        <Button type="button" variant="secondary" className="shrink-0" aria-expanded={advanced} onClick={() => setAdvanced((current) => !current)}><SlidersHorizontal size={16} />{t(locale, "portal.filters.more")}{activeCount > 0 ? <span className="rounded-full bg-page px-1.5 text-[11px] tabular-nums">{activeCount}</span> : null}</Button>
      </div>
      {advanced ? (
        <div className="mt-3 grid grid-cols-1 gap-2 border-t border-border pt-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs font-medium text-muted">{t(locale, "portal.filters.location")}<select className={`${fieldClass} mt-1`} value={value.province} onChange={(event) => onChange({ ...value, province: event.target.value })}><option value="">{t(locale, "portal.filters.all")}</option>{provinces.map((province) => <option key={province} value={province}>{t(locale, `province.${province}` as MessageKey)}</option>)}</select></label>
          <label className="text-xs font-medium text-muted">{t(locale, "portal.filters.privacy")}<select className={`${fieldClass} mt-1`} value={value.privacy} onChange={(event) => onChange({ ...value, privacy: event.target.value as PrivacyMode | "" })}><option value="">{t(locale, "portal.filters.all")}</option>{privacyModes.map((mode) => <option key={mode} value={mode}>{t(locale, `privacy.${mode}` as MessageKey)}</option>)}</select></label>
          <label className="text-xs font-medium text-muted">{t(locale, "portal.filters.from")}<input type="date" className={`${fieldClass} mt-1`} value={value.from} onChange={(event) => onChange({ ...value, from: event.target.value })} /></label>
          <label className="text-xs font-medium text-muted">{t(locale, "portal.filters.to")}<input type="date" className={`${fieldClass} mt-1`} value={value.to} onChange={(event) => onChange({ ...value, to: event.target.value })} /></label>
        </div>
      ) : null}
      {activeCount > 0 ? <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted"><span>{t(locale, "portal.filters.applied")}: {activeCount}</span><button type="button" className="inline-flex items-center gap-1 font-semibold text-action" onClick={onClear}><X size={13} />{t(locale, "portal.filters.clear")}</button></div> : null}
    </form>
  );
}
