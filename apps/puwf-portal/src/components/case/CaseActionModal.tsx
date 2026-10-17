"use client";

import type { Priority } from "@kapas/domain";
import { priorities } from "@kapas/domain";
import { t, type MessageKey } from "@kapas/localization";
import type { PortalCaseAction } from "@kapas/mock-services";
import { closeCaseSchema, resolutionInputSchema } from "@kapas/validation";
import { Eye, LockKeyhole, Mail, UserRound } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useLocaleStore } from "@/stores/locale-store";

const inputClass =
  "mt-1 h-input w-full rounded-control border border-border bg-surface px-2 text-sm text-ink";
const areaClass =
  "mt-1 min-h-[80px] w-full rounded-control border border-border bg-surface px-2 py-2 text-sm text-ink";

const escalationRecipient = {
  name: "Ayesha Khan",
  email: "ayesha.khan@puwf.org.pk",
  roleKey: "portal.case.escalation.recipientRole",
} as const;

export function CaseActionModal({
  kind,
  currentPriority,
  pending,
  error,
  onClose,
  onSubmit,
}: {
  kind: PortalCaseAction | null;
  currentPriority: Priority;
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (kind: PortalCaseAction, payload: Record<string, string>) => Promise<void>;
}) {
  const locale = useLocaleStore((s) => s.locale);
  const [note, setNote] = useState("");
  const [priority, setPriority] = useState<Priority>(currentPriority);
  const [channel, setChannel] = useState("call");
  const [validation, setValidation] = useState<string | null>(null);

  useEffect(() => {
    setNote("");
    setPriority(currentPriority);
    setChannel("call");
    setValidation(null);
  }, [kind, currentPriority]);

  if (!kind || kind === "startReview") {
    return null;
  }

  function validate(): boolean {
    if (kind === "proposeResolution") {
      return resolutionInputSchema.safeParse({ summary: note.trim() }).success;
    }
    if (kind === "close" || kind === "reopen" || kind === "escalate") {
      return closeCaseSchema.safeParse({ reason: note.trim() }).success;
    }
    if (kind === "resolve" || kind === "changePriority" || kind === "recordContact") {
      return true;
    }
    return note.trim().length > 0;
  }

  async function submit() {
    if (!kind) {
      return;
    }
    if (!validate()) {
      setValidation(t(locale, "portal.case.validation"));
      return;
    }
    setValidation(null);
    const cleanNote = note.trim();
    await onSubmit(kind, {
      note: kind === "escalate"
        ? `${cleanNote}\n\nEscalated to: ${escalationRecipient.name} <${escalationRecipient.email}>`
        : cleanNote,
      priority,
      channel,
    });
  }

  const title = t(locale, `portal.case.action.${kind}` as MessageKey);
  const confirmCopy =
    kind === "escalate"
      ? t(locale, "portal.case.confirmEscalate")
      : kind === "resolve"
        ? t(locale, "portal.case.confirmResolve")
        : kind === "close"
          ? t(locale, "portal.case.confirmClose")
          : null;
  const noteLabel =
    kind === "proposeResolution"
      ? t(locale, "portal.case.summary")
      : kind === "escalate" || kind === "close" || kind === "reopen"
        ? t(locale, "portal.case.reason")
        : t(locale, "portal.case.note");
  const showNote = kind !== "changePriority";
  const primaryLabel = confirmCopy ? t(locale, "common.confirm") : t(locale, "common.save");
  const workerVisible = ["requestInformation", "recordAction", "escalate", "proposeResolution", "resolve", "close", "reopen"].includes(kind);

  return (
    <Dialog
      open
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
            {t(locale, "common.cancel")}
          </Button>
          <Button
            type="button"
            variant={kind === "close" ? "destructive" : "primary"}
            onClick={() => void submit()}
            disabled={pending}
          >
            {primaryLabel}
          </Button>
        </>
      }
    >
      <div className={`flex items-start gap-2 rounded-control p-2.5 ${workerVisible ? "bg-[var(--surface-soft-teal)]" : "bg-page"}`}>{workerVisible ? <Eye aria-hidden size={16} className="mt-0.5 shrink-0 text-[var(--brand-fos-teal-dark)]" /> : <LockKeyhole aria-hidden size={16} className="mt-0.5 shrink-0 text-muted" />}<div><p className="text-xs font-semibold text-ink">{t(locale, workerVisible ? "portal.case.visibility.worker" : "portal.case.visibility.internal")}</p><p className="text-[11px] leading-4 text-muted">{t(locale, workerVisible ? "portal.case.visibility.workerBody" : "portal.case.visibility.internalBody")}</p></div></div>
      {confirmCopy ? <p>{confirmCopy}</p> : null}
      {kind === "escalate" ? (
        <section className="rounded-card border border-[var(--progress-accent)] bg-[var(--surface-soft-amber)] p-3">
          <p className="text-[11px] font-semibold uppercase text-muted">{t(locale, "portal.case.escalation.recipient")}</p>
          <div className="mt-2 space-y-2">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface text-action">
                <UserRound size={16} />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">{escalationRecipient.name}</p>
                <p className="text-xs text-muted">{t(locale, escalationRecipient.roleKey as MessageKey)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-control bg-surface px-2 py-2 text-sm text-ink" dir="ltr">
              <Mail size={15} className="shrink-0 text-action" />
              <span className="truncate">{escalationRecipient.email}</span>
            </div>
          </div>
        </section>
      ) : null}
      {kind === "changePriority" ? (
        <label className="block text-xs text-muted">
          {t(locale, "portal.table.priority")}
          <select
            className={inputClass}
            value={priority}
            onChange={(event) => setPriority(event.target.value as Priority)}
          >
            {priorities.map((item) => (
              <option key={item} value={item}>
                {t(locale, `portal.priority.${item}` as MessageKey)}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {kind === "recordContact" ? (
        <label className="block text-xs text-muted">
          {t(locale, "portal.case.channel")}
          <select className={inputClass} value={channel} onChange={(event) => setChannel(event.target.value)}>
            <option value="call">{t(locale, "portal.case.channel.call")}</option>
            <option value="message">{t(locale, "portal.case.channel.message")}</option>
            <option value="none">{t(locale, "portal.case.channel.none")}</option>
          </select>
        </label>
      ) : null}
      {showNote ? (
        <label className="block text-xs text-muted">
          {noteLabel}
          <textarea className={areaClass} value={note} onChange={(event) => setNote(event.target.value)} />
        </label>
      ) : (
        <label className="block text-xs text-muted">
          {t(locale, "portal.case.reason")}
          <textarea className={areaClass} value={note} onChange={(event) => setNote(event.target.value)} />
        </label>
      )}
      {validation ? <p className="text-xs text-critical">{validation}</p> : null}
      {error ? <p className="text-xs text-critical">{error}</p> : null}
    </Dialog>
  );
}
