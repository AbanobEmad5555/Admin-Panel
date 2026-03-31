import assert from "node:assert/strict";
import test from "node:test";
import {
  getActiveSidebarHref,
  getSidebarLinkHref,
  getSidebarLinkLabel,
  getSortedSidebarModules,
} from "@/components/layout/Sidebar";
import type { AdminNavigationModule } from "@/features/admin-auth/types";

const modules: AdminNavigationModule[] = [
  {
    moduleId: "website",
    label: "Website",
    position: 8,
    isVisible: true,
    entry: "/admin/homepage-control",
    permissionKeys: ["homepage.view"],
    links: [
      {
        id: "website-ratings",
        label: "Ratings",
        href: "/admin/ratings",
        moduleId: "website",
        position: 5,
        requiredPermissions: ["reviews.view"],
        accessMode: "any",
        isEntry: false,
        isAccessible: true,
      },
      {
        id: "website-homepage",
        label: "Homepage",
        href: "/admin/homepage-control",
        moduleId: "website",
        position: 1,
        requiredPermissions: ["homepage.view"],
        accessMode: "any",
        isEntry: true,
        isAccessible: true,
      },
    ],
  },
  {
    moduleId: "team",
    label: "Team",
    position: 10,
    isVisible: true,
    entry: "/admin/team/employees",
    permissionKeys: ["team.view"],
    links: [
      {
        id: "team-roles",
        label: "Staff Roles",
        href: "/admin/team/roles",
        moduleId: "team",
        position: 2,
        requiredPermissions: ["team.manage_roles"],
        accessMode: "any",
        isEntry: false,
        isAccessible: true,
      },
      {
        id: "team-employees",
        label: "Employees",
        href: "/admin/team/employees",
        moduleId: "team",
        position: 1,
        requiredPermissions: ["team.view"],
        accessMode: "any",
        isEntry: true,
        isAccessible: true,
      },
    ],
  },
  {
    moduleId: "crm",
    label: "CRM",
    position: 3,
    isVisible: true,
    entry: "/admin/crm/pipeline",
    permissionKeys: ["orders.view"],
    links: [
      {
        id: "crm-leads",
        label: "Leads",
        href: "/admin/crm/leads",
        moduleId: "crm",
        position: 2,
        requiredPermissions: ["leads.view"],
        accessMode: "any",
        isEntry: false,
        isAccessible: true,
      },
      {
        id: "crm-orders",
        label: "Orders",
        href: "/admin/orders",
        moduleId: "crm",
        position: 1,
        requiredPermissions: ["orders.view"],
        accessMode: "any",
        isEntry: false,
        isAccessible: true,
      },
      {
        id: "crm-users",
        label: "Customers",
        href: "/admin/users",
        moduleId: "crm",
        position: 4,
        requiredPermissions: ["customers.view"],
        accessMode: "any",
        isEntry: false,
        isAccessible: false,
      },
      {
        id: "crm-pipeline",
        label: "Pipeline",
        href: "/admin/crm/pipeline",
        moduleId: "crm",
        position: 3,
        requiredPermissions: ["orders.view"],
        accessMode: "any",
        isEntry: true,
        isAccessible: true,
      },
    ],
  },
];

test("sidebar keeps frontend presentation order while filtering inaccessible links", () => {
  const sorted = getSortedSidebarModules(modules);

  assert.deepEqual(
    sorted.map((moduleItem) => moduleItem.moduleId),
    ["crm", "website", "team"]
  );

  assert.deepEqual(
    sorted.find((moduleItem) => moduleItem.moduleId === "crm")?.links.map((link) => link.href),
    ["/admin/orders", "/admin/crm/pipeline", "/admin/crm/leads"]
  );
});

test("team employees alias is rendered as Team with canonical team href", () => {
  const teamLink = modules[1].links[1];

  assert.equal(getSidebarLinkHref(teamLink), "/admin/team");
  assert.equal(getSidebarLinkLabel(teamLink), "Team");
});

test("sidebar marks only the most specific purchases route as active", () => {
  const activeHref = getActiveSidebarHref("/purchases/costs", [
    {
      id: "purchases-summary",
      label: "Purchases Summary",
      href: "/purchases/summary",
      moduleId: "purchases",
      position: 1,
      requiredPermissions: ["purchases.view"],
      accessMode: "any",
      isEntry: true,
      isAccessible: true,
    },
    {
      id: "purchases-list",
      label: "Purchases",
      href: "/purchases",
      moduleId: "purchases",
      position: 2,
      requiredPermissions: ["purchases.view"],
      accessMode: "any",
      isEntry: false,
      isAccessible: true,
    },
    {
      id: "purchases-costs",
      label: "Operational Costs",
      href: "/purchases/costs",
      moduleId: "purchases",
      position: 3,
      requiredPermissions: ["purchases.view"],
      accessMode: "any",
      isEntry: false,
      isAccessible: true,
    },
  ]);

  assert.equal(activeHref, "/purchases/costs");
});
