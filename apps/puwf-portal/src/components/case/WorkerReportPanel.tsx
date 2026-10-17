"use client";

import { getWorkflowNode, type Complaint } from "@kapas/domain";
import { t, type MessageKey } from "@kapas/localization";
import { CalendarDays, Contact, Fingerprint, MapPin, ShieldCheck, Users } from "lucide-react";
import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { PrivacyBadge } from "@/components/ui/semantic-badge";
import { fullLocationLabel, identityLabel, structuredAnswerRows } from "@/lib/case-workspace";
import { useLocaleStore } from "@/stores/locale-store";

function Fact({
  icon: Icon,
  label,
  value,
  ltr = false,
  children,
}: {
  icon: typeof MapPin;
  label: string;
  value?: string;
  ltr?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-start gap-2.5 py-2">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-control bg-page text-[var(--brand-fos-teal-dark)]">
        <Icon aria-hidden size={16} />
      </span>
      <div className="min-w-0">
        <dt className="text-[11px] font-medium text-muted">{label}</dt>
        {children ?? (
          <dd className="mt-0.5 break-words text-sm font-medium text-ink" dir={ltr ? "ltr" : undefined}>
            {value}
          </dd>
        )}
      </div>
    </div>
  );
}

export function WorkerReportPanel({ complaint }: { complaint: Complaint }) {
  const locale = useLocaleStore((s) => s.locale);
  const identity = identityLabel(complaint);
  const rows = structuredAnswerRows(complaint);
  const affected = complaint.affectedRange ?? complaint.incident.othersAffected;
  const cnic = identity.last4 ? `••••-•••••••-${identity.last4}` : t(locale, "portal.case.identity.notStored");
  const contactValue = complaint.incident.structuredAnswers.contact;
  const contactOption = typeof contactValue === "string" ? getWorkflowNode("contact")?.options?.find((option) => option.value === contactValue) : null;
  const gender = complaint.privacyMode === "ANON" ? "Not Stated" : (complaint.gender ?? "Not Stated");

  return <Card className="p-0">
    <div className="border-b border-border px-4 py-3"><div className="flex items-center justify-between gap-3"><div><h2 className="text-base font-semibold text-ink">{t(locale, "portal.case.workerReport")}</h2><p className="mt-0.5 text-xs text-muted">{t(locale, "portal.case.workerReportNote")}</p></div><span className="rounded-control bg-[var(--surface-soft-teal)] px-2 py-1 text-[11px] font-semibold text-[var(--brand-fos-teal-dark)]">{t(locale, "portal.case.source.worker")}</span></div></div>
    <div className="grid grid-cols-1 divide-y divide-border px-4 sm:grid-cols-2 sm:divide-x sm:divide-y-0 rtl:sm:divide-x-reverse">
      <dl className="divide-y divide-border sm:pe-4"><Fact icon={MapPin} label={t(locale, "portal.table.location")} value={fullLocationLabel(complaint) || t(locale, "portal.case.notAvailable")} /><Fact icon={CalendarDays} label={t(locale, "portal.case.incidentWhen")} value={complaint.incident.whenLabel || t(locale, "portal.case.notAvailable")} /><Fact icon={Users} label={t(locale, "portal.case.facts.affected")} value={t(locale, affected === "individual" ? "others.no" : `range.${affected === "more-than-20" ? "20+" : affected === "not-sure" ? "unsure" : affected}` as MessageKey)} /></dl>
      <dl className="divide-y divide-border sm:ps-4">
        <Fact icon={ShieldCheck} label={t(locale, "portal.table.privacy")}>
          <dd className="mt-1">
            <PrivacyBadge privacy={complaint.privacyMode} />
          </dd>
        </Fact>
        <Fact
          icon={Contact}
          label={t(locale, "portal.case.contact")}
          value={
            contactOption
              ? t(locale, contactOption.labelKey as MessageKey)
              : t(locale, complaint.reporter.contactAllowed ? "common.yes" : "common.no")
          }
        />
        <Fact
          icon={Fingerprint}
          label={t(locale, "portal.case.identity")}
          value={`${cnic}${identity.last4 ? ` · ${t(locale, identity.verified ? "portal.case.identity.verified" : "portal.case.identity.unverified")}` : ""}`}
          ltr
        />
      </dl>
    </div>
    <dl className="grid grid-cols-1 border-t border-border bg-page px-4 py-2 sm:grid-cols-3 sm:divide-x sm:divide-border rtl:sm:divide-x-reverse"><div className="py-2 sm:px-3"><dt className="text-[11px] text-muted">{t(locale, "portal.case.reporterType")}</dt><dd className="mt-0.5 text-sm font-medium text-ink">{t(locale, `portal.reporter.${complaint.reporterType}` as MessageKey)}</dd></div><div className="py-2 sm:px-3"><dt className="text-[11px] text-muted">{t(locale, "portal.case.workerType")}</dt><dd className="mt-0.5 text-sm font-medium text-ink">{complaint.affectedWorkerType ? t(locale, `portal.employment.${complaint.affectedWorkerType}` as MessageKey) : t(locale, "portal.case.notAvailable")}</dd></div><div className="py-2 sm:px-3"><dt className="text-[11px] text-muted">{t(locale, "portal.filters.gender")}</dt><dd className="mt-0.5 text-sm font-medium text-ink">{t(locale, `portal.gender.${gender}` as MessageKey)}</dd></div></dl>
    {rows.length > 0 ? <div className="border-t border-border px-4 py-4"><h3 className="text-sm font-semibold text-ink">{t(locale, "portal.case.structuredDetails")}</h3><dl className="mt-2 divide-y divide-border">{rows.map((row) => <div key={row.id} className="grid gap-1 py-2.5 sm:grid-cols-[minmax(180px,0.8fr)_minmax(0,1.2fr)] sm:gap-4"><dt className="text-xs text-muted">{t(locale, row.promptKey)}</dt><dd className="text-sm font-medium text-ink">{[...row.answerKeys.map((key) => t(locale, key)), ...row.rawValues].join("، ")}</dd></div>)}</dl></div> : null}
  </Card>;
}
