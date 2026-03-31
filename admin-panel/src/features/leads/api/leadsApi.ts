import { leadsApiClient } from "@/features/leads/api/client";
import axios from "axios";
import { getLocalizedValue } from "@/modules/localization/utils";
import type {
  ApiEnvelope,
  Lead,
  LeadFilters,
  LeadListParams,
  LeadPayload,
  LeadsListResult,
  PaginationMeta,
  LeadStatus,
  PipelineColumn,
  User,
} from "@/features/leads/types";
import { LEAD_STATUS_ORDER } from "@/features/leads/types";

const LEAD_ENDPOINTS = ["/leads", "/api/leads"] as const;

const requestLeadApi = async <T>(
  method: "get" | "post" | "patch",
  path = "",
  config?: Record<string, unknown>,
  body?: unknown
) => {
  let lastError: unknown;

  for (const endpoint of LEAD_ENDPOINTS) {
    try {
      const url = `${endpoint}${path}`;

      if (method === "get") {
        return await leadsApiClient.get<T>(url, config);
      }

      if (method === "post") {
        return await leadsApiClient.post<T>(url, body, config);
      }

      return await leadsApiClient.patch<T>(url, body, config);
    } catch (error) {
      if (!axios.isAxiosError(error) || error.response?.status !== 404) {
        throw error;
      }

      lastError = error;
    }
  }

  throw lastError;
};

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
};

const firstString = (...values: unknown[]): string | undefined => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
};

const toLeadTag = (
  value: unknown,
  totalOrders?: number,
  tagOverride?: boolean
): Lead["tag"] => {
  if (!tagOverride && typeof totalOrders === "number") {
    if (totalOrders >= 5) {
      return "VIP";
    }
    if (totalOrders >= 1) {
      return "Customer";
    }
    return "Potential";
  }

  const normalized = String(value ?? "").trim().toUpperCase();
  if (normalized === "VIP") {
    return "VIP";
  }
  if (normalized === "CUSTOMER") {
    return "Customer";
  }
  if (normalized === "POTENTIAL") {
    return "Potential";
  }
  return "Potential";
};

const normalizeUser = (value: unknown): User | undefined => {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const user = value as Record<string, unknown>;
  const id = toNumber(user.id) ?? toNumber(user.userId);
  const name = firstString(user.name, user.fullName, user.username);
  const nameEn = firstString(user.nameEn, user.full_name_en, user.fullNameEn);
  const nameAr = firstString(user.nameAr, user.full_name_ar, user.fullNameAr);

  if (!id && !name) {
    return undefined;
  }

  return {
    id: id ?? 0,
    name:
      getLocalizedValue({ en: nameEn, ar: nameAr, legacy: name, lang: "en" }) ??
      `Admin ${id ?? "-"}`,
    nameEn,
    nameAr,
    email: firstString(user.email),
  };
};

