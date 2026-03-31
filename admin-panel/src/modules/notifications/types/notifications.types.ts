export type NotificationSeverity = "INFO" | "WARNING" | "CRITICAL";

export type NotificationModule =
  | "dashboards"
  | "inventory"
  | "crm"
  | "calendar"
  | "pos"
  | "invoices"
  | "purchases"
  | "website"
  | "promo-codes"
  | "team"
  | "loyalty-program"
  | "system";

export type NotificationItem = {
  id: string;
  type: string;
  module: NotificationModule;
  title: string;
  message: string;
  entityType?: string | null;
  entityId?: string | number | null;
  redirectUrl?: string | null;
  severity?: NotificationSeverity | null;
  isRead: boolean;
  readAt?: string | null;
  deliveredAt?: string | null;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
};

export type NotificationsPagination = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
};

export type NotificationsFilters = {
  page?: number;
  limit?: number;
  isRead?: boolean;
  module?: NotificationModule | "";
  type?: string;
};

export type NotificationsListResponse = {
  items: NotificationItem[];
  pagination: NotificationsPagination;
};

export type UnreadCountResponse = {
  unreadCount: number;
};

export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message: string | null;
};

export type NotificationPreferenceSource = "default" | "module" | (string & {});

export type NotificationPreferenceModuleItem = {
  module: NotificationModule;
  label: string;
  isEnabled: boolean;
};

export type NotificationPreferenceTypeItem = {
  module: NotificationModule;
  type: string;
  label: string;
  isEnabled: boolean;
  source?: NotificationPreferenceSource;
};

export type NotificationPreferencesResponse = {
  adminId: number;
  modules: NotificationPreferenceModuleItem[];
  types: NotificationPreferenceTypeItem[];
};

export type UpdateNotificationPreferenceModulesPayload = {
  preferences: Pick<NotificationPreferenceModuleItem, "module" | "isEnabled">[];
};

export type UpdateNotificationPreferenceTypesPayload = {
  preferences: Pick<NotificationPreferenceTypeItem, "module" | "type" | "isEnabled">[];
};
