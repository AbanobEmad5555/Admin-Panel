"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";
import { useLocalization } from "@/modules/localization/LocalizationProvider";
import NotificationListItem from "@/modules/notifications/components/NotificationListItem";
import NotificationsEmptyState from "@/modules/notifications/components/NotificationsEmptyState";
import NotificationsSkeleton from "@/modules/notifications/components/NotificationsSkeleton";
import type { NotificationItem } from "@/modules/notifications/types/notifications.types";

type NotificationsDropdownProps = {
  notifications: NotificationItem[];
  isLoading: boolean;
  isError: boolean;
  onNotificationClick: (notification: NotificationItem) => void;
  onMarkAllAsRead: () => void;
  isMarkingAllAsRead: boolean;
};

export default function NotificationsDropdown({
  notifications,
  isLoading,
  isError,
  onNotificationClick,
  onMarkAllAsRead,
  isMarkingAllAsRead,
}: NotificationsDropdownProps) {
  const { t } = useLocalization();

  return (
    <div className="w-[min(92vw,24rem)] rounded-2xl border border-slate-200 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{t("notifications.title")}</h2>
          <p className="text-xs text-slate-500">{t("notifications.latestActivity")}</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="px-3 py-1 text-xs"
          onClick={onMarkAllAsRead}
          disabled={isMarkingAllAsRead || notifications.length === 0}
        >
          {isMarkingAllAsRead ? t("common.updating") : t("notifications.markAllRead")}
        </Button>
      </div>

      <div className="max-h-[26rem] overflow-y-auto p-3">
        {isLoading ? <NotificationsSkeleton compact rows={4} /> : null}
        {!isLoading && isError ? (
          <NotificationsEmptyState
            compact
            title={t("notifications.loadFailed")}
            description={t("notifications.pollRetry")}
          />
        ) : null}
        {!isLoading && !isError && notifications.length === 0 ? (
          <NotificationsEmptyState
            compact
            title={t("notifications.emptyTitle")}
            description={t("notifications.emptyDescription")}
          />
        ) : null}
        {!isLoading && !isError && notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <NotificationListItem
                key={notification.id}
                notification={notification}
                compact
                actionLabel={notification.redirectUrl ? t("notifications.openDetails") : undefined}
                onClick={onNotificationClick}
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className="border-t border-slate-200 px-4 py-3">
        <Link
          href="/admin/notifications"
          className="inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
        >
          {t("notifications.viewAll")}
        </Link>
      </div>
    </div>
  );
}
