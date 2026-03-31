import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers/auth";
import { fieldByLabel } from "./helpers/form";
import { installMockAdminApi } from "./helpers/mockAdminApi";

test("admin can create an employee with a linked login account", async ({ page }) => {
  const mockApi = await installMockAdminApi(page, {
    loginEmail: "owner@test.com",
    loginPassword: "123456",
    duplicateEmployeeEmails: ["duplicate@test.com"],
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

  await page.goto("/admin/team");
  await page.getByRole("button", { name: "Add Employee" }).click();

  await fieldByLabel(page, "Full Name (English)").fill("Mina Atef");
  await fieldByLabel(page, "Salary").fill("15000");
  await fieldByLabel(page, "Email").fill("mina.employee@test.com");
  await fieldByLabel(page, "Login email").fill("mina.login@test.com");
  await fieldByLabel(page, "Staff role").selectOption("role-owner");
  await fieldByLabel(page, "Staff account status").selectOption("ACTIVE");
  await page.getByRole("button", { name: "Create Employee" }).click();

  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(mockApi.requests.createdEmployees).toHaveLength(1);
  expect(mockApi.requests.createdEmployees[0]).toMatchObject({
    fullNameEn: "Mina Atef",
    salary: 15000,
    email: "mina.employee@test.com",
    account: {
      createLogin: true,
      email: "mina.login@test.com",
      roleId: "role-owner",
      staffAccountStatus: "ACTIVE",
    },
  });
});

test("duplicate linked login email failure is surfaced cleanly in the employee creation flow", async ({
  page,
}) => {
  await installMockAdminApi(page, {
    loginEmail: "owner@test.com",
    loginPassword: "123456",
    duplicateEmployeeEmails: ["duplicate@test.com"],
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

  await page.goto("/admin/team");
  await page.getByRole("button", { name: "Add Employee" }).click();

  await fieldByLabel(page, "Full Name (English)").fill("Duplicate Email");
  await fieldByLabel(page, "Salary").fill("12000");
  await fieldByLabel(page, "Email").fill("duplicate-employee@test.com");
  await fieldByLabel(page, "Login email").fill("duplicate@test.com");
  await fieldByLabel(page, "Staff role").selectOption("role-owner");
  await page.getByRole("button", { name: "Create Employee" }).click();

  await expect(page.getByText("Conflict while creating employee.")).toBeVisible();
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("legacy employee creation still works when no linked login account is requested", async ({
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
  await page.goto("/admin/team");
  await page.getByRole("button", { name: "Add Employee" }).click();

  await fieldByLabel(page, "Full Name (English)").fill("Legacy Hire");
  await fieldByLabel(page, "Salary").fill("9500");
  await fieldByLabel(page, "Email").fill("legacy.hire@test.com");
  await page.getByRole("checkbox", { name: "Create or enable a login account for this employee" }).uncheck();
  await page.getByRole("button", { name: "Create Employee" }).click();

  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(mockApi.requests.createdEmployees).toHaveLength(1);
  expect(mockApi.requests.createdEmployees[0]).toMatchObject({
    fullNameEn: "Legacy Hire",
    salary: 9500,
    email: "legacy.hire@test.com",
  });
  expect(
    (mockApi.requests.createdEmployees[0] as { account?: unknown }).account
  ).toBeUndefined();
});

test("employee edit updates linked role, login email, and auth status without changing employee status", async ({
  page,
}) => {
  const mockApi = await installMockAdminApi(page, {
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
    ],
    employees: [
      {
        id: "employee-1",
        employeeCode: "EMP-001",
        fullNameEn: "Mina Atef",
        fullName: "Mina Atef",
        role: "EMPLOYEE",
        status: "VACATION",
        salary: 15000,
        currency: "EGP",
        email: "mina.employee@test.com",
        phone: "+201000000001",
        employmentType: "FULL_TIME",
        department: "Operations",
        departmentEn: "Operations",
        shiftStart: "09:00",
        shiftEnd: "17:00",
        hireDate: "2026-01-15",
        workingDays: ["SUN", "MON", "TUE", "WED", "THU"],
        authAccount: {
          userId: "user-employee-1",
          email: "mina.login@test.com",
          phone: "+201000000001",
          staffAccountStatus: "SUSPENDED",
          mustChangePassword: false,
          role: {
            id: "role-manager",
            code: "MANAGER",
            name: "Manager",
            legacyUserRole: "ADMIN",
            isSystem: true,
          },
        },
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
  await page.goto("/admin/team");

  const employeeRow = page.locator("tr", { hasText: "Mina Atef" });
  await expect(employeeRow).toContainText("VACATION");
  await expect(employeeRow).toContainText("SUSPENDED");

  await page.getByRole("button", { name: "Edit Mina Atef" }).click();
  await fieldByLabel(page, "Login email").fill("mina.updated@test.com");
  await fieldByLabel(page, "Staff role").selectOption("role-owner");
  await fieldByLabel(page, "Staff account status").selectOption("ACTIVE");
  await page.getByRole("button", { name: "Save Changes" }).click();

  await expect(page.getByText("Employee updated.")).toBeVisible();
  expect(mockApi.requests.updatedEmployees).toHaveLength(1);
  expect(mockApi.requests.updatedEmployees[0]).toMatchObject({
    employeeId: "employee-1",
  });
  expect(mockApi.requests.updatedEmployees[0].payload).toMatchObject({
    account: {
      email: "mina.updated@test.com",
      staffAccountStatus: "ACTIVE",
    },
  });
  expect(mockApi.requests.assignedStaffRoles).toHaveLength(1);
  expect(mockApi.requests.assignedStaffRoles[0]).toMatchObject({
    userId: "user-employee-1",
    payload: {
      roleId: "role-owner",
    },
  });

  await expect(employeeRow).toContainText("VACATION");
  await expect(employeeRow).toContainText("ACTIVE");
  await expect(employeeRow).toContainText("mina.updated@test.com");
});
