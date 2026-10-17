"use client";

import type { AnalyticsFilters, ComplaintFilters } from "@kapas/domain";
import { analyticsService, caseManagementService, locationService, snapshotFrom } from "@kapas/mock-services";
import { useQuery } from "@tanstack/react-query";

export function useDashboardData(filters?: ComplaintFilters, enabled = true) {
  return useQuery({
    queryKey: ["dashboard", filters],
    queryFn: async () => {
      const rows = await caseManagementService.list(filters);
      return { rows, snapshot: snapshotFrom(rows) };
    },
    enabled,
  });
}

export function useComplaintList(filters?: ComplaintFilters) {
  return useQuery({
    queryKey: ["complaints", filters],
    queryFn: () => caseManagementService.list(filters),
  });
}

export function useComplaint(id: string) {
  return useQuery({
    queryKey: ["complaints", id],
    queryFn: () => caseManagementService.get(id),
    enabled: id.length > 0,
  });
}

export function useAnalyticsSnapshot(filters?: AnalyticsFilters, enabled = true) {
  return useQuery({
    queryKey: ["analytics", filters],
    queryFn: () => analyticsService.getSnapshot(filters),
    enabled,
  });
}

export function useProvinces() {
  return useQuery({
    queryKey: ["provinces"],
    queryFn: async () => {
      const rows = await locationService.list();
      return [...new Set(rows.map((row) => row.province))].sort();
    },
  });
}
