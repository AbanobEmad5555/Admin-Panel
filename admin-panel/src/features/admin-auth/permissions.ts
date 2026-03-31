import type {
  AdminAuthMe,
  AdminNavigationLink,
  AdminNavigationModule,
  AdminNavigationRoute,
} from "@/features/admin-auth/types";
import type { DashboardModuleId } from "@/modules/dashboard-layout/types/dashboardLayout.types";

export type PermissionCheck = string | string[] | undefined;

const normalizePermission = (value: string) => value.trim().toLowerCase();
const normalizePathname = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "/") {
    return trimmed || "/";
  }
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
};

export const getPermissionSet = (permissions: string[] | undefined | null) =>
  new Set((permissions ?? []).map(normalizePermission));

export const hasPermission = (
  permissions: string[] | undefined | null,
  required: PermissionCheck
) => {
  if (!required || (Array.isArray(required) && required.length === 0)) {
    return true;
  }

  const checks = Array.isArray(required) ? required : [required];
  const permissionSet = getPermissionSet(permissions);

  return checks.some((check) => {
    const normalized = normalizePermission(check);
    const [moduleKey, actionKey] = normalized.split(".");
    return (
      permissionSet.has(normalized) ||
      permissionSet.has("*") ||
      permissionSet.has(`${moduleKey}.*`) ||
      permissionSet.has(`${moduleKey}.manage`) ||
      (actionKey ? permissionSet.has(`${moduleKey}.${actionKey}`) : false)
    );
  });
};

const getNavigationRouteMatches = (
  auth: Pick<AdminAuthMe, "navigation"> | null,
  pathname: string
): AdminNavigationRoute[] => {
  const normalizedPath = normalizePathname(pathname);
  const routes = auth?.navigation?.routes ?? [];

  return routes
    .filter((route) => {
      const routePath = normalizePathname(route.path);
      return normalizedPath === routePath || normalizedPath.startsWith(`${routePath}/`);
    })
    .sort((left, right) => normalizePathname(right.path).length - normalizePathname(left.path).length);
};

export const getNavigationRouteForPath = (
  auth: Pick<AdminAuthMe, "navigation"> | null,
  pathname: string
) => getNavigationRouteMatches(auth, pathname)[0] ?? null;

const getNavigationLinkMatches = (
  auth: Pick<AdminAuthMe, "navigation"> | null,
  pathname: string
): AdminNavigationLink[] => {
  const normalizedPath = normalizePathname(pathname);
  const links = auth?.navigation?.links ?? [];

  return links
    .filter((link) => {
      const href = normalizePathname(link.href);
      return normalizedPath === href || normalizedPath.startsWith(`${href}/`);
    })
    .sort((left, right) => normalizePathname(right.href).length - normalizePathname(left.href).length);
};

export const getNavigationModuleForPath = (
  auth: Pick<AdminAuthMe, "navigation"> | null,
  pathname: string
): AdminNavigationModule | null => {
  const routeMatch = getNavigationRouteForPath(auth, pathname);
  if (routeMatch) {
    return auth?.navigation?.modules.find((moduleItem) => moduleItem.moduleId === routeMatch.moduleId) ?? null;
  }

  const linkMatch = getNavigationLinkMatches(auth, pathname)[0];
  if (!linkMatch) {
    return null;
  }

  return auth?.navigation?.modules.find((moduleItem) => moduleItem.moduleId === linkMatch.moduleId) ?? null;
};

export const canAccessPath = (
  auth: Pick<AdminAuthMe, "permissions" | "navigation"> | null,
  pathname: string
) => {
  const route = getNavigationRouteForPath(auth, pathname);
  if (!route) {
    return false;
  }

  if (route.isAccessible === false) {
    return false;
  }

  return hasPermission(auth?.permissions, route.requiredPermissions);
};

export const canAccessDashboardModule = (
  moduleId: DashboardModuleId,
  auth: Pick<AdminAuthMe, "navigation"> | null
) =>
  Boolean(
    auth?.navigation?.modules.find(
      (moduleItem) => moduleItem.moduleId === moduleId && moduleItem.isVisible && moduleItem.entry
    )
  );

export const getDashboardModuleRoute = (
  moduleId: DashboardModuleId,
  auth: Pick<AdminAuthMe, "navigation" | "moduleEntries"> | null
) => {
  if (auth?.moduleEntries && Object.prototype.hasOwnProperty.call(auth.moduleEntries, moduleId)) {
    return auth.moduleEntries[moduleId] ?? null;
  }

  return (
    auth?.navigation?.modules.find((moduleItem) => moduleItem.moduleId === moduleId)?.entry ?? null
  );
};

export const canRenderDashboardModuleEntry = (
  moduleId: DashboardModuleId,
  auth: Pick<AdminAuthMe, "navigation" | "moduleEntries"> | null
) => Boolean(getDashboardModuleRoute(moduleId, auth));

