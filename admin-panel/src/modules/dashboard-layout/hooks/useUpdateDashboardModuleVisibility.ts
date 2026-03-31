"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateDashboardModuleVisibility } from "@/modules/dashboard-layout/api/dashboardLayout.api";
import { DASHBOARD_LAYOUT_QUERY_KEY } from "@/modules/dashboard-layout/hooks/useDashboardLayout";
import type { DashboardLayoutItem } from "@/modules/dashboard-layout/types/dashboardLayout.types";

export const useUpdateDashboardModuleVisibility = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      moduleId,
      isVisible,
      fallbackModules,
    }: {
      moduleId: DashboardLayoutItem["moduleId"];
      isVisible: boolean;
      fallbackModules?: DashboardLayoutItem[];
    }) => updateDashboardModuleVisibility(moduleId, isVisible, fallbackModules),
    onSuccess: (modules) => {
      queryClient.setQueryData(DASHBOARD_LAYOUT_QUERY_KEY, modules);
    },
  });
};
