import api from "@/services/api";
import type {
  ApiEnvelope,
  LoyaltyHistoryItem,
  LoyaltyHistoryQueryParams,
  LoyaltySettingsDto,
  LoyaltySettingsFormValues,
  LoyaltyExpiringSoonItem,
  LoyaltyOverviewAccounts,
  LoyaltyOverviewConsumedAccount,
  LoyaltyOverviewCurrentAccount,
  LoyaltyOverviewExpiringAccount,
  LoyaltySummaryFilters,
  LoyaltySummaryMetric,
  LoyaltySummaryResponse,
  LoyaltyUserListItem,
  LoyaltyUserSummary,
  LoyaltyUsersQueryParams,
  ManualAdjustmentPayload,
  ManualExpirePayload,
  PaginatedResult,
  ResetPayload,
} from "@/features/loyalty/types";

const LOYALTY_BASE = "/api/admin/loyalty";

const unwrap = <T>(value: unknown): T => {
  const envelope = value as ApiEnvelope<T>;
  if (envelope && typeof envelope === "object" && "success" in envelope) {
    if (!envelope.success) {
      throw new Error(envelope.message ?? "Request failed.");
    }
    return envelope.data;
  }
  return value as T;
};

const toStringSafe = (value: unknown, fallback = "") => {
  if (value === null || value === undefined) return fallback;
  return String(value);
};

const toNumberSafe = (value: unknown, fallback = 0) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const toNullableString = (value: unknown) => {
  const normalized = toStringSafe(value, "").trim();
  return normalized ? normalized : null;
};

const normalizeSummaryDateBoundary = (
  value: string | undefined,
  boundary: "start" | "end"
) => {
  const trimmed = toStringSafe(value, "").trim();
  if (!trimmed) return undefined;

  // Keep already timestamped values intact and only expand plain dates.
  if (trimmed.includes("T")) return trimmed;

  return boundary === "start"
    ? `${trimmed}T00:00:00.000Z`
    : `${trimmed}T23:59:59.999Z`;
};

const normalizeSettings = (value: unknown): LoyaltySettingsDto => {
  const row = (unwrap<Record<string, unknown>>(value) ?? {}) as Record<string, unknown>;
  return {
    isEnabled: Boolean(row.isEnabled),
    earnAmount: toStringSafe(row.earnAmount, "0.00"),
    earnPoints: toStringSafe(row.earnPoints, "0.000"),
    redeemPoints: toStringSafe(row.redeemPoints, "0.000"),
    redeemAmount: toStringSafe(row.redeemAmount, "0.00"),
    expirationDays: toNumberSafe(row.expirationDays, 365),
    pointsPrecision: toNumberSafe(row.pointsPrecision, 3),
    moneyPrecision: toNumberSafe(row.moneyPrecision, 2),
    roundingMode: toStringSafe(row.roundingMode, "HALF_UP") as LoyaltySettingsDto["roundingMode"],
    minRedeemPoints: toStringSafe(row.minRedeemPoints, "0.000"),
    maxRedeemPointsPerOrder: toStringSafe(row.maxRedeemPointsPerOrder, "0.000"),
    minPayableAmountAfterRedeem: toStringSafe(row.minPayableAmountAfterRedeem, "0.00"),
    expiringSoonThresholdDays: toNumberSafe(row.expiringSoonThresholdDays, 7),
    earnBase: toStringSafe(row.earnBase, "PRODUCT_SUBTOTAL") as LoyaltySettingsDto["earnBase"],
    allowPromoCodeStacking: Boolean(row.allowPromoCodeStacking),
    allowManualDiscountStacking: Boolean(row.allowManualDiscountStacking),
    version: row.version === undefined ? undefined : toNumberSafe(row.version, 0),
  };
};

