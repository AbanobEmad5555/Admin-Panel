"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useHasHydrated } from "@/lib/useHasHydrated";
import { useLocalization } from "@/modules/localization/LocalizationProvider";
import NotificationsDropdown from "@/modules/notifications/components/NotificationsDropdown";
import { useLatestNotifications } from "@/modules/notifications/hooks/useLatestNotifications";
import { useMarkAllNotificationsRead } from "@/modules/notifications/hooks/useMarkAllNotificationsRead";
import { useMarkNotificationRead } from "@/modules/notifications/hooks/useMarkNotificationRead";
import { useNotificationsPolling } from "@/modules/notifications/hooks/useNotificationsPolling";
import { formatUnreadCount } from "@/modules/notifications/utils/notificationFormat";
import { handleNotificationClick } from "@/modules/notifications/utils/notificationRedirect";
import type { NotificationItem } from "@/modules/notifications/types/notifications.types";

const getErrorMessage = (error: unknown, fallback: string) => {
  if (!error || typeof error !== "object") {
    return fallback;
  }
  const maybeAxios = error as { response?: { data?: { message?: string }; status?: number } };
  return maybeAxios.response?.data?.message ?? fallback;
};

export default function NotificationBell() {
  const router = useRouter();
  const { language, t } = useLocalization();
  const mounted = useHasHydrated();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const latestLimit = 10;

  const latestQuery = useLatestNotifications(latestLimit);
  const unreadQuery = useNotificationsPolling({
    latestLimit,
    seedNotifications: latestQuery.data ?? [],
  });
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const unreadCount = unreadQuery.data ?? 0;
  const notifications = latestQuery.data ?? [];

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    const status = (latestQuery.error as { response?: { status?: number } } | undefined)?.response?.status;
    if (status === 403) {
      router.replace("/403");
    }
  }, [latestQuery.error, router]);

  const unreadLabel = useMemo(() => formatUnreadCount(unreadCount), [unreadCount]);

  const handleMarkOneAsRead = async (notification: NotificationItem) => {
    try {
      await markRead.mutateAsync(notification.id);
    } catch (error) {
      toast.error(getErrorMessage(error, t("notifications.updatedToast")));
    }
  };

  const handleDropdownItemClick = (notification: NotificationItem) => {
    void handleNotificationClick({
      notification,
      router,
      onMarkAsRead: handleMarkOneAsRead,
      onAfterNavigate: () => setOpen(false),
    });
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAll.mutateAsync();
    } catch (error) {
      toast.error(getErrorMessage(error, t("notifications.markAllFailed")));
    }
  };

  if (!mounted) {
    return <div className="h-10 w-10 rounded-full border border-slate-200 bg-white" aria-hidden="true" />;
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={
          unreadCount > 0
            ? language === "ar"
              ? `${unreadCount} ${t("notifications.ariaBellUnread")}`
              : `${unreadCount} ${t("notifications.ariaBellUnread")}`
            : t("notifications.ariaBell")
        }
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((current) => !current)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-600 px-1.5 py-0.5 text-[11px] font-semibold text-white">
            {unreadLabel}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-3">
          <NotificationsDropdown
            notifications={notifications}
            isLoading={latestQuery.isLoading}
            isError={latestQuery.isError}
            onNotificationClick={handleDropdownItemClick}
            onMarkAllAsRead={handleMarkAllAsRead}
            isMarkingAllAsRead={markAll.isPending}
          />
        </div>
      ) : null}
    </div>
  );
}
