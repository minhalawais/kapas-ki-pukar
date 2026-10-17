"use client";

import type { Priority } from "@kapas/domain";
import { t, type MessageKey } from "@kapas/localization";
import type { PortalCaseAction } from "@kapas/mock-services";
import { useState } from "react";

import { CaseActionModal } from "@/components/case/CaseActionModal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { useCaseWorkspace } from "@/lib/use-case-actions";
import { useLocaleStore } from "@/stores/locale-store";

const PRIMARY: PortalCaseAction[] = ["startReview", "recordAction", "proposeResolution", "resolve", "close", "reopen"];
const COMMON: PortalCaseAction[] = ["requestInformation", "recordContact", "addNote", "escalate"];

export function ActionRail({ available, currentPriority, pending, workspace }: {
  available: Record<PortalCaseAction, boolean>;
  currentPriority: Priority;
  pending: boolean;
  workspace: ReturnType<typeof useCaseWorkspace>;
}) {
  const locale = useLocaleStore((s) => s.locale);
  const [kind, setKind] = useState<PortalCaseAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const primary = PRIMARY.find((item) => available[item]);
  const common = COMMON.filter((item) => available[item] && item !== primary);

  async function run(action: PortalCaseAction, payload: Record<string, string>) {
    setError(null);
    try {
      if (action === "changePriority") await workspace.changePriority.mutateAsync({ priority: payload.priority as Priority, reason: payload.note || undefined });
      else if (action === "addNote") await workspace.addNote.mutateAsync(payload.note);
      else if (action === "recordContact") await workspace.recordContact.mutateAsync({ channel: payload.channel as "call" | "message" | "none", note: payload.note || undefined });
      else if (action === "requestInformation") await workspace.requestInformation.mutateAsync(payload.note);
      else if (action === "addFinding") await workspace.addFinding.mutateAsync(payload.note);
      else if (action === "recordAction") await workspace.recordAction.mutateAsync({ type: "Action Taken", note: payload.note });
      else if (action === "escalate") await workspace.escalate.mutateAsync(payload.note);
      else if (action === "proposeResolution") await workspace.proposeResolution.mutateAsync({ summary: payload.note });
      else if (action === "resolve") await workspace.resolve.mutateAsync(payload.note || undefined);
      else if (action === "close") await workspace.close.mutateAsync(payload.note);
      else if (action === "reopen") await workspace.reopen.mutateAsync(payload.note);
      setKind(null);
    } catch { setError(t(locale, "portal.case.actionFailed")); }
  }

  async function onClick(action: PortalCaseAction) {
    if (!available[action] || pending) return;
    if (action === "startReview") { setError(null); try { await workspace.startReview.mutateAsync(); } catch { setError(t(locale, "portal.case.actionFailed")); } return; }
    setKind(action);
  }

  const actionButton = (action: PortalCaseAction) => <Button key={action} type="button" variant="secondary" className="w-full justify-start" disabled={pending} onClick={() => void onClick(action)}>{t(locale, `portal.case.action.${action}` as MessageKey)}</Button>;

  return <>
    <Card className="h-fit">
      <p className="text-[11px] font-semibold uppercase text-muted">{t(locale, "portal.case.recommendedAction")}</p>
      {primary ? <Button type="button" className="mt-2 w-full" disabled={pending} onClick={() => void onClick(primary)}>{t(locale, `portal.case.action.${primary}` as MessageKey)}</Button> : <p className="mt-2 text-sm text-muted">{t(locale, "portal.case.noActions")}</p>}
      {common.length > 0 ? <div className="mt-4 border-t border-border pt-4"><h2 className="text-sm font-semibold text-ink">{t(locale, "portal.case.commonActions")}</h2><div className="mt-2 space-y-2">{common.map(actionButton)}</div></div> : null}
      {error && !kind ? <p className="mt-2 text-xs text-critical">{error}</p> : null}
      <CaseActionModal kind={kind} currentPriority={currentPriority} pending={pending} error={error} onClose={() => { setKind(null); setError(null); }} onSubmit={run} />
    </Card>
  </>;
}
