"use client";

import { t } from "@kapas/localization";
import { useParams } from "next/navigation";

import { ActionRail } from "@/components/case/ActionRail";
import { AIInsightCard } from "@/components/case/AIInsightCard";
import { CaseHeader } from "@/components/case/CaseHeader";
import { CaseSafetyBanner } from "@/components/case/CaseSafetyBanner";
import { CaseTimeline } from "@/components/case/CaseTimeline";
import { EvidenceGallery } from "@/components/case/EvidenceGallery";
import { ResolutionPanel } from "@/components/case/ResolutionPanel";
import { VoiceEvidenceCard } from "@/components/case/VoiceEvidenceCard";
import { WorkerReportPanel } from "@/components/case/WorkerReportPanel";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { LoadingState } from "@/components/states/loading-state";
import { useCaseWorkspace } from "@/lib/use-case-actions";
import { useLocaleStore } from "@/stores/locale-store";

export default function ComplaintDetailPage() {
  const locale = useLocaleStore((s) => s.locale);
  const params = useParams<{ id: string }>();
  const id = params.id ?? "";
  const workspace = useCaseWorkspace(id);
  const { query, available } = workspace;
  const complaint = query.data;

  if (query.isLoading) {
    return <LoadingState label={t(locale, "common.loading")} />;
  }
  if (query.isError) {
    return (
      <ErrorState
        title={t(locale, "common.error")}
        retryLabel={t(locale, "common.retry")}
        onRetry={() => {
          void query.refetch();
        }}
      />
    );
  }
  if (!complaint) {
    return <EmptyState title={t(locale, "portal.case.empty")} />;
  }
  if (!available) {
    return <LoadingState label={t(locale, "common.loading")} />;
  }

  return (
    <section className="space-y-5">
      <CaseHeader complaint={complaint} />
      <CaseSafetyBanner complaint={complaint} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          <WorkerReportPanel complaint={complaint} />
          <VoiceEvidenceCard
            voice={complaint.voice}
            transcriptUr={complaint.ai?.transcriptUr}
            transcriptEn={complaint.ai?.transcriptEn}
          />
          <EvidenceGallery evidence={complaint.evidence} />
          <AIInsightCard ai={complaint.ai} />
          <ResolutionPanel complaint={complaint} />
        </div>
        <aside className="space-y-4 xl:sticky xl:top-[76px] xl:self-start">
          <ActionRail
            available={available}
            currentPriority={complaint.priority}
            pending={workspace.pending}
            workspace={workspace}
          />
          <CaseTimeline actions={complaint.actions} />
        </aside>
      </div>
    </section>
  );
}
