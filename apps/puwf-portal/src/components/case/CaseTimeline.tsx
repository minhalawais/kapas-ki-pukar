"use client";

import { isWorkerVisibleAction, type CaseAction } from "@kapas/domain";
import { t } from "@kapas/localization";
import { Eye, LockKeyhole } from "lucide-react";

import { Card } from "@/components/ui/card";
import { actorLabelKey, eventLabelKey, formatDate, sortedTimeline } from "@/lib/case-workspace";
import { useLocaleStore } from "@/stores/locale-store";

export function CaseTimeline({ actions }: { actions: CaseAction[] }) {
  const locale = useLocaleStore((s) => s.locale);
  const rows = sortedTimeline(actions);

  return (
    <Card className="h-fit">
      <h2 className="text-sm font-semibold text-ink">{t(locale, "portal.case.timeline")}</h2>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-muted">{t(locale, "portal.case.timeline.empty")}</p>
      ) : (
        <ol className="mt-3 space-y-0">
          {rows.map((item, index) => {
            const workerVisible = isWorkerVisibleAction(item);
            return (
            <li key={item.id} className="relative border-s border-border pb-4 ps-4 last:border-transparent last:pb-0"><span className={`absolute -start-[5px] top-1 h-2.5 w-2.5 rounded-full border-2 border-surface ${index === rows.length - 1 ? "bg-action" : "bg-[var(--progress-accent)]"}`} />
              <div className="flex flex-wrap items-start justify-between gap-2"><p className="text-sm font-medium text-ink">{t(locale, eventLabelKey(item.type))}</p><span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted">{workerVisible ? <Eye size={11} /> : <LockKeyhole size={11} />}{t(locale, workerVisible ? "portal.case.visibility.worker" : "portal.case.visibility.internal")}</span></div>
              <p className="text-xs text-muted">
                {formatDate(item.at)} · {t(locale, actorLabelKey(item.actorRole))}
              </p>
              {item.note ? <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{item.note}</p> : null}
            </li>);
          })}
        </ol>
      )}
    </Card>
  );
}
