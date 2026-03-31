import assert from "node:assert/strict";
import test from "node:test";
import {
  canAccessDashboardModule,
  hasPermission,
} from "@/features/admin-auth/permissions";

test("staff accounts do not get legacy ADMIN fallback when a permission is missing", () => {
  assert.equal(
    hasPermission(["team.view"], ["team.manage_roles"], "ADMIN", true),
    false
  );
});

test("legacy ADMIN fallback remains intact for non-staff compatibility consumers", () => {
  assert.equal(hasPermission([], ["team.manage_roles"], "ADMIN", false), true);
});

test("dashboard module access follows the mapped permission contract", () => {
  const auth = {
    permissions: ["dashboard.view", "team.view"],
    legacyRole: "ADMIN",
    isStaffAccount: true,
  };

  assert.equal(canAccessDashboardModule("dashboards", auth), true);
  assert.equal(canAccessDashboardModule("team", auth), true);
  assert.equal(canAccessDashboardModule("calendar", auth), false);
});

test("empty required-permission arrays are treated as unrestricted routes", () => {
  assert.equal(hasPermission(["dashboard.view"], [], "ADMIN", true), true);
});
