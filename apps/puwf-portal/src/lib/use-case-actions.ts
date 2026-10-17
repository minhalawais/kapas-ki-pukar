"use client";

import type { ActionInput, ContactAction, Priority, ResolutionInput } from "@kapas/domain";
import { caseLifecycleService, caseManagementService } from "@kapas/mock-services";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useComplaint } from "@/lib/use-complaints";

export function useCaseWorkspace(id: string) {
  const queryClient = useQueryClient();
  const query = useComplaint(id);
  const available = query.data ? caseLifecycleService.availableActions(query.data.status) : null;

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["complaints"] });
    void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    void queryClient.invalidateQueries({ queryKey: ["analytics"] });
  }

  const caseId = query.data?.id ?? id;

  const startReview = useMutation({
    mutationFn: () => caseManagementService.startReview(caseId),
    onSuccess: invalidate,
  });
  const changePriority = useMutation({
    mutationFn: (input: { priority: Priority; reason?: string }) =>
      caseManagementService.changePriority(caseId, input.priority, input.reason),
    onSuccess: invalidate,
  });
  const addNote = useMutation({
    mutationFn: (note: string) => caseManagementService.addNote(caseId, note),
    onSuccess: invalidate,
  });
  const recordContact = useMutation({
    mutationFn: (data: ContactAction) => caseManagementService.recordContact(caseId, data),
    onSuccess: invalidate,
  });
  const requestInformation = useMutation({
    mutationFn: (note: string) => caseManagementService.requestInformation(caseId, note),
    onSuccess: invalidate,
  });
  const addFinding = useMutation({
    mutationFn: (finding: string) => caseManagementService.addFinding(caseId, finding),
    onSuccess: invalidate,
  });
  const recordAction = useMutation({
    mutationFn: (action: ActionInput) => caseManagementService.recordAction(caseId, action),
    onSuccess: invalidate,
  });
  const escalate = useMutation({
    mutationFn: (reason: string) => caseManagementService.escalate(caseId, reason),
    onSuccess: invalidate,
  });
  const proposeResolution = useMutation({
    mutationFn: (resolution: ResolutionInput) =>
      caseManagementService.proposeResolution(caseId, resolution),
    onSuccess: invalidate,
  });
  const resolve = useMutation({
    mutationFn: (note?: string) => caseManagementService.resolve(caseId, note),
    onSuccess: invalidate,
  });
  const close = useMutation({
    mutationFn: (reason: string) => caseManagementService.close(caseId, reason),
    onSuccess: invalidate,
  });
  const reopen = useMutation({
    mutationFn: (reason: string) => caseManagementService.reopen(caseId, reason),
    onSuccess: invalidate,
  });

  const pending =
    startReview.isPending ||
    changePriority.isPending ||
    addNote.isPending ||
    recordContact.isPending ||
    requestInformation.isPending ||
    addFinding.isPending ||
    recordAction.isPending ||
    escalate.isPending ||
    proposeResolution.isPending ||
    resolve.isPending ||
    close.isPending ||
    reopen.isPending;

  return {
    query,
    available,
    pending,
    startReview,
    changePriority,
    addNote,
    recordContact,
    requestInformation,
    addFinding,
    recordAction,
    escalate,
    proposeResolution,
    resolve,
    close,
    reopen,
  };
}
