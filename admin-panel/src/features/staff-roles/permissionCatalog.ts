import type { StaffPermission } from "@/features/admin-auth/types";

export const resolvePermissionCatalog = (backendCatalog: StaffPermission[] | undefined | null) =>
  [...(backendCatalog ?? [])].sort((left, right) => {
    if (left.moduleKey === right.moduleKey) {
      return left.actionKey.localeCompare(right.actionKey);
    }
    return left.moduleKey.localeCompare(right.moduleKey);
  });

export const groupPermissionsByModule = (permissions: StaffPermission[]) =>
  permissions.reduce<Record<string, StaffPermission[]>>((accumulator, permission) => {
    if (!accumulator[permission.moduleKey]) {
      accumulator[permission.moduleKey] = [];
    }
    accumulator[permission.moduleKey].push(permission);
    return accumulator;
  }, {});
