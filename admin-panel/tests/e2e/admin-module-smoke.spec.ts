import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers/auth";
import { installMockAdminApi } from "./helpers/mockAdminApi";

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const pages = [
  { path: "/dashboard", heading: "Dashboard Overview" },
  { path: "/admin/orders", heading: "Orders" },
  { path: "/admin/products", heading: "Products" },
  { path: "/categories", heading: "Categories" },
  { path: "/admin/users", heading: "Users" },
  { path: "/admin/loyalty", heading: "Loyalty Overview" },
  { path: "/admin/notifications", heading: "Notifications" },
  { path: "/admin/team", heading: "Team" },
  { path: "/admin/pos", heading: "POS Terminal" },
] as const;

test("full-access admin smoke-loads the main admin modules", async ({ page }) => {
  await installMockAdminApi(page, {
    loginEmail: "owner@test.com",
    loginPassword: "123456",
    profile: {
      id: "user-owner",
      email: "owner@test.com",
      firstName: "Owner",
      lastName: "Admin",
      legacyRole: "ADMIN",
      isStaffAccount: true,
      mustChangePassword: false,
      staffAccountStatus: "ACTIVE",
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
        "leads.view",
        "team.view",
        "team.create",
        "team.edit",
        "team.manage_roles",
        "calendar.view",
        "notifications.view",
        "notifications.preferences",
        "loyalty.view",
        "reviews.view",
        "homepage.view",
        "homepage.edit",
        "homepage.publish",
        "terms.view",
        "terms.edit",
        "privacy.view",
        "privacy.edit",
        "pos.view",
        "purchases.view",
        "promo_codes.view",
        "invoices.view",
      ],
      employee: null,
    },
  });

  await loginAs(page, "owner@test.com", "123456");

  for (const entry of pages) {
    await test.step(entry.path, async () => {
      await page.goto(entry.path);
      await expect(page).toHaveURL(entry.path);
      await expect(
        page.getByRole("heading", { name: new RegExp(`^${escapeRegExp(entry.heading)}$`) })
      ).toBeVisible();
    });
  }
});
