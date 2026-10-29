"use client";

import type { ActionInput, ContactAction, Priority, ResolutionInput } from "@kapas/domain";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { productionPortalApi } from "@/lib/portal-api";
import { useComplaint } from "@/lib/use-complaints";

export type PortalCaseAction =
  | "startReview" | "changePriority" | "addNote" | "recordContact"
  | "addFinding" | "recordAction" | "escalate" | "proposeResolution" | "resolve" | "close" | "reopen";

export function useCaseWorkspace(id: string) {
  const queryClient = useQueryClient();
  const query = useComplaint(id);
  const availableQuery = useQuery({ queryKey: ["available-actions", id], queryFn: () => productionPortalApi.available(id), enabled: Boolean(query.data) });
  const available = availableQuery.data?.actions ?? null;

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["complaints"] });
    void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    void queryClient.invalidateQueries({ queryKey: ["analytics"] });
  }

  const caseId = query.data?.id ?? id;

  const startReview = useMutation({
    mutationFn: () => productionPortalApi.startReview(caseId, query.data?.version ?? 0),
    onSuccess: invalidate,
  });
  const changePriority = useMutation({
    mutationFn: (input: { priority: Priority; reason?: string }) =>
      productionPortalApi.changePriority(caseId, input.priority, input.reason, query.data?.version ?? 0),
    onSuccess: invalidate,
  });
  const assign = useMutation({
    mutationFn: (assigneeId: string | null) => productionPortalApi.assign(caseId, assigneeId, query.data?.version ?? 0),
    onSuccess: invalidate,
  });
  const addNote = useMutation({
    mutationFn: (note: string) => productionPortalApi.addNote(caseId, note, query.data?.version ?? 0),
    onSuccess: invalidate,
  });
  const recordContact = useMutation({
    mutationFn: (data: ContactAction) => productionPortalApi.recordContact(caseId, data, query.data?.version ?? 0),
    onSuccess: invalidate,
  });
  const addFinding = useMutation({
    mutationFn: (finding: string) => productionPortalApi.addFinding(caseId, finding, query.data?.version ?? 0),
    onSuccess: invalidate,
  });
  const recordAction = useMutation({
    mutationFn: (action: ActionInput) => productionPortalApi.recordAction(caseId, action, query.data?.version ?? 0),
    onSuccess: invalidate,
  });
  const escalate = useMutation({
    mutationFn: (reason: string) => productionPortalApi.escalate(caseId, reason, query.data?.version ?? 0),
    onSuccess: invalidate,
  });
  const proposeResolution = useMutation({
    mutationFn: (resolution: ResolutionInput) =>
      productionPortalApi.proposeResolution(caseId, resolution, query.data?.version ?? 0),
    onSuccess: invalidate,
  });
  const resolve = useMutation({
    mutationFn: (note?: string) => productionPortalApi.resolve(caseId, note, query.data?.version ?? 0),
    onSuccess: invalidate,
  });
  const close = useMutation({
    mutationFn: (reason: string) => productionPortalApi.close(caseId, reason, query.data?.version ?? 0),
    onSuccess: invalidate,
  });
  const reopen = useMutation({
    mutationFn: (reason: string) => productionPortalApi.reopen(caseId, reason, query.data?.version ?? 0),
    onSuccess: invalidate,
  });

  const pending =
    startReview.isPending ||
    changePriority.isPending ||
    addNote.isPending ||
    recordContact.isPending ||
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
    assign,
    addNote,
    recordContact,
    addFinding,
    recordAction,
    escalate,
    proposeResolution,
    resolve,
    close,
    reopen,
  };
}
