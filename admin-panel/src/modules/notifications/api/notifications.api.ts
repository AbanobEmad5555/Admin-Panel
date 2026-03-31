import api from "@/services/api";
import { extractList } from "@/lib/extractList";
import type {
  ApiEnvelope,
  NotificationItem,
  NotificationPreferenceModuleItem,
  NotificationPreferenceTypeItem,
  NotificationModule,
  NotificationSeverity,
  NotificationPreferencesResponse,
  NotificationsFilters,
  NotificationsListResponse,
  NotificationsPagination,
  UpdateNotificationPreferenceModulesPayload,
  UpdateNotificationPreferenceTypesPayload,
} from "@/modules/notifications/types/notifications.types";

const NOTIFICATIONS_BASE = "/api/admin/notifications";
const NOTIFICATION_PREFERENCES_BASE = "/api/admin/notification-preferences";

const unwrap = <T>(value: unknown): T => {
  const envelope = (value ?? {}) as ApiEnvelope<T>;
  if (typeof envelope === "object" && envelope && "data" in envelope) {
    return envelope.data;
  }
  return value as T;
};

const toStringSafe = (value: unknown, fallback = "") => {
  if (value === null || value === undefined) {
    return fallback;
  }
  return String(value);
};

const toBooleanSafe = (value: unknown) => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  if (typeof value === "string") {
    return value.toLowerCase() === "true" || value === "1";
  }
  return false;
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

const normalizeSeverity = (value: unknown): NotificationSeverity | null => {
  const normalized = toStringSafe(value).trim().toUpperCase();
  if (normalized === "INFO" || normalized === "WARNING" || normalized === "CRITICAL") {
    return normalized;
  }
  return null;
};

const normalizeModule = (value: unknown): NotificationModule => {
  const normalized = toStringSafe(value, "system").trim() as NotificationModule;
  return normalized || "system";
};

const normalizePreferenceModuleItem = (value: unknown): NotificationPreferenceModuleItem => {
  const row = (value ?? {}) as Record<string, unknown>;

  return {
    module: normalizeModule(row.module),
    label: toStringSafe(row.label, toStringSafe(row.module, "System")),
    isEnabled: toBooleanSafe(row.isEnabled ?? row.enabled),
  };
};

const normalizePreferenceTypeItem = (value: unknown): NotificationPreferenceTypeItem => {
  const row = (value ?? {}) as Record<string, unknown>;

  return {
    module: normalizeModule(row.module),
    type: toStringSafe(row.type),
    label: toStringSafe(row.label, toStringSafe(row.type)),
    isEnabled: toBooleanSafe(row.isEnabled ?? row.enabled),
    source: toStringSafe(row.source) || undefined,
  };
};

const normalizeNotificationPreferencesResponse = (value: unknown): NotificationPreferencesResponse => {
  const payload = unwrap<unknown>(value);
  const row = (payload ?? {}) as Record<string, unknown>;

  return {
    adminId: Math.max(0, toNumberSafe(row.adminId ?? row.admin_id, 0)),
    modules: Array.isArray(row.modules) ? row.modules.map(normalizePreferenceModuleItem) : [],
    types: Array.isArray(row.types) ? row.types.map(normalizePreferenceTypeItem) : [],
  };
};

export const normalizeNotificationItem = (value: unknown): NotificationItem => {
  const row = (value ?? {}) as Record<string, unknown>;

  return {
    id: toStringSafe(row.id),
    type: toStringSafe(row.type),
    module: normalizeModule(row.module),
    title: toStringSafe(row.title, "Untitled notification"),
    message: toStringSafe(row.message),
    entityType: toStringSafe(row.entityType ?? row.entity_type, "") || null,
    entityId: (row.entityId ?? row.entity_id ?? null) as string | number | null,
    redirectUrl: toStringSafe(row.redirectUrl ?? row.redirect_url, "") || null,
    severity: normalizeSeverity(row.severity),
    isRead: toBooleanSafe(row.isRead ?? row.is_read),
    readAt: toStringSafe(row.readAt ?? row.read_at, "") || null,
    deliveredAt: toStringSafe(row.deliveredAt ?? row.delivered_at, "") || null,
    createdAt: toStringSafe(row.createdAt ?? row.created_at),
    metadata:
      row.metadata && typeof row.metadata === "object"
        ? (row.metadata as Record<string, unknown>)
        : null,
  };
};

const normalizePagination = (value: unknown, itemCount: number): NotificationsPagination => {
  const row = (value ?? {}) as Record<string, unknown>;
  const page = Math.max(1, toNumberSafe(row.page, 1));
  const limit = Math.max(1, toNumberSafe(row.limit, itemCount || 20));
  const totalItems = Math.max(itemCount, toNumberSafe(row.totalItems, itemCount));
  const totalPages = Math.max(1, toNumberSafe(row.totalPages, Math.ceil(totalItems / limit)));

  return {
    page,
    limit,
    totalItems,
    totalPages,
  };
};

