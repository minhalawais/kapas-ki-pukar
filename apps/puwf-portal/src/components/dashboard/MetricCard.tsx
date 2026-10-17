import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";

export function MetricCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
  helper,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "neutral" | "critical" | "warning" | "info" | "success";
  helper?: string;
}) {
  const toneClass = {
    neutral: "bg-page text-muted",
    critical: "bg-[#FCEAEA] text-critical",
    warning: "bg-[var(--surface-soft-gold)] text-[#9B5B08]",
    info: "bg-[var(--surface-soft-blue)] text-info",
    success: "bg-[#E5F4EB] text-success",
  }[tone];
  return (
    <Card className="flex min-h-24 items-start justify-between gap-3 p-4">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-muted">{label}</p>
        <p className="mt-1 text-[28px] font-semibold leading-[34px] text-ink tabular-nums">{value}</p>
        {helper ? <p className="mt-1 truncate text-[11px] text-muted">{helper}</p> : null}
      </div>
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-control ${toneClass}`}><Icon aria-hidden size={18} /></span>
    </Card>
  );
}
