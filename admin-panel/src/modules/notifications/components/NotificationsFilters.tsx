"use client";

import Button from "@/components/ui/Button";
import { useLocalization } from "@/modules/localization/LocalizationProvider";
import { getNotificationModuleLabel } from "@/modules/notifications/utils/notificationFormat";
import type { NotificationModule } from "@/modules/notifications/types/notifications.types";
import type { NotificationsFilterState } from "@/modules/notifications/utils/notificationUrlState";

const modules: Array<{ value: NotificationModule; label: string }> = [
  { value: "dashboards", label: "Dashboards" },
  { value: "inventory", label: "Inventory" },
  { value: "crm", label: "CRM" },
  { value: "calendar", label: "Calendar" },
  { value: "pos", label: "POS" },
  { value: "invoices", label: "Invoices" },
  { value: "purchases", label: "Purchases" },
  { value: "website", label: "Website" },
  { value: "promo-codes", label: "Promo Codes" },
  { value: "team", label: "Team" },
  { value: "loyalty-program", label: "Loyalty Program" },
  { value: "system", label: "System" },
];

type NotificationsFiltersProps = {
  value: NotificationsFilterState;
  onApply: (value: NotificationsFilterState) => void;
  onClear: () => void;
};

export default function NotificationsFilters({
  value,
  onApply,
  onClear,
}: NotificationsFiltersProps) {
  const { language, t } = useLocalization();

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid items-end gap-3 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto]">
        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">
            {t("notifications.readStatus")}
          </span>
          <select
            value={typeof value.isRead === "boolean" ? String(value.isRead) : ""}
            onChange={(event) =>
              onApply({
                ...value,
                page: 1,
                isRead:
                  event.target.value === ""
                    ? undefined
                    : event.target.value === "true",
              })
            }
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
          >
            <option value="">{t("notifications.all")}</option>
            <option value="false">{t("notifications.unread")}</option>
            <option value="true">{t("notifications.read")}</option>
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">
            {t("notifications.module")}
          </span>
          <select
            value={value.module ?? ""}
            onChange={(event) =>
              onApply({
                ...value,
                page: 1,
                module: (event.target.value || undefined) as NotificationModule | undefined,
              })
            }
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
          >
            <option value="">{t("notifications.allModules")}</option>
            {modules.map((module) => (
              <option key={module.value} value={module.value}>
                {getNotificationModuleLabel(module.value, language)}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">
            {t("notifications.type")}
          </span>
          <input
            value={value.type ?? ""}
            onChange={(event) =>
              onApply({
                ...value,
                page: 1,
                type: event.target.value || undefined,
              })
            }
            placeholder={t("notifications.typePlaceholder")}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
          />
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">
            {t("notifications.perPage")}
          </span>
          <select
            value={String(value.limit)}
            onChange={(event) =>
              onApply({
                ...value,
                page: 1,
                limit: Number(event.target.value),
              })
            }
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </label>

        <div className="flex lg:justify-end">
          <Button type="button" variant="secondary" onClick={onClear} className="w-full lg:w-auto">
            {t("notifications.resetFilters")}
          </Button>
        </div>
      </div>
    </section>
  );
}
