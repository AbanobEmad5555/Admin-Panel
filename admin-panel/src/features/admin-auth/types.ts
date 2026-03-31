export type StaffAccountStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export type StaffPermission = {
  id: string | number;
  key: string;
  moduleKey: string;
  actionKey: string;
  label: string;
};

export type StaffPermissionCatalogResponse = {
  items: StaffPermission[];
};

export type StaffRoleSummary = {
  id: string | number;
  code: string;
  name: string;
  isSystem: boolean;
  legacyUserRole?: string | null;
};

export type StaffRoleListItem = StaffRoleSummary & {
  description?: string | null;
  assignmentCount: number;
  permissions?: StaffPermission[] | null;
};

export type StaffRoleDetails = StaffRoleListItem & {
  permissions: StaffPermission[];
};

export type StaffEmployeeSummary = {
  id: string | number;
  employeeCode?: string | null;
  fullNameEn?: string | null;
  status?: string | null;
};

export type AdminNavigationAccessMode = "any" | "all";

export type AdminNavigationLink = {
  id: string;
  label: string;
  href: string;
  moduleId: string;
  position: number;
  requiredPermissions: string[];
  accessMode: AdminNavigationAccessMode;
  isEntry: boolean;
  isAccessible: boolean;
};

export type AdminNavigationModule = {
  moduleId: string;
  label: string;
  position: number;
  isVisible: boolean;
  entry: string | null;
  permissionKeys: string[];
  links: AdminNavigationLink[];
};

export type AdminNavigationRoute = {
  path: string;
  moduleId: string;
  requiredPermissions: string[];
  accessMode: AdminNavigationAccessMode;
  isAccessible: boolean;
};

export type AdminNavigation = {
  defaultEntry: string | null;
  modules: AdminNavigationModule[];
  links: AdminNavigationLink[];
  routes: AdminNavigationRoute[];
};

export type AdminAuthMe = {
  id: string | number;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  legacyRole?: string | null;
  isStaffAccount: boolean;
  mustChangePassword: boolean;
  staffAccountStatus?: StaffAccountStatus | null;
  staffRole: StaffRoleSummary | null;
  permissions: string[];
  moduleEntries?: Partial<Record<string, string | null>>;
  navigation?: AdminNavigation | null;
  employee: StaffEmployeeSummary | null;
};

export type StaffRolesListResponse = {
  items: StaffRoleListItem[];
  totalItems: number;
};

export type CreateStaffRoleInput = {
  name: string;
  description?: string;
  legacyUserRole?: string;
  permissionKeys: string[];
};

export type UpdateStaffRoleMetadataInput = {
  name?: string;
  description?: string;
  legacyUserRole?: string;
};

export type UpdateStaffRolePermissionsInput = {
  permissionKeys: string[];
};

export type AssignStaffRoleInput = {
  roleId: string | number;
};