const normalizePaginated = <T>(value: unknown, itemMapper: (item: unknown) => T): PaginatedResult<T> => {
  const payload = unwrap<Record<string, unknown>>(value) ?? {};
  const pagination =
    payload.pagination && typeof payload.pagination === "object"
      ? (payload.pagination as Record<string, unknown>)
      : {};
  const items = Array.isArray(payload.items)
    ? payload.items
    : Array.isArray(payload.rows)
      ? payload.rows
      : Array.isArray(payload.data)
        ? payload.data
        : [];
  const limit = toNumberSafe(payload.limit ?? pagination.limit, 20);
  const page = toNumberSafe(payload.page ?? pagination.page ?? pagination.currentPage, 1);
  const totalItemsRaw = toNumberSafe(
    payload.totalItems ?? payload.total ?? pagination.totalItems ?? pagination.total,
    items.length
  );
  const totalItems = Math.max(items.length, totalItemsRaw);
  const totalPages = Math.max(
    1,
    toNumberSafe(payload.totalPages ?? pagination.totalPages, Math.ceil(totalItems / limit))
  );
  return {
    items: items.map(itemMapper),
    page,
    limit,
    totalItems,
    totalPages,
  };
};

const normalizeUserListItem = (value: unknown): LoyaltyUserListItem => {
  const row = (value ?? {}) as Record<string, unknown>;
  return {
    userId: toNumberSafe(row.userId, 0),
    name: toStringSafe(row.name, "-"),
    email: toStringSafe(row.email, "-"),
    status: toNullableString(row.status) as LoyaltyUserListItem["status"],
    availablePoints: toStringSafe(row.availablePoints, "0.000"),
    pendingPoints: toStringSafe(row.pendingPoints, "0.000"),
    redeemedPoints: toStringSafe(row.redeemedPoints, "0.000"),
    expiredPoints: toStringSafe(row.expiredPoints, "0.000"),
    annulledPoints: toStringSafe(row.annulledPoints ?? row.reversedPoints, "0.000"),
    lifetimeEarned: toStringSafe(row.lifetimeEarned, "0.000"),
    lifetimeRedeemed: toStringSafe(row.lifetimeRedeemed, "0.000"),
    lastLedgerAt: toNullableString(row.lastLedgerAt),
  };
};

const normalizeOverviewCurrentAccount = (value: unknown): LoyaltyOverviewCurrentAccount => {
  const row = (value ?? {}) as Record<string, unknown>;
  return {
    userId: toNumberSafe(row.userId, 0),
    name: toStringSafe(row.name, "-"),
    email: toStringSafe(row.email, "-"),
    availablePoints: toStringSafe(row.availablePoints, "0.000"),
    pendingPoints: toStringSafe(row.pendingPoints, "0.000"),
    lifetimeEarned: toStringSafe(row.lifetimeEarned, "0.000"),
    redeemedPoints: toStringSafe(row.redeemedPoints, "0.000"),
    lastLedgerAt: toNullableString(row.lastLedgerAt),
  };
};

const normalizeOverviewExpiringAccount = (value: unknown): LoyaltyOverviewExpiringAccount => {
  const row = (value ?? {}) as Record<string, unknown>;
  return {
    userId: toNumberSafe(row.userId, 0),
    name: toStringSafe(row.name, "-"),
    email: toStringSafe(row.email, "-"),
    expiringPoints: toStringSafe(row.expiringPoints, "0.000"),
    expiresAt: toNullableString(row.expiresAt),
    daysLeft: toNumberSafe(row.daysLeft, 0),
    availablePoints: toStringSafe(row.availablePoints, "0.000"),
    lastLedgerAt: toNullableString(row.lastLedgerAt),
  };
};

const normalizeOverviewConsumedAccount = (value: unknown): LoyaltyOverviewConsumedAccount => {
  const row = (value ?? {}) as Record<string, unknown>;
  return {
    userId: toNumberSafe(row.userId, 0),
    name: toStringSafe(row.name, "-"),
    email: toStringSafe(row.email, "-"),
    redeemedPoints: toStringSafe(row.redeemedPoints, "0.000"),
    lifetimeRedeemed: toStringSafe(row.lifetimeRedeemed, "0.000"),
    lastLedgerAt: toNullableString(row.lastLedgerAt),
  };
};

