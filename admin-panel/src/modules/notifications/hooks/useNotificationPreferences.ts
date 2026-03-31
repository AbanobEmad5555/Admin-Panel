import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "@/modules/notifications/api/notifications.api";
import { notificationsKeys } from "@/modules/notifications/hooks/useNotificationsShared";
import type {
  NotificationPreferencesResponse,
  UpdateNotificationPreferenceModulesPayload,
  UpdateNotificationPreferenceTypesPayload,
} from "@/modules/notifications/types/notifications.types";

export const notificationPreferenceKeys = {
  detail: () => ["notifications", "preferences"] as const,
};

const invalidateNotificationQueries = async (queryClient: ReturnType<typeof useQueryClient>) => {
  await queryClient.invalidateQueries({ queryKey: notificationPreferenceKeys.detail() });
  await queryClient.invalidateQueries({ queryKey: ["notifications", "list"] });
  await queryClient.invalidateQueries({ queryKey: ["notifications", "latest"] });
  await queryClient.invalidateQueries({ queryKey: notificationsKeys.unreadCount() });
};

export const useNotificationPreferences = () =>
  useQuery({
    queryKey: notificationPreferenceKeys.detail(),
    queryFn: () => notificationsApi.getNotificationPreferences(),
  });

export const useUpdateNotificationPreferenceModules = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateNotificationPreferenceModulesPayload) =>
      notificationsApi.updateNotificationPreferenceModules(payload),
    onSuccess: async () => {
      await invalidateNotificationQueries(queryClient);
    },
  });
};

export const useUpdateNotificationPreferenceTypes = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateNotificationPreferenceTypesPayload) =>
      notificationsApi.updateNotificationPreferenceTypes(payload),
    onSuccess: async () => {
      await invalidateNotificationQueries(queryClient);
    },
  });
};

export const useResetNotificationPreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsApi.resetNotificationPreferences(),
    onSuccess: async () => {
      await invalidateNotificationQueries(queryClient);
    },
  });
};

export const buildPreferenceSnapshot = (data: NotificationPreferencesResponse | undefined) => ({
  modules:
    data?.modules
      .map(({ module, isEnabled }) => ({
        module,
        isEnabled,
      }))
      .sort((left, right) => left.module.localeCompare(right.module)) ?? [],
  types:
    data?.types
      .map(({ module, type, isEnabled }) => ({
        module,
        type,
        isEnabled,
      }))
      .sort((left, right) =>
        `${left.module}:${left.type}`.localeCompare(`${right.module}:${right.type}`),
      ) ?? [],
});
