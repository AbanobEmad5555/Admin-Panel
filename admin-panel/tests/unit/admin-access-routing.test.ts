import assert from "node:assert/strict";
import test from "node:test";
import {
  canAccessPath,
  canRenderDashboardModuleEntry,
  getDashboardModuleRoute,
  getNavigationModuleForPath,
  getNavigationRouteForPath,
} from "@/features/admin-auth/permissions";
import type { AdminAuthMe } from "@/features/admin-auth/types";

const authProfile: Pick<AdminAuthMe, "permissions" | "moduleEntries" | "navigation"> = {
  permissions: ["dashboard.view", "customers.view", "team.view"],
  moduleEntries: {
    crm: "/admin/users",
    dashboards: "/dashboard",
    inventory: null,
  },
  navigation: {
    defaultEntry: "/dashboard",
    modules: [
      {
        moduleId: "crm",
        label: "CRM",
        position: 1,
        isVisible: true,
        entry: "/admin/users",
        permissionKeys: ["customers.view"],
        links: [
          {
            id: "crm-users",
            label: "Customers",
            href: "/admin/users",
            moduleId: "crm",
            position: 1,
            requiredPermissions: ["customers.view"],
            accessMode: "any",
            isEntry: true,
            isAccessible: true,
          },
        ],
      },
      {
        moduleId: "inventory",
        label: "Inventory",
        position: 2,
        isVisible: false,
        entry: null,
        permissionKeys: ["products.view"],
        links: [],
      },
    ],
    links: [
      {
        id: "crm-users",
        label: "Customers",
        href: "/admin/users",
        moduleId: "crm",
        position: 1,
        requiredPermissions: ["customers.view"],
        accessMode: "any",
        isEntry: true,
        isAccessible: true,
      },
    ],
    routes: [
      {
        path: "/admin/users",
        moduleId: "crm",
        requiredPermissions: ["customers.view"],
        accessMode: "any",
        isAccessible: true,
      },
      {
        path: "/admin/team/roles",
        moduleId: "team",
        requiredPermissions: ["team.manage_roles"],
        accessMode: "any",
        isAccessible: false,
      },
    ],
  },
};

test("route guard uses backend navigation routes", () => {
  assert.equal(getNavigationRouteForPath(authProfile, "/admin/users")?.path, "/admin/users");
  assert.equal(canAccessPath(authProfile, "/admin/users"), true);
  assert.equal(canAccessPath(authProfile, "/admin/team/roles"), false);
});

test("sidebar/module lookup uses backend navigation metadata", () => {
  assert.equal(getNavigationModuleForPath(authProfile, "/admin/users")?.moduleId, "crm");
});

test("dashboard module route uses backend moduleEntries only", () => {
  assert.equal(getDashboardModuleRoute("crm", authProfile), "/admin/users");
  assert.equal(getDashboardModuleRoute("inventory", authProfile), null);
});

test("dashboard module entry is hidden when backend returns null", () => {
  assert.equal(canRenderDashboardModuleEntry("inventory", authProfile), false);
  assert.equal(canRenderDashboardModuleEntry("crm", authProfile), true);
});
