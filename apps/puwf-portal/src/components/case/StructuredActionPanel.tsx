"use client";

import type { Complaint } from "@kapas/domain";
import {
  simplifiedRecordOptions,
  type SimplifiedRecordKind,
} from "@kapas/domain";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { staffFormHeaders, staffMutationHeaders } from "@/lib/csrf";

const fieldClass =
  "mt-1 h-9 w-full rounded-control border border-border bg-surface px-2 text-sm text-ink";
const areaClass =
  "mt-1 min-h-28 w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-ink";

function requestId() {
  return globalThis.crypto?.randomUUID?.() ?? `portal-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function mutate(
  id: string,
  path: string,
  body: Record<string, unknown>,
  method: "POST" | "PATCH" = "POST",
) {
  const response = await fetch(`/api/v1/cases/${encodeURIComponent(id)}/${path}`, {
    method: path === "status" ? "PATCH" : method,
    credentials: "include",
    headers: staffMutationHeaders(),
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => ({}))) as { message?: string; code?: string; actionId?: string; version?: number };
  if (!response.ok) {
    const raw =
      payload.message && payload.code !== payload.message
        ? payload.message
        : (payload.code ?? payload.message ?? `Request failed (${response.status})`);
    throw Object.assign(new Error(raw), { status: response.status });
  }
  return payload;
}

async function uploadStaffDocument(
  caseId: string,
  file: File,
  expectedVersion: number,
): Promise<{ evidenceId: string; version: number }> {
  const form = new FormData();
  form.append("file", file);
  form.append("expectedVersion", String(expectedVersion));
  form.append("requestId", requestId());
  form.append("recordTimeline", "false");
  const response = await fetch(`/api/v1/cases/${encodeURIComponent(caseId)}/staff-evidence`, {
    method: "POST",
    credentials: "include",
    headers: staffFormHeaders(),
    body: form,
  });
  const payload = (await response.json().catch(() => ({}))) as {
    message?: string;
    code?: string;
    evidenceId?: string;
    version?: number;
  };
  if (!response.ok || !payload.evidenceId || payload.version === undefined) {
    const raw =
      payload.message && payload.code !== payload.message
        ? payload.message
        : (payload.code ?? payload.message ?? `Upload failed (${response.status})`);
    throw Object.assign(new Error(raw), { status: response.status });
  }
  return { evidenceId: payload.evidenceId, version: payload.version };
}

export function StructuredActionPanel({ complaint, onSaved }: { complaint: Complaint; onSaved(): void }) {
  const row = complaint as Complaint & { assignedStaffId?: string | null; version: number };
  const [kind, setKind] = useState<SimplifiedRecordKind>("investigation-started");
  const [summary, setSummary] = useState("");
  const [staffFiles, setStaffFiles] = useState<File[]>([]);
  const staffFileInputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function clearStaffFileSelection() {
    setStaffFiles([]);
    if (staffFileInputRef.current) staffFileInputRef.current.value = "";
  }

  const options =
    complaint.status === "Closed"
      ? [{ value: "close-complaint" as const, label: "Close complaint" }].slice(0, 0)
      : simplifiedRecordOptions;

  async function save() {
    if (options.length === 0) return;
    if (summary.trim().length < 8) {
      setError("Add at least 8 characters of case detail.");
      return;
    }

    const meta = { expectedVersion: row.version, requestId: requestId() };
    const now = new Date().toISOString();
    const assignee = row.assignedStaffId ?? undefined;
    const notes = summary.trim();
    const mayCall = complaint.reporter.contactAllowed;

    setPending(true);
    setError(null);
    try {
      if (kind === "investigation-started") {
        await mutate(complaint.id, "investigation/start", { ...meta, summary: notes });
      } else if (kind === "record-contact") {
        await mutate(complaint.id, "facts", {
          ...meta,
          fact: notes,
          sourceType: "employer",
          verificationState: "reported",
        });
      } else if (kind === "record-worker-contact") {
        await mutate(complaint.id, "contacts", {
          ...meta,
          channel: mayCall ? "call" : "none",
          outcome: mayCall ? "connected" : "prohibited",
          occurredAt: now,
          language: "ur",
          safeContactConfirmed: mayCall,
          emergencyOverride: false,
          summary: notes,
          visibility: mayCall ? "worker-visible" : "internal",
        });
      } else if (kind === "root-cause-analysis") {
        await mutate(complaint.id, "findings", {
          ...meta,
          issue: notes.slice(0, 200),
          allegation: notes,
          conclusion: "unable-to-determine",
          rationale: notes,
        });
      } else if (kind === "corrective-action-taken") {
        let version = row.version;
        const uploadedEvidenceIds: string[] = [];
        for (const file of staffFiles) {
          const uploaded = await uploadStaffDocument(complaint.id, file, version);
          uploadedEvidenceIds.push(uploaded.evidenceId);
          version = uploaded.version;
        }
        await mutate(complaint.id, "corrective-actions", {
          expectedVersion: version,
          requestId: requestId(),
          type: "corrective",
          title: notes.slice(0, 200),
          description: notes,
          ...(assignee ? { ownerStaffId: assignee } : {}),
          expectedOutcome: notes,
          workerVisibleSummary: notes,
          dueAt: new Date(Date.now() + 3 * 86_400_000).toISOString(),
          ...(uploadedEvidenceIds.length > 0 ? { attachmentEvidenceIds: uploadedEvidenceIds } : {}),
        });
      } else if (kind === "close-complaint") {
        await mutate(complaint.id, "close", {
          ...meta,
          code: "unable-to-proceed",
          summary: notes,
          communicationExceptionReason: "Closure recorded from the case workspace.",
          outstandingReferralAcknowledged: true,
        });
      }

      setSummary("");
      clearStaffFileSelection();
      onSaved();
    } catch (cause) {
      const typed = cause as Error & { status?: number };
      setError(
        typed.status === 409
          ? "Another officer updated this case. Your text is preserved; review the refreshed case and submit again."
          : typed.message,
      );
      if (typed.status === 409) onSaved();
    } finally {
      setPending(false);
    }
  }

  if (options.length === 0) {
    return (
      <Card className="h-fit p-4">
        <p className="text-sm text-muted">This complaint is closed.</p>
      </Card>
    );
  }

  return (
    <Card className="h-fit p-4">
      <h2 className="text-sm font-semibold text-ink">Record action</h2>
      <label className="mt-3 block text-xs font-medium text-muted">
        Action type
        <select
          className={fieldClass}
          value={kind}
          onChange={(event) => {
            setKind(event.target.value as SimplifiedRecordKind);
            setError(null);
            clearStaffFileSelection();
          }}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="mt-3 block text-sm font-semibold text-ink">
        Case record
        <textarea
          className={areaClass}
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          placeholder="Document facts, rationale, result, or reason"
        />
      </label>
      {kind === "corrective-action-taken" ? (
        <label className="mt-3 block text-xs font-medium text-muted">
          IO documents (PDF or JPEG/PNG)
          <input
            ref={staffFileInputRef}
            className="mt-1 block w-full text-sm text-ink file:mr-3 file:h-9 file:rounded-control file:border file:border-border file:bg-page file:px-3 file:text-sm"
            type="file"
            accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png"
            multiple
            onChange={(event) => {
              setStaffFiles(Array.from(event.target.files ?? []));
              setError(null);
            }}
          />
          {staffFiles.length > 0 ? (
            <ul className="mt-2 space-y-1 text-sm text-ink">
              {staffFiles.map((file) => (
                <li key={`${file.name}-${file.size}`}>{file.name}</li>
              ))}
            </ul>
          ) : null}
        </label>
      ) : null}
      <Button className="mt-4 h-9 w-full" disabled={pending} onClick={() => void save()}>
        Save
      </Button>
      {error ? (
        <p role="alert" className="mt-3 text-sm text-critical">
          {error}
        </p>
      ) : null}
    </Card>
  );
}
