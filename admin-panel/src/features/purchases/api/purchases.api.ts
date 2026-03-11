import api from "@/services/api";
import { getLocalizedValue } from "@/modules/localization/utils";
import type { CostCategory, CostRow, PurchaseRow, PurchaseStatus } from "@/components/purchases/types";

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  message?: string;
};

type PurchaseApiRecord = {
  id?: number | string;
  purchaseId?: string;
  productId?: number | string | null;
  productName?: string | null;
  productNameEn?: string | null;
  productNameAr?: string | null;
  categoryId?: number | string | null;
  categoryName?: string | null;
  categoryNameEn?: string | null;
  categoryNameAr?: string | null;
  variantId?: number | string | null;
  variantName?: string | null;
  supplierName?: string | null;
  supplierNameEn?: string | null;
  supplierNameAr?: string | null;
  supplierContact?: string | null;
  supplierEmail?: string | null;
  supplierPhone?: string | null;
  quantity?: number | string | null;
  unitCost?: number | string | null;
  totalCost?: number | string | null;
  status?: string | null;
  expectedArrivalDate?: string | null;
  deliveredAt?: string | null;
  pendingApproval?: boolean | null;
  inventorySyncedAt?: string | null;
  inventorySyncedQuantity?: number | string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type CostApiRecord = {
  id?: number | string;
  name?: string | null;
  costNameEn?: string | null;
  costNameAr?: string | null;
  category?: string | null;
  amount?: number | string | null;
  date?: string | null;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type SummaryResponse = {
  totalPurchases?: number | string | null;
  totalOperationalCosts?: number | string | null;
  totalExpenses?: number | string | null;
  revenue?: number | string | null;
  grossProfit?: number | string | null;
  netProfit?: number | string | null;
  avgPurchaseCost?: number | string | null;
  totalOrders?: number | string | null;
  purchasesByBucket?: unknown;
  operationalCostsByBucket?: unknown;
  revenueByBucket?: unknown;
  grossProfitByBucket?: unknown;
  netProfitByBucket?: unknown;
  costBreakdownByCategory?: unknown;
};

export type SummaryPeriod = "day" | "month" | "quarter" | "year";

export type PurchasesSummaryData = {
  totalPurchases: number;
  totalOperationalCosts: number;
  totalExpenses: number;
  revenue: number;
  grossProfit: number;
  netProfit: number;
  avgPurchaseCost: number;
  totalOrders: number;
  purchasesByBucket: Record<string, number>;
  operationalCostsByBucket: Record<string, number>;
  revenueByBucket: Record<string, number>;
  grossProfitByBucket: Record<string, number>;
  netProfitByBucket: Record<string, number>;
  costBreakdownByCategory: Record<string, number>;
};

type PurchaseMutationInput = {
  productId?: number;
  productName: string;
  productNameEn?: string;
  productNameAr?: string;
  categoryId?: number;
  categoryName?: string;
  categoryNameEn?: string;
  categoryNameAr?: string;
  variantId?: number;
  variantName?: string;
  supplierName: string;
  supplierNameEn?: string;
  supplierNameAr?: string;
  supplierContact?: string;
  supplierEmail?: string;
  supplierPhone?: string;
  quantity: number;
  unitCost: number;
  status: PurchaseStatus;
  expectedArrivalDate?: string;
  pendingApproval?: boolean;
};

type CostMutationInput = {
  name: string;
  costNameEn?: string;
  costNameAr?: string;
  category: CostCategory;
  amount: number;
  date: string;
  notes?: string;
};

const toNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const toOptionalNumber = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = toNumber(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toText = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const normalizePurchaseStatus = (value: unknown): PurchaseStatus => {
  const normalized = String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

  if (
    normalized === "ORDERED" ||
    normalized === "IN_TRANSIT" ||
    normalized === "DELIVERED" ||
    normalized === "CANCELLED"
  ) {
    return normalized;
  }

  return "ORDERED";
};

const normalizeCostCategory = (value: unknown): CostCategory => {
  const normalized = String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

  switch (normalized) {
    case "RENT":
    case "UTILITIES":
    case "SALARY":
    case "MARKETING":
    case "SHIPPING":
    case "MISCELLANEOUS":
      return normalized;
    default:
      return "MISCELLANEOUS";
  }
};

const unwrapList = <T,>(payload: unknown): T[] => {
  if (Array.isArray(payload)) {
    return payload as T[];
  }
  if (!payload || typeof payload !== "object") {
    return [];
  }
  const record = payload as Record<string, unknown>;
  const candidates = [record.data, record.items, record.list, record.rows, record.purchases, record.costs];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate as T[];
    }
  }
  return [];
};

const normalizePurchase = (record: PurchaseApiRecord): PurchaseRow => ({
  id: String(record.id ?? ""),
  purchaseId: toText(record.purchaseId),
  productId: toOptionalNumber(record.productId),
  productName: getLocalizedValue({
    en: toText(record.productNameEn),
    ar: toText(record.productNameAr),
    legacy: toText(record.productName),
    lang: "en",
  }),
  productNameEn: toText(record.productNameEn) || undefined,
  productNameAr: toText(record.productNameAr) || undefined,
  categoryId: toOptionalNumber(record.categoryId),
  categoryName:
    getLocalizedValue({
      en: toText(record.categoryNameEn),
      ar: toText(record.categoryNameAr),
      legacy: toText(record.categoryName),
      lang: "en",
    }) || undefined,
  categoryNameEn: toText(record.categoryNameEn) || undefined,
  categoryNameAr: toText(record.categoryNameAr) || undefined,
  variantId: toOptionalNumber(record.variantId),
  variantName: toText(record.variantName) || undefined,
  supplierName: getLocalizedValue({
    en: toText(record.supplierNameEn),
    ar: toText(record.supplierNameAr),
    legacy: toText(record.supplierName),
    lang: "en",
  }),
  supplierNameEn: toText(record.supplierNameEn) || undefined,
  supplierNameAr: toText(record.supplierNameAr) || undefined,
  supplierContact: toText(record.supplierContact) || undefined,
  supplierEmail: toText(record.supplierEmail) || undefined,
  supplierPhone: toText(record.supplierPhone) || undefined,
  quantity: toNumber(record.quantity),
  unitCost: toNumber(record.unitCost),
  totalCost: toNumber(record.totalCost),
  expectedArrivalDate: toText(record.expectedArrivalDate),
  deliveredAt: toText(record.deliveredAt) || undefined,
  pendingApproval: Boolean(record.pendingApproval),
  inventorySyncedAt: toText(record.inventorySyncedAt) || undefined,
  inventorySyncedQuantity: toOptionalNumber(record.inventorySyncedQuantity) ?? undefined,
  status: normalizePurchaseStatus(record.status),
  createdAt: toText(record.createdAt) || undefined,
  updatedAt: toText(record.updatedAt) || undefined,
});

const normalizeCost = (record: CostApiRecord): CostRow => ({
  id: String(record.id ?? ""),
  name: getLocalizedValue({
    en: toText(record.costNameEn),
    ar: toText(record.costNameAr),
    legacy: toText(record.name),
    lang: "en",
  }),
  costNameEn: toText(record.costNameEn) || undefined,
  costNameAr: toText(record.costNameAr) || undefined,
  category: normalizeCostCategory(record.category),
  amount: toNumber(record.amount),
  date: toText(record.date),
  notes: toText(record.notes),
  createdAt: toText(record.createdAt) || undefined,
  updatedAt: toText(record.updatedAt) || undefined,
});

const normalizeBuckets = (value: unknown): Record<string, number> => {
  if (Array.isArray(value)) {
    return value.reduce<Record<string, number>>((acc, item, index) => {
      const record = (item ?? {}) as Record<string, unknown>;
      const key =
        toText(record.key) ||
        toText(record.label) ||
        toText(record.name) ||
        String(index + 1);
      acc[key] = toNumber(record.value ?? record.amount ?? record.total ?? record.sum);
      return acc;
    }, {});
  }

  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).reduce<Record<string, number>>(
      (acc, [key, bucketValue]) => {
        acc[key] = toNumber(bucketValue);
        return acc;
      },
      {}
    );
  }

  return {};
};

