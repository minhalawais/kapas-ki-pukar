import { t } from "@kapas/localization";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Text, View } from "react-native";

import { ComplaintListCardsSkeleton } from "../../src/components/loading-skeleton";
import { PrimaryCta } from "../../src/components/primary-cta";
import { ScreenShell } from "../../src/components/screen-shell";
import { EmptyState, ErrorState } from "../../src/components/screen-states";
import { IconBadge } from "../../src/components/ui-primitives";
import {
  complaintNeedsAttention,
  filterComplaints,
  formatRelativeListRefresh,
  isComplaintComplete,
  type ComplaintFilter,
} from "../../src/features/tracking/complaintPresentation";
import { ComplaintsListChrome } from "../../src/features/tracking/ComplaintsListChrome";
import { ComplaintsListChromeSkeleton } from "../../src/features/tracking/ComplaintsListChromeSkeleton";
import { ComplaintsPageHeader } from "../../src/features/tracking/ComplaintsPageHeader";
import { ComplaintStatusCard } from "../../src/features/tracking/ComplaintStatusCard";
import { useMyComplaints } from "../../src/hooks/use-my-complaints";
import { useAutoPromptId } from "../../src/hooks/use-prompt-playback";
import { useLocaleStore } from "../../src/stores/localeStore";
import { fontFamily, mobileType, semanticColors } from "../../src/theme/tokens";

export default function ComplaintsScreen() {
  const router = useRouter();
  const locale = useLocaleStore((s) => s.locale);
  const query = useMyComplaints();
  const family = locale === "ur" ? fontFamily.urduUi : fontFamily.ui;
  const [filter, setFilter] = useState<ComplaintFilter>("all");
  useAutoPromptId("SC-complaints");
  const complaints = query.data ?? [];
  const isLoading = query.isLoading;
  const showListChrome = isLoading || complaints.length > 0;
  const counts = useMemo(
    () => ({
      all: complaints.length,
      active: complaints.filter((item) => !isComplaintComplete(item)).length,
      attention: complaints.filter(complaintNeedsAttention).length,
      complete: complaints.filter(isComplaintComplete).length,
    }),
    [complaints],
  );
  const visibleComplaints = useMemo(() => {
    const list = filterComplaints(complaints, filter);
    return [...list].sort((a, b) => {
      const aAttention = complaintNeedsAttention(a) ? 1 : 0;
      const bAttention = complaintNeedsAttention(b) ? 1 : 0;
      if (aAttention !== bAttention) return bAttention - aAttention;
      return b.submittedAt.localeCompare(a.submittedAt);
    });
  }, [complaints, filter]);
  const refreshLabel =
    query.dataUpdatedAt > 0
      ? formatRelativeListRefresh(query.dataUpdatedAt, locale)
      : null;

  return (
    <ScreenShell
      header={
        <View style={{ backgroundColor: semanticColors.pageWorker }}>
          <ComplaintsPageHeader />
          {showListChrome ? (
            isLoading ? (
              <ComplaintsListChromeSkeleton />
            ) : (
              <ComplaintsListChrome
                filter={filter}
                onFilterChange={setFilter}
                counts={counts}
                visibleCount={visibleComplaints.length}
                refreshLabel={refreshLabel}
                onReport={() => router.push("/grievance")}
              />
            )
          ) : null}
        </View>
      }
      fullWidthHeader
      scroll
      contentStyle={{
        gap: 14,
        paddingTop: showListChrome ? 14 : undefined,
      }}
      refreshing={query.isFetching && !query.isLoading}
      onRefresh={() => {
        void query.refetch();
      }}
    >
      {isLoading ? <ComplaintListCardsSkeleton count={3} /> : null}
      {query.isError ? <ErrorState onRetry={() => void query.refetch()} /> : null}
      {query.isSuccess && complaints.length === 0 ? (
        <EmptyState
          icon="file-tray-outline"
          messageKey="complaints.empty"
          helperKey="complaints.nextStep"
          action={
            <PrimaryCta labelKey="home.reportProblem" icon="mic" onPress={() => router.push("/grievance")} />
          }
        />
      ) : null}
      {!isLoading ? (
        <View style={{ gap: 12 }}>
          {visibleComplaints.map((complaint) => (
            <ComplaintStatusCard
              key={`${complaint.referenceNumber}:${complaint.draftId}`}
              complaint={complaint}
              onPress={() => router.push(`/complaints/${complaint.draftId}`)}
            />
          ))}
          {complaints.length > 0 && visibleComplaints.length === 0 ? (
            <View style={{ alignItems: "center", gap: 10, paddingVertical: 28 }}>
              <IconBadge icon="checkmark-done-outline" tone="green" size={64} />
              <Text
                style={{
                  color: semanticColors.textSecondary,
                  fontSize: mobileType.helper.size,
                  lineHeight: mobileType.helper.line,
                  fontFamily: family,
                  textAlign: "center",
                }}
              >
                {t(locale, "complaints.filteredEmpty")}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </ScreenShell>
  );
}
