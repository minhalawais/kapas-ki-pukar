"use client";

import type { AIAnalysis } from "@kapas/domain";
import { t, type MessageKey } from "@kapas/localization";
import { AlertCircle, Sparkles } from "lucide-react";

import { Card } from "@/components/ui/card";
import { impactLabelKey } from "@/lib/case-workspace";
import { useLocaleStore } from "@/stores/locale-store";

export function AIInsightCard({ ai }: { ai: AIAnalysis | null }) {
  const locale = useLocaleStore((s) => s.locale);

  if (!ai || ai.failed) {
    return (
      <Card className="border-voice/30 bg-[var(--surface-soft-teal)]">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-ink"><Sparkles aria-hidden size={17} className="text-[var(--brand-fos-teal-dark)]" />{t(locale, "portal.case.ai")}</h2>
        <p className="mt-2 text-sm text-ink">{t(locale, "grievance.ai.unavailable")}</p>
      </Card>
    );
  }

  const facts = ai.extractedFacts;
  const affectedKey = impactLabelKey(facts?.affectedWorkers);
  const hasFacts = Boolean(facts?.locationText || facts?.affectedWorkers);

  return (
    <Card className="border-voice/30 bg-[var(--surface-soft-teal)]">
      <div className="flex items-start justify-between gap-3"><div><h2 className="flex items-center gap-2 text-sm font-semibold text-ink"><Sparkles aria-hidden size={17} className="text-[var(--brand-fos-teal-dark)]" />{t(locale, "portal.case.ai")}</h2><p className="mt-0.5 text-[11px] text-muted">{t(locale, "portal.case.aiAssistive")}</p></div><span className="rounded-control border border-voice/30 bg-surface px-2 py-1 text-[10px] font-semibold text-[var(--brand-fos-teal-dark)]">{t(locale, "portal.case.source.ai")}</span></div>
      <dl className="mt-3 space-y-2 text-sm">
        <div>
          <dt className="text-xs text-muted">{t(locale, "grievance.ai.summaryLabel")}</dt>
          <dd className="leading-6">{(locale === "ur" ? ai.summaryUr : ai.summaryEn) ?? ai.summaryEn ?? ai.summaryUr ?? t(locale, "grievance.ai.unavailable")}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">{t(locale, "grievance.ai.suggestedCategory")}</dt>
          <dd>
            {ai.suggestedCategory
              ? t(locale, `category.${ai.suggestedCategory}` as MessageKey)
              : t(locale, "common.empty")}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">{t(locale, "portal.case.suggestedPriority")}</dt>
          <dd>
            {ai.suggestedPriority
              ? t(locale, `portal.priority.${ai.suggestedPriority}` as MessageKey)
              : t(locale, "common.empty")}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">{t(locale, "portal.case.extractedFacts")}</dt>
          <dd>
            {hasFacts ? (
              <ul className="list-disc ps-4">
                {facts?.locationText ? (
                  <li>
                    {t(locale, "portal.case.facts.location")}: {facts.locationText}
                  </li>
                ) : null}
                {affectedKey ? (
                  <li>
                    {t(locale, "portal.case.facts.affected")}: {t(locale, affectedKey)}
                  </li>
                ) : null}
              </ul>
            ) : (
              t(locale, "portal.case.facts.none")
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">{t(locale, "portal.case.confidence")}</dt>
          <dd>{t(locale, `portal.case.confidence.${ai.confidence}` as MessageKey)}</dd>
        </div>
        {ai.humanReviewRequired ? (
          <div className="flex items-center gap-2 rounded-control border border-warning/30 bg-[var(--surface-soft-gold)] p-2">
            <AlertCircle aria-hidden size={16} className="shrink-0 text-warning" />
            <div><dt className="text-xs font-semibold text-ink">{t(locale, "portal.case.humanReview")}</dt><dd className="text-xs text-muted">{t(locale, "portal.case.humanReviewBody")}</dd></div>
          </div>
        ) : null}
      </dl>
    </Card>
  );
}
