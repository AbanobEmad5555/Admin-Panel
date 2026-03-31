import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { NotificationItem } from "@/modules/notifications/types/notifications.types";

type HandleNotificationClickOptions = {
  notification: NotificationItem;
  router: AppRouterInstance;
  onMarkAsRead?: (notification: NotificationItem) => Promise<unknown>;
  onAfterNavigate?: () => void;
};

const sanitizeRedirectUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      return parsed.pathname || null;
    } catch {
      return null;
    }
  }

  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
};

const resolveModuleRedirect = (notification: NotificationItem, redirectUrl: string | null) => {
  if (notification.module === "purchases") {
    if (redirectUrl === "/purchases/costs" || redirectUrl === "/admin/purchases/costs") {
      return "/purchases/costs";
    }

    if (redirectUrl === "/purchases/summary" || redirectUrl === "/admin/purchases/summary") {
      return "/purchases/summary";
    }

    return "/purchases";
  }

  return redirectUrl;
};

export const resolveNotificationRedirect = (notification: NotificationItem) => {
  const redirectUrl = notification.redirectUrl?.trim()
    ? sanitizeRedirectUrl(notification.redirectUrl)
    : null;

  const moduleRedirect = resolveModuleRedirect(notification, redirectUrl);
  if (moduleRedirect) {
    return moduleRedirect;
  }

  return null;
};

export const handleNotificationClick = async ({
  notification,
  router,
  onMarkAsRead,
  onAfterNavigate,
}: HandleNotificationClickOptions) => {
  const redirectUrl = resolveNotificationRedirect(notification);

  if (!notification.isRead && onMarkAsRead) {
    void onMarkAsRead(notification).catch(() => undefined);
  }

  if (redirectUrl) {
    router.push(redirectUrl);
    onAfterNavigate?.();
  }
};
