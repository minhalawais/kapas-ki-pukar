"use client";

import type { CaseStatus, Gender, Priority, PrivacyMode, WorkerCategoryCode } from "@kapas/domain";
import { caseStatuses, genders, priorities, privacyModes, workerCategoryCodes } from "@kapas/domain";
import { t, type MessageKey } from "@kapas/localization";
import { SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLocaleStore } from "@/stores/locale-store";

export interface AnalyticsFilterDraft {
  category: WorkerCategoryCode | "";
  status: CaseStatus | "";
  priority: Priority | "";
  province: string;
  privacy: PrivacyMode | "";
  gender: Gender | "";
  from: string;
  to: string;
}

const fieldClass =
  "h-input w-full rounded-control border border-border bg-surface px-2 text-sm text-ink";

export function AnalyticsFilterBar({
  value,
  provinces,
  onChange,
  onClear,
}: {
  value: AnalyticsFilterDraft;
  provinces: string[];
  onChange: (next: AnalyticsFilterDraft) => void;
  onClear: () => void;
}) {
  const locale = useLocaleStore((s) => s.locale);
  const statuses = caseStatuses.filter((status) => status !== "Draft");
  const activeCount = Object.values(value).filter(Boolean).length;

  return (
    <div className="rounded-card border border-border bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3"><div className="flex items-center gap-2"><SlidersHorizontal aria-hidden size={17} className="text-[var(--brand-fos-teal-dark)]" /><div><h2 className="text-sm font-semibold text-ink">{t(locale, "portal.analytics.filterTitle")}</h2><p className="text-[11px] text-muted">{t(locale, "portal.analytics.filterNote")}</p></div></div>{activeCount > 0 ? <Button type="button" variant="ghost" className="h-8 text-xs" onClick={onClear}><X size={14} />{t(locale, "portal.filters.clear")}</Button> : null}</div>
      <div className="p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="block text-xs text-muted">
          {t(locale, "portal.filters.from")}
          <input
            type="date"
            className={`${fieldClass} mt-1`}
            value={value.from}
            onChange={(event) => onChange({ ...value, from: event.target.value })}
          />
        </label>
        <label className="block text-xs text-muted">
          {t(locale, "portal.filters.to")}
          <input
            type="date"
            className={`${fieldClass} mt-1`}
            value={value.to}
            onChange={(event) => onChange({ ...value, to: event.target.value })}
          />
        </label>
        <label className="block text-xs text-muted">
          {t(locale, "portal.filters.category")}
          <select
            className={`${fieldClass} mt-1`}
            value={value.category}
            onChange={(event) =>
              onChange({ ...value, category: event.target.value as WorkerCategoryCode | "" })
            }
          >
            <option value="">{t(locale, "portal.filters.all")}</option>
            {workerCategoryCodes.map((code) => (
              <option key={code} value={code}>
                {t(locale, `category.${code}` as MessageKey)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-muted">
          {t(locale, "portal.filters.status")}
          <select
            className={`${fieldClass} mt-1`}
            value={value.status}
            onChange={(event) => onChange({ ...value, status: event.target.value as CaseStatus | "" })}
          >
            <option value="">{t(locale, "portal.filters.all")}</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {t(locale, `portal.status.${status}` as MessageKey)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-muted">
          {t(locale, "portal.filters.priority")}
          <select
            className={`${fieldClass} mt-1`}
            value={value.priority}
            onChange={(event) => onChange({ ...value, priority: event.target.value as Priority | "" })}
          >
            <option value="">{t(locale, "portal.filters.all")}</option>
            {priorities.map((priority) => (
              <option key={priority} value={priority}>
                {t(locale, `portal.priority.${priority}` as MessageKey)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-muted">
          {t(locale, "portal.filters.location")}
          <select
            className={`${fieldClass} mt-1`}
            value={value.province}
            onChange={(event) => onChange({ ...value, province: event.target.value })}
          >
            <option value="">{t(locale, "portal.filters.all")}</option>
            {provinces.map((province) => (
              <option key={province} value={province}>
                {t(locale, `province.${province}` as MessageKey)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-muted">
          {t(locale, "portal.filters.privacy")}
          <select
            className={`${fieldClass} mt-1`}
            value={value.privacy}
            onChange={(event) => onChange({ ...value, privacy: event.target.value as PrivacyMode | "" })}
          >
            <option value="">{t(locale, "portal.filters.all")}</option>
            {privacyModes.map((mode) => (
              <option key={mode} value={mode}>
                {t(locale, `privacy.${mode}` as MessageKey)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-muted">
          {t(locale, "portal.filters.gender")}
          <select
            className={`${fieldClass} mt-1`}
            value={value.gender}
            onChange={(event) => onChange({ ...value, gender: event.target.value as Gender | "" })}
          >
            <option value="">{t(locale, "portal.filters.all")}</option>
            {genders.map((gender) => (
              <option key={gender} value={gender}>
                {t(locale, `portal.gender.${gender}` as MessageKey)}
              </option>
            ))}
          </select>
        </label>
      </div>
      </div>
    </div>
  );
}
