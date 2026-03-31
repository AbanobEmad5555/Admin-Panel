import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers/auth";
import { fieldByLabel } from "./helpers/form";
import { installMockAdminApi } from "./helpers/mockAdminApi";

test("restricted user does not see roles nav and is redirected away from the roles route", async ({
  page,
}) => {
  await installMockAdminApi(page, {
    loginEmail: "manager@test.com",
    loginPassword: "123456",
    profile: {
      id: "user-manager",
      email: "manager@test.com",
      firstName: "Manager",
      lastName: "User",
      legacyRole: "ADMIN",
      isStaffAccount: true,
      mustChangePassword: false,
      staffAccountStatus: "ACTIVE",
      staffRole: {
        id: "role-manager",
        code: "MANAGER",
        name: "Manager",
        isSystem: true,
        legacyUserRole: "ADMIN",
      },
      permissions: ["dashboard.view", "team.view", "calendar.view"],
      employee: null,
    },
  });

  await loginAs(page, "manager@test.com", "123456");

  await page.goto("/admin/team");
  await expect(page.getByRole("link", { name: "Staff Roles" })).toHaveCount(0);

  await page.goto("/admin/team/roles");
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: "Admin Modules" })).toBeVisible();
});

test("top-level user can create a custom role and assigned roles stay protected from deletion in the list", async ({
  page,
}) => {
  const mockApi = await installMockAdminApi(page, {
    loginEmail: "owner@test.com",
    loginPassword: "123456",
    duplicateEmployeeEmails: [],
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
  await expect(page).toHaveURL(/\/admin\/team\/roles$/);
  await expect(page.getByRole("heading", { name: "Staff Roles & Permissions" })).toBeVisible();

  const managerRow = page.locator("tr", { hasText: "Manager" });
  await expect(managerRow.getByRole("button")).toBeDisabled();

  await page.getByRole("button", { name: "Create custom role" }).click();
  await fieldByLabel(page, "Role name").fill("Content Auditor");
  await fieldByLabel(page, "Description").fill("Reviews and approves content.");
  await fieldByLabel(page, "Legacy user role").selectOption("EMPLOYEE");
  await page.getByRole("checkbox", { name: "dashboard · view" }).check();
  await page.getByRole("checkbox", { name: "reviews · view" }).check();
  await page.getByRole("button", { name: "Create role" }).click();

  await expect(page).toHaveURL(/\/admin\/team\/roles\/role-custom-/);
  await expect(page.getByRole("heading", { name: "Content Auditor" })).toBeVisible();

  expect(mockApi.requests.createdRoles).toHaveLength(1);
  expect(mockApi.requests.createdRoles[0]).toMatchObject({
    name: "Content Auditor",
    legacyUserRole: "EMPLOYEE",
    permissionKeys: expect.arrayContaining(["dashboard.view", "reviews.view"]),
  });
});

test("system roles stay immutable in the role details UI and assigned custom roles stay deletion-blocked", async ({
  page,
}) => {
  await installMockAdminApi(page, {
    loginEmail: "owner@test.com",
    loginPassword: "123456",
    roles: [
      {
        id: "role-owner",
        code: "OWNER",
        name: "Owner",
        description: "Top-level owner role.",
        isSystem: true,
        legacyUserRole: "ADMIN",
        assignmentCount: 1,
        permissions: [
          {
            id: "team-manage-roles",
            key: "team.manage_roles",
            moduleKey: "team",
            actionKey: "manage_roles",
            label: "team · manage_roles",
          },
        ],
      },
      {
        id: "role-manager",
        code: "MANAGER",
        name: "Manager",
        description: "Operations manager.",
        isSystem: true,
        legacyUserRole: "ADMIN",
        assignmentCount: 3,
        permissions: [
          {
            id: "team-view",
            key: "team.view",
            moduleKey: "team",
            actionKey: "view",
            label: "team · view",
          },
        ],
      },
      {
        id: "role-assigned-custom",
        code: "CUSTOM_ASSIGNED",
        name: "Assigned Custom Role",
        description: "Assigned custom role.",
        isSystem: false,
        legacyUserRole: "EMPLOYEE",
        assignmentCount: 2,
        permissions: [
          {
            id: "dashboard-view",
            key: "dashboard.view",
            moduleKey: "dashboard",
            actionKey: "view",
            label: "dashboard · view",
          },
        ],
      },
    ],
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
  await page.goto("/admin/team/roles/role-manager");

  await expect(page.getByText("This is a system role. Its identity cannot be renamed or deleted in the UI.")).toBeVisible();
  await expect(fieldByLabel(page, "Role name")).toBeDisabled();
  await expect(fieldByLabel(page, "Legacy user role")).toBeDisabled();
  await expect(fieldByLabel(page, "Description")).toBeDisabled();

  await page.goto("/admin/team/roles");
  const assignedRoleRow = page.locator("tr", { hasText: "Assigned Custom Role" });
  const deleteButton = assignedRoleRow.getByRole("button");
  await expect(deleteButton).toBeDisabled();
  await expect(deleteButton).toHaveAttribute("title", "This role cannot be deleted from the UI.");
});

test("custom role metadata and permissions can be edited from the details page", async ({
  page,
}) => {
  const mockApi = await installMockAdminApi(page, {
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
      permissions: ["dashboard.view", "team.view", "team.create", "team.edit", "team.manage_roles"],
      employee: null,
    },
  });

  await loginAs(page, "owner@test.com", "123456");
  await page.goto("/admin/team/roles");

  await page.getByRole("button", { name: "Create custom role" }).click();
  await fieldByLabel(page, "Role name").fill("Content Auditor");
  await fieldByLabel(page, "Description").fill("Reviews and approves content.");
  await fieldByLabel(page, "Legacy user role").selectOption("EMPLOYEE");
  await page.locator("label", { hasText: "dashboard" }).first().click();
  await page.locator("label", { hasText: "reviews" }).first().click();
  await page.getByRole("button", { name: "Create role" }).click();

  await expect(page).toHaveURL(/\/admin\/team\/roles\/role-custom-/);

  await fieldByLabel(page, "Role name").fill("Content QA");
  await fieldByLabel(page, "Description").fill("Reviews, audits, and approves content.");
  await fieldByLabel(page, "Legacy user role").selectOption("MANAGER");
  await page.locator("label", { hasText: "notifications" }).first().click();
  await page.getByRole("button", { name: "Save changes" }).click();

  await expect(page.getByText("Role updated.")).toBeVisible();
  expect(mockApi.requests.updatedRoleMetadata).toHaveLength(1);
  expect(mockApi.requests.updatedRoleMetadata[0]).toMatchObject({
    payload: {
      name: "Content QA",
      description: "Reviews, audits, and approves content.",
      legacyUserRole: "MANAGER",
    },
  });
  expect(mockApi.requests.updatedRolePermissions).toHaveLength(1);
  expect(mockApi.requests.updatedRolePermissions[0].payload).toMatchObject({
    permissionKeys: expect.arrayContaining(["dashboard.view", "reviews.view", "notifications.view"]),
  });
});
