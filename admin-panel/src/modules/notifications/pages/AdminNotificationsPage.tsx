"use client";
import { useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import AdminLayout from "@/components/layout/AdminLayout";
import Button from "@/components/ui/Button";
import { useLocalization } from "@/modules/localization/LocalizationProvider";
import NotificationsFilters from "@/modules/notifications/components/NotificationsFilters";
import NotificationsPageList from "@/modules/notifications/components/NotificationsPageList";
import { useMarkAllNotificationsRead } from "@/modules/notifications/hooks/useMarkAllNotificationsRead";
import { useMarkNotificationRead } from "@/modules/notifications/hooks/useMarkNotificationRead";
import { useNotifications } from "@/modules/notifications/hooks/useNotifications";
import { handleNotificationClick } from "@/modules/notifications/utils/notificationRedirect";
import {
  buildSearchParamsFromNotificationsFilters,
  parseNotificationsFiltersFromSearchParams,
  type NotificationsFilterState,
} from "@/modules/notifications/utils/notificationUrlState";
import type { NotificationItem } from "@/modules/notifications/types/notifications.types";

const getErrorMessage = (error: unknown, fallback: string) => {
  if (!error || typeof error !== "object") {
    return fallback;
  }
  const maybeAxios = error as { response?: { data?: { message?: string }; status?: number } };
  return maybeAxios.response?.data?.message ?? fallback;
};

export default function AdminNotificationsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useLocalization();

  const filters = useMemo<NotificationsFilterState>(
    () => parseNotificationsFiltersFromSearchParams(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const notificationsQuery = useNotifications(filters);
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const notifications = notificationsQuery.data?.items ?? [];
  const pagination = notificationsQuery.data?.pagination ?? {
    page: filters.page,
    limit: filters.limit,
    totalItems: 0,
    totalPages: 1,
  };

  useEffect(() => {
    const status = (notificationsQuery.error as { response?: { status?: number } } | undefined)?.response?.status;
    if (status === 403) {
      router.replace("/403");
    }
  }, [notificationsQuery.error, router]);

  const setFilters = (next: NotificationsFilterState) => {
    const params = buildSearchParamsFromNotificationsFilters(next);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      isRead: undefined,
      module: undefined,
      type: undefined,
    });
  };

  const handleMarkOneAsRead = async (notification: NotificationItem) => {
    try {
      await markRead.mutateAsync(notification.id);
    } catch (error) {
      toast.error(getErrorMessage(error, t("notifications.updatedToast")));
    }
  };

  const handleNotificationItemClick = (notification: NotificationItem) => {
    void handleNotificationClick({
      notification,
      router,
      onMarkAsRead: handleMarkOneAsRead,
    });
  };

  const handleMarkAll = async () => {
    try {
      await markAll.mutateAsync();
      toast.success(t("notifications.markAllSuccess"));
    } catch (error) {
      toast.error(getErrorMessage(error, t("notifications.markAllFailed")));
    }
  };

  return (
    <AdminLayout title={t("notifications.title")}>
      <section className="space-y-4">
        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">{t("notifications.title")}</h1>
              <p className="mt-1 text-sm text-slate-500">{t("notifications.subtitle")}</p>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void handleMarkAll()}
              disabled={markAll.isPending || notifications.length === 0}
            >
              {markAll.isPending ? t("common.updating") : t("notifications.markAllRead")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push("/admin/notifications/preferences")}
            >
              {t("notifications.preferences.openAction", "Notification preferences")}
            </Button>
          </div>
        </header>

        <NotificationsFilters
          value={filters}
          onApply={setFilters}
          onClear={handleResetFilters}
        />

        <section className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
              <p>
                {t("notifications.showing")}{" "}
                <span className="font-semibold text-slate-900">{notifications.length}</span>{" "}
                {t("notifications.of")}{" "}
                <span className="font-semibold text-slate-900">{pagination.totalItems}</span>{" "}
                {t("notifications.itemsLabel")}
              </p>
              <p>
                {t("notifications.page")}{" "}
                <span className="font-semibold text-slate-900">{pagination.page}</span>{" "}
                {t("notifications.of")}{" "}
                <span className="font-semibold text-slate-900">{pagination.totalPages}</span>
              </p>
            </div>
          </div>

          <NotificationsPageList
            notifications={notifications}
            isLoading={notificationsQuery.isLoading}
            isError={notificationsQuery.isError}
            errorMessage={getErrorMessage(notificationsQuery.error, t("notifications.pageLoadFailed"))}
            onNotificationClick={handleNotificationItemClick}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <Button
              type="button"
              variant="secondary"
              disabled={pagination.page <= 1}
              onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}
            >
              {t("common.previous")}
            </Button>
            <div className="text-sm text-slate-600">
              {t("notifications.page")}{" "}
              <span className="font-semibold text-slate-900">{pagination.page}</span>{" "}
              {t("notifications.of")}{" "}
              <span className="font-semibold text-slate-900">{pagination.totalPages}</span>
            </div>
            <Button
              type="button"
              variant="secondary"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}
            >
              {t("common.next")}
            </Button>
          </div>
        </section>
      </section>
    </AdminLayout>
  );
}
