"use client";

import { getNotificationModuleLabel } from "@/modules/notifications/utils/notificationFormat";
import { useLocalization } from "@/modules/localization/LocalizationProvider";
import type { NotificationModule } from "@/modules/notifications/types/notifications.types";

type NotificationBadgeProps = {
  module: NotificationModule;
};

export default function NotificationBadge({ module }: NotificationBadgeProps) {
  const { language } = useLocalization();

  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
      {getNotificationModuleLabel(module, language)}
    </span>
  );
}
