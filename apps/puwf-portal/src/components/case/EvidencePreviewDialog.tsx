"use client";

import { t } from "@kapas/localization";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useLocaleStore } from "@/stores/locale-store";

export type EvidencePreviewTarget = {
  id: string;
  label: string;
  href: string;
  kind: "photo" | "document";
};

export function EvidencePreviewDialog({
  file,
  onClose,
}: {
  file: EvidencePreviewTarget | null;
  onClose: () => void;
}) {
  const locale = useLocaleStore((s) => s.locale);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!file) {
      setObjectUrl(null);
      setFailed(false);
      setLoading(false);
      return;
    }
    let active = true;
    let url: string | null = null;
    setLoading(true);
    setFailed(false);
    void fetch(file.href, { credentials: "include" })
      .then((response) => {
        if (!response.ok) throw new Error("evidence_unavailable");
        return response.blob();
      })
      .then((blob) => {
        if (!active) return;
        url = URL.createObjectURL(blob);
        setObjectUrl(url);
      })
      .catch(() => {
        if (active) setFailed(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
      setObjectUrl(null);
    };
  }, [file]);

  return (
    <Dialog
      open={file !== null}
      onClose={onClose}
      title={file?.label ?? ""}
      size="xl"
      footer={
        <Button variant="secondary" className="h-10 px-4" onClick={onClose}>
          {t(locale, "common.close")}
        </Button>
      }
    >
      {loading ? (
        <div className="flex min-h-[240px] items-center justify-center text-muted">
          <Loader2 className="animate-spin" size={28} aria-hidden />
        </div>
      ) : null}
      {!loading && failed ? (
        <p className="text-base text-critical">This file could not be loaded.</p>
      ) : null}
      {!loading && !failed && objectUrl && file?.kind === "photo" ? (
        <div className="flex max-h-[min(70vh,720px)] items-center justify-center overflow-hidden rounded-control border border-border bg-page p-2">
          <img src={objectUrl} alt={file.label} className="max-h-[min(68vh,700px)] w-auto max-w-full object-contain" />
        </div>
      ) : null}
      {!loading && !failed && objectUrl && file?.kind === "document" ? (
        <iframe
          title={file.label}
          src={objectUrl}
          className="h-[min(70vh,720px)] w-full rounded-control border border-border bg-page"
        />
      ) : null}
    </Dialog>
  );
}
