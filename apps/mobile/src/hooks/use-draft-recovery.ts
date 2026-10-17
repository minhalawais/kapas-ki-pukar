import { persistenceKeys } from "@kapas/domain";
import { complaintService } from "@kapas/mock-services";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getDraftRecoveryFingerprint, shouldOfferDraftRecovery } from "../features/grievance/draftRecovery";
import { useGrievanceDraftStore } from "../stores/grievanceDraftStore";

const DRAFT_QUERY_KEY = ["complaint-draft"] as const;
const DRAFT_DISMISSAL_QUERY_KEY = ["draft-recovery-dismissal"] as const;

export function useDraftRecovery() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: DRAFT_QUERY_KEY,
    queryFn: () => complaintService.getDraft(),
  });
  const dismissalQuery = useQuery({
    queryKey: DRAFT_DISMISSAL_QUERY_KEY,
    queryFn: () => AsyncStorage.getItem(persistenceKeys.draftRecoveryDismissed),
    staleTime: Infinity,
  });

  const discard = useMutation({
    mutationFn: () => complaintService.discardDraft(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: DRAFT_QUERY_KEY });
      queryClient.setQueryData(DRAFT_QUERY_KEY, null);
    },
    onSuccess: async () => {
      useGrievanceDraftStore.getState().resetAfterSubmit();
      await queryClient.invalidateQueries({ queryKey: DRAFT_QUERY_KEY });
    },
    onError: async () => {
      await queryClient.invalidateQueries({ queryKey: DRAFT_QUERY_KEY });
    },
  });

  const draft = query.data ?? null;
  const fingerprint = draft ? getDraftRecoveryFingerprint(draft) : null;

  async function acknowledgePrompt(): Promise<void> {
    if (!fingerprint) return;

    // Update the cache first so navigation or a slow storage write cannot reopen the dialog.
    queryClient.setQueryData(DRAFT_DISMISSAL_QUERY_KEY, fingerprint);
    try {
      await AsyncStorage.setItem(persistenceKeys.draftRecoveryDismissed, fingerprint);
    } catch {
      // Keep the in-memory dismissal for this session even if device storage is unavailable.
    }
  }

  return {
    draft,
    isLoading: query.isLoading || dismissalQuery.isLoading,
    isError: query.isError || dismissalQuery.isError,
    hasDraft: Boolean(draft),
    shouldPrompt: shouldOfferDraftRecovery(
      draft,
      dismissalQuery.data,
      dismissalQuery.isSuccess,
    ),
    acknowledgePrompt,
    discardDraft: discard.mutateAsync,
    isDiscarding: discard.isPending,
    discardError: discard.isError,
    refetch: query.refetch,
  };
}
