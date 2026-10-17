"use client";

import type { Evidence } from "@kapas/domain";
import { t } from "@kapas/localization";
import { FileText, Image as ImageIcon, Paperclip, ShieldCheck } from "lucide-react";

import { Card } from "@/components/ui/card";
import { useLocaleStore } from "@/stores/locale-store";

export function EvidenceGallery({ evidence }: { evidence: Evidence[] }) {
  const locale = useLocaleStore((s) => s.locale);

  return (
    <Card>
      <div className="flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-sm font-semibold text-ink"><Paperclip aria-hidden size={18} className="text-[var(--brand-fos-teal-dark)]" />{t(locale, "portal.case.evidence")}</h2>{evidence.length > 0 ? <span className="rounded-full bg-page px-2 py-0.5 text-[11px] font-semibold text-muted tabular-nums">{evidence.length}</span> : null}</div>
      {evidence.length === 0 ? (
        <p className="mt-2 text-sm text-muted">{t(locale, "portal.case.noEvidence")}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {evidence.map((item) => (
            <li key={item.id} className="flex items-center gap-3 rounded-control border border-border px-3 py-2.5 text-sm">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-page text-[var(--brand-fos-teal-dark)]">{item.kind === "photo" ? <ImageIcon aria-hidden size={19} /> : <FileText aria-hidden size={19} />}</span>
              <div className="min-w-0 flex-1"><p className="truncate font-medium text-ink" dir="ltr">{item.fileName}</p>
              <p className="mt-0.5 text-xs text-muted">
                {t(
                  locale,
                  item.kind === "photo" ? "portal.case.evidence.photo" : "portal.case.evidence.document",
                )}
              </p></div><ShieldCheck aria-label={t(locale, "portal.case.evidenceStored")} size={17} className="shrink-0 text-success" />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
