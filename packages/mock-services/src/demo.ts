import type { CaseStatus, Complaint, DemoScenario, GoldenScenarioId } from "@kapas/domain";
import { goldenScenarioIds, goldenScenarioTrackingIds, withDerivedFields } from "@kapas/domain";
import { extraDemoComplaints, getGoldenComplaint } from "@kapas/mock-data";

import { complaintService } from "./complaintService";
import { caseLifecycleService } from "./lifecycle/CaseLifecycleService";
import { offlineQueueService } from "./offlineQueue";
import {
  getDemoFlags,
  getMobileRepository,
  getPortalRepository,
  hydrateDemoRuntime,
  patchDemoFlags,
  resetDemoFlags,
} from "./runtime";

const labels: Record<GoldenScenarioId, string> = {
  "GS-01": "demo.gs01",
  "GS-02": "demo.gs02",
  "GS-03": "demo.gs03",
  "GS-04": "demo.gs04",
  "GS-05": "demo.gs05",
  "GS-06": "demo.gs06",
  "GS-07": "demo.gs07",
  "GS-08": "demo.gs08",
  "GS-09": "demo.gs09",
  "GS-10": "demo.gs10",
};

const QUEUE_ONE_DRAFT_ID = "demo-queue-one";

export const demoAdvanceSteps = [
  "next",
  "review",
  "action",
  "propose",
  "resolve",
  "close",
  "reopen",
  "worker-track",
] as const;

export type DemoAdvanceStep = (typeof demoAdvanceSteps)[number];

function asScenarioId(id: string): GoldenScenarioId {
  if ((goldenScenarioIds as readonly string[]).includes(id)) {
    return id as GoldenScenarioId;
  }
  throw new Error(`Unknown scenario ${id}.`);
}

function scenarioFromId(id: GoldenScenarioId): DemoScenario {
  const trackingId = goldenScenarioTrackingIds[id];
  return {
    id,
    labelKey: labels[id],
    trackingId,
    complaintIds: [trackingId],
  };
}

function queueOneDraft() {
  return {
    id: QUEUE_ONE_DRAFT_ID,
    stepId: "review" as const,
    category: "WAG" as const,
    privacyMode: "CONF" as const,
    reporterIdentity: { mode: "cnic" as const, cnicLast4: "4567", cnicVerified: false },
    incident: {
      whenLabel: "today",
      immediateDanger: false,
      othersAffected: "individual" as const,
      structuredAnswers: {},
    },
    location: { province: "Punjab", district: "Multan", villageLabel: "Chak 12/BC", placeLabel: "Chak 12/BC", source: "manual" as const },
    evidence: [],
    voice: {
      id: "demo-queue-voice",
      localUri: "asset://demo-audio/queue-one.m4a",
      durationMs: 1200,
      recordedAt: "2026-08-19T12:00:00.000Z",
      locale: "ur" as const,
    },
    updatedAt: "2026-08-19T12:00:00.000Z",
  };
}

function nextDemoStatus(status: CaseStatus): CaseStatus | null {
  if (status === "Submitted" || status === "Reopened") {
    return "Under Review";
  }
  if (status === "Under Review") {
    return "Action in Progress";
  }
  if (status === "Action in Progress") {
    return "Proposed Resolution";
  }
  if (status === "Proposed Resolution") {
    return "Resolved";
  }
  if (status === "Resolved") {
    return "Closed";
  }
  if (status === "Closed") {
    return "Reopened";
  }
  return null;
}

function statusForStep(status: CaseStatus, step: DemoAdvanceStep): CaseStatus | null {
  if (step === "next" || step === "worker-track") {
    return nextDemoStatus(status);
  }
  if (step === "review") {
    return "Under Review";
  }
  if (step === "action") {
    return "Action in Progress";
  }
  if (step === "propose") {
    return "Proposed Resolution";
  }
  if (step === "resolve") {
    return "Resolved";
  }
  if (step === "close") {
    return "Closed";
  }
  return "Reopened";
}

async function readScenarioComplaint(id: GoldenScenarioId): Promise<Complaint> {
  const trackingId = goldenScenarioTrackingIds[id];
  return (
    (await getPortalRepository().get(trackingId)) ??
    (await getMobileRepository().get(trackingId)) ??
    getGoldenComplaint(id)
  );
}

async function writeScenarioComplaint(complaint: Complaint): Promise<void> {
  await getPortalRepository().save(complaint);
  await getMobileRepository().save(complaint);
}

