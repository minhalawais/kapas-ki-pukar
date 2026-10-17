"use client";

import type { CaseStatus, Priority, PrivacyMode } from "@kapas/domain";
import { t, type MessageKey } from "@kapas/localization";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  Clock3,
  Eye,
  EyeOff,
  Flag,
  LockKeyhole,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useLocaleStore } from "@/stores/locale-store";

const statusConfig: Record<CaseStatus, { icon: typeof Clock3; className: string }> = {
  Draft: { icon: CircleDot, className: "bg-page text-muted" },
  Submitted: { icon: CircleDot, className: "bg-[var(--surface-soft-blue)] text-info" },
  "Under Review": { icon: Eye, className: "bg-[var(--surface-soft-teal)] text-[var(--brand-fos-teal-dark)]" },
  "Action in Progress": { icon: Clock3, className: "bg-[var(--surface-soft-teal)] text-[var(--brand-fos-teal-dark)]" },
  "Proposed Resolution": { icon: CheckCircle2, className: "bg-[var(--surface-soft-teal)] text-success" },
  Resolved: { icon: CheckCircle2, className: "bg-[#E5F4EB] text-success" },
  Closed: { icon: CheckCircle2, className: "bg-page text-muted" },
  Reopened: { icon: RotateCcw, className: "bg-[var(--surface-soft-blue)] text-info" },
};

const priorityConfig: Record<Priority, { icon: typeof Flag; className: string }> = {
  Emergency: { icon: AlertTriangle, className: "bg-[#FCEAEA] text-critical" },
  Critical: { icon: ShieldAlert, className: "bg-[var(--surface-soft-gold)] text-[#9B5B08]" },
  High: { icon: Flag, className: "bg-[var(--surface-soft-blue)] text-info" },
  Standard: { icon: Flag, className: "bg-page text-muted" },
};

const privacyConfig: Record<PrivacyMode, { icon: typeof EyeOff; className: string }> = {
  ANON: { icon: EyeOff, className: "bg-page text-ink" },
  CONF: { icon: LockKeyhole, className: "bg-[var(--surface-soft-gold)] text-[#81510B]" },
  IDEN: { icon: Eye, className: "bg-[var(--surface-soft-blue)] text-info" },
};

function Badge({ label, icon: Icon, className }: { label: string; icon: typeof Clock3; className: string }) {
  return (
    <span className={cn("inline-flex min-h-6 items-center gap-1 rounded-control px-2 py-1 text-xs font-semibold", className)}>
      <Icon aria-hidden size={13} strokeWidth={2.2} />
      {label}
    </span>
  );
}

export function StatusBadge({ status }: { status: CaseStatus }) {
  const locale = useLocaleStore((s) => s.locale);
  return <Badge label={t(locale, `portal.status.${status}` as MessageKey)} {...statusConfig[status]} />;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const locale = useLocaleStore((s) => s.locale);
  return <Badge label={t(locale, `portal.priority.${priority}` as MessageKey)} {...priorityConfig[priority]} />;
}

export function PrivacyBadge({ privacy }: { privacy: PrivacyMode }) {
  const locale = useLocaleStore((s) => s.locale);
  return <Badge label={t(locale, `privacy.${privacy}` as MessageKey)} {...privacyConfig[privacy]} />;
}
