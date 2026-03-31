"use client";

import { getNotificationSeverityLabel } from "@/modules/notifications/utils/notificationFormat";
import { useLocalization } from "@/modules/localization/LocalizationProvider";
import type { NotificationSeverity } from "@/modules/notifications/types/notifications.types";

type NotificationSeverityBadgeProps = {
  severity?: NotificationSeverity | null;
};

export default function NotificationSeverityBadge({
  severity,
}: NotificationSeverityBadgeProps) {
  const { language } = useLocalization();

  if (!severity) {
    return null;
  }

  const className =
    severity === "CRITICAL"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : severity === "WARNING"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-sky-200 bg-sky-50 text-sky-700";

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${className}`}>
      {getNotificationSeverityLabel(severity, language)}
    </span>
  );
}
