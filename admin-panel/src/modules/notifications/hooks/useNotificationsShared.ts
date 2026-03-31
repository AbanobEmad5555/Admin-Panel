import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "@/modules/notifications/api/notifications.api";
import { mergeNotificationLists } from "@/modules/notifications/utils/notificationPolling";
import type {
  NotificationItem,
  NotificationsFilters,
  NotificationsListResponse,
} from "@/modules/notifications/types/notifications.types";

export const notificationsKeys = {
  latest: (limit: number) => ["notifications", "latest", limit] as const,
  list: (filters: NotificationsFilters) => ["notifications", "list", filters] as const,
  unreadCount: () => ["notifications", "unread-count"] as const,
  since: (since: string) => ["notifications", "since", since] as const,
};

const updateNotificationReadState = (notification: NotificationItem, isRead = true): NotificationItem => ({
  ...notification,
  isRead,
  readAt: isRead ? notification.readAt ?? new Date().toISOString() : null,
});

const patchListItems = (
  list: NotificationsListResponse | undefined,
  updater: (item: NotificationItem) => NotificationItem,
) => {
  if (!list) {
    return list;
  }
  return {
    ...list,
    items: list.items.map(updater),
  };
};

export const useLatestNotifications = (limit = 10) =>
  useQuery({
    queryKey: notificationsKeys.latest(limit),
    queryFn: () => notificationsApi.getLatestNotifications(limit),
  });

export const useNotifications = (filters: NotificationsFilters) =>
  useQuery({
    queryKey: notificationsKeys.list(filters),
    queryFn: () => notificationsApi.getNotifications(filters),
    placeholderData: keepPreviousData,
  });

export const useUnreadCount = (refetchInterval?: number) =>
  useQuery({
    queryKey: notificationsKeys.unreadCount(),
    queryFn: () => notificationsApi.getUnreadCount(),
    refetchInterval,
  });

export const useNotificationsSince = (since: string) =>
  useQuery({
    queryKey: notificationsKeys.since(since),
    queryFn: () => notificationsApi.getNotificationsSince(since),
    enabled: Boolean(since),
  });

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationsApi.markNotificationAsRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });

      const previousUnreadCount = queryClient.getQueryData<number>(notificationsKeys.unreadCount());
      const previousLists = queryClient.getQueriesData<NotificationsListResponse>({
        queryKey: ["notifications", "list"],
      });
      const previousLatest = queryClient.getQueriesData<NotificationItem[]>({
        queryKey: ["notifications", "latest"],
      });

      queryClient.setQueriesData<NotificationsListResponse>(
        { queryKey: ["notifications", "list"] },
        (current) =>
          patchListItems(current, (item) =>
            item.id === id ? updateNotificationReadState(item) : item,
          ),
      );

      queryClient.setQueriesData<NotificationItem[]>(
        { queryKey: ["notifications", "latest"] },
        (current) =>
          current?.map((item) => (item.id === id ? updateNotificationReadState(item) : item)) ?? [],
      );

      queryClient.setQueryData<number>(
        notificationsKeys.unreadCount(),
        typeof previousUnreadCount === "number" ? Math.max(0, previousUnreadCount - 1) : 0,
      );

      return { previousUnreadCount, previousLists, previousLatest };
    },
    onError: (_error, _id, context) => {
      if (!context) {
        return;
      }
      queryClient.setQueryData(notificationsKeys.unreadCount(), context.previousUnreadCount);
      context.previousLists.forEach(([key, value]) => {
        queryClient.setQueryData(key, value);
      });
      context.previousLatest.forEach(([key, value]) => {
        queryClient.setQueryData(key, value);
      });
    },
    onSuccess: (notification) => {
      queryClient.setQueriesData<NotificationItem[]>(
        { queryKey: ["notifications", "latest"] },
        (current) =>
          mergeNotificationLists(
            current?.map((item) => (item.id === notification.id ? notification : item)) ?? [],
            [notification],
          ),
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: notificationsKeys.unreadCount() });
      void queryClient.invalidateQueries({ queryKey: ["notifications", "latest"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications", "list"] });
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsApi.markAllNotificationsAsRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });

      const previousUnreadCount = queryClient.getQueryData<number>(notificationsKeys.unreadCount());
      const previousLists = queryClient.getQueriesData<NotificationsListResponse>({
        queryKey: ["notifications", "list"],
      });
      const previousLatest = queryClient.getQueriesData<NotificationItem[]>({
        queryKey: ["notifications", "latest"],
      });

      queryClient.setQueriesData<NotificationsListResponse>(
        { queryKey: ["notifications", "list"] },
        (current) => patchListItems(current, (item) => updateNotificationReadState(item)),
      );

      queryClient.setQueriesData<NotificationItem[]>(
        { queryKey: ["notifications", "latest"] },
        (current) => current?.map((item) => updateNotificationReadState(item)) ?? [],
      );

      queryClient.setQueryData<number>(notificationsKeys.unreadCount(), 0);

      return { previousUnreadCount, previousLists, previousLatest };
    },
    onError: (_error, _variables, context) => {
      if (!context) {
        return;
      }
      queryClient.setQueryData(notificationsKeys.unreadCount(), context.previousUnreadCount);
      context.previousLists.forEach(([key, value]) => {
        queryClient.setQueryData(key, value);
      });
      context.previousLatest.forEach(([key, value]) => {
        queryClient.setQueryData(key, value);
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: notificationsKeys.unreadCount() });
      void queryClient.invalidateQueries({ queryKey: ["notifications", "latest"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications", "list"] });
    },
  });
};
