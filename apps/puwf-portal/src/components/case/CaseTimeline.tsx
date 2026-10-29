"use client";

import type { Complaint } from "@kapas/domain";
import { actionDetailText, actionSummaryText, isWorkerVisibleAction, type CaseAction } from "@kapas/domain";
import { t } from "@kapas/localization";
import { Eye, LockKeyhole } from "lucide-react";
import { useState } from "react";

import { EvidenceAttachmentGrid } from "./EvidenceAttachmentGrid";
import { EvidencePreviewDialog, type EvidencePreviewTarget } from "./EvidencePreviewDialog";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import {
  actorLabelKey,
  eventLabelKey,
  formatDate,
  sortedTimeline,
  timelineAttachmentsForAction,
} from "@/lib/case-workspace";
import { useLocaleStore } from "@/stores/locale-store";


export function CaseTimeline({
  actions,
  complaint,
}: {
  actions: CaseAction[];
  complaint: Pick<Complaint, "evidence" | "referenceNumber" | "trackingId">;
}) {
  const locale = useLocaleStore((s) => s.locale);
  const rows = sortedTimeline(actions);
  const [selected, setSelected] = useState<CaseAction | null>(null);
  const [previewFile, setPreviewFile] = useState<EvidencePreviewTarget | null>(null);
  const summary = selected ? actionSummaryText(selected) : undefined;
  const caseKey = complaint.referenceNumber ?? complaint.trackingId;
  const attachments = selected
    ? timelineAttachmentsForAction(selected, complaint.evidence, caseKey)
    : [];

  return (
    <Card className="h-fit">
      <h2 className="text-sm font-semibold text-ink">{t(locale, "portal.case.timeline")}</h2>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-muted">{t(locale, "portal.case.timeline.empty")}</p>
      ) : (
        <ol className="mt-3 space-y-0">
          {rows.map((item, index) => {
            const workerVisible = isWorkerVisibleAction(item);
            const preview = actionDetailText(item);
            return (
              <li key={item.id} className="relative border-s border-border pb-4 ps-4 last:border-transparent last:pb-0">
                <span
                  className={`absolute -start-[5px] top-1 h-2.5 w-2.5 rounded-full border-2 border-surface ${index === rows.length - 1 ? "bg-action" : "bg-[var(--progress-accent)]"}`}
                />
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => setSelected(item)}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-sm font-medium text-ink">{t(locale, eventLabelKey(item.type))}</p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted">
                      {workerVisible ? <Eye size={11} /> : <LockKeyhole size={11} />}
                      {t(locale, workerVisible ? "portal.case.visibility.worker" : "portal.case.visibility.internal")}
                    </span>
                  </div>
                  <p className="text-xs text-muted">
                    {formatDate(item.at)} · {t(locale, actorLabelKey(item.actorRole))}
                  </p>
                  {preview ? (
                    <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-sm text-ink">{preview}</p>
                  ) : (
                    <p className="mt-1 text-xs text-muted">View details</p>
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      )}
      <Dialog
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected ? t(locale, eventLabelKey(selected.type)) : ""}
        size="lg"
        footer={
          <Button variant="secondary" className="h-10 px-4" onClick={() => setSelected(null)}>
            {t(locale, "common.close")}
          </Button>
        }
      >
        {selected ? (
          <>
            <p className="text-sm text-muted">
              {formatDate(selected.at)} · {t(locale, actorLabelKey(selected.actorRole))}
            </p>
            {summary ? (
              <p className="mt-2 whitespace-pre-wrap text-ink">{summary}</p>
            ) : (
              <p className="mt-2 text-muted">No written detail was stored for this entry.</p>
            )}
            {attachments.length > 0 ? (
              <div className="mt-4 border-t border-border pt-4">
                <p className="text-sm font-semibold text-ink">IO documents</p>
                <EvidenceAttachmentGrid files={attachments} onOpen={setPreviewFile} />
              </div>
            ) : null}
          </>
        ) : null}
      </Dialog>
      <EvidencePreviewDialog file={previewFile} onClose={() => setPreviewFile(null)} />
    </Card>
  );
}
