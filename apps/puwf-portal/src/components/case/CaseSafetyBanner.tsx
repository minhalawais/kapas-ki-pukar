"use client";

import type { Complaint } from "@kapas/domain";
import { t } from "@kapas/localization";
import { AlertTriangle, ShieldAlert } from "lucide-react";

import { useLocaleStore } from "@/stores/locale-store";

export function CaseSafetyBanner({ complaint }: { complaint: Complaint }) {
  const locale = useLocaleStore((s) => s.locale);
  if (!complaint.incident.currentDanger && !complaint.incident.immediateDanger && complaint.priority !== "Emergency") return null;
  const immediate = complaint.incident.immediateDanger || complaint.priority === "Emergency";
  const Icon = immediate ? AlertTriangle : ShieldAlert;
  return <section className={`flex items-start gap-3 rounded-card border px-4 py-3 ${immediate ? "border-critical/35 bg-[#FCEAEA]" : "border-warning/40 bg-[var(--surface-soft-gold)]"}`} aria-labelledby="safety-title"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-control bg-surface ${immediate ? "text-critical" : "text-warning"}`}><Icon aria-hidden size={19} /></span><div><h2 id="safety-title" className="text-sm font-semibold text-ink">{t(locale, immediate ? "portal.case.safety.immediate" : "portal.case.safety.current")}</h2><p className="mt-0.5 text-xs text-ink">{t(locale, immediate ? "portal.case.safety.immediateBody" : "portal.case.safety.currentBody")}</p></div></section>;
}
