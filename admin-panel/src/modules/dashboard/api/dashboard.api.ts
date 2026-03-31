import api from "@/services/api";
import type {
  DashboardAppliedFilters,
  DashboardOrderPreviewItem,
  DashboardOrderSegment,
  DashboardQueryParams,
  DashboardRange,
  DashboardResponse,
  DashboardSeriesPoint,
  DashboardSummary,
} from "@/modules/dashboard/api/dashboard.types";

type ApiEnvelope<T> = {
  data?: T;
};

const DASHBOARD_ENDPOINT = "/api/admin/dashboard";

const unwrap = <T>(value: unknown): T => {
  const envelope = (value ?? {}) as ApiEnvelope<T>;
  if (typeof envelope === "object" && envelope && "data" in envelope) {
    return envelope.data as T;
  }
  return value as T;
};

const toNumberSafe = (value: unknown, fallback = 0) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
};

const toStringSafe = (value: unknown, fallback = "") => {
  if (value === null || value === undefined) {
    return fallback;
  }
  return String(value);
};

const normalizeRange = (value: unknown): DashboardRange => {
  const normalized = toStringSafe(value, "30d") as DashboardRange;
  if (normalized === "7d" || normalized === "30d" || normalized === "90d" || normalized === "thisMonth" || normalized === "custom") {
    return normalized;
  }
  return "30d";
};

const normalizeFilters = (value: unknown): DashboardAppliedFilters => {
  const row = (value ?? {}) as Record<string, unknown>;
  return {
    range: normalizeRange(row.range),
    startDate: toStringSafe(row.startDate),
    endDate: toStringSafe(row.endDate),
  };
};

const normalizeSummary = (value: unknown): DashboardSummary => {
  const row = (value ?? {}) as Record<string, unknown>;
  return {
    totalOrders: Math.max(0, toNumberSafe(row.totalOrders, 0)),
    onlineOrdersCount: Math.max(0, toNumberSafe(row.onlineOrdersCount, 0)),
    posOrdersCount: Math.max(0, toNumberSafe(row.posOrdersCount, 0)),
    tempOrdersCount: Math.max(0, toNumberSafe(row.tempOrdersCount, 0)),
    totalExpenses: toNumberSafe(row.totalExpenses, 0),
    totalRevenue: toNumberSafe(row.totalRevenue, 0),
    totalProfit: toNumberSafe(row.totalProfit, 0),
    totalNetIncome: toNumberSafe(row.totalNetIncome, 0),
  };
};

const normalizeSeriesPoint = (value: unknown): DashboardSeriesPoint => {
  const row = (value ?? {}) as Record<string, unknown>;
  return {
    label: toStringSafe(row.label),
    value: toNumberSafe(row.value, 0),
  };
};

const normalizeOrderPreviewItem = (value: unknown): DashboardOrderPreviewItem => {
  const row = (value ?? {}) as Record<string, unknown>;
  return {
    id:
      typeof row.id === "number" || typeof row.id === "string"
        ? row.id
        : toStringSafe(row.id),
    orderType: toStringSafe(row.orderType, "ONLINE") as DashboardOrderPreviewItem["orderType"],
    orderNumber: toStringSafe(row.orderNumber, toStringSafe(row.id, "-")),
    customerName: toStringSafe(row.customerName, "Unknown"),
    status: toStringSafe(row.status, "-"),
    paymentStatus: toStringSafe(row.paymentStatus, "-"),
    paymentType: toStringSafe(row.paymentType, "-"),
    total: toNumberSafe(row.total, 0),
    createdAt: toStringSafe(row.createdAt),
  };
};

const normalizeOrderSegment = (value: unknown): DashboardOrderSegment => {
  const row = (value ?? {}) as Record<string, unknown>;
  return {
    count: Math.max(0, toNumberSafe(row.count, 0)),
    items: Array.isArray(row.items) ? row.items.map(normalizeOrderPreviewItem) : [],
  };
};

const normalizeDashboardResponse = (value: unknown): DashboardResponse => {
  const payload = unwrap<unknown>(value);
  const row = (payload ?? {}) as Record<string, unknown>;
  const charts = (row.charts ?? {}) as Record<string, unknown>;
  const orders = (row.orders ?? {}) as Record<string, unknown>;

  return {
    filters: normalizeFilters(row.filters),
    summary: normalizeSummary(row.summary),
    charts: {
      expensesSeries: Array.isArray(charts.expensesSeries)
        ? charts.expensesSeries.map(normalizeSeriesPoint)
        : [],
      profitSeries: Array.isArray(charts.profitSeries)
        ? charts.profitSeries.map(normalizeSeriesPoint)
        : [],
      netIncomeSeries: Array.isArray(charts.netIncomeSeries)
        ? charts.netIncomeSeries.map(normalizeSeriesPoint)
        : [],
    },
    orders: {
      online: normalizeOrderSegment(orders.online),
      pos: normalizeOrderSegment(orders.pos),
      temp: normalizeOrderSegment(orders.temp),
    },
  };
};

const buildSearchParams = (params: DashboardQueryParams) => {
  const search = new URLSearchParams();

  if (params.range) {
    search.set("range", params.range);
  }
  if (params.startDate) {
    search.set("startDate", params.startDate);
  }
  if (params.endDate) {
    search.set("endDate", params.endDate);
  }
  if (params.ordersLimit) {
    search.set("ordersLimit", String(Math.min(20, Math.max(1, params.ordersLimit))));
  }

  return search.toString();
};

export const dashboardApi = {
  async get(params: DashboardQueryParams): Promise<DashboardResponse> {
    const query = buildSearchParams(params);
    const response = await api.get(`${DASHBOARD_ENDPOINT}${query ? `?${query}` : ""}`);
    return normalizeDashboardResponse(response.data);
  },
};
