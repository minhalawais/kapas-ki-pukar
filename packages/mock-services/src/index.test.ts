import { DEMO_NOW_ISO, persistenceKeys, workerFacingStatusKey } from "@kapas/domain";
import { describe, expect, it, beforeEach } from "vitest";

import {
  analyticsGender,
  complaintsToCsv,
  criticalRate,
  openCases,
  resolutionRate,
  reopenRate,
  snapshotFrom,
  totalComplaints,
} from "./analyticsSelectors";
import { analyticsService } from "./analyticsService";
import { caseManagementService } from "./caseManagement";
import { complaintService } from "./complaintService";
import { demoService } from "./demo";
import { InvalidTransitionError, caseLifecycleService } from "./lifecycle/CaseLifecycleService";
import { locationService } from "./locationService";
import { offlineQueueService } from "./offlineQueue";
import { rightsContentService } from "./rightsContentService";
import { priorityRulesService } from "./rules/PriorityRulesService";
import {
  configureMockRuntime,
  ensurePersistenceSchema,
  getDemoFlags,
  getMobileRepository,
  getPortalRepository,
  hydrateDemoRuntime,
  persistDemoFlags,
} from "./runtime";
import { createMemoryStore } from "./storage/KeyValueStore";

describe("mock services", () => {
  beforeEach(() => {
    configureMockRuntime({
      portalStore: createMemoryStore(),
      mobileStore: createMemoryStore(),
    });
  });

  it("lists the seeded portal dataset through the service", async () => {
    const rows = await caseManagementService.list();
    expect(rows).toHaveLength(200);
  });

  it("resets to the same baseline count", async () => {
    const first = await caseManagementService.list();
    await caseManagementService.addNote(first[0]!.id, "demo note");
    await demoService.reset();
    const after = await caseManagementService.list();
    expect(after).toHaveLength(200);
    expect(after[0]?.actions.some((item) => item.note === "demo note")).toBe(false);
  });

  it("derives analytics from the repository", async () => {
    const snapshot = await analyticsService.getSnapshot();
    expect(snapshot.total).toBe(200);
    expect(snapshot.newCount + snapshot.inProgressCount + snapshot.resolvedCount).toBeGreaterThan(0);
    expect(snapshot.generatedAt).toBe(DEMO_NOW_ISO);
    expect(snapshot.byCategory.reduce((sum, row) => sum + row.count, 0)).toBe(200);
    expect(snapshot.byStatus.reduce((sum, row) => sum + row.count, 0)).toBe(200);
    expect(snapshot.byProvince.reduce((sum, row) => sum + row.count, 0)).toBe(200);
    expect(snapshot.trend.length).toBeGreaterThan(0);
  });

  it("reconciles filtered KPI totals with the complaint list", async () => {
    const filters = { category: ["WAG" as const], priority: ["Critical" as const] };
    const rows = await caseManagementService.list(filters);
    const snapshot = await analyticsService.getSnapshot(filters);
    expect(snapshot.total).toBe(rows.length);
    expect(snapshot.newCount).toBe(rows.filter((row) => row.status === "Received").length);
    expect(snapshot.criticalCount).toBe(
      rows.filter((row) => row.priority === "Emergency" || row.priority === "Critical").length,
    );
    expect(snapshot.overdueCount).toBe(rows.filter((row) => row.overdue).length);
    expect(snapshot.byCategory.every((row) => row.key === "WAG")).toBe(true);
  });

  it("documents programme KPI formulas against the filtered repository", async () => {
    const rows = await caseManagementService.list();
    expect(totalComplaints(rows)).toBe(rows.length);
    expect(openCases(rows)).toBe(
      rows.filter((row) =>
        [
          "Received",
          "Triage",
          "Verification",
          "Investigation",
          "Action in Progress",
          "Escalated",
          "Outcome Verification",
          "Reopened",
        ].includes(row.status),
      ).length,
    );
    expect(resolutionRate(rows)).toBe(((rows.filter((row) => row.status === "Closed").length) / rows.length) * 100);
    expect(criticalRate(rows)).toBe(
      ((rows.filter((row) => row.priority === "Emergency" || row.priority === "Critical").length) / rows.length) * 100,
    );
    expect(reopenRate(rows)).toBe(
      (rows.filter((row) => row.status === "Reopened").length /
        rows.filter((row) => row.status === "Closed").length) *
        100,
    );
  });

  it("reconciles every analytics series with the filtered complaint count", async () => {
    const filters = { category: ["WAG" as const], province: ["Punjab"] };
    const snapshot = await analyticsService.getSnapshot(filters);
    const sum = (rows: { count: number }[]) => rows.reduce((total, row) => total + row.count, 0);
    expect(sum(snapshot.byCategory)).toBe(snapshot.total);
    expect(sum(snapshot.byStatus)).toBe(snapshot.total);
    expect(sum(snapshot.byProvince)).toBe(snapshot.total);
    expect(sum(snapshot.byPriority)).toBe(snapshot.total);
    expect(sum(snapshot.byPrivacy)).toBe(snapshot.total);
    expect(sum(snapshot.byGender)).toBe(snapshot.total);
    expect(sum(snapshot.byOutcome)).toBe(snapshot.total);
    expect(sum(snapshot.byAiConfidence)).toBe(snapshot.total);
    expect(sum(snapshot.byHumanReview)).toBe(snapshot.total);
    expect(sum(snapshot.trend)).toBe(snapshot.total);
    expect(snapshot.openCount + snapshot.resolvedCount).toBeLessThanOrEqual(snapshot.total);
  });

  it("puts anonymous gender into the Not Stated bucket", async () => {
    const rows = await caseManagementService.list({ privacyMode: ["ANON"] });
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row) => analyticsGender(row) === "Not Stated")).toBe(true);
    const female = await analyticsService.getSnapshot({ gender: ["Female"] });
    expect(female.byPrivacy.some((row) => row.key === "ANON")).toBe(false);
  });

  it("exports CSV rows for the current filters without identity fields", async () => {
    const filters = { category: ["SAN" as const] };
    const rows = await caseManagementService.list(filters);
    const blob = await analyticsService.exportCsv(filters);
    const csv = await blob.text();
    expect(csv.split("\n").length).toBe(rows.length + 1);
    expect(csv).toContain("trackingId");
    expect(csv).not.toContain("displayName");
    expect(complaintsToCsv(rows).split("\n").length).toBe(rows.length + 1);
    expect(snapshotFrom([]).total).toBe(0);
  });

  it("searches tracking id, category and location together with other filters", async () => {
    const all = await caseManagementService.list();
    const sample = all.find((row) => row.location.province === "Punjab");
    expect(sample).toBeTruthy();
    const found = await caseManagementService.list({
      search: sample!.trackingId,
      province: ["Punjab"],
    });
    expect(found).toHaveLength(1);
    expect(found[0]?.trackingId).toBe(sample!.trackingId);
    const none = await caseManagementService.list({
      search: sample!.trackingId,
      province: ["Sindh"],
    });
    expect(none).toHaveLength(0);
  });

  it("loads GS-01 onto the mobile repository only", async () => {
    const loaded = await demoService.loadScenario("GS-01");
    expect(loaded.trackingId).toBe("KP-26-000101");
    const mobile = await getMobileRepository().get("KP-26-000101");
    expect(mobile?.trackingId).toBe("KP-26-000101");
    expect(mobile?.status).toBe("Triage");
    expect(demoService.getFlags()).toMatchObject({
      activeScenarioId: "GS-01",
      portalInjected: false,
    });
  });

  it("injects a golden scenario onto both surfaces", async () => {
    const injected = await demoService.injectScenarioComplaint("GS-01");
    expect(injected.trackingId).toBe("KP-26-000101");
    const portal = await getPortalRepository().get("KP-26-000101");
    const mobile = await getMobileRepository().get("KP-26-000101");
    expect(portal?.status).toBe("Triage");
    expect(mobile?.status).toBe("Triage");
    expect(demoService.getFlags().portalInjected).toBe(true);
    const mine = await complaintService.listMine();
    expect(mine.some((row) => row.trackingId === "KP-26-000101")).toBe(true);
  });

  it("advances GS-01 from Under Review to Action in Progress", async () => {
    await demoService.injectScenarioComplaint("GS-01");
    const next = await demoService.advanceScenario("GS-01", "next");
    expect(next.status).toBe("Investigation");
    const portal = await getPortalRepository().get("KP-26-000101");
    const mobile = await getMobileRepository().get("KP-26-000101");
    expect(portal?.status).toBe("Investigation");
    expect(mobile?.status).toBe("Investigation");
    expect(demoService.getFlags().workerTrackingStep).toBe("Investigation");
  });

  it("adds extra portal complaints and reset restores the seed", async () => {
    const extra = await demoService.generateAdditionalComplaints(5);
    expect(extra).toHaveLength(5);
    expect(await caseManagementService.list()).toHaveLength(205);
    await demoService.reset();
    expect(await caseManagementService.list()).toHaveLength(200);
    expect(demoService.getFlags().activeScenarioId).toBeNull();
    expect(demoService.getFlags().aiFailure).toBe(false);
  });

  it("rejects unknown scenarios", async () => {
    await expect(demoService.loadScenario("GS-99")).rejects.toThrow(/Unknown scenario/);
    await expect(demoService.injectScenarioComplaint("GS-00")).rejects.toThrow(/Unknown scenario/);
  });

  it("persists AI simulation flags across hydrate", async () => {
    const store = createMemoryStore();
    configureMockRuntime({
      portalStore: store,
      mobileStore: store,
      demoStore: store,
    });
    demoService.setAiFailure(true);
    demoService.setAiDelay(1200);
    demoService.setAiConfidence("low");
    expect(demoService.getFlags()).toMatchObject({
      aiFailure: true,
      aiDelayMs: 1200,
      aiConfidenceOverride: "low",
    });
    await persistDemoFlags();
    configureMockRuntime({
      portalStore: store,
      mobileStore: store,
      demoStore: store,
    });
    expect(getDemoFlags().aiFailure).toBe(false);
    await hydrateDemoRuntime();
    expect(getDemoFlags()).toMatchObject({
      aiFailure: true,
      aiDelayMs: 1200,
      aiConfidenceOverride: "low",
    });
  });

  it("blocks illegal lifecycle transitions", () => {
    expect(caseLifecycleService.canTransition("Received", "Closed")).toBe(false);
    expect(() =>
      caseLifecycleService.transition(
        {
          status: "Received",
          actions: [],
        } as never,
        "Closed",
        { at: DEMO_NOW_ISO, actorRole: "puwf-grievance-manager" },
      ),
    ).toThrow(InvalidTransitionError);
    expect(caseLifecycleService.availableActions("Received").startReview).toBe(true);
    expect(caseLifecycleService.availableActions("Received").close).toBe(false);
    expect(caseLifecycleService.availableActions("Closed").reopen).toBe(true);
    expect(caseLifecycleService.availableActions("Closed").close).toBe(false);
  });

  it("moves a case through review, action, resolution and close", async () => {
    const rows = await caseManagementService.list({ status: ["Received"] });
    const id = rows[0]!.id;
    const reviewed = await caseManagementService.startReview(id);
    expect(reviewed.status).toBe("Triage");
    const acted = await caseManagementService.recordAction(id, {
      type: "Action Taken",
      note: "Site visit recorded",
    });
    expect(acted.status).toBe("Action in Progress");
    const proposed = await caseManagementService.proposeResolution(id, {
      summary: "Pay the remaining agreed wage.",
    });
    expect(proposed.status).toBe("Outcome Verification");
    const resolved = await caseManagementService.resolve(id);
    expect(resolved.status).toBe("Closed");
    const reopened = await caseManagementService.reopen(id, "Worker not satisfied");
    expect(reopened.status).toBe("Reopened");
    expect(reopened.actions.some((item) => item.note === "Worker not satisfied")).toBe(true);
    const notes = await caseManagementService.addNote(id, "First note");
    const notes2 = await caseManagementService.addNote(id, "Second note");
    const noteIds = notes2.actions.filter((item) => item.type === "Internal Note Added").map((item) => item.id);
    expect(new Set(noteIds).size).toBe(noteIds.length);
    void notes;
    await expect(caseManagementService.close(id, "too early")).rejects.toThrow(InvalidTransitionError);
  });

  it("applies deterministic priority floors", () => {
    expect(priorityRulesService.getMinimumPriority({ immediateDanger: true })).toBe("Emergency");
    expect(priorityRulesService.getMinimumPriority({ immediateDanger: false, category: "CHL" })).toBe(
      "Critical",
    );
    expect(priorityRulesService.reconcile("Standard", "Critical")).toBe("Critical");
  });

  it("lists demo locations through the service", async () => {
    const rows = await locationService.list();
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.some((row) => row.province === "Punjab")).toBe(true);
    expect(rows.some((row) => row.province === "Sindh")).toBe(true);
    const punjab = await locationService.listByProvince("Punjab");
    expect(punjab.every((row) => row.province === "Punjab")).toBe(true);
  });

  it("seeds realistic mobile demo complaints for the worker view", async () => {
    const rows = await complaintService.listMine();
    expect(rows.map((row) => row.trackingId)).toEqual([
      "KP-26-000102",
      "KP-26-000101",
      "KP-26-000106",
      "KP-26-000110",
    ]);
    expect(rows.some((row) => row.status === "Action in Progress")).toBe(true);
    expect(rows.some((row) => row.priority === "Emergency")).toBe(true);
  });

  it("submits a draft with a unique tracking id and keeps original audio", async () => {
    const voice = {
      id: "voice-1",
      localUri: "file://local/voice.m4a",
      durationMs: 1200,
      recordedAt: "2026-08-19T12:00:00.000Z",
      locale: "ur" as const,
    };
    const created = await complaintService.createFromDraft({
      id: "draft-1",
      stepId: "review",
      category: "WAG",
      privacyMode: "CONF",
      reporterIdentity: { mode: "cnic", cnicLast4: "4567", phoneLast4: "4567", cnicVerified: false },
      incident: {
        whenLabel: "today",
        immediateDanger: false,
        othersAffected: "individual",
        structuredAnswers: { contactPreference: "do-not-initiate" },
      },
      location: { province: "Punjab", district: "Multan", villageLabel: "Chak Demo 12", placeLabel: "Chak Demo 12", source: "manual" },
      evidence: [],
      voice,
      ai: {
        suggestedCategory: "WAG",
        suggestedPriority: "High",
        summaryEn: "Paid less than agreed.",
        confidenceScore: 0.94,
        confidence: "high",
        failed: false,
        humanReviewRequired: false,
      },
      updatedAt: "2026-08-19T12:00:00.000Z",
    });
    expect(created.trackingId).toMatch(/^KP-26-\d{6}$/);
    expect(created.status).toBe("Received");
    expect(created.voice?.localUri).toBe("file://local/voice.m4a");
    expect(created.ai?.summaryEn).toBe("Paid less than agreed.");
    expect(created.priority).toBe("High");
    await expect(complaintService.getDraft()).resolves.toBeNull();
    const mine = await complaintService.listMine();
    expect(mine.some((row) => row.trackingId === created.trackingId)).toBe(true);
  });

  it("rejects submit without privacy mode", async () => {
    await expect(
      complaintService.createFromDraft({
        id: "draft-2",
        stepId: "review",
        category: "WAG",
        incident: {},
        location: {},
        evidence: [],
        voice: null,
        updatedAt: "2026-08-19T12:00:00.000Z",
      }),
    ).rejects.toThrow(/privacy/i);
  });

  it("omits identity and direct-contact fields from anonymous submissions", async () => {
    const created = await complaintService.createFromDraft({
      id: "anonymous-draft",
      stepId: "review",
      category: "WAG",
      privacyMode: "ANON",
      reporterIdentity: { mode: "anonymous", cnicVerified: false },
      incident: {
        whenLabel: "today",
        immediateDanger: false,
        othersAffected: "individual",
        structuredAnswers: {
          contactPreference: "none",
          alternateContact: "03001234567",
          identityValue: "sensitive",
        },
      },
      location: { province: "Punjab", district: "Multan", placeLabel: "Cotton field", source: "manual" },
      evidence: [],
      voice: null,
      updatedAt: "2026-08-19T12:00:00.000Z",
    });

    expect(created.reporterIdentity).toBeUndefined();
    expect(created.reporter.displayName).toBeUndefined();
    expect(created.reporter.contactAllowed).toBe(false);
    expect(created.incident.structuredAnswers).not.toHaveProperty("alternateContact");
    expect(created.incident.structuredAnswers).not.toHaveProperty("identityValue");
  });

  it("records dissatisfaction without reopening a closed case", async () => {
    const created = await complaintService.createFromDraft({
      id: "draft-3",
      stepId: "review",
      category: "SAN",
      privacyMode: "IDEN",
      reporterIdentity: { mode: "cnic", cnicLast4: "4567", phoneLast4: "4567", cnicVerified: false },
      incident: { whenLabel: "today", immediateDanger: false, othersAffected: "individual", structuredAnswers: { contactPreference: "do-not-initiate" } },
      location: { province: "Sindh", district: "Sanghar", placeLabel: "Cotton field", source: "manual" },
      evidence: [],
      voice: null,
      updatedAt: "2026-08-19T12:00:00.000Z",
    });
    await getMobileRepository().save({ ...created, status: "Closed" });
    await complaintService.submitWorkerFeedback(created.id, {
      outcome: "unresolved",
      submittedAt: DEMO_NOW_ISO,
    });
    const after = await complaintService.getById(created.id);
    expect(after?.status).toBe("Closed");
    expect(after?.workerFeedback?.outcome).toBe("unresolved");
  });

  it("lists all rights topics through the service", async () => {
    const topics = await rightsContentService.list();
    expect(topics).toHaveLength(13);
    expect(topics.map((topic) => topic.id)).toContain("wages");
  });

  it("queues an offline submit as Draft and promotes it once on reconnect", async () => {
    demoService.setOffline(true);
    const draft = {
      id: "offline-draft-1",
      stepId: "review" as const,
      category: "WAG" as const,
      privacyMode: "CONF" as const,
      reporterIdentity: { mode: "cnic" as const, cnicLast4: "4567", phoneLast4: "4567", cnicVerified: false },
      incident: {
        whenLabel: "today",
        immediateDanger: false,
        othersAffected: "individual" as const,
        structuredAnswers: { contactPreference: "do-not-initiate" },
      },
      location: { province: "Punjab", district: "Multan", placeLabel: "Cotton field", source: "manual" as const },
      evidence: [],
      voice: {
        id: "voice-offline",
        localUri: "file://local/voice.m4a",
        durationMs: 800,
        recordedAt: "2026-08-19T12:00:00.000Z",
        locale: "ur" as const,
      },
      updatedAt: "2026-08-19T12:00:00.000Z",
    };
    const saved = await complaintService.createFromDraft(draft);
    expect(saved.status).toBe("Received");
    expect(workerFacingStatusKey[saved.status]).toBe("status.worker.received");
    expect(saved.voice?.localUri).toBe("file://local/voice.m4a");
    expect(await offlineQueueService.pendingCount()).toBe(1);
    const again = await complaintService.createFromDraft(draft);
    expect(again.trackingId).toBe(saved.trackingId);
    expect(await offlineQueueService.pendingCount()).toBe(1);
    const result = await demoService.simulateReconnect();
    expect(result.processed).toBe(1);
    expect(result.failed).toBe(0);
    expect(getDemoFlags().connectivity).toBe("online");
    const sent = await complaintService.getById(saved.id);
    expect(sent?.status).toBe("Received");
    expect(sent?.actions.some((item) => item.type === "Complaint Received")).toBe(true);
    expect(await offlineQueueService.pendingCount()).toBe(0);
    const retry = await demoService.processQueue();
    expect(retry.processed).toBe(0);
    const mine = await complaintService.listMine();
    expect(mine.filter((row) => row.trackingId === saved.trackingId)).toHaveLength(1);
  });

  it("persists simulated offline state across hydrate", async () => {
    const store = createMemoryStore();
    configureMockRuntime({ mobileStore: store });
    demoService.setOffline(true);
    await persistDemoFlags();
    configureMockRuntime({ mobileStore: store });
    expect(getDemoFlags().offline).toBe(false);
    await hydrateDemoRuntime();
    expect(getDemoFlags().connectivity).toBe("offline-demo");
    expect(getDemoFlags().offline).toBe(true);
  });

  it("writes schema on first run and resets the queue when the version mismatches", async () => {
    const store = createMemoryStore();
    configureMockRuntime({ mobileStore: store });
    const first = await ensurePersistenceSchema();
    expect(first.reset).toBe(false);
    expect(await store.getItem(persistenceKeys.schema)).toBe("3");
    demoService.setOffline(true);
    await demoService.queueOneComplaint();
    expect(await offlineQueueService.pendingCount()).toBe(1);
    await store.setItem(persistenceKeys.schema, "0");
    const second = await ensurePersistenceSchema();
    expect(second.reset).toBe(true);
    expect(await offlineQueueService.pendingCount()).toBe(0);
    expect(getDemoFlags().connectivity).toBe("online");
  });

  it("refreshes the persisted portal seed when the schema version changes", async () => {
    const store = createMemoryStore();
    configureMockRuntime({ portalStore: store, demoStore: store });
    await store.setItem(persistenceKeys.schema, "1");
    const oldRows = await caseManagementService.list();
    await caseManagementService.addNote(oldRows[0]!.id, "old local portal seed");
    expect((await caseManagementService.get(oldRows[0]!.id))?.actions.some((item) => item.note === "old local portal seed")).toBe(true);
    const result = await ensurePersistenceSchema();
    expect(result.reset).toBe(true);
    expect(await store.getItem(persistenceKeys.schema)).toBe("3");
    expect((await caseManagementService.get(oldRows[0]!.id))?.actions.some((item) => item.note === "old local portal seed")).toBe(false);
  });

  it("clears the offline queue on demo reset", async () => {
    await demoService.queueOneComplaint();
    expect(await offlineQueueService.pendingCount()).toBe(1);
    await demoService.reset();
    expect(await offlineQueueService.pendingCount()).toBe(0);
    expect(getDemoFlags().offline).toBe(false);
  });

  it("clears a corrupt draft instead of crashing", async () => {
    const store = createMemoryStore();
    configureMockRuntime({ mobileStore: store });
    await store.setItem(persistenceKeys.draft, "{not-json");
    await expect(complaintService.getDraft()).resolves.toBeNull();
    expect(await store.getItem(persistenceKeys.draft)).toBeNull();
  });
});
