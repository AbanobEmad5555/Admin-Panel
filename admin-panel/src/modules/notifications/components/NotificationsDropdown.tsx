"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";
import GradientCard from "@/components/ui/GradientCard";
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
    <GradientCard
      glow
      padding="none"
      className="w-[min(92vw,26rem)] overflow-hidden border-white/15 bg-[rgba(8,15,30,0.94)] shadow-[0_26px_70px_rgba(2,6,23,0.72),0_0_36px_rgba(56,189,248,0.12)]"
    >
      <div className="flex items-center justify-between border-b border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-4 py-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-50">{t("notifications.title")}</h2>
          <p className="text-xs text-slate-300">{t("notifications.latestActivity")}</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onMarkAllAsRead}
          disabled={isMarkingAllAsRead || notifications.length === 0}
        >
          {isMarkingAllAsRead ? t("common.updating") : t("notifications.markAllRead")}
        </Button>
      </div>

      <div className="admin-scrollbar max-h-[26rem] overflow-y-auto bg-[linear-gradient(180deg,rgba(15,23,42,0.72),rgba(2,6,23,0.88))] p-3">
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

      <div className="border-t border-white/12 bg-[rgba(255,255,255,0.02)] px-4 py-4">
        <Link href="/admin/notifications" className="block">
          <Button className="w-full">{t("notifications.viewAll")}</Button>
        </Link>
      </div>
    </GradientCard>
  );
}
