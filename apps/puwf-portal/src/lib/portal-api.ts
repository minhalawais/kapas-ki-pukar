"use client";

import type {
  ActionInput,
  AnalyticsFilters,
  AnalyticsSnapshot,
  Complaint,
  ComplaintFilters,
  ContactAction,
  Priority,
  ResolutionInput,
} from "@kapas/domain";

import { staffMutationHeaders } from "@/lib/csrf";
import { staffCaseRowToComplaint } from "@/lib/staff-case-to-complaint";

const API = "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const method = init?.method ?? "GET";
  const needsCsrf = method !== "GET" && method !== "HEAD";
  const response = await fetch(`${API}/api/v1${path}`, {
    ...init,
    credentials: "include",
    headers: needsCsrf
      ? staffMutationHeaders(init?.headers)
      : { ...(init?.headers as Record<string, string> | undefined) },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { message?: string; code?: string };
    const error = new Error(body.message ?? `Request failed (${response.status})`) as Error & {
      code?: string;
      status?: number;
    };
    error.code = body.code ?? (response.status === 409 ? "VERSION_CONFLICT" : "request_error");
    error.status = response.status;
    throw error;
  }
  return response.json() as Promise<T>;
}

function toComplaint(row: Record<string, unknown>): Complaint {
  return staffCaseRowToComplaint(row, API);
}

const query = (filters?: ComplaintFilters) => {
  const params = new URLSearchParams();
  if (filters?.status?.length) params.set("status", filters.status[0]);
  if (filters?.priority?.length) params.set("priority", filters.priority[0]);
  if (filters?.province?.length) params.set("province", filters.province[0]);
  return params.toString() ? `?${params.toString()}` : "";
};

async function action(
  id: string,
  type: string,
  version: number,
  note?: string,
  visibility?: "internal" | "worker-visible",
) {
  await request(`/cases/${encodeURIComponent(id)}/actions`, {
    method: "POST",
    body: JSON.stringify({ type, expectedVersion: version, note, visibility }),
  });
  return productionPortalApi.get(id);
}

export const productionPortalApi = {
  async list(filters?: ComplaintFilters): Promise<Complaint[]> {
    const rows = await request<Record<string, unknown>[]>(`/cases${query(filters)}`);
    return rows.map(toComplaint);
  },
  async get(id: string): Promise<Complaint | null> {
    const row = await request<Record<string, unknown> | null>(`/cases/${encodeURIComponent(id)}`);
    return row ? toComplaint(row) : null;
  },
  async available(id: string) {
    return request<{ actions: Record<string, boolean>; version: number }>(
      `/cases/${encodeURIComponent(id)}/available-actions`,
    );
  },
  async startReview(id: string, version: number) {
    return action(id, "startReview", version);
  },
  async changePriority(
    id: string,
    priority: Priority,
    reason: string | undefined,
    version: number,
  ) {
    await request(`/cases/${id}/priority`, {
      method: "PATCH",
      body: JSON.stringify({ priority, reason, expectedVersion: version }),
    });
    return this.get(id);
  },
  async assign(id: string, assigneeId: string | null, version: number) {
    await request(`/cases/${id}/assignment`, {
      method: "PATCH",
      body: JSON.stringify({ assigneeId, expectedVersion: version }),
    });
    return this.get(id);
  },
  async addNote(id: string, note: string, version: number) {
    return action(id, "addInternalNote", version, note);
  },
  async recordContact(id: string, data: ContactAction, version: number) {
    return action(id, "recordContact", version, data.note ?? data.channel);
  },
  async addFinding(id: string, finding: string, version: number) {
    return action(id, "addFinding", version, finding);
  },
  async recordAction(id: string, data: ActionInput, version: number) {
    return action(id, "recordAction", version, `${data.type}: ${data.note}`);
  },
  async escalate(id: string, reason: string, version: number) {
    return action(id, "escalate", version, reason, "worker-visible");
  },
  async proposeResolution(id: string, resolution: ResolutionInput, version: number) {
    await request(`/cases/${id}/actions`, {
      method: "POST",
      body: JSON.stringify({
        type: "proposeResolution",
        expectedVersion: version,
        note: resolution.summary,
        visibility: "worker-visible",
      }),
    });
    return this.get(id);
  },
  async resolve(id: string, summary: string | undefined, version: number) {
    await request(`/cases/${id}/resolve`, {
      method: "PATCH",
      body: JSON.stringify({ expectedVersion: version, summary: summary ?? "Recorded" }),
    });
    return this.get(id);
  },
  async close(id: string, reason: string, version: number) {
    await request(`/cases/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ expectedVersion: version, status: "Closed", reason }),
    });
    return this.get(id);
  },
  async reopen(id: string, reason: string, version: number) {
    await request(`/cases/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ expectedVersion: version, status: "Reopened", reason }),
    });
    return this.get(id);
  },
  async analytics(filters?: AnalyticsFilters): Promise<AnalyticsSnapshot> {
    return request<AnalyticsSnapshot>(`/analytics/summary${query(filters as ComplaintFilters)}`);
  },
  async createExport(filters: AnalyticsFilters, purpose = "portal analytics export") {
    return request<{ id: string; status: string; expiresAt: string }>("/exports", {
      method: "POST",
      body: JSON.stringify({ filters, purpose }),
    });
  },
  async exportStatus(id: string) {
    return request<{
      id: string;
      status: string;
      rowCount: number;
      expiresAt: string;
      failureCode: string | null;
    }>(`/exports/${id}`);
  },
  async exportContent(id: string) {
    const response = await fetch(`${API}/api/v1/exports/${encodeURIComponent(id)}/content`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Export unavailable");
    return response.blob();
  },
};
