import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers/auth";
import { fieldByLabel } from "./helpers/form";
import { installMockAdminApi } from "./helpers/mockAdminApi";

const ownerProfile = {
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

test("login page loads normally", async ({ page }) => {
  await installMockAdminApi(page, {
    loginEmail: "owner@test.com",
    loginPassword: "123456",
    profile: ownerProfile,
  });

  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Admin Login" })).toBeVisible();
  await expect(fieldByLabel(page, "Email")).toBeVisible();
  await expect(fieldByLabel(page, "Password")).toBeVisible();
});

test("wrong password stays on the login page and surfaces the backend error inline", async ({
  page,
}) => {
  await installMockAdminApi(page, {
    loginEmail: "owner@test.com",
    loginPassword: "123456",
    profile: ownerProfile,
  });

  await page.goto("/login");
  await fieldByLabel(page, "Email").fill("owner@test.com");
  await fieldByLabel(page, "Password").fill("wrong-password");
  await page.getByRole("button", { name: "Sign In" }).click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText("Invalid email or password")).toBeVisible();
  await expect(fieldByLabel(page, "Password")).toHaveValue("wrong-password");
});

test("top-level login works and logout clears stale admin access", async ({ page }) => {
  await installMockAdminApi(page, {
    loginEmail: "owner@test.com",
    loginPassword: "123456",
    profile: ownerProfile,
  });

  await loginAs(page, "owner@test.com", "123456");

  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: "Admin Modules" })).toBeVisible();

  await page.goto("/admin/team");
  await expect(page.getByRole("heading", { name: "Team" })).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Admin Login" })).toBeVisible();

  await page.goto("/admin/team");
  await expect(page).toHaveURL(/\/login(?:\?.*redirect=.*)?$/);
});
