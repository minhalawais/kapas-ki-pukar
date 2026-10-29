"use client";

import type { Evidence } from "@kapas/domain";
import { t } from "@kapas/localization";
import { Paperclip } from "lucide-react";
import { useState } from "react";

import { EvidenceAttachmentGrid } from "./EvidenceAttachmentGrid";
import { EvidencePreviewDialog, type EvidencePreviewTarget } from "./EvidencePreviewDialog";

import { Card } from "@/components/ui/card";
import { useLocaleStore } from "@/stores/locale-store";


export function EvidenceGallery({
  evidence,
  status = "none",
}: {
  evidence: Evidence[];
  status?: "none" | "pending" | "processing" | "complete" | "action_required";
}) {
  const locale = useLocaleStore((s) => s.locale);
  const [previewFile, setPreviewFile] = useState<EvidencePreviewTarget | null>(null);
  const files: EvidencePreviewTarget[] = evidence.map((item) => ({
    id: item.id,
    label: item.fileName,
    href: item.localUri,
    kind: item.kind === "photo" ? "photo" : "document",
  }));

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Paperclip aria-hidden size={18} className="text-[var(--brand-fos-teal-dark)]" />
          {t(locale, "portal.case.evidence")}
        </h2>
        {evidence.length > 0 ? (
          <span className="rounded-full bg-page px-2 py-0.5 text-[11px] font-semibold text-muted tabular-nums">
            {evidence.length}
          </span>
        ) : null}
      </div>
      {evidence.length === 0 ? (
        <p className="mt-2 text-sm text-muted" role={status === "action_required" ? "alert" : "status"}>
          {status === "pending" || status === "processing"
            ? (locale === "ur" ? "ثبوت اپ لوڈ یا جانچ کے مرحلے میں ہیں۔" : "Evidence is still uploading or being checked.")
            : status === "action_required"
              ? (locale === "ur" ? "ثبوت کی ترسیل کے لیے کارروائی درکار ہے۔" : "Evidence delivery needs attention.")
              : t(locale, "portal.case.noEvidence")}
        </p>
      ) : (
        <EvidenceAttachmentGrid compact files={files} onOpen={setPreviewFile} />
      )}
      <EvidencePreviewDialog file={previewFile} onClose={() => setPreviewFile(null)} />
    </Card>
  );
}