const normalizeLead = (value: unknown): Lead => {
  const lead = (value ?? {}) as Record<string, unknown>;
  const normalizedLeadId =
    toNumber(
      lead.leadId ??
        lead.lead_id ??
        lead.crmLeadId ??
        lead.crm_lead_id ??
        lead.id
    ) ?? 0;
  const totalOrders = toNumber(lead.totalOrders ?? lead.ordersCount ?? lead.orderCount);
  const tagOverride = Boolean(lead.tagOverride);

  const assignedTo =
    normalizeUser(lead.assignedTo) ||
    normalizeUser(lead.assignedAdmin) ||
    normalizeUser(lead.assignedUser) ||
    normalizeUser(lead.admin);

  const assignedName = firstString(
    lead.assignedToName,
    lead.assignedAdminName,
    lead.assigned_name,
    lead.assignedToFullName
  );

  const assignedToId =
    toNumber(lead.assignedToId) ??
    toNumber(lead.assignedAdminId) ??
    toNumber(lead.assignedUserId) ??
    assignedTo?.id;

  const nameEn = firstString(lead.nameEn, lead.name_en, lead.fullNameEn, lead.customerNameEn);
  const nameAr = firstString(lead.nameAr, lead.name_ar, lead.fullNameAr, lead.customerNameAr);

  return {
    id: normalizedLeadId,
    name:
      getLocalizedValue({
        en: nameEn,
        ar: nameAr,
        legacy: firstString(lead.name, lead.fullName, lead.customerName, lead.tempName, lead.userName) ?? "-",
        lang: "en",
      }) ?? "-",
    nameEn,
    nameAr,
    phone: firstString(lead.phone, lead.phoneNumber, lead.mobile, lead.tempPhone) ?? "-",
    email: firstString(lead.email),
    source: firstString(lead.source, lead.leadSource, lead.channel) ?? "Unknown",
    status: String(lead.status ?? "New") as Lead["status"],
    tag: toLeadTag(lead.tag ?? lead.type, totalOrders, tagOverride),
    tagOverride,
    priority: String(lead.priority ?? "Medium") as Lead["priority"],
    assignedToId,
    assignedTo:
      assignedTo || (assignedName ? { id: assignedToId ?? 0, name: assignedName } : undefined),
    userId: toNumber(lead.userId),
    budget: toNumber(lead.budget ?? lead.totalSpent),
    notes: firstString(lead.notes),
    followUpDate: firstString(lead.followUpDate, lead.nextFollowUpDate),
    createdAt: String(lead.createdAt ?? new Date().toISOString()),
    updatedAt: String(lead.updatedAt ?? new Date().toISOString()),
  };
};

