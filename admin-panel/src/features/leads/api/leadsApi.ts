import { leadsApiClient } from "@/features/leads/api/client";
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

  if (!id && !name) {
    return undefined;
  }

  return {
    id: id ?? 0,
    name: name ?? `Admin ${id ?? "-"}`,
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

  return {
    id: normalizedLeadId,
    name: firstString(lead.name, lead.fullName, lead.customerName, lead.tempName, lead.userName) ?? "-",
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

  const isAdmin = (value: unknown) => {
    if (!value || typeof value !== "object") {
      return false;
    }
    const row = value as Record<string, unknown>;
    return String(row.role ?? "").toUpperCase() === "ADMIN";
  };

  return usersRaw
    .filter((item) => isAdmin(item))
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

export const leadsApi = {
  async getLeadsList(params: LeadListParams): Promise<LeadsListResult> {
    const response = await leadsApiClient.get<ApiEnvelope<unknown>>("/api/leads", {
      params: toListQueryParams(params),
    });

    const data = (response.data?.data ?? {}) as Record<string, unknown>;
    return {
      leads: normalizeLeadList(data.leads),
      pagination: normalizePagination(data.pagination),
    };
  },

  async getLeads(filters: LeadFilters): Promise<Lead[]> {
    const response = await leadsApiClient.get<ApiEnvelope<unknown>>("/api/leads", {
      params: toQueryParams(filters),
    });

    return normalizeLeadList(response.data?.data);
  },

  async assignLeadAdmin(leadId: number, adminId: number): Promise<void> {
    await leadsApiClient.patch(`/api/leads/${leadId}/assign-admin`, { adminId });
  },

  async getAdminUsers(): Promise<User[]> {
    const response = await leadsApiClient.get<ApiEnvelope<unknown>>("/admin/users", {
      params: { page: 1, limit: 200 },
    });

    const payload = response.data?.data;
    const isAdmin = (value: unknown) => {
      if (!value || typeof value !== "object") {
        return false;
      }
      const row = value as Record<string, unknown>;
      return String(row.role ?? "").toUpperCase() === "ADMIN";
    };

    if (Array.isArray(payload)) {
      return payload
        .filter((item) => isAdmin(item))
        .map((item) => normalizeUser(item))
        .filter((user): user is User => Boolean(user && user.id));
    }

    return normalizeAdminList(payload);
  },

  async getLeadById(id: number): Promise<Lead | null> {
    const response = await leadsApiClient.get<ApiEnvelope<unknown>>("/api/leads");
    const leads = normalizeLeadList(response.data?.data);
    return leads.find((lead) => lead.id === id) ?? null;
  },

  async getPipeline(): Promise<PipelineColumn[]> {
    const response = await leadsApiClient.get<ApiEnvelope<unknown>>("/api/leads/pipeline");
    const payload = response.data?.data;

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
  },

  async createLead(payload: LeadPayload): Promise<Lead> {
    const response = await leadsApiClient.post<ApiEnvelope<unknown>>("/api/leads", payload);
    return normalizeLead(response.data?.data);
  },

  async updateLead(id: number, payload: Partial<LeadPayload>): Promise<Lead> {
    const response = await leadsApiClient.patch<ApiEnvelope<unknown>>(`/api/leads/${id}`, payload);
    return normalizeLead(response.data?.data);
  },

  async updateLeadStatus(id: number, status: LeadStatus): Promise<void> {
    await leadsApiClient.patch(`/api/leads/${id}/status`, { status });
  },
};
