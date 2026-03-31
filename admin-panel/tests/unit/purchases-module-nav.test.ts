import assert from "node:assert/strict";
import test from "node:test";
import type { AdminAuthMe } from "@/features/admin-auth/types";
import { getVisiblePurchasesTabs } from "@/components/purchases/PurchasesModuleNav";

const createProfile = (
  linkHrefs: string[],
  routePaths: string[]
): Pick<AdminAuthMe, "navigation" | "permissions"> => ({
  permissions: ["purchases.view"],
  navigation: {
    defaultEntry: "/purchases/summary",
    modules: [],
    links: linkHrefs.map((href, index) => ({
      id: `link-${index + 1}`,
      label: href,
      href,
      moduleId: "purchases",
      position: index + 1,
      requiredPermissions: ["purchases.view"],
      accessMode: "any",
      isEntry: href === "/purchases/summary",
      isAccessible: true,
    })),
    routes: routePaths.map((path) => ({
      path,
      moduleId: "purchases",
      requiredPermissions: ["purchases.view"],
      accessMode: "any",
      isAccessible: true,
    })),
  },
});

test("shows purchases tabs only when backend exposes them, in canonical order", () => {
  const profile = createProfile(
    ["/purchases/summary", "/purchases", "/purchases/costs"],
    ["/purchases", "/purchases/costs", "/purchases/summary"]
  );

  const tabs = getVisiblePurchasesTabs(profile).map((tab) => tab.href);

  assert.deepEqual(tabs, ["/purchases", "/purchases/costs", "/purchases/summary"]);
});

test("hides purchases tabs omitted from backend navigation", () => {
  const profile = createProfile(
    ["/purchases/summary"],
    ["/purchases/summary"]
  );

  const tabs = getVisiblePurchasesTabs(profile).map((tab) => tab.href);

  assert.deepEqual(tabs, ["/purchases/summary"]);
});

test("does not render tabs when backend link exists but route access is missing", () => {
  const profile = createProfile(
    ["/purchases", "/purchases/costs", "/purchases/summary"],
    ["/purchases/summary"]
  );

  const tabs = getVisiblePurchasesTabs(profile).map((tab) => tab.href);

  assert.deepEqual(tabs, ["/purchases/summary"]);
});
