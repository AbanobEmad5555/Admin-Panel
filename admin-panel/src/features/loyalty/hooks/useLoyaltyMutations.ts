"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { loyaltyApi } from "@/features/loyalty/api/loyalty.api";
import { loyaltyQueryKeys } from "@/features/loyalty/hooks/queryKeys";
import type {
  LoyaltySettingsFormValues,
  ManualAdjustmentPayload,
  ManualExpirePayload,
  ResetPayload,
} from "@/features/loyalty/types";

const invalidateUserQueries = async (
  queryClient: ReturnType<typeof useQueryClient>,
  userId: number
) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["loyalty", "users"] }),
    queryClient.invalidateQueries({ queryKey: loyaltyQueryKeys.userSummary(userId) }),
    queryClient.invalidateQueries({ queryKey: ["loyalty", "user-history", userId] }),
    queryClient.invalidateQueries({ queryKey: ["loyalty", "summary"] }),
  ]);
};

export const useUpdateLoyaltySettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LoyaltySettingsFormValues) => loyaltyApi.updateSettings(payload),
    onSuccess: async (data) => {
      queryClient.setQueryData(loyaltyQueryKeys.settings(), data);
      await queryClient.invalidateQueries({ queryKey: loyaltyQueryKeys.settings() });
      await queryClient.invalidateQueries({ queryKey: ["loyalty", "summary"] });
    },
  });
};

export const useManualAdjustPoints = (userId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ManualAdjustmentPayload) => loyaltyApi.manualAdjust(userId, payload),
    onSuccess: async () => invalidateUserQueries(queryClient, userId),
  });
};

export const useManualExpirePoints = (userId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ManualExpirePayload) => loyaltyApi.manualExpire(userId, payload),
    onSuccess: async () => invalidateUserQueries(queryClient, userId),
  });
};

export const useResetLoyaltyUser = (userId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ResetPayload) => loyaltyApi.resetUser(userId, payload),
    onSuccess: async () => invalidateUserQueries(queryClient, userId),
  });
};
