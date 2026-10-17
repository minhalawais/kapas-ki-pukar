import type { AnalyticsFilters, Complaint } from "@kapas/domain";

import { complaintsToCsv, filterComplaints } from "./analyticsSelectors";

export function exportCsv(rows: Complaint[], filters?: AnalyticsFilters): string {
  return complaintsToCsv(filterComplaints(rows, filters));
}
