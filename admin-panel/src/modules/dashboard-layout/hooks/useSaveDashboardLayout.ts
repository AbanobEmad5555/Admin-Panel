"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveDashboardLayout } from "@/modules/dashboard-layout/api/dashboardLayout.api";
import { DASHBOARD_LAYOUT_QUERY_KEY } from "@/modules/dashboard-layout/hooks/useDashboardLayout";
import type { DashboardLayoutItem } from "@/modules/dashboard-layout/types/dashboardLayout.types";

export const useSaveDashboardLayout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (modules: DashboardLayoutItem[]) => saveDashboardLayout(modules),
    onSuccess: (modules) => {
      queryClient.setQueryData(DASHBOARD_LAYOUT_QUERY_KEY, modules);
    },
  });
};
