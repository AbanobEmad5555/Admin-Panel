"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavSection = {
  module: string;
  items: { href: string; label: string }[];
};

const navSections: NavSection[] = [
  {
    module: "Dashboards",
    items: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/admin/sales", label: "Sales Dashboard" },
    ],
  },
  {
    module: "Inventory",
    items: [
      { href: "/admin/products", label: "Products" },
      { href: "/categories", label: "Categories" },
      { href: "/variants", label: "Variants" },
    ],
  },
  {
    module: "CRM",
    items: [
      { href: "/admin/orders", label: "Orders" },
      { href: "/admin/crm/pipeline", label: "CRM Pipeline" },
      { href: "/admin/crm/leads", label: "Leads" },
      { href: "/admin/crm/leads/pipeline", label: "Leads Pipeline" },
      { href: "/admin/users", label: "Users" },
    ],
  },
  {
    module: "Website",
    items: [
      { href: "/admin/homepage-control", label: "HomePage Control" },
      { href: "/admin/faqs", label: "FAQ Categories" },
      { href: "/admin/terms-conditions", label: "Terms & Conditions" },
      { href: "/admin/privacy-policy", label: "Privacy Policy" },
    ],
  },
  {
    module: "Promo Codes",
    items: [{ href: "/admin/promo-codes", label: "Promo Codes" }],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isRouteActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const getSectionByPath = () => {
    if (pathname === "/dashboard" || pathname.startsWith("/admin/sales")) {
      return "Dashboards";
    }

    if (
      pathname === "/products" ||
      pathname.startsWith("/products/") ||
      pathname === "/categories" ||
      pathname.startsWith("/categories/") ||
      pathname === "/variants" ||
      pathname.startsWith("/variants/") ||
      pathname === "/admin/products" ||
      pathname.startsWith("/admin/products/")
    ) {
      return "Inventory";
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
      return "CRM";
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
      return "Website";
    }

    if (
      pathname === "/admin/promo-codes" ||
      pathname.startsWith("/admin/promo-codes/")
    ) {
      return "Promo Codes";
    }

    return null;
  };

  const activeSection = getSectionByPath();
  const visibleSections = activeSection
    ? navSections.filter((section) => section.module === activeSection)
    : navSections;

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white md:block">
      <Link
        href="/"
        className="flex h-16 items-center px-6 text-lg font-semibold text-slate-900 transition hover:text-slate-700"
      >
        Admin Panel
      </Link>
      <nav className="h-[calc(100vh-4rem)] overflow-y-auto px-3 pb-4">
        {visibleSections.map((section) => (
          <div key={section.module} className="mb-5">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {section.module}
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
                    {item.label}
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