const normalizeSummary = (payload: SummaryResponse): PurchasesSummaryData => ({
  totalPurchases: toNumber(payload.totalPurchases),
  totalOperationalCosts: toNumber(payload.totalOperationalCosts),
  totalExpenses: toNumber(payload.totalExpenses),
  revenue: toNumber(payload.revenue),
  grossProfit: toNumber(payload.grossProfit),
  netProfit: toNumber(payload.netProfit),
  avgPurchaseCost: toNumber(payload.avgPurchaseCost),
  totalOrders: toNumber(payload.totalOrders),
  purchasesByBucket: normalizeBuckets(payload.purchasesByBucket),
  operationalCostsByBucket: normalizeBuckets(payload.operationalCostsByBucket),
  revenueByBucket: normalizeBuckets(payload.revenueByBucket),
  grossProfitByBucket: normalizeBuckets(payload.grossProfitByBucket),
  netProfitByBucket: normalizeBuckets(payload.netProfitByBucket),
  costBreakdownByCategory: normalizeBuckets(payload.costBreakdownByCategory),
});

const buildPurchasePayload = (input: PurchaseMutationInput) => ({
  productId: input.productId,
  productName: input.productName,
  productNameEn: input.productNameEn || input.productName,
  productNameAr: input.productNameAr || undefined,
  categoryId: input.categoryId,
  categoryName: input.categoryName,
  categoryNameEn: input.categoryNameEn || input.categoryName,
  categoryNameAr: input.categoryNameAr || undefined,
  variantId: input.variantId,
  variantName: input.variantName,
  supplierName: input.supplierName,
  supplierNameEn: input.supplierNameEn || input.supplierName,
  supplierNameAr: input.supplierNameAr || undefined,
  supplierContact: input.supplierContact,
  supplierEmail: input.supplierEmail,
  supplierPhone: input.supplierPhone,
  quantity: input.quantity,
  unitCost: input.unitCost,
  status: input.status,
  expectedArrivalDate: input.expectedArrivalDate || undefined,
  pendingApproval: input.pendingApproval,
});

