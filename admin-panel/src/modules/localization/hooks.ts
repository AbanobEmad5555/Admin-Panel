"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { localizationApi } from "@/modules/localization/api";
import { LOCALIZATION_QUERY_KEY } from "@/modules/localization/constants";

export const useAdminLocalization = () =>
  useQuery({
    queryKey: LOCALIZATION_QUERY_KEY,
    queryFn: localizationApi.getSettings,
  });

export const useUpdateAdminLocalization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: localizationApi.updateSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(LOCALIZATION_QUERY_KEY, data);
      queryClient.invalidateQueries({ queryKey: LOCALIZATION_QUERY_KEY });
    },
  });
};
