"use client";

import Badge from "@/components/ui/Badge";
import { useLocalization } from "@/modules/localization/LocalizationProvider";
import type { NotificationSeverity } from "@/modules/notifications/types/notifications.types";
import { getNotificationSeverityLabel } from "@/modules/notifications/utils/notificationFormat";

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

  const tone = severity === "CRITICAL" ? "danger" : severity === "WARNING" ? "warning" : "info";

  return <Badge tone={tone}>{getNotificationSeverityLabel(severity, language)}</Badge>;
}