const normalizeUserSummary = (value: unknown): LoyaltyUserSummary => {
  const row = (unwrap<Record<string, unknown>>(value) ?? {}) as Record<string, unknown>;
  const balance =
    row.balance && typeof row.balance === "object"
      ? (row.balance as Record<string, unknown>)
      : row;
  const expiringSoon = Array.isArray(row.expiringSoon)
    ? row.expiringSoon.map((item) => normalizeExpiringSoonItem(item))
    : [];
  return {
    userId: toNumberSafe(row.userId ?? balance.userId, 0),
    name: toNullableString(row.name),
    email: toNullableString(row.email),
    availablePoints: toStringSafe(balance.availablePoints, "0.000"),
    pendingPoints: toStringSafe(balance.pendingPoints, "0.000"),
    lifetimeEarned: toStringSafe(
      balance.lifetimeEarned ?? row.lifetimeEarned ?? row.earnedPoints,
      "0.000"
    ),
    redeemedPoints: toStringSafe(balance.redeemedPoints, "0.000"),
    lifetimeRedeemed: toStringSafe(
      balance.lifetimeRedeemed ?? row.lifetimeRedeemed,
      "0.000"
    ),
    expiredPoints: toStringSafe(balance.expiredPoints, "0.000"),
    annulledPoints: toStringSafe(balance.annulledPoints ?? balance.reversedPoints, "0.000"),
    lastLedgerAt: toNullableString(balance.lastLedgerAt),
    expiringSoon,
  };
};

const normalizeExpiringSoonItem = (value: unknown): LoyaltyExpiringSoonItem => {
  const row = (value ?? {}) as Record<string, unknown>;
  const order = (row.order ?? null) as Record<string, unknown> | null;

  return {
    id: toStringSafe(row.id),
    pointsAmount: toStringSafe(row.pointsAmount, "0.000"),
    remainingPoints: toNullableString(row.remainingPoints),
    expiresAt: toNullableString(row.expiresAt),
    sourceReference: toNullableString(row.sourceReference),
    order: order
      ? { id: toNumberSafe(order.id, 0), status: toStringSafe(order.status, "UNKNOWN") }
      : null,
  };
};

const normalizeHistoryItem = (value: unknown): LoyaltyHistoryItem => {
  const row = (value ?? {}) as Record<string, unknown>;
  const order = (row.order ?? null) as Record<string, unknown> | null;
  const createdByAdmin = (row.createdByAdmin ?? null) as Record<string, unknown> | null;

  return {
    id: toStringSafe(row.id),
    type: toStringSafe(row.type, "EARN") as LoyaltyHistoryItem["type"],
    status: toStringSafe(row.status, "AVAILABLE") as LoyaltyHistoryItem["status"],
    source: toStringSafe(row.source, "ORDER") as LoyaltyHistoryItem["source"],
    pointsAmount: toStringSafe(row.pointsAmount, "0.000"),
    moneyAmount: toNullableString(row.moneyAmount),
    remainingPoints: toNullableString(row.remainingPoints),
    expiresAt: toNullableString(row.expiresAt),
    effectiveAt: toNullableString(row.effectiveAt),
    sourceReference: toNullableString(row.sourceReference),
    notes: toNullableString(row.notes),
    metadata: typeof row.metadata === "object" && row.metadata ? (row.metadata as Record<string, unknown>) : {},
    order: order
      ? { id: toNumberSafe(order.id, 0), status: toStringSafe(order.status, "UNKNOWN") }
      : null,
    createdByAdmin: createdByAdmin
      ? {
          id: createdByAdmin.id as number | string | undefined,
          name: toNullableString(createdByAdmin.name),
          email: toNullableString(createdByAdmin.email),
        }
      : null,
    createdAt: toNullableString(row.createdAt),
  };
};

const inferMetricKind = (key: string, value: unknown): LoyaltySummaryMetric["kind"] => {
  if (typeof value === "number") return "count";
  if (/(amount|revenue|money|sales)/i.test(key)) return "money";
  if (/points?/i.test(key)) return "points";
  return "text";
};

