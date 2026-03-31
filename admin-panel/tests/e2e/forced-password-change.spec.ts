import { expect, test } from "@playwright/test";
import { fieldByLabel } from "./helpers/form";
import { installMockAdminApi } from "./helpers/mockAdminApi";

test("newly provisioned staff user is forced to change password before opening normal admin pages", async ({
  page,
}) => {
  await installMockAdminApi(page, {
    loginEmail: "staff@test.com",
    loginPassword: "123456",
    profile: {
      id: "user-staff",
      email: "staff@test.com",
      firstName: "Staff",
      lastName: "User",
      legacyRole: "ADMIN",
      isStaffAccount: true,
      mustChangePassword: true,
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

  await page.goto("/login");
  await fieldByLabel(page, "Email").fill("staff@test.com");
  await fieldByLabel(page, "Password").fill("123456");
  await page.getByRole("button", { name: "Sign In" }).click();

  await expect(page).toHaveURL(/\/admin\/change-password$/);

  await page.goto("/admin/team");
  await expect(page).toHaveURL(/\/admin\/change-password$/);

  await fieldByLabel(page, "Current password").fill("123456");
  await fieldByLabel(page, "New password").fill("12345678");
  await fieldByLabel(page, "Confirm new password").fill("12345678");
  await page.getByRole("button", { name: "Update password" }).click();

  await expect(page).toHaveURL("/");

  await page.goto("/admin/team");
  await expect(page).toHaveURL(/\/admin\/team$/);
  await expect(page.getByRole("heading", { name: "Team" })).toBeVisible();
});
