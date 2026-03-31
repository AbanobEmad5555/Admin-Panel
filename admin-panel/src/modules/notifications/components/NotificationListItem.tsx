"use client";

import { ExternalLink } from "lucide-react";
import { useLocalization } from "@/modules/localization/LocalizationProvider";
import NotificationBadge from "@/modules/notifications/components/NotificationBadge";
import NotificationSeverityBadge from "@/modules/notifications/components/NotificationSeverityBadge";
import {
  formatNotificationDateTime,
  formatNotificationRelativeTime,
  getLocalizedNotificationContent,
  getNotificationTypeLabel,
} from "@/modules/notifications/utils/notificationFormat";
import type { NotificationItem } from "@/modules/notifications/types/notifications.types";

type NotificationListItemProps = {
  notification: NotificationItem;
  compact?: boolean;
  onClick?: (notification: NotificationItem) => void;
  actionLabel?: string;
};

export default function NotificationListItem({
  notification,
  compact = false,
  onClick,
  actionLabel,
}: NotificationListItemProps) {
  const { language, direction } = useLocalization();
  const clickable = Boolean(onClick);
  const handleClick = () => {
    onClick?.(notification);
  };
  const localizedContent = getLocalizedNotificationContent(notification, language);
  const readLabel = notification.isRead
    ? language === "ar"
      ? "مقروء"
      : "Read"
    : language === "ar"
      ? "غير مقروء"
      : "Unread";

  const content = (
    <div
      className={`relative rounded-xl border p-4 text-left transition ${
        notification.isRead
          ? "border-slate-200 bg-white"
          : "border-sky-200 bg-sky-50/70 shadow-sm"
      } ${clickable ? "hover:border-slate-300 hover:bg-slate-50" : ""}`}
    >
      {!notification.isRead ? (
        <span
          aria-hidden="true"
          className={`absolute top-3 h-2.5 w-2.5 rounded-full bg-sky-500 ${
            direction === "rtl" ? "right-3" : "left-3"
          }`}
        />
      ) : null}
      <div
        className={`space-y-3 ${
          !notification.isRead ? (direction === "rtl" ? "pr-4" : "pl-4") : ""
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-semibold text-slate-900">{localizedContent.title}</h3>
              {notification.redirectUrl ? (
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
              ) : null}
            </div>
            <p className={`mt-1 text-sm ${notification.isRead ? "text-slate-500" : "text-slate-700"}`}>
              {localizedContent.message}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p
              className="text-xs font-medium text-slate-500"
              title={formatNotificationDateTime(notification.createdAt, language)}
            >
              {compact
                ? formatNotificationRelativeTime(notification.createdAt, language)
                : formatNotificationDateTime(notification.createdAt, language)}
            </p>
            {actionLabel ? <p className="mt-1 text-xs text-slate-400">{actionLabel}</p> : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <NotificationBadge module={notification.module} />
          <NotificationSeverityBadge severity={notification.severity} />
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              notification.isRead ? "bg-slate-100 text-slate-500" : "bg-slate-900 text-white"
            }`}
          >
            {readLabel}
          </span>
          {!compact && notification.type ? (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
              {getNotificationTypeLabel(notification.type, language)}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );

  if (!clickable) {
    return content;
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="block w-full rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
    >
      {content}
    </button>
  );
}