const normalizeSummary = (value: unknown): LoyaltySummaryResponse => {
  const payload = (unwrap<Record<string, unknown>>(value) ?? {}) as Record<string, unknown>;
  const totals =
    payload.totals && typeof payload.totals === "object"
      ? (payload.totals as Record<string, unknown>)
      : {};

  const topLevelScalarMetrics = Object.entries(payload)
    .filter(
      ([key, metricValue]) =>
        key !== "totals" &&
        (typeof metricValue === "string" || typeof metricValue === "number")
    )
    .map(([key, metricValue]) => ({
      key,
      labelKey: `loyalty.summary.metric.${key}`,
      value: String(metricValue),
      kind: inferMetricKind(key, metricValue),
    }));

  const metrics: LoyaltySummaryMetric[] = [
    ...Object.entries(totals).map(([key, metricValue]) => ({
      key,
      labelKey: `loyalty.summary.metric.${key}`,
      value: typeof metricValue === "string" || typeof metricValue === "number" ? String(metricValue) : "0",
      kind: inferMetricKind(key, metricValue),
    })),
    ...topLevelScalarMetrics,
  ];

  return { metrics, raw: payload };
};

export const loyaltyApi = {
  async getSettings() {
    const response = await api.get(`${LOYALTY_BASE}/settings`);
    return normalizeSettings(response.data);
  },

  async updateSettings(payload: LoyaltySettingsFormValues) {
    const response = await api.put(`${LOYALTY_BASE}/settings`, payload, {
      headers: { "Content-Type": "application/json" },
    });
    return normalizeSettings(response.data);
  },

  async getSummary(params: LoyaltySummaryFilters) {
    const response = await api.get(`${LOYALTY_BASE}/summary`, {
      params: {
        ...params,
        dateFrom: normalizeSummaryDateBoundary(params.dateFrom, "start"),
        dateTo: normalizeSummaryDateBoundary(params.dateTo, "end"),
      },
    });
    return normalizeSummary(response.data);
  },

  async getUsers(params: LoyaltyUsersQueryParams) {
    const response = await api.get(`${LOYALTY_BASE}/users`, {
      params: {
        ...params,
        hasPointsOnly: true,
      },
    });
    return normalizePaginated(response.data, normalizeUserListItem);
  },

  async getUserSummary(userId: number) {
    const response = await api.get(`${LOYALTY_BASE}/users/${userId}/summary`);
    return normalizeUserSummary(response.data);
  },

  async getUserHistory(userId: number, params: LoyaltyHistoryQueryParams) {
    const response = await api.get(`${LOYALTY_BASE}/users/${userId}/history`, { params });
    return normalizePaginated(response.data, normalizeHistoryItem);
  },

  async getOverview(params: LoyaltySummaryFilters): Promise<LoyaltyOverviewAccounts> {
    const response = await api.get(`${LOYALTY_BASE}/overview`, {
      params: {
        ...params,
        dateFrom: normalizeSummaryDateBoundary(params.dateFrom, "start"),
        dateTo: normalizeSummaryDateBoundary(params.dateTo, "end"),
      },
    });
    const payload = unwrap<Record<string, unknown>>(response.data) ?? {};
    return {
      summary: normalizeSummary(payload.summary),
      currentPointUsers: normalizePaginated(
        payload.currentPointUsers,
        normalizeOverviewCurrentAccount
      ),
      expiringSoonUsers: normalizePaginated(
        payload.expiringSoonUsers,
        normalizeOverviewExpiringAccount
      ),
      consumedUsers: normalizePaginated(
        payload.consumedUsers,
        normalizeOverviewConsumedAccount
      ),
    };
  },

  async manualAdjust(userId: number, payload: ManualAdjustmentPayload) {
    const response = await api.post(`${LOYALTY_BASE}/users/${userId}/manual-adjust`, payload, {
      headers: { "Content-Type": "application/json" },
    });
    return unwrap(response.data);
  },

  async manualExpire(userId: number, payload: ManualExpirePayload) {
    const response = await api.post(`${LOYALTY_BASE}/users/${userId}/manual-expire`, payload, {
      headers: { "Content-Type": "application/json" },
    });
    return unwrap(response.data);
  },

  async resetUser(userId: number, payload: ResetPayload) {
    const response = await api.post(`${LOYALTY_BASE}/users/${userId}/reset`, payload, {
      headers: { "Content-Type": "application/json" },
    });
    return unwrap(response.data);
  },
};
