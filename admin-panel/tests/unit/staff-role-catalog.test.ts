import assert from "node:assert/strict";
import test from "node:test";
import { groupPermissionsByModule, resolvePermissionCatalog } from "@/features/staff-roles/permissionCatalog";

test("permission catalog renders only the backend-provided permission universe", () => {
  const catalog = resolvePermissionCatalog([
    {
      id: "settings-view",
      key: "settings.view",
      moduleKey: "settings",
      actionKey: "view",
      label: "settings.view",
    },
    {
      id: "orders-edit",
      key: "orders.edit",
      moduleKey: "orders",
      actionKey: "edit",
      label: "orders.edit",
    },
  ]);

  assert.deepEqual(
    catalog.map((permission) => permission.key),
    ["orders.edit", "settings.view"]
  );
});

test("permission catalog groups records by module key", () => {
  const grouped = groupPermissionsByModule([
    {
      id: "dashboard-view",
      key: "dashboard.view",
      moduleKey: "dashboard",
      actionKey: "view",
      label: "dashboard.view",
    },
    {
      id: "team-edit",
      key: "team.edit",
      moduleKey: "team",
      actionKey: "edit",
      label: "team.edit",
    },
    {
      id: "team-view",
      key: "team.view",
      moduleKey: "team",
      actionKey: "view",
      label: "team.view",
    },
  ]);

  assert.deepEqual(Object.keys(grouped).sort(), ["dashboard", "team"]);
  assert.deepEqual(
    grouped.team?.map((permission) => permission.key).sort(),
    ["team.edit", "team.view"]
  );
});
