"use client";

import { t } from "@kapas/localization";
import { useParams } from "next/navigation";

import { CaseHeader } from "@/components/case/CaseHeader";
import { CaseSafetyBanner } from "@/components/case/CaseSafetyBanner";
import { CaseStageStepper } from "@/components/case/CaseStageStepper";
import { CaseTimeline } from "@/components/case/CaseTimeline";
import { EvidenceGallery } from "@/components/case/EvidenceGallery";
import { ResolutionPanel } from "@/components/case/ResolutionPanel";
import { StructuredActionPanel } from "@/components/case/StructuredActionPanel";
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
      <CaseStageStepper status={complaint.status} actions={complaint.actions} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          <WorkerReportPanel complaint={complaint} />
          <VoiceEvidenceCard voice={complaint.voice} evidenceStatus={complaint.evidenceStatus} />
          <EvidenceGallery evidence={complaint.evidence} status={complaint.evidenceStatus} />
          <ResolutionPanel complaint={complaint} />
        </div>
        <aside className="space-y-4 xl:sticky xl:top-[76px] xl:self-start">
          <StructuredActionPanel complaint={complaint} onSaved={() => { void query.refetch(); }} />
          <CaseTimeline actions={complaint.actions} complaint={complaint} />
        </aside>
      </div>
    </section>
  );
}
