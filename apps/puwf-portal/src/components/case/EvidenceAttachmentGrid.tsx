"use client";

import { FileText } from "lucide-react";
import { useEffect, useState } from "react";

import type { EvidencePreviewTarget } from "./EvidencePreviewDialog";

function Thumbnail({ href, label }: { href: string; label: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let url: string | null = null;
    void fetch(href, { credentials: "include" })
      .then((response) => {
        if (!response.ok) throw new Error("thumb_unavailable");
        return response.blob();
      })
      .then((blob) => {
        if (!active) return;
        url = URL.createObjectURL(blob);
        setSrc(url);
      })
      .catch(() => {
        if (active) setSrc(null);
      });
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [href]);

  if (!src) {
    return <div className="h-full w-full bg-page" aria-hidden />;
  }

  return (
    <img src={src} alt={label} className="h-full w-full object-cover" />
  );
}

export function EvidenceAttachmentGrid({
  files,
  onOpen,
  compact = false,
}: {
  files: EvidencePreviewTarget[];
  onOpen: (file: EvidencePreviewTarget) => void;
  compact?: boolean;
}) {
  if (files.length === 0) return null;

  return (
    <ul
      className={
        compact
          ? "mt-2 grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-2 sm:max-w-xl"
          : "mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3"
      }
    >
      {files.map((file) => (
        <li key={file.id}>
          <button
            type="button"
            onClick={() => onOpen(file)}
            className="flex w-full flex-col overflow-hidden rounded-control border border-border bg-surface text-left shadow-sm transition-colors hover:border-[var(--brand-fos-teal-dark)] hover:bg-page"
          >
            <div
              className={
                compact
                  ? "relative h-[68px] w-full overflow-hidden border-b border-border bg-page"
                  : "relative aspect-[4/3] w-full overflow-hidden border-b border-border bg-page"
              }
            >
              {file.kind === "photo" ? (
                <Thumbnail href={file.href} label={file.label} />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-1 text-[var(--brand-fos-teal-dark)]">
                  <FileText size={compact ? 22 : 32} aria-hidden />
                  <span className="text-[9px] font-semibold uppercase tracking-wide text-muted">PDF</span>
                </div>
              )}
            </div>
            <p
              className={
                compact
                  ? "truncate px-2 py-1 text-[11px] font-medium text-ink"
                  : "truncate px-2.5 py-2 text-sm font-medium text-ink"
              }
              dir="ltr"
              title={file.label}
            >
              {file.label}
            </p>
          </button>
        </li>
      ))}
    </ul>
  );
}
