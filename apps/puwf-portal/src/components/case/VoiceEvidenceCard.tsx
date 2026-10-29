"use client";

import type { VoiceEvidence } from "@kapas/domain";
import { t } from "@kapas/localization";
import { AudioLines } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDuration, protectedAudioSrc } from "@/lib/case-workspace";
import { useLocaleStore } from "@/stores/locale-store";

export function VoiceEvidenceCard({
  voice,
  evidenceStatus = "none",
}: {
  voice: VoiceEvidence | null;
  evidenceStatus?: "none" | "pending" | "processing" | "complete" | "action_required";
}) {
  const locale = useLocaleStore((s) => s.locale);
  const remote = protectedAudioSrc(voice?.localUri);
  const [src, setSrc] = useState<string>();
  const [loadFailed, setLoadFailed] = useState(false);
  const durationMs = voice?.durationMs;
  const awaitingMedia =
    !voice && (evidenceStatus === "pending" || evidenceStatus === "processing");

  useEffect(() => {
    if (!remote) {
      setSrc(undefined);
      setLoadFailed(false);
      return;
    }
    let objectUrl: string | undefined;
    let cancelled = false;
    setLoadFailed(false);
    void fetch(remote, { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) throw new Error(String(response.status));
        const mime = response.headers.get("content-type") ?? "audio/mp4";
        const buffer = await response.arrayBuffer();
        if (buffer.byteLength === 0) throw new Error("empty");
        return new Blob([buffer], { type: mime.split(";")[0]?.trim() || "audio/mp4" });
      })
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => {
        if (!cancelled) {
          setSrc(undefined);
          setLoadFailed(true);
        }
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [remote]);

  if (!voice && evidenceStatus === "none") return null;

  return (
    <Card>
      <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
        <AudioLines aria-hidden size={18} className="text-[var(--brand-fos-teal-dark)]" />
        {t(locale, "portal.case.voice")}
      </h2>
      <div className="mt-3 rounded-control bg-[var(--surface-soft-teal)] p-3">
        {src ? (
          <audio className="h-10 w-full" controls preload="metadata" src={src}>
            {t(locale, "portal.case.audioUnavailable")}
          </audio>
        ) : (
          <p className="text-sm text-muted">
            {awaitingMedia
              ? locale === "ur"
                ? "آواز اپ لوڈ یا جانچ کے مرحلے میں ہے۔"
                : "Voice recording is still uploading or being checked."
              : loadFailed
                ? t(locale, "portal.case.audioUnavailable")
                : t(locale, "common.loading")}
          </p>
        )}
        {loadFailed && remote ? (
          <Button
            type="button"
            variant="secondary"
            className="mt-2 h-9 text-xs"
            onClick={() => window.open(remote, "_blank", "noopener,noreferrer")}
          >
            {locale === "ur" ? "ریکارڈنگ کھولیں" : "Open recording"}
          </Button>
        ) : null}
        {durationMs ? (
          <p className="mt-1 text-xs text-muted">
            {t(locale, "portal.case.duration")}: {formatDuration(durationMs)}
          </p>
        ) : null}
      </div>
    </Card>
  );
}
