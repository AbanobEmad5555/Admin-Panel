import assert from "node:assert/strict";
import test from "node:test";
import { adminAuthApi } from "@/features/admin-auth/api/adminAuth.api";
import api from "@/services/api";

const client = api as unknown as {
  get: (url: string) => Promise<{ data: unknown }>;
};

test("getAdminAuthMe preserves canonical backend routes and parses navigation metadata", async () => {
  const originalGet = client.get;
  client.get = async () => ({
    data: {
      success: true,
      data: {
        id: 12,
        email: "staff@test.com",
        firstName: "Staff",
        lastName: "User",
        legacyRole: "ADMIN",
        isStaffAccount: true,
        mustChangePassword: false,
        staffAccountStatus: "ACTIVE",
        staffRole: {
          id: 4,
          code: "MANAGER",
          name: "Manager",
          isSystem: true,
          legacyUserRole: "ADMIN",
        },
        permissions: ["team.view", "", "dashboard.view"],
        moduleEntries: {
          crm: "/admin/crm/leads",
          inventory: "/categories",
          dashboards: "/dashboard",
          "loyalty-program": "/admin/loyalty",
          website: "/admin/homepage-control",
          purchases: "/purchases/summary",
          calendar: "/calendar",
          pos: "/admin/pos",
        },
        navigation: {
          defaultEntry: "/dashboard",
          modules: [
            {
              moduleId: "crm",
              label: "CRM",
              position: 1,
              isVisible: true,
              entry: "/admin/crm/leads",
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
          ],
        },
        employee: {
          id: 90,
          employeeCode: "EMP-090",
          fullNameEn: "Staff User",
          status: "ACTIVE",
        },
      },
    },
  });

  try {
    const profile = await adminAuthApi.getAdminAuthMe();
    assert.equal(profile.id, "12");
    assert.equal(profile.staffRole?.id, "4");
    assert.deepEqual(profile.permissions, ["team.view", "dashboard.view"]);
    assert.deepEqual(profile.moduleEntries, {
      crm: "/admin/crm/leads",
      inventory: "/categories",
      dashboards: "/dashboard",
      "loyalty-program": "/admin/loyalty",
      website: "/admin/homepage-control",
      purchases: "/purchases/summary",
      calendar: "/calendar",
      pos: "/admin/pos",
    });
    assert.equal(profile.navigation?.defaultEntry, "/dashboard");
    assert.equal(profile.navigation?.modules[0]?.moduleId, "crm");
    assert.equal(profile.navigation?.links[0]?.href, "/admin/users");
    assert.equal(profile.navigation?.routes[0]?.path, "/admin/users");
    assert.deepEqual(profile.employee, {
      id: "90",
      employeeCode: "EMP-090",
      fullNameEn: "Staff User",
      status: "ACTIVE",
    });
  } finally {
    client.get = originalGet;
  }
});

test("listStaffRoles normalizes role metadata and mixed permission payload shapes", async () => {
  const originalGet = client.get;
  client.get = async () => ({
    data: {
      success: true,
      data: {
        items: [
          {
            id: 7,
            code: "CONTENT_QA",
            name: "Content QA",
            description: "Reviews content.",
            isSystem: false,
            legacyUserRole: "MANAGER",
            assignmentCount: "2",
            permissions: [
              "dashboard.view",
              {
                key: "reviews.view",
                module_key: "reviews",
                action_key: "view",
                label: "reviews.view",
              },
            ],
          },
        ],
      },
    },
  });

  try {
    const response = await adminAuthApi.listStaffRoles();
    assert.equal(response.totalItems, 1);
    assert.equal(response.items[0]?.id, "7");
    assert.equal(response.items[0]?.assignmentCount, 2);
    assert.deepEqual(
      response.items[0]?.permissions?.map((permission) => permission.key),
      ["dashboard.view", "reviews.view"]
    );
  } finally {
    client.get = originalGet;
  }
});

test("listStaffPermissions normalizes the backend permission catalog envelope", async () => {
  const originalGet = client.get;
  client.get = async () => ({
    data: {
      success: true,
      data: {
        items: [
          {
            id: 10,
            key: "settings.view",
            module_key: "settings",
            action_key: "view",
            label: "settings.view",
          },
          {
            id: 11,
            key: "social_links.edit",
            moduleKey: "social_links",
            actionKey: "edit",
            label: "social_links.edit",
          },
        ],
      },
    },
  });

  try {
    const response = await adminAuthApi.listStaffPermissions();
    assert.deepEqual(
      response.items.map((permission) => permission.key),
      ["settings.view", "social_links.edit"]
    );
    assert.deepEqual(response.items.map((permission) => permission.moduleKey), [
      "settings",
      "social_links",
    ]);
  } finally {
    client.get = originalGet;
  }
});