export const purchasesApi = {
  async list() {
    const response = await api.get<ApiEnvelope<unknown>>("/api/admin/purchases", {
      params: { page: 1, limit: 1000 },
    });
    const payload = response.data?.data ?? response.data;
    return unwrapList<PurchaseApiRecord>(payload).map(normalizePurchase);
  },

  async listByProduct(productId: string | number) {
    const response = await api.get<ApiEnvelope<unknown>>("/api/admin/purchases", {
      params: { page: 1, limit: 1000, productId },
    });
    const payload = response.data?.data ?? response.data;
    return unwrapList<PurchaseApiRecord>(payload).map(normalizePurchase);
  },

  async create(input: PurchaseMutationInput) {
    const response = await api.post<ApiEnvelope<PurchaseApiRecord>>(
      "/api/admin/purchases",
      buildPurchasePayload(input)
    );
    const payload = response.data?.data ?? response.data;
    return normalizePurchase((payload ?? {}) as PurchaseApiRecord);
  },

  async update(id: string, input: PurchaseMutationInput) {
    const response = await api.put<ApiEnvelope<PurchaseApiRecord>>(
      `/api/admin/purchases/${id}`,
      buildPurchasePayload(input)
    );
    const payload = response.data?.data ?? response.data;
    return normalizePurchase((payload ?? {}) as PurchaseApiRecord);
  },

  async patchStatus(id: string, status: PurchaseStatus, expectedArrivalDate?: string) {
    const response = await api.patch<ApiEnvelope<PurchaseApiRecord>>(
      `/api/admin/purchases/${id}/status`,
      {
        status,
        expectedArrivalDate: expectedArrivalDate || undefined,
      }
    );
    const payload = response.data?.data ?? response.data;
    return normalizePurchase((payload ?? {}) as PurchaseApiRecord);
  },

  async remove(id: string) {
    await api.delete(`/api/admin/purchases/${id}`);
  },
};

export const purchaseCostsApi = {
  async list() {
    const response = await api.get<ApiEnvelope<unknown>>("/api/admin/purchases/costs", {
      params: { page: 1, limit: 1000 },
    });
    const payload = response.data?.data ?? response.data;
    return unwrapList<CostApiRecord>(payload).map(normalizeCost);
  },

  async create(input: CostMutationInput) {
    const response = await api.post<ApiEnvelope<CostApiRecord>>(
      "/api/admin/purchases/costs",
      {
        ...input,
        name: input.name,
        costNameEn: input.costNameEn || input.name,
        costNameAr: input.costNameAr || undefined,
      }
    );
    const payload = response.data?.data ?? response.data;
    return normalizeCost((payload ?? {}) as CostApiRecord);
  },

  async update(id: string, input: CostMutationInput) {
    const response = await api.put<ApiEnvelope<CostApiRecord>>(
      `/api/admin/purchases/costs/${id}`,
      {
        ...input,
        name: input.name,
        costNameEn: input.costNameEn || input.name,
        costNameAr: input.costNameAr || undefined,
      }
    );
    const payload = response.data?.data ?? response.data;
    return normalizeCost((payload ?? {}) as CostApiRecord);
  },

  async remove(id: string) {
    await api.delete(`/api/admin/purchases/costs/${id}`);
  },
};

export const purchasesSummaryApi = {
  async get(period: SummaryPeriod) {
    const response = await api.get<ApiEnvelope<SummaryResponse>>("/api/admin/purchases/summary", {
      params: { period },
    });
    const payload = (response.data?.data ?? response.data ?? {}) as SummaryResponse;
    return normalizeSummary(payload);
  },
};

export const __testing = {
  buildPurchasePayload,
  normalizeCost,
  normalizeCostCategory,
  normalizePurchase,
  normalizePurchaseStatus,
  normalizeSummary,
};
