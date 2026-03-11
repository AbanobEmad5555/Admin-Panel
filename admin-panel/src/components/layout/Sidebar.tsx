"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

type NavSection = {
  moduleKey: string;
  items: { href: string; labelKey: string }[];
};

const navSections: NavSection[] = [
  {
    moduleKey: "nav.dashboards",
    items: [
      { href: "/dashboard", labelKey: "nav.dashboard" },
      { href: "/admin/sales", labelKey: "nav.salesDashboard" },
    ],
  },
  {
    moduleKey: "nav.finance",
    items: [
      { href: "/admin/invoices", labelKey: "nav.invoices" },
    ],
  },
  {
    moduleKey: "nav.purchases",
    items: [
      { href: "/purchases", labelKey: "nav.purchases" },
      { href: "/purchases/costs", labelKey: "nav.operationalCosts" },
      { href: "/purchases/summary", labelKey: "nav.summary" },
    ],
  },
  {
    moduleKey: "nav.inventory",
    items: [
      { href: "/admin/products", labelKey: "nav.products" },
      { href: "/admin/ratings", labelKey: "nav.ratings" },
      { href: "/categories", labelKey: "nav.categories" },
      { href: "/variants", labelKey: "nav.variants" },
    ],
  },
  {
    moduleKey: "nav.crm",
    items: [
      { href: "/admin/orders", labelKey: "nav.orders" },
      { href: "/admin/crm/pipeline", labelKey: "nav.crmPipeline" },
      { href: "/admin/crm/leads", labelKey: "nav.leads" },
      { href: "/admin/users", labelKey: "nav.users" },
    ],
  },
  {
    moduleKey: "nav.adminPanel",
    items: [
      { href: "/calendar", labelKey: "nav.calendar" },
    ],
  },
  {
    moduleKey: "nav.team",
    items: [
      { href: "/admin/team", labelKey: "nav.team" },
    ],
  },
  {
    moduleKey: "nav.website",
    items: [
      { href: "/admin/homepage-control", labelKey: "nav.homepageControl" },
      { href: "/admin/faqs", labelKey: "nav.faqCategories" },
      { href: "/admin/terms-conditions", labelKey: "nav.termsConditions" },
      { href: "/admin/privacy-policy", labelKey: "nav.privacyPolicy" },
    ],
  },
  {
    moduleKey: "nav.promoCodes",
    items: [{ href: "/admin/promo-codes", labelKey: "nav.promoCodes" }],
  },
  {
    moduleKey: "nav.pos",
    items: [
      { href: "/admin/pos", labelKey: "nav.posTerminal" },
      { href: "/admin/pos/daily-report", labelKey: "nav.dailyReport" },
      { href: "/admin/pos/session-report", labelKey: "nav.sessionReport" },
      { href: "/admin/pos/top-products", labelKey: "nav.topProducts" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { direction, t } = useLocalization();

  const isRouteActive = (href: string) => {
    if (pathname === href) {
      return true;
    }
    if (!pathname.startsWith(`${href}/`)) {
      return false;
    }

    const hasMoreSpecificMatch = navSections.some((section) =>
      section.items.some(
        (item) =>
          item.href !== href &&
          item.href.startsWith(`${href}/`) &&
          (pathname === item.href || pathname.startsWith(`${item.href}/`))
      )
    );

    return !hasMoreSpecificMatch;
  };

  const getSectionByPath = () => {
    if (pathname === "/dashboard" || pathname.startsWith("/admin/sales")) {
      return "nav.dashboards";
    }

    if (pathname === "/admin/sales" || pathname.startsWith("/admin/sales/")) {
      return "nav.dashboards";
    }

    if (
      pathname === "/admin/invoices" ||
      pathname.startsWith("/admin/invoices/")
    ) {
      return "nav.finance";
    }

    if (
      pathname === "/purchases" ||
      pathname.startsWith("/purchases/")
    ) {
      return "nav.purchases";
    }

    if (
      pathname === "/products" ||
      pathname.startsWith("/products/") ||
      pathname === "/categories" ||
      pathname.startsWith("/categories/") ||
      pathname === "/variants" ||
      pathname.startsWith("/variants/") ||
      pathname === "/admin/products" ||
      pathname.startsWith("/admin/products/") ||
      pathname === "/admin/ratings" ||
      pathname.startsWith("/admin/ratings/")
    ) {
      return "nav.inventory";
    }

    if (
      pathname === "/calendar" ||
      pathname.startsWith("/calendar/")
    ) {
      return "nav.adminPanel";
    }

    if (
      pathname === "/admin/team" ||
      pathname.startsWith("/admin/team/")
    ) {
      return "nav.team";
    }

    if (
      pathname === "/users" ||
      pathname.startsWith("/users/") ||
      pathname === "/admin/users" ||
      pathname.startsWith("/admin/users/") ||
      pathname === "/orders" ||
      pathname.startsWith("/orders/") ||
      pathname === "/admin/orders" ||
      pathname.startsWith("/admin/orders/") ||
      pathname === "/admin/crm/pipeline" ||
      pathname.startsWith("/admin/crm/pipeline/") ||
      pathname === "/admin/crm/leads" ||
      pathname.startsWith("/admin/crm/leads/")
    ) {
      return "nav.crm";
    }

    if (
      pathname === "/admin/homepage-control" ||
      pathname.startsWith("/admin/homepage-control/") ||
      pathname === "/admin/faqs" ||
      pathname.startsWith("/admin/faqs/") ||
      pathname === "/admin/terms-conditions" ||
      pathname.startsWith("/admin/terms-conditions/") ||
      pathname === "/admin/privacy-policy" ||
      pathname.startsWith("/admin/privacy-policy/")
    ) {
      return "nav.website";
    }

    if (
      pathname === "/admin/promo-codes" ||
      pathname.startsWith("/admin/promo-codes/")
    ) {
      return "nav.promoCodes";
    }

    if (
      pathname === "/admin/pos" ||
      pathname.startsWith("/admin/pos/")
    ) {
      return "nav.pos";
    }

    return null;
  };

  const activeSection = getSectionByPath();
  const visibleSections = activeSection
    ? navSections.filter((section) => section.moduleKey === activeSection)
    : navSections;

  return (
    <aside
      className={`hidden w-64 shrink-0 bg-white md:block ${
        direction === "rtl" ? "border-l border-slate-200" : "border-r border-slate-200"
      }`}
    >
      <Link
        href="/"
        className="flex h-16 items-center px-6 text-lg font-semibold text-slate-900 transition hover:text-slate-700"
      >
        {t("app.name")}
      </Link>
      <nav className="h-[calc(100vh-4rem)] overflow-y-auto px-3 pb-4">
        {visibleSections.map((section) => (
          <div key={section.moduleKey} className="mb-5">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {t(section.moduleKey)}
            </p>
            <div>
              {section.items.map((item) => {
                const isActive = isRouteActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`mb-1 flex items-center rounded-md px-3 py-2 text-sm font-medium transition ${
                      isActive
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    {t(item.labelKey)}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
