"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "@/modules/notifications/api/notifications.api";
import { notificationsKeys, useUnreadCount } from "@/modules/notifications/hooks/useNotificationsShared";
import { notificationSound } from "@/modules/notifications/utils/notificationSound";
import type { NotificationItem } from "@/modules/notifications/types/notifications.types";

type UseNotificationsPollingOptions = {
  latestLimit?: number;
  intervalMs?: number;
  seedNotifications?: NotificationItem[];
};

export const useNotificationsPolling = ({
  latestLimit = 10,
  intervalMs = 15000,
  seedNotifications = [],
}: UseNotificationsPollingOptions = {}) => {
  const queryClient = useQueryClient();
  const unreadQuery = useUnreadCount(intervalMs);
  const previousUnreadCountRef = useRef<number | null>(null);
  const initializedRef = useRef(false);
  const seenUnreadIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const latest =
      seedNotifications.length > 0
        ? seedNotifications
        : queryClient.getQueryData<NotificationItem[]>(notificationsKeys.latest(latestLimit)) ?? [];
    if (latest.length === 0) {
      return;
    }
    seenUnreadIdsRef.current = new Set(latest.filter((item) => !item.isRead).map((item) => item.id));
  }, [latestLimit, queryClient, seedNotifications]);

  useEffect(() => {
    const unreadCount = unreadQuery.data;
    if (typeof unreadCount !== "number") {
      return;
    }

    if (!initializedRef.current) {
      initializedRef.current = true;
      previousUnreadCountRef.current = unreadCount;
      return;
    }

    const previousUnreadCount = previousUnreadCountRef.current ?? unreadCount;
    previousUnreadCountRef.current = unreadCount;

    if (unreadCount <= previousUnreadCount) {
      return;
    }

    void (async () => {
      try {
        const latest = await notificationsApi.getLatestNotifications(latestLimit);
        queryClient.setQueryData(notificationsKeys.latest(latestLimit), latest);
        void queryClient.invalidateQueries({ queryKey: ["notifications", "list"] });

        const genuinelyNewUnread = latest.filter(
          (item) => !item.isRead && !seenUnreadIdsRef.current.has(item.id),
        );

        if (genuinelyNewUnread.length > 0) {
          genuinelyNewUnread.forEach((item) => seenUnreadIdsRef.current.add(item.id));
          await notificationSound.play();
        }
      } catch {
        // Keep current UI and retry on the next poll cycle.
      }
    })();
  }, [latestLimit, queryClient, unreadQuery.data]);

  return unreadQuery;
};
