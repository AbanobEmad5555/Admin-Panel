import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers/auth";
import { installMockAdminApi } from "./helpers/mockAdminApi";

const fullAccessProfile = {
  id: "user-owner",
  email: "owner@test.com",
  firstName: "Owner",
  lastName: "Admin",
  legacyRole: "ADMIN" as const,
  isStaffAccount: true,
  mustChangePassword: false,
  staffAccountStatus: "ACTIVE" as const,
  staffRole: {
    id: "role-owner",
    code: "OWNER",
    name: "Owner",
    isSystem: true,
    legacyUserRole: "ADMIN",
  },
  permissions: [
    "dashboard.view",
    "orders.view",
    "temp_orders.view",
    "products.view",
    "categories.view",
    "customers.view",
    "team.view",
    "team.create",
    "team.edit",
    "team.manage_roles",
    "calendar.view",
    "notifications.view",
    "notifications.preferences",
    "loyalty.view",
    "pos.view",
  ],
  employee: null,
};

test.describe("admin module smoke coverage", () => {
  test.beforeEach(async ({ page }) => {
    await installMockAdminApi(page, {
      loginEmail: "owner@test.com",
      loginPassword: "123456",
      profile: fullAccessProfile,
    });

    await loginAs(page, "owner@test.com", "123456");
  });

  const routes = [
    { path: "/", heading: "Admin Modules" },
    { path: "/dashboard", heading: "Dashboard Overview" },
    { path: "/admin/orders", heading: "Orders" },
    { path: "/admin/products", heading: "Products" },
    { path: "/categories", heading: "Categories" },
    { path: "/admin/users", heading: "Users" },
    { path: "/admin/loyalty", heading: "Loyalty Overview" },
    { path: "/admin/notifications", heading: "Notifications" },
    { path: "/admin/team", heading: "Team" },
    { path: "/admin/team/roles", heading: "Staff Roles & Permissions" },
    { path: "/calendar", heading: "Delivery Operations Calendar" },
    { path: "/admin/pos", heading: "POS Terminal" },
  ] as const;

  for (const route of routes) {
    test(`loads ${route.path}`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page).toHaveURL(route.path);
      await expect(page.getByRole("heading", { name: route.heading, exact: true })).toBeVisible();
    });
  }
});
