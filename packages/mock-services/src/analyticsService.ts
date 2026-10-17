import type { AnalyticsFilters, AnalyticsSnapshot } from "@kapas/domain";

import { snapshotFrom } from "./analyticsSelectors";
import { exportCsv as csvFromRepository } from "./exportCsv";
import { getPortalRepository } from "./runtime";

export const analyticsService = {
  async getSnapshot(filters?: AnalyticsFilters): Promise<AnalyticsSnapshot> {
    const rows = await getPortalRepository().list();
    return snapshotFrom(rows, filters);
  },
  async exportCsv(filters?: AnalyticsFilters): Promise<Blob> {
    const rows = await getPortalRepository().list();
    return new Blob([csvFromRepository(rows, filters)]);
  },
};