const normalizeLeadList = (payload: unknown): Lead[] => {
  if (Array.isArray(payload)) {
    return payload.map(normalizeLead).filter((lead) => lead.id > 0);
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const record = payload as Record<string, unknown>;

  if (Array.isArray(record.items)) {
    return normalizeLeadList(record.items);
  }

  if (Array.isArray(record.rows)) {
    return normalizeLeadList(record.rows);
  }

  if (Array.isArray(record.leads)) {
    return normalizeLeadList(record.leads);
  }

  if (Array.isArray(record.data)) {
    return normalizeLeadList(record.data);
  }

  return [];
};

const normalizePagination = (value: unknown): PaginationMeta => {
  const record = (value ?? {}) as Record<string, unknown>;
  return {
    totalItems: toNumber(record.totalItems) ?? 0,
    currentPage: toNumber(record.currentPage) ?? 1,
    totalPages: toNumber(record.totalPages) ?? 1,
    limit: toNumber(record.limit) ?? 20,
  };
};

const normalizeAdminList = (payload: unknown): User[] => {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const data = payload as Record<string, unknown>;
  const usersRaw = Array.isArray(data.users)
    ? data.users
    : Array.isArray(data.items)
      ? data.items
      : Array.isArray(data.rows)
        ? data.rows
        : [];

  return usersRaw
    .map((item) => normalizeUser(item))
    .filter((user): user is User => Boolean(user && user.id));
};

const toQueryParams = (filters: LeadFilters) => {
  const params: Record<string, string> = {};

  if (filters.status) {
    params.status = filters.status;
  }

  if (filters.tag) {
    params.tag = filters.tag;
  }

  if (filters.assignedTo) {
    params.assignedTo = filters.assignedTo;
  }

  if (filters.source) {
    params.source = filters.source;
  }

  return params;
};

const toListQueryParams = (params: LeadListParams) => {
  const query: Record<string, string | number> = {
    page: params.page,
    limit: params.limit,
  };

  const normalizedSearch = (params.search ?? params.q ?? "").trim();
  if (normalizedSearch) {
    query.search = normalizedSearch;
  }

  if (params.type) {
    query.type = params.type;
  }

  return query;
};

const buildPipelineFromLeads = (leads: Lead[]): PipelineColumn[] => {
  return LEAD_STATUS_ORDER.map((status) => ({
    status,
    leads: leads.filter((lead) => lead.status === status),
  }));
};

const normalizePipelinePayload = (payload: unknown): PipelineColumn[] => {
  if (Array.isArray(payload)) {
    return payload.map((column) => {
      const value = (column ?? {}) as Record<string, unknown>;

      return {
        status: String(value.status ?? "New") as LeadStatus,
        leads: normalizeLeadList(value.leads),
      };
    });
  }

  if (payload && typeof payload === "object") {
    const map = payload as Record<string, unknown>;
    return Object.entries(map).map(([status, leads]) => ({
      status: status as LeadStatus,
      leads: normalizeLeadList(leads),
    }));
  }

  return [];
};

export const leadsApi = {
  async getLeadsList(params: LeadListParams): Promise<LeadsListResult> {
    const response = await requestLeadApi<ApiEnvelope<unknown>>("get", "", {
      params: toListQueryParams(params),
    });

    const data = (response.data?.data ?? {}) as Record<string, unknown>;
    return {
      leads: normalizeLeadList(data.leads),
      pagination: normalizePagination(data.pagination),
    };
  },

  async getLeads(filters: LeadFilters): Promise<Lead[]> {
    const response = await requestLeadApi<ApiEnvelope<unknown>>("get", "", {
      params: toQueryParams(filters),
    });

    return normalizeLeadList(response.data?.data);
  },

  async assignLeadAdmin(leadId: number, adminId: number): Promise<void> {
    await requestLeadApi("patch", `/${leadId}/assign-admin`, undefined, { adminId });
  },

  async getAdminUsers(): Promise<User[]> {
    const response = await leadsApiClient.get<ApiEnvelope<unknown>>("/admin/users", {
      params: { page: 1, limit: 200 },
    });

    const payload = response.data?.data;

    if (Array.isArray(payload)) {
      return payload
        .map((item) => normalizeUser(item))
        .filter((user): user is User => Boolean(user && user.id));
    }

    return normalizeAdminList(payload);
  },

  async getLeadById(id: number): Promise<Lead | null> {
    const response = await requestLeadApi<ApiEnvelope<unknown>>("get");
    const leads = normalizeLeadList(response.data?.data);
    return leads.find((lead) => lead.id === id) ?? null;
  },

  async getPipeline(): Promise<PipelineColumn[]> {
    try {
      const response = await requestLeadApi<ApiEnvelope<unknown>>("get", "/pipeline");
      const pipeline = normalizePipelinePayload(response.data?.data);
      if (pipeline.length > 0) {
        return pipeline;
      }
    } catch (error) {
      if (!axios.isAxiosError(error)) {
        throw error;
      }

      const status = error.response?.status;
      if (status && ![404, 405].includes(status)) {
        throw error;
      }
    }

    const fallback = await requestLeadApi<ApiEnvelope<unknown>>("get", "", {
      params: { page: 1, limit: 500 },
    });

    const fallbackData = (fallback.data?.data ?? {}) as Record<string, unknown>;
    const leads = normalizeLeadList(fallbackData.leads ?? fallback.data?.data);
    return buildPipelineFromLeads(leads);
  },

  async createLead(payload: LeadPayload): Promise<Lead> {
    const response = await requestLeadApi<ApiEnvelope<unknown>>("post", "", undefined, payload);
    return normalizeLead(response.data?.data);
  },

  async updateLead(id: number, payload: Partial<LeadPayload>): Promise<Lead> {
    const response = await requestLeadApi<ApiEnvelope<unknown>>("patch", `/${id}`, undefined, payload);
    return normalizeLead(response.data?.data);
  },

  async updateLeadStatus(id: number, status: LeadStatus): Promise<void> {
    await requestLeadApi("patch", `/${id}/status`, undefined, { status });
  },
};
