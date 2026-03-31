import api from "@/services/api";
import type {
  AdminAuthMe,
  AdminNavigation,
  AdminNavigationAccessMode,
  AdminNavigationLink,
  AdminNavigationModule,
  AdminNavigationRoute,
  AssignStaffRoleInput,
  CreateStaffRoleInput,
  StaffPermission,
  StaffPermissionCatalogResponse,
  StaffRoleDetails,
  StaffRoleListItem,
  StaffRoleSummary,
  StaffRolesListResponse,
  UpdateStaffRoleMetadataInput,
  UpdateStaffRolePermissionsInput,
} from "@/features/admin-auth/types";

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  message?: string | null;
};

const unwrap = <T>(value: unknown): T => {
  const envelope = (value ?? {}) as ApiEnvelope<T>;
  if (typeof envelope === "object" && "data" in envelope && envelope.data !== undefined) {
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

const toId = (value: unknown) => toStringSafe(value);
const normalizeRoute = (value: unknown) => toStringSafe(value).trim();
const normalizeAccessMode = (value: unknown): AdminNavigationAccessMode =>
  toStringSafe(value).trim().toLowerCase() === "all" ? "all" : "any";

const toPermission = (value: unknown): StaffPermission => {
  const row = (value ?? {}) as Record<string, unknown>;
  return {
    id: toId(row.id ?? row.key),
    key: toStringSafe(row.key),
    moduleKey: toStringSafe(row.moduleKey ?? row.module_key),
    actionKey: toStringSafe(row.actionKey ?? row.action_key),
    label: toStringSafe(row.label),
  };
};

const toPermissionCatalog = (value: unknown): StaffPermissionCatalogResponse => {
  const row = (value ?? {}) as Record<string, unknown>;
  const items = Array.isArray(row.items) ? row.items.map(toPermission) : [];
  return { items };
};

const toRoleSummary = (value: unknown): StaffRoleSummary => {
  const row = (value ?? {}) as Record<string, unknown>;
  return {
    id: toId(row.id),
    code: toStringSafe(row.code),
    name: toStringSafe(row.name),
    isSystem: Boolean(row.isSystem),
    legacyUserRole: toStringSafe(row.legacyUserRole, "") || null,
  };
};

const toRoleListItem = (value: unknown): StaffRoleListItem => {
  const row = (value ?? {}) as Record<string, unknown>;
  const permissionsRaw = Array.isArray(row.permissions) ? row.permissions : null;
  return {
    ...toRoleSummary(row),
    description: toStringSafe(row.description, "") || null,
    assignmentCount:
      typeof row.assignmentCount === "number"
        ? row.assignmentCount
        : Number(row.assignmentCount ?? 0) || 0,
    permissions: permissionsRaw?.map((permission) =>
      typeof permission === "string"
        ? toPermission({ id: permission, key: permission })
        : toPermission(permission)
    ),
  };
};

const toRoleDetails = (value: unknown): StaffRoleDetails => {
  const row = (value ?? {}) as Record<string, unknown>;
  return {
    ...toRoleListItem(row),
    permissions: Array.isArray(row.permissions) ? row.permissions.map(toPermission) : [],
  };
};

const toNavigationLink = (value: unknown): AdminNavigationLink => {
  const row = (value ?? {}) as Record<string, unknown>;
  return {
    id: toStringSafe(row.id),
    label: toStringSafe(row.label),
    href: normalizeRoute(row.href),
    moduleId: toStringSafe(row.moduleId),
    position: typeof row.position === "number" ? row.position : Number(row.position ?? 0) || 0,
    requiredPermissions: Array.isArray(row.requiredPermissions)
      ? row.requiredPermissions.map((permission) => toStringSafe(permission)).filter(Boolean)
      : [],
    accessMode: normalizeAccessMode(row.accessMode),
    isEntry: row.isEntry !== false,
    isAccessible: row.isAccessible !== false,
  };
};

const toNavigationRoute = (value: unknown): AdminNavigationRoute => {
  const row = (value ?? {}) as Record<string, unknown>;
  return {
    path: normalizeRoute(row.path),
    moduleId: toStringSafe(row.moduleId),
    requiredPermissions: Array.isArray(row.requiredPermissions)
      ? row.requiredPermissions.map((permission) => toStringSafe(permission)).filter(Boolean)
      : [],
    accessMode: normalizeAccessMode(row.accessMode),
    isAccessible: row.isAccessible !== false,
  };
};

const toNavigationModule = (value: unknown): AdminNavigationModule => {
  const row = (value ?? {}) as Record<string, unknown>;
  return {
    moduleId: toStringSafe(row.moduleId),
    label: toStringSafe(row.label),
    position: typeof row.position === "number" ? row.position : Number(row.position ?? 0) || 0,
    isVisible: Boolean(row.isVisible),
    entry:
      row.entry === null || row.entry === undefined || row.entry === ""
        ? null
        : normalizeRoute(row.entry),
    permissionKeys: Array.isArray(row.permissionKeys)
      ? row.permissionKeys.map((permission) => toStringSafe(permission)).filter(Boolean)
      : [],
    links: Array.isArray(row.links) ? row.links.map(toNavigationLink) : [],
  };
};

const toNavigation = (value: unknown): AdminNavigation | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const row = value as Record<string, unknown>;
  return {
    defaultEntry:
      row.defaultEntry === null || row.defaultEntry === undefined || row.defaultEntry === ""
        ? null
        : normalizeRoute(row.defaultEntry),
    modules: Array.isArray(row.modules) ? row.modules.map(toNavigationModule) : [],
    links: Array.isArray(row.links) ? row.links.map(toNavigationLink) : [],
    routes: Array.isArray(row.routes) ? row.routes.map(toNavigationRoute) : [],
  };
};

const toAdminAuthMe = (value: unknown): AdminAuthMe => {
  const row = (value ?? {}) as Record<string, unknown>;
  const employee = (row.employee ?? null) as Record<string, unknown> | null;
  const moduleEntriesRaw = (row.moduleEntries ?? row.module_entries ?? null) as
    | Record<string, unknown>
    | null;
  const moduleEntries = moduleEntriesRaw
    ? Object.fromEntries(
        Object.entries(moduleEntriesRaw).map(([key, entry]) => [
          key,
          entry === null || entry === undefined || entry === ""
            ? null
            : normalizeRoute(entry),
        ])
      )
    : undefined;
  return {
    id: toId(row.id),
    email: toStringSafe(row.email),
    firstName: toStringSafe(row.firstName, "") || null,
    lastName: toStringSafe(row.lastName, "") || null,
    legacyRole: toStringSafe(row.legacyRole, "") || null,
    isStaffAccount: Boolean(row.isStaffAccount),
    mustChangePassword: Boolean(row.mustChangePassword),
    staffAccountStatus: (toStringSafe(row.staffAccountStatus, "") || null) as AdminAuthMe["staffAccountStatus"],
    staffRole: row.staffRole ? toRoleSummary(row.staffRole) : null,
    permissions: Array.isArray(row.permissions)
      ? row.permissions
          .map((permission) => toStringSafe(permission))
          .filter(Boolean)
      : [],
    moduleEntries,
    navigation: toNavigation(row.navigation),
    employee: employee
      ? {
          id: toId(employee.id),
          employeeCode: toStringSafe(employee.employeeCode, "") || null,
          fullNameEn: toStringSafe(employee.fullNameEn, "") || null,
          status: toStringSafe(employee.status, "") || null,
        }
      : null,
  };
};

export const adminAuthApi = {
  async getAdminAuthMe(): Promise<AdminAuthMe> {
    const response = await api.get("/api/admin/auth/me");
    return toAdminAuthMe(unwrap(response.data));
  },

  async listStaffPermissions(): Promise<StaffPermissionCatalogResponse> {
    const response = await api.get("/api/admin/staff-permissions");
    return toPermissionCatalog(unwrap(response.data));
  },

  async changeInitialPassword(payload: { oldPassword: string; newPassword: string }) {
    const response = await api.post("/api/admin/auth/change-initial-password", payload, {
      headers: { "Content-Type": "application/json" },
    });
    return unwrap<{ mustChangePassword: false }>(response.data);
  },

  async listStaffRoles(): Promise<StaffRolesListResponse> {
    const response = await api.get("/api/admin/staff-roles");
    const payload = unwrap<unknown>(response.data);
    const row = (payload ?? {}) as Record<string, unknown>;
    const items = Array.isArray(row.items) ? row.items.map(toRoleListItem) : [];
    return {
      items,
      totalItems: typeof row.totalItems === "number" ? row.totalItems : items.length,
    };
  },

  async getStaffRole(roleId: string | number): Promise<StaffRoleDetails> {
    const response = await api.get(`/api/admin/staff-roles/${roleId}`);
    return toRoleDetails(unwrap(response.data));
  },

  async createStaffRole(payload: CreateStaffRoleInput): Promise<StaffRoleDetails> {
    const response = await api.post("/api/admin/staff-roles", payload, {
      headers: { "Content-Type": "application/json" },
    });
    return toRoleDetails(unwrap(response.data));
  },

  async updateStaffRoleMetadata(
    roleId: string | number,
    payload: UpdateStaffRoleMetadataInput
  ): Promise<StaffRoleDetails> {
    const response = await api.patch(`/api/admin/staff-roles/${roleId}`, payload, {
      headers: { "Content-Type": "application/json" },
    });
    return toRoleDetails(unwrap(response.data));
  },

  async updateStaffRolePermissions(
    roleId: string | number,
    payload: UpdateStaffRolePermissionsInput
  ): Promise<StaffRoleDetails> {
    const response = await api.put(`/api/admin/staff-roles/${roleId}/permissions`, payload, {
      headers: { "Content-Type": "application/json" },
    });
    return toRoleDetails(unwrap(response.data));
  },

  async deleteStaffRole(roleId: string | number) {
    const response = await api.delete(`/api/admin/staff-roles/${roleId}`);
    return unwrap<{ id: string | number; deleted: true }>(response.data);
  },

  async assignStaffUserRole(userId: string | number, payload: AssignStaffRoleInput) {
    const response = await api.patch(`/api/admin/staff-users/${userId}/role`, payload, {
      headers: { "Content-Type": "application/json" },
    });
    return unwrap<{
      userId: string | number;
      role: StaffRoleSummary;
      previousRole: Pick<StaffRoleSummary, "id" | "code" | "name"> | null;
    }>(response.data);
  },
};
