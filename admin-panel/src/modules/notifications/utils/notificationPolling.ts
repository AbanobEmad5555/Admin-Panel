import type { NotificationItem } from "@/modules/notifications/types/notifications.types";

export const dedupeNotifications = (items: NotificationItem[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item.id || seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
};

export const sortNotificationsLatestFirst = (items: NotificationItem[]) =>
  [...items].sort((left, right) => {
    const leftTime = Date.parse(left.createdAt);
    const rightTime = Date.parse(right.createdAt);
    return rightTime - leftTime;
  });

export const mergeNotificationLists = (
  current: NotificationItem[],
  incoming: NotificationItem[],
  limit?: number,
) => {
  const merged = sortNotificationsLatestFirst(dedupeNotifications([...incoming, ...current]));
  return typeof limit === "number" ? merged.slice(0, limit) : merged;
};
