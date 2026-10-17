import {
  complaintService,
  ensurePersistenceSchema,
  getPersistenceNotice,
  hydrateDemoRuntime,
} from "@kapas/mock-services";

export { ensurePersistenceSchema, getPersistenceNotice, hydrateDemoRuntime };

export async function bootLocalPersistence(): Promise<void> {
  await ensurePersistenceSchema();
  await hydrateDemoRuntime();
  await complaintService.getDraft();
}
