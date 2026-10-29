"use client";

import type { AnalyticsFilters, ComplaintFilters } from "@kapas/domain";
import { useQuery } from "@tanstack/react-query";

import { productionPortalApi } from "@/lib/portal-api";

export function useDashboardData(filters?: ComplaintFilters, enabled = true) {
  return useQuery({
    queryKey: ["dashboard", filters],
    queryFn: async () => {
      const [rows, snapshot] = await Promise.all([productionPortalApi.list(filters), productionPortalApi.analytics(filters as AnalyticsFilters)]); return { rows, snapshot };
    },
    enabled,
  });
}

export function useComplaintList(filters?: ComplaintFilters) {
  return useQuery({
    queryKey: ["complaints", filters],
    queryFn: () => productionPortalApi.list(filters),
  });
}

export function useComplaint(id: string) {
  return useQuery({
    queryKey: ["complaints", id],
    queryFn: () => productionPortalApi.get(id),
    enabled: id.length > 0,
  });
}

export function useAnalyticsSnapshot(filters?: AnalyticsFilters, enabled = true) {
  return useQuery({
    queryKey: ["analytics", filters],
    queryFn: () => productionPortalApi.analytics(filters),
    enabled,
  });
}

export function useProvinces() {
  return useQuery({
    queryKey: ["provinces"],
    queryFn: async () => {
      const rows = await fetch("/api/v1/reference-data/locations", { credentials: "include" }).then((response) => response.json()) as { province: string }[];
      return [...new Set(rows.map((row) => row.province))].sort();
    },
  });
}
