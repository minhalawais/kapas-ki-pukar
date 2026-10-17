"use client";

import { workerFacingStatusKey, workerNextStepKey, type Complaint } from "@kapas/domain";
import { t, type MessageKey } from "@kapas/localization";
import { Eye, X } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/semantic-badge";
import { useLocaleStore } from "@/stores/locale-store";

function needsWorkerInformation(complaint: Complaint): boolean {
  return (
    complaint.status !== "Resolved" &&
    complaint.status !== "Closed" &&
    complaint.actions.some((action) => action.type === "More Information Requested")
  );
}

export function WorkerViewDrawer({
  complaint,
  open,
  onClose,
}: {
  complaint: Complaint;
  open: boolean;
  onClose: () => void;
}) {
  const locale = useLocaleStore((s) => s.locale);
  const needsInfo = needsWorkerInformation(complaint);
  const statusKey = (needsInfo ? "status.worker.needInfo" : workerFacingStatusKey[complaint.status]) as MessageKey;
  const nextStepKey = (needsInfo ? "complaints.next.awaiting" : workerNextStepKey[complaint.status]) as MessageKey;

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-ink/35"
        aria-label={t(locale, "common.close")}
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="worker-view-title"
        className="absolute inset-y-0 end-0 flex w-full max-w-md flex-col border-s border-border bg-[var(--surface-warm)] shadow-xl"
      >
        <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3">
          <div className="flex items-center gap-2">
            <Eye size={18} className="text-action" />
            <h2 id="worker-view-title" className="text-base font-semibold text-ink">
              {t(locale, "portal.case.workerView")}
            </h2>
          </div>
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-control hover:bg-page"
            aria-label={t(locale, "common.close")}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-5">
          <p className="text-xs text-muted">{t(locale, "portal.case.workerViewNote")}</p>
          <div className="mt-5 rounded-card border border-border bg-surface p-4">
            <p className="font-mono text-xs text-muted" dir="ltr">
              {complaint.trackingId}
            </p>
            <div className="mt-3">
              <StatusBadge status={complaint.status} />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-ink">{t(locale, statusKey)}</h3>
            <div className={`mt-4 rounded-card p-3 ${complaint.overdue ? "bg-[#FCEAEA]" : "bg-[var(--surface-soft-teal)]"}`}>
              <p className="text-xs font-semibold text-ink">{t(locale, "complaints.nextAction")}</p>
              <p className="mt-1 text-sm leading-6 text-ink">
                {t(locale, (complaint.overdue ? "complaints.next.overdue" : nextStepKey) as MessageKey)}
              </p>
            </div>
            {complaint.resolution ? (
              <div className="mt-4 border-t border-border pt-4">
                <p className="text-xs font-semibold text-muted">{t(locale, "portal.case.resolution")}</p>
                <p className="mt-1 text-sm leading-6 text-ink">{complaint.resolution.summary}</p>
              </div>
            ) : null}
          </div>
        </div>
        <footer className="border-t border-border bg-surface p-4">
          <Button type="button" variant="secondary" className="w-full" onClick={onClose}>
            {t(locale, "common.close")}
          </Button>
        </footer>
      </aside>
    </div>
  );
}
