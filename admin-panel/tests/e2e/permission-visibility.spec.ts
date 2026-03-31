import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers/auth";
import { fieldByLabel } from "./helpers/form";
import { installMockAdminApi } from "./helpers/mockAdminApi";

const restrictedProfile = {
  id: "user-view-only",
  email: "viewer@test.com",
  firstName: "Viewer",
  lastName: "User",
  legacyRole: "ADMIN" as const,
  isStaffAccount: true,
  mustChangePassword: false,
  staffAccountStatus: "ACTIVE" as const,
  staffRole: {
    id: "role-employee",
    code: "EMPLOYEE",
    name: "Employee",
    isSystem: true,
    legacyUserRole: "EMPLOYEE",
  },
  permissions: ["dashboard.view", "team.view"],
  employee: null,
};

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
  permissions: ["dashboard.view", "team.view", "team.manage_roles"],
  employee: null,
};

test("restricted user sees only allowed modules, can open allowed routes, and is blocked from forbidden ones", async ({
  page,
}) => {
  await installMockAdminApi(page, {
    loginEmail: "viewer@test.com",
    loginPassword: "123456",
    profile: restrictedProfile,
  });

  await loginAs(page, "viewer@test.com", "123456");

  await expect(page.getByRole("heading", { name: "Admin Modules" })).toBeVisible();
  await expect(page.getByText("Dashboards", { exact: true })).toBeVisible();
  await expect(page.getByText("Team", { exact: true })).toBeVisible();
  await expect(page.getByText("CRM", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Calendar", { exact: true })).toHaveCount(0);

  await page.goto("/admin/team");
  await expect(page).toHaveURL(/\/admin\/team$/);
  await expect(page.getByRole("heading", { name: "Team" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add Employee" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Edit / })).toBeDisabled();
  await expect(page.getByRole("button", { name: /Change status for / })).toBeDisabled();

  await page.goto("/admin/team/roles");
  await expect(page).toHaveURL("/dashboard");
  await expect(page.getByText("Staff Roles & Permissions")).toHaveCount(0);
});

test("dashboard module cards respect backend moduleEntries and do not bounce through invalid routes", async ({
  page,
}) => {
  await installMockAdminApi(page, {
    loginEmail: "viewer@test.com",
    loginPassword: "123456",
    profile: {
      ...restrictedProfile,
      permissions: ["dashboard.view", "customers.view", "categories.view"],
      moduleEntries: {
        crm: null,
        inventory: "/categories",
      },
    },
  });

  await loginAs(page, "viewer@test.com", "123456");

  await expect(page.getByText("CRM", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Inventory", { exact: true })).toBeVisible();

  await page.getByText("Inventory", { exact: true }).click();
  await expect(page).toHaveURL("/categories");
  await expect(page.getByRole("heading", { name: "Categories" })).toBeVisible();
});

test("backend rejections are surfaced cleanly in the roles UI", async ({ page }) => {
  await installMockAdminApi(page, {
    loginEmail: "owner@test.com",
    loginPassword: "123456",
    profile: ownerProfile,
    failures: {
      createRole: {
        status: 403,
        message: "Forbidden: requires staff role OWNER",
      },
    },
  });

  await loginAs(page, "owner@test.com", "123456");
  await page.goto("/admin/team/roles");

  await page.getByRole("button", { name: "Create custom role" }).click();
  await fieldByLabel(page, "Role name").fill("Blocked Role");
  await fieldByLabel(page, "Legacy user role").selectOption("EMPLOYEE");
  await page.locator("label", { hasText: "dashboard" }).first().click();
  await page.getByRole("button", { name: "Create role" }).click();

  await expect(page.getByText("Forbidden: requires staff role OWNER")).toBeVisible();
  await expect(page.getByRole("dialog")).toBeVisible();
});