function applyAdvance(complaint: Complaint, step: DemoAdvanceStep): Complaint {
  const to = statusForStep(complaint.status, step);
  if (!to) {
    throw new Error(`No demo advance from ${complaint.status}.`);
  }
  if (!caseLifecycleService.canTransition(complaint.status, to)) {
    throw new Error(`Transition ${complaint.status} → ${to} is not allowed.`);
  }
  const at = new Date().toISOString();
  let next = caseLifecycleService.transition(complaint, to, {
    at,
    actorRole: "puwf-grievance-manager",
    note: "Demo advance",
  });
  if (to === "Proposed Resolution") {
    next = { ...next, resolution: { summary: "Demo proposed remedy.", proposedAt: at } };
  }
  if (to === "Resolved") {
    next = {
      ...next,
      resolution: {
        summary: next.resolution?.summary ?? "Demo proposed remedy.",
        proposedAt: next.resolution?.proposedAt,
        resolvedAt: at,
      },
    };
  }
  return withDerivedFields(next);
}

export const demoService = {
  getFlags: getDemoFlags,
  listScenarios(): DemoScenario[] {
    return goldenScenarioIds.map(scenarioFromId);
  },
  async hydrate(): Promise<void> {
    await hydrateDemoRuntime();
  },
  async reset(): Promise<void> {
    await getPortalRepository().reset();
    await getMobileRepository().reset();
    await offlineQueueService.clear();
    await resetDemoFlags();
  },
  async loadScenario(id: string): Promise<DemoScenario> {
    const scenarioId = asScenarioId(id);
    const complaint = getGoldenComplaint(scenarioId);
    await getMobileRepository().save(complaint);
    patchDemoFlags({
      activeScenarioId: scenarioId,
      portalInjected: false,
      workerTrackingStep: complaint.status,
    });
    return scenarioFromId(scenarioId);
  },
  async injectScenarioComplaint(id: string): Promise<Complaint> {
    const scenarioId = asScenarioId(id);
    const complaint = getGoldenComplaint(scenarioId);
    await writeScenarioComplaint(complaint);
    patchDemoFlags({
      activeScenarioId: scenarioId,
      portalInjected: true,
      workerTrackingStep: complaint.status,
    });
    return complaint;
  },
  setOffline(value: boolean): void {
    patchDemoFlags({
      offline: value,
      connectivity: value ? "offline-demo" : "online",
    });
  },
  setAiFailure(value: boolean): void {
    patchDemoFlags({ aiFailure: value });
  },
  setAiDelay(ms: number): void {
    patchDemoFlags({ aiDelayMs: ms });
  },
  setAiConfidence(value: "high" | "medium" | "low" | null): void {
    patchDemoFlags({ aiConfidenceOverride: value });
  },
  async generateAdditionalComplaints(count = 5): Promise<Complaint[]> {
    const rows = await getPortalRepository().list();
    const maxIndex = rows.reduce((max, row) => {
      const value = Number.parseInt(row.trackingId.slice(-6), 10);
      return Number.isFinite(value) ? Math.max(max, value) : max;
    }, 0);
    const extra = extraDemoComplaints(count, maxIndex + 1);
    for (const row of extra) {
      await getPortalRepository().save(row);
    }
    return extra;
  },
  async queueOneComplaint(): Promise<Complaint> {
    const previous = getDemoFlags().connectivity;
    patchDemoFlags({ connectivity: "offline-demo" });
    try {
      return await complaintService.createFromDraft(queueOneDraft());
    } finally {
      patchDemoFlags({ connectivity: previous });
    }
  },
  async processQueue(): Promise<{ processed: number; failed: number }> {
    return offlineQueueService.processQueue();
  },
  async simulateReconnect(): Promise<{ processed: number; failed: number }> {
    patchDemoFlags({ connectivity: "reconnecting" });
    try {
      const result = await offlineQueueService.processQueue();
      patchDemoFlags({ connectivity: "online" });
      return result;
    } catch {
      patchDemoFlags({ connectivity: "offline-demo" });
      throw new Error("Reconnect failed");
    }
  },
  async advanceScenario(id: string, step: string): Promise<Complaint> {
    const scenarioId = asScenarioId(id);
    if (!(demoAdvanceSteps as readonly string[]).includes(step)) {
      throw new Error(`Unknown demo step ${step}.`);
    }
    const current = await readScenarioComplaint(scenarioId);
    const next = applyAdvance(current, step as DemoAdvanceStep);
    await writeScenarioComplaint(next);
    patchDemoFlags({
      activeScenarioId: scenarioId,
      workerTrackingStep: next.status,
    });
    return next;
  },
};
