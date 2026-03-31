import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers/auth";
import { fieldByLabel } from "./helpers/form";
import { installMockAdminApi } from "./helpers/mockAdminApi";

test("restricted staff only gets allowed team access and blocked actions stay unavailable", async ({
  page,
}) => {
  await installMockAdminApi(page, {
    loginEmail: "viewer@test.com",
    loginPassword: "123456",
    profile: {
      id: "user-viewer",
      email: "viewer@test.com",
      firstName: "View",
      lastName: "Only",
      legacyRole: "ADMIN",
      isStaffAccount: true,
      mustChangePassword: false,
      staffAccountStatus: "ACTIVE",
      staffRole: {
        id: "role-viewer",
        code: "EMPLOYEE",
        name: "View Only",
        isSystem: false,
        legacyUserRole: "EMPLOYEE",
      },
      permissions: ["dashboard.view", "team.view"],
      employee: null,
    },
  });

  await loginAs(page, "viewer@test.com", "123456");
  await page.goto("/admin/team");

  await expect(page.getByRole("heading", { name: "Team" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Team" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Staff Roles" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Add Employee" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Edit Mina Atef" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Change status for Mina Atef" })).toBeDisabled();

  await page.goto("/admin/team/roles");
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: "Admin Modules" })).toBeVisible();
});

test("backend permission rejection is surfaced when the UI can open the flow but the contract denies the action", async ({
  page,
}) => {
  await installMockAdminApi(page, {
    loginEmail: "owner@test.com",
    loginPassword: "123456",
    failures: {
      createRole: {
        status: 403,
        message: "You do not have permission to create staff roles.",
      },
    },
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
      permissions: ["dashboard.view", "team.view", "team.create", "team.edit", "team.manage_roles"],
      employee: null,
    },
  });

  await loginAs(page, "owner@test.com", "123456");
  await page.goto("/admin/team/roles");

  await page.getByRole("button", { name: "Create custom role" }).click();
  await fieldByLabel(page, "Role name").fill("Blocked Role");
  await fieldByLabel(page, "Description").fill("Should be rejected.");
  await fieldByLabel(page, "Legacy user role").selectOption("EMPLOYEE");
  await page.locator("label", { hasText: "dashboard" }).first().click();
  await page.getByRole("button", { name: "Create role" }).click();

  await expect(page.getByText("You do not have permission to create staff roles.")).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/team\/roles$/);
});
