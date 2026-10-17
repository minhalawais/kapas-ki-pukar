"use client";

import type { Complaint } from "@kapas/domain";
import { t, type MessageKey } from "@kapas/localization";
import { ChevronLeft, ChevronRight, Clock3 } from "lucide-react";
import Link from "next/link";

import { PriorityBadge, StatusBadge } from "@/components/ui/semantic-badge";
import { formatPortalDate } from "@/lib/case-workspace";
import { useLocaleStore } from "@/stores/locale-store";

export function CaseHeader({ complaint }: { complaint: Complaint }) {
  const locale = useLocaleStore((s) => s.locale);
  const BackIcon = locale === "ur" ? ChevronRight : ChevronLeft;
  const showPriority = complaint.priority === "Emergency" || complaint.priority === "Critical";

  return (
    <header className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <nav className="flex items-center gap-1 text-xs text-muted">
            <Link href="/dashboard" className="inline-flex items-center gap-1 font-semibold text-action">
              <BackIcon size={14} />
              {t(locale, "portal.case.breadcrumb")}
            </Link>
            <span aria-hidden> / </span>
            <span dir="ltr">{complaint.trackingId}</span>
          </nav>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[22px] font-semibold leading-7 text-ink">
                {t(locale, `category.${complaint.categoryCode}` as MessageKey)}
              </h1>
              {complaint.subcategoryCode ? (
                <span className="rounded-control bg-page px-2 py-1 font-mono text-[11px] text-muted">
                  {complaint.subcategoryCode}
                </span>
              ) : null}
              <StatusBadge status={complaint.status} />
              {showPriority ? <PriorityBadge priority={complaint.priority} /> : null}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
              <span className="font-mono font-semibold text-ink" dir="ltr">
                {complaint.trackingId}
              </span>
              <span>
                {t(locale, "portal.case.submitted")} {formatPortalDate(complaint.submittedAt, locale)}
              </span>
              <span>
                {t(locale, "portal.case.updated")} {formatPortalDate(complaint.updatedAt, locale)}
              </span>
              <span
                className={`inline-flex items-center gap-1 ${
                  complaint.overdue ? "font-semibold text-critical" : ""
                }`}
              >
                <Clock3 size={12} aria-hidden />
                {complaint.overdue
                  ? t(locale, "portal.case.overdue")
                  : `${t(locale, "portal.case.due")} ${formatPortalDate(complaint.dueAt, locale)}`}
              </span>
            </div>
          </div>
        </div>

        <div className="shrink-0 self-start">
          <div className="flex items-center gap-2 rounded-card border border-border/80 bg-surface px-3 py-1.5 shadow-sm">
            <img
              src="/brand/puwf_logo.png"
              alt="PUWF Logo"
              className="h-12 w-auto max-w-[180px] object-contain sm:h-14"
            />
          </div>
        </div>
      </div>
      <div className="border-b border-border" />
    </header>
  );
}
