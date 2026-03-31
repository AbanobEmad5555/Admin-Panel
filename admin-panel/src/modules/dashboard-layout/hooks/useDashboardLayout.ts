"use client";

import { useQuery } from "@tanstack/react-query";
import { getDashboardLayout } from "@/modules/dashboard-layout/api/dashboardLayout.api";
import { useAdminTokenPresence } from "@/lib/useAdminTokenPresence";

export const DASHBOARD_LAYOUT_QUERY_KEY = ["dashboard-layout"] as const;

export const useDashboardLayout = () => {
  const hasToken = useAdminTokenPresence();

  return useQuery({
    queryKey: DASHBOARD_LAYOUT_QUERY_KEY,
    queryFn: getDashboardLayout,
    enabled: Boolean(hasToken),
    staleTime: 60_000,
  });
};
