"use client";

import Badge from "@/components/ui/Badge";
import { useLocalization } from "@/modules/localization/LocalizationProvider";
import type { NotificationModule } from "@/modules/notifications/types/notifications.types";
import { getNotificationModuleLabel } from "@/modules/notifications/utils/notificationFormat";

type NotificationBadgeProps = {
  module: NotificationModule;
};

export default function NotificationBadge({ module }: NotificationBadgeProps) {
  const { language } = useLocalization();

  return <Badge>{getNotificationModuleLabel(module, language)}</Badge>;
}
