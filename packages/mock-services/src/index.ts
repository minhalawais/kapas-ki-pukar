export {
  configureMockRuntime,
  ensurePersistenceSchema,
  getDemoFlags,
  getMobileRepository,
  getPersistenceNotice,
  getPortalRepository,
  hydrateDemoRuntime,
  persistDemoFlags,
  type DemoFlags,
  type PersistenceNotice,
} from "./runtime";
export { offlineQueueService } from "./offlineQueue";
export { createMemoryStore, createWebStorageAdapter, type KeyValueStore } from "./storage/KeyValueStore";
export {
  createMobileComplaintRepository,
  createPortalComplaintRepository,
  type ComplaintRepositoryContract,
} from "./repositories/ComplaintRepository";
export { caseLifecycleService, InvalidTransitionError, type PortalCaseAction } from "./lifecycle/CaseLifecycleService";
export { priorityRulesService } from "./rules/PriorityRulesService";
export { complaintService } from "./complaintService";
export { caseManagementService } from "./caseManagement";
export { analyticsService } from "./analyticsService";
export { demoService } from "./demo";
export { evidenceService } from "./evidence";
export { locationService } from "./locationService";
export { rightsContentService } from "./rightsContentService";
export { snapshotFrom, filterComplaints, complaintsToCsv, comparePriority, compareStatus, exportCsv } from "./analytics";

export class PhaseNotReadyError extends Error {
  constructor(phase: string, contract: string) {
    super(`${contract} is implemented in Implementation Phase ${phase}.`);
    this.name = "PhaseNotReadyError";
  }
}