const normalizeNotificationsListResponse = (value: unknown): NotificationsListResponse => {
  const payload = unwrap<unknown>(value);
  const row = (payload ?? {}) as Record<string, unknown>;
  const itemsRaw =
    extractList<unknown>(payload).length > 0
      ? extractList<unknown>(payload)
      : Array.isArray(row.notifications)
        ? row.notifications
        : [];

  const paginationSource =
    (row.pagination as Record<string, unknown> | undefined) ??
    ({
      page: row.page,
      limit: row.limit,
      totalItems: row.totalItems,
      totalPages: row.totalPages,
    } as Record<string, unknown>);

  return {
    items: itemsRaw.map(normalizeNotificationItem),
    pagination: normalizePagination(paginationSource, itemsRaw.length),
  };
};

export const notificationsApi = {
  async getLatestNotifications(limit = 10): Promise<NotificationItem[]> {
    const response = await api.get(`${NOTIFICATIONS_BASE}/latest`, {
      params: { limit },
    });
    const payload = unwrap<unknown>(response.data);
    const rows = extractList<unknown>(payload);
    return rows.map(normalizeNotificationItem);
  },

  async getNotifications(params: NotificationsFilters): Promise<NotificationsListResponse> {
    const search = new URLSearchParams();

    if (params.page) search.set("page", String(params.page));
    if (params.limit) search.set("limit", String(params.limit));
    if (typeof params.isRead === "boolean") search.set("isRead", String(params.isRead));
    if (params.module) search.set("module", params.module);
    if (params.type?.trim()) search.set("type", params.type.trim());

    const response = await api.get(
      `${NOTIFICATIONS_BASE}${search.toString() ? `?${search.toString()}` : ""}`,
    );
    return normalizeNotificationsListResponse(response.data);
  },

  async getUnreadCount(): Promise<number> {
    const response = await api.get(`${NOTIFICATIONS_BASE}/unread-count`);
    const payload = unwrap<unknown>(response.data) as Record<string, unknown>;
    return Math.max(0, toNumberSafe(payload.unreadCount ?? payload.count, 0));
  },

  async markNotificationAsRead(id: string): Promise<NotificationItem> {
    const response = await api.patch(`${NOTIFICATIONS_BASE}/${id}/read`);
    return normalizeNotificationItem(unwrap(response.data));
  },

  async markAllNotificationsAsRead(): Promise<{ updatedCount: number }> {
    const response = await api.patch(`${NOTIFICATIONS_BASE}/read-all`);
    const payload = unwrap<unknown>(response.data) as Record<string, unknown>;
    return {
      updatedCount: Math.max(0, toNumberSafe(payload.updatedCount ?? payload.count, 0)),
    };
  },

  async getNotificationsSince(since: string): Promise<NotificationItem[]> {
    const response = await api.get(`${NOTIFICATIONS_BASE}/since`, {
      params: { since },
    });
    const payload = unwrap<unknown>(response.data);
    const rows = extractList<unknown>(payload);
    return rows.map(normalizeNotificationItem);
  },

  async getNotificationPreferences(): Promise<NotificationPreferencesResponse> {
    const response = await api.get(NOTIFICATION_PREFERENCES_BASE);
    return normalizeNotificationPreferencesResponse(response.data);
  },

  async updateNotificationPreferenceModules(
    payload: UpdateNotificationPreferenceModulesPayload,
  ): Promise<{ updated: number }> {
    const response = await api.put(`${NOTIFICATION_PREFERENCES_BASE}/modules`, payload);
    const data = unwrap<unknown>(response.data) as Record<string, unknown>;
    return {
      updated: Math.max(0, toNumberSafe(data.updated, payload.preferences.length)),
    };
  },

  async updateNotificationPreferenceTypes(
    payload: UpdateNotificationPreferenceTypesPayload,
  ): Promise<{ updated: number }> {
    const response = await api.put(`${NOTIFICATION_PREFERENCES_BASE}/types`, payload);
    const data = unwrap<unknown>(response.data) as Record<string, unknown>;
    return {
      updated: Math.max(0, toNumberSafe(data.updated, payload.preferences.length)),
    };
  },

  async resetNotificationPreferences(): Promise<{ deleted: number }> {
    const response = await api.delete(NOTIFICATION_PREFERENCES_BASE);
    const data = unwrap<unknown>(response.data) as Record<string, unknown>;
    return {
      deleted: Math.max(0, toNumberSafe(data.deleted, 0)),
    };
  },
};
