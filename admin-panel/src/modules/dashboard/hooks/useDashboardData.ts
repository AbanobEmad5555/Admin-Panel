import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/modules/dashboard/api/dashboard.api";
import type { DashboardQueryParams } from "@/modules/dashboard/api/dashboard.types";

export const dashboardKeys = {
  detail: (params: DashboardQueryParams) => ["dashboard", params] as const,
};

export const useDashboardData = (params: DashboardQueryParams, enabled = true) =>
  useQuery({
    queryKey: dashboardKeys.detail(params),
    queryFn: () => dashboardApi.get(params),
    enabled,
  });
