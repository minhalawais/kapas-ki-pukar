"use client";

import type { VoiceEvidence } from "@kapas/domain";
import { t } from "@kapas/localization";
import { AudioLines } from "lucide-react";

import { Card } from "@/components/ui/card";
import { demoAudioSrc, formatDuration } from "@/lib/case-workspace";
import { useLocaleStore } from "@/stores/locale-store";

export function VoiceEvidenceCard({
  voice,
  transcriptUr,
  transcriptEn,
}: {
  voice: VoiceEvidence | null;
  transcriptUr?: string;
  transcriptEn?: string;
}) {
  const locale = useLocaleStore((s) => s.locale);
  const src = demoAudioSrc(voice?.localUri);
  const durationMs = voice?.durationMs ?? 18300;
  const defaultTranscriptUr = "السلام علیکم۔ میں کھیت میں کام کرتی ہوں۔ اسپرے کے فوراً بعد ہمیں کھیت میں کام کے لیے بھیج دیا گیا اور کیمیائی بو کی وجہ سے ہماری طبیعت خراب ہوئی۔ ہم چاہتے ہیں کہ کام کی جگہ پر ہماری صحت اور حفاظت کا خیال رکھا جائے۔";
  const defaultTranscriptEn = "Assalam-o-Alaikum. I work in the field. Immediately after spraying, we were sent into the field to work, and the chemical smell caused us to feel ill. We want our health and safety to be respected at the workplace.";

  return (
    <Card>
      <h2 className="flex items-center gap-2 text-sm font-semibold text-ink"><AudioLines aria-hidden size={18} className="text-[var(--brand-fos-teal-dark)]" />{t(locale, "portal.case.voice")}</h2>
      <div className="mt-3 space-y-3">
        <div className="rounded-control bg-[var(--surface-soft-teal)] p-3">
          <audio className="h-10 w-full" controls preload="metadata" src={src}>{t(locale, "portal.case.audioUnavailable")}</audio>
          <p className="mt-1 text-xs text-muted">
            {t(locale, "portal.case.duration")}: {formatDuration(durationMs)}
          </p>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-control border border-border bg-page p-3">
          <p className="text-xs text-muted">{t(locale, "portal.case.transcript")}</p>
          <p className="mt-1 font-urdu text-sm leading-6 text-ink" dir="rtl">{transcriptUr ?? defaultTranscriptUr}</p>
        </div>
        <div className="rounded-control border border-border bg-page p-3">
          <p className="text-xs text-muted">{t(locale, "portal.case.translation")}</p>
          <p className="mt-1 text-sm leading-6 text-ink" dir="ltr">{transcriptEn ?? defaultTranscriptEn}</p>
        </div>
        </div>
      </div>
    </Card>
  );
}
