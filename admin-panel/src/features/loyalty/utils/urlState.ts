import type {
  LoyaltyHistoryQueryParams,
  LoyaltySummaryFilters,
  LoyaltySummaryTimeRange,
  LoyaltyTransactionSource,
  LoyaltyTransactionStatus,
  LoyaltyTransactionType,
  LoyaltyUserStatus,
  LoyaltyUsersQueryParams,
} from "@/features/loyalty/types";

export const LOYALTY_PAGE_SIZE = 20;

const safePositive = (value: string | null, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const safeString = (value: string | null) => (value ?? "").trim();

const formatDateOnly = (value: Date) => value.toISOString().slice(0, 10);

export const getSummaryRangeDates = (
  timeRange: LoyaltySummaryTimeRange,
  baseDate = new Date()
) => {
  const end = new Date(baseDate);
  const start = new Date(baseDate);

  if (timeRange === "day") {
    return { dateFrom: formatDateOnly(start), dateTo: formatDateOnly(end) };
  }

  if (timeRange === "week") {
    start.setDate(start.getDate() - 6);
    return { dateFrom: formatDateOnly(start), dateTo: formatDateOnly(end) };
  }

  if (timeRange === "month") {
    start.setDate(1);
    return { dateFrom: formatDateOnly(start), dateTo: formatDateOnly(end) };
  }

  if (timeRange === "quarter") {
    start.setMonth(Math.floor(start.getMonth() / 3) * 3, 1);
    return { dateFrom: formatDateOnly(start), dateTo: formatDateOnly(end) };
  }

  if (timeRange === "year") {
    start.setMonth(0, 1);
    return { dateFrom: formatDateOnly(start), dateTo: formatDateOnly(end) };
  }

  return { dateFrom: formatDateOnly(start), dateTo: formatDateOnly(end) };
};

export const parseUsersParams = (searchParams: URLSearchParams): LoyaltyUsersQueryParams => ({
  page: safePositive(searchParams.get("page"), 1),
  limit: safePositive(searchParams.get("limit"), LOYALTY_PAGE_SIZE),
  search: safeString(searchParams.get("search")),
  status: (searchParams.get("status") as LoyaltyUserStatus | null) ?? undefined,
  sortBy: (searchParams.get("sortBy") as LoyaltyUsersQueryParams["sortBy"] | null) ?? "lastLedgerAt",
  sortOrder: (searchParams.get("sortOrder") as "asc" | "desc" | null) ?? "desc",
});

export const buildUsersParams = (params: LoyaltyUsersQueryParams) => {
  const next = new URLSearchParams();
  next.set("page", String(params.page));
  next.set("limit", String(params.limit));
  if (params.search) next.set("search", params.search);
  if (params.status) next.set("status", params.status);
  if (params.sortBy) next.set("sortBy", params.sortBy);
  if (params.sortOrder) next.set("sortOrder", params.sortOrder);
  return next;
};

export const parseSummaryFilters = (searchParams: URLSearchParams): LoyaltySummaryFilters => {
  const timeRange =
    (searchParams.get("timeRange") as LoyaltySummaryTimeRange | null) ?? "month";
  const rangeDefaults = getSummaryRangeDates(timeRange);
  const userIdParam = searchParams.get("userId");

  return {
    dateFrom: safeString(searchParams.get("dateFrom")) || rangeDefaults.dateFrom,
    dateTo: safeString(searchParams.get("dateTo")) || rangeDefaults.dateTo,
    timeRange:
      safeString(searchParams.get("dateFrom")) || safeString(searchParams.get("dateTo"))
        ? ((searchParams.get("timeRange") as LoyaltySummaryTimeRange | null) ?? "custom")
        : timeRange,
    userId: userIdParam ? safePositive(userIdParam, 0) : undefined,
    type: (searchParams.get("type") as LoyaltyTransactionType | null) ?? undefined,
    source: (searchParams.get("source") as LoyaltyTransactionSource | null) ?? undefined,
    currentPointPage: safePositive(searchParams.get("currentPointPage"), 1),
    currentPointLimit: safePositive(searchParams.get("currentPointLimit"), 5),
    expiringSoonPage: safePositive(searchParams.get("expiringSoonPage"), 1),
    expiringSoonLimit: safePositive(searchParams.get("expiringSoonLimit"), 5),
    consumedPage: safePositive(searchParams.get("consumedPage"), 1),
    consumedLimit: safePositive(searchParams.get("consumedLimit"), 5),
  };
};

export const buildSummaryFilters = (filters: LoyaltySummaryFilters) => {
  const next = new URLSearchParams();
  next.set("dateFrom", filters.dateFrom);
  next.set("dateTo", filters.dateTo);
  if (filters.timeRange) next.set("timeRange", filters.timeRange);
  if (filters.userId) next.set("userId", String(filters.userId));
  if (filters.type) next.set("type", filters.type);
  if (filters.source) next.set("source", filters.source);
  if (filters.currentPointPage && filters.currentPointPage !== 1) {
    next.set("currentPointPage", String(filters.currentPointPage));
  }
  if (filters.currentPointLimit && filters.currentPointLimit !== 5) {
    next.set("currentPointLimit", String(filters.currentPointLimit));
  }
  if (filters.expiringSoonPage && filters.expiringSoonPage !== 1) {
    next.set("expiringSoonPage", String(filters.expiringSoonPage));
  }
  if (filters.expiringSoonLimit && filters.expiringSoonLimit !== 5) {
    next.set("expiringSoonLimit", String(filters.expiringSoonLimit));
  }
  if (filters.consumedPage && filters.consumedPage !== 1) {
    next.set("consumedPage", String(filters.consumedPage));
  }
  if (filters.consumedLimit && filters.consumedLimit !== 5) {
    next.set("consumedLimit", String(filters.consumedLimit));
  }
  return next;
};

export const parseHistoryParams = (searchParams: URLSearchParams): LoyaltyHistoryQueryParams => ({
  page: safePositive(searchParams.get("page"), 1),
  limit: safePositive(searchParams.get("limit"), LOYALTY_PAGE_SIZE),
  type: (searchParams.get("type") as LoyaltyTransactionType | null) ?? undefined,
  status: (searchParams.get("status") as LoyaltyTransactionStatus | null) ?? undefined,
  source: (searchParams.get("source") as LoyaltyTransactionSource | null) ?? undefined,
  dateFrom: safeString(searchParams.get("dateFrom")) || undefined,
  dateTo: safeString(searchParams.get("dateTo")) || undefined,
});

export const buildHistoryParams = (params: LoyaltyHistoryQueryParams) => {
  const next = new URLSearchParams();
  next.set("page", String(params.page));
  next.set("limit", String(params.limit));
  if (params.type) next.set("type", params.type);
  if (params.status) next.set("status", params.status);
  if (params.source) next.set("source", params.source);
  if (params.dateFrom) next.set("dateFrom", params.dateFrom);
  if (params.dateTo) next.set("dateTo", params.dateTo);
  return next;
};
