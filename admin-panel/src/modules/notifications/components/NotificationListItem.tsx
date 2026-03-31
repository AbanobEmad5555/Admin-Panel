"use client";

import { ExternalLink } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { useLocalization } from "@/modules/localization/LocalizationProvider";
import NotificationBadge from "@/modules/notifications/components/NotificationBadge";
import NotificationSeverityBadge from "@/modules/notifications/components/NotificationSeverityBadge";
import type { NotificationItem } from "@/modules/notifications/types/notifications.types";
import {
  formatNotificationDateTime,
  formatNotificationRelativeTime,
  getLocalizedNotificationContent,
  getNotificationTypeLabel,
} from "@/modules/notifications/utils/notificationFormat";

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
  const readLabel =
    notification.isRead
      ? language === "ar"
        ? "مقروء"
        : "Read"
      : language === "ar"
        ? "غير مقروء"
        : "Unread";

  const content = (
    <div
      className={`relative rounded-2xl border p-4 text-left transition-all duration-300 ${
        notification.isRead
          ? "border-white/10 bg-white/5"
          : "border-cyan-300/20 bg-[linear-gradient(135deg,rgba(34,211,238,0.1),rgba(168,85,247,0.12))] shadow-[0_16px_36px_rgba(2,6,23,0.28)]"
      } ${clickable ? "hover:-translate-y-0.5 hover:bg-white/8" : ""}`}
    >
      {!notification.isRead ? (
        <span
          aria-hidden="true"
          className={`absolute top-3 h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(56,189,248,0.55)] ${
            direction === "rtl" ? "right-3" : "left-3"
          }`}
        />
      ) : null}
      <div className={`space-y-3 ${!notification.isRead ? (direction === "rtl" ? "pr-4" : "pl-4") : ""}`}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-semibold text-slate-50">{localizedContent.title}</h3>
              {notification.redirectUrl ? (
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden="true" />
              ) : null}
            </div>
            <p className={`mt-1 text-sm ${notification.isRead ? "text-slate-400" : "text-slate-200"}`}>
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
            {actionLabel ? <p className="mt-1 text-xs text-slate-500">{actionLabel}</p> : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <NotificationBadge module={notification.module} />
          <NotificationSeverityBadge severity={notification.severity} />
          <Badge tone={notification.isRead ? "neutral" : "info"}>{readLabel}</Badge>
          {!compact && notification.type ? (
            <Badge tone="neutral">{getNotificationTypeLabel(notification.type, language)}</Badge>
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
      className="block w-full rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
    >
      {content}
    </button>
  );
}
