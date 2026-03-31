"use client";

import { useLocalization } from "@/modules/localization/LocalizationProvider";
import NotificationListItem from "@/modules/notifications/components/NotificationListItem";
import NotificationsEmptyState from "@/modules/notifications/components/NotificationsEmptyState";
import NotificationsSkeleton from "@/modules/notifications/components/NotificationsSkeleton";
import type { NotificationItem } from "@/modules/notifications/types/notifications.types";

type NotificationsPageListProps = {
  notifications: NotificationItem[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onNotificationClick: (notification: NotificationItem) => void;
};

export default function NotificationsPageList({
  notifications,
  isLoading,
  isError,
  errorMessage,
  onNotificationClick,
}: NotificationsPageListProps) {
  const { t } = useLocalization();

  if (isLoading) {
    return <NotificationsSkeleton rows={6} />;
  }

  if (isError) {
    return (
      <NotificationsEmptyState
        title={t("notifications.loadFailed")}
        description={errorMessage ?? t("notifications.retryLater")}
      />
    );
  }

  if (notifications.length === 0) {
    return (
      <NotificationsEmptyState
        title={t("notifications.emptyPageTitle")}
        description={t("notifications.emptyPageDescription")}
      />
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification) => (
        <NotificationListItem
          key={notification.id}
          notification={notification}
          onClick={onNotificationClick}
          actionLabel={notification.redirectUrl ? t("notifications.openDestination") : undefined}
        />
      ))}
    </div>
  );
}
