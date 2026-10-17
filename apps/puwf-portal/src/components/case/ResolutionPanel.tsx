"use client";

import type { Complaint } from "@kapas/domain";
import { t, type MessageKey } from "@kapas/localization";
import { CheckCircle2, MessageSquareText } from "lucide-react";

import { useLocaleStore } from "@/stores/locale-store";

export function ResolutionPanel({ complaint }: { complaint: Complaint }) {
  const locale = useLocaleStore((s) => s.locale);
  if (!complaint.resolution && !complaint.workerFeedback) return null;
  return <section className="rounded-card border border-success/35 bg-[#E5F4EB] p-4" aria-labelledby="resolution-title"><div className="flex items-center gap-2"><CheckCircle2 aria-hidden size={19} className="text-success" /><h2 id="resolution-title" className="text-sm font-semibold text-ink">{t(locale, "portal.case.resolution")}</h2></div>{complaint.resolution ? <p className="mt-2 text-sm leading-6 text-ink">{complaint.resolution.summary}</p> : null}{complaint.workerFeedback ? <div className="mt-3 flex items-center gap-2 border-t border-success/20 pt-3 text-xs text-ink"><MessageSquareText aria-hidden size={15} className="text-success" /><span>{t(locale, "portal.case.workerFeedback")}: <strong>{t(locale, `portal.analytics.outcome.${complaint.workerFeedback.outcome}` as MessageKey)}</strong></span></div> : null}</section>;
}
