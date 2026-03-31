import type { NotificationModule, NotificationsFilters } from "@/modules/notifications/types/notifications.types";

export type NotificationsFilterState = NotificationsFilters & {
  page: number;
  limit: number;
  module?: NotificationModule | "";
  type?: string;
};

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

const allowedModules = new Set<NotificationModule>([
  "dashboards",
  "inventory",
  "crm",
  "calendar",
  "pos",
  "invoices",
  "purchases",
  "website",
  "promo-codes",
  "team",
  "loyalty-program",
  "system",
]);

const parsePositiveInteger = (value: string | null, fallback: number) => {
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(1, Math.trunc(parsed));
};

const parseReadFilter = (value: string | null) => {
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  return undefined;
};

export const parseNotificationsFiltersFromSearchParams = (
  searchParams: URLSearchParams,
): NotificationsFilterState => {
  const moduleValue = searchParams.get("module")?.trim() as NotificationModule | undefined;
  return {
    page: parsePositiveInteger(searchParams.get("page"), DEFAULT_PAGE),
    limit: parsePositiveInteger(searchParams.get("limit"), DEFAULT_LIMIT),
    isRead: parseReadFilter(searchParams.get("isRead")),
    module: moduleValue && allowedModules.has(moduleValue) ? moduleValue : undefined,
    type: searchParams.get("type")?.trim() || undefined,
  };
};

export const buildSearchParamsFromNotificationsFilters = (
  filters: NotificationsFilterState,
) => {
  const params = new URLSearchParams();
  params.set("page", String(Math.max(1, filters.page || DEFAULT_PAGE)));
  params.set("limit", String(Math.max(1, filters.limit || DEFAULT_LIMIT)));

  if (typeof filters.isRead === "boolean") {
    params.set("isRead", String(filters.isRead));
  }
  if (filters.module) {
    params.set("module", filters.module);
  }
  if (filters.type?.trim()) {
    params.set("type", filters.type.trim());
  }

  return params;
};
