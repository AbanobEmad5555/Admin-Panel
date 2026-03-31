"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useAdminAuth } from "@/features/admin-auth/AdminAuthProvider";
import { useLocalization } from "@/modules/localization/LocalizationProvider";
import type { AdminNavigationLink, AdminNavigationModule } from "@/features/admin-auth/types";

const SIDEBAR_SCROLL_STORAGE_KEY = "admin-sidebar-scroll-top";

const MODULE_DISPLAY_ORDER = [
  "dashboards",
  "inventory",
  "crm",
  "calendar",
  "pos",
  "invoices",
  "purchases",
  "website",
  "promo-codes",
  "team",
  "loyalty-program",
  "system",
] as const;

const LINK_DISPLAY_ORDER: Record<string, string[]> = {
  dashboards: ["/dashboard", "/admin/sales"],
  inventory: ["/admin/products", "/categories", "/variants"],
  crm: ["/admin/orders", "/admin/crm/pipeline", "/admin/crm/leads", "/admin/users"],
  calendar: ["/calendar"],
  pos: ["/admin/pos", "/admin/pos/daily-report", "/admin/pos/session-report", "/admin/pos/top-products"],
  invoices: ["/admin/invoices"],
  purchases: ["/purchases/summary", "/purchases", "/purchases/costs", "/purchases/operational-costs"],
  website: [
    "/admin/homepage-control",
    "/admin/faqs",
    "/admin/footer-settings",
    "/admin/social-links",
    "/admin/ratings",
    "/admin/terms-conditions",
    "/admin/privacy-policy",
  ],
  "promo-codes": ["/admin/promo-codes"],
  team: ["/admin/team", "/admin/team/roles"],
  "loyalty-program": ["/admin/loyalty", "/admin/loyalty/settings", "/admin/loyalty/users"],
  system: ["/admin/notifications", "/admin/notification-preferences", "/admin/settings/localization"],
};

const LINK_PRESENTATION_OVERRIDES: Record<
  string,
  {
    href?: string;
    label?: string;
  }
> = {
  "/admin/team/employees": {
    href: "/admin/team",
    label: "Team",
  },
};

const getModuleOrder = (moduleId: string) => {
  const index = MODULE_DISPLAY_ORDER.indexOf(moduleId as (typeof MODULE_DISPLAY_ORDER)[number]);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
};

const sortLinks = (moduleId: string, links: AdminNavigationLink[]) => {
  const preferredOrder = LINK_DISPLAY_ORDER[moduleId] ?? [];
  return [...links].sort((left, right) => {
    const leftHref = getSidebarLinkHref(left);
    const rightHref = getSidebarLinkHref(right);
    const leftIndex = preferredOrder.indexOf(leftHref);
    const rightIndex = preferredOrder.indexOf(rightHref);

    if (leftIndex !== -1 || rightIndex !== -1) {
      if (leftIndex === -1) {
        return 1;
      }
      if (rightIndex === -1) {
        return -1;
      }
      return leftIndex - rightIndex;
    }

    if (left.position !== right.position) {
      return left.position - right.position;
    }

    return getSidebarLinkLabel(left).localeCompare(getSidebarLinkLabel(right));
  });
};

const sortModules = (modules: AdminNavigationModule[]) =>
  [...modules].sort((left, right) => {
    const leftOrder = getModuleOrder(left.moduleId);
    const rightOrder = getModuleOrder(right.moduleId);

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    if (left.position !== right.position) {
      return left.position - right.position;
    }

    return left.label.localeCompare(right.label);
  });

const normalizePathname = (value: string) => {
  if (!value || value === "/") {
    return value || "/";
  }
  return value.endsWith("/") ? value.slice(0, -1) : value;
};

export const getActiveSidebarHref = (
  pathname: string,
  links: Array<Pick<AdminNavigationLink, "href">>
) => {
  const normalizedPath = normalizePathname(pathname);

  return (
    links
      .map((link) => getSidebarLinkHref(link))
      .filter((href) => {
        const normalizedHref = normalizePathname(href);
        return (
          normalizedPath === normalizedHref ||
          (normalizedHref !== "/" && normalizedPath.startsWith(`${normalizedHref}/`))
        );
      })
      .sort((left, right) => normalizePathname(right).length - normalizePathname(left).length)[0] ?? null
  );
};

export const getSidebarLinkHref = (link: Pick<AdminNavigationLink, "href">) =>
  LINK_PRESENTATION_OVERRIDES[link.href]?.href ?? link.href;

export const getSidebarLinkLabel = (link: Pick<AdminNavigationLink, "href" | "label">) =>
  LINK_PRESENTATION_OVERRIDES[link.href]?.label ?? link.label;

export const getSortedSidebarModules = (modules: AdminNavigationModule[]) =>
  sortModules(
    modules
      .filter((moduleItem) => moduleItem.isVisible)
      .map((moduleItem) => ({
        ...moduleItem,
        links: sortLinks(
          moduleItem.moduleId,
          moduleItem.links.filter((link) => link.isAccessible)
        ),
      }))
      .filter((moduleItem) => moduleItem.links.length > 0)
  );

export default function Sidebar() {
  const pathname = usePathname();
  const { direction, t } = useLocalization();
  const { profile } = useAdminAuth();
  const navRef = useRef<HTMLElement | null>(null);

  const modules = getSortedSidebarModules(profile?.navigation?.modules ?? []);
  const activeHref = getActiveSidebarHref(
    pathname,
    modules.flatMap((moduleItem) => moduleItem.links)
  );

  useEffect(() => {
    const navElement = navRef.current;
    if (!navElement || typeof window === "undefined") {
      return;
    }

    const storedValue = window.sessionStorage.getItem(SIDEBAR_SCROLL_STORAGE_KEY);
    if (!storedValue) {
      return;
    }

    const scrollTop = Number(storedValue);
    if (Number.isFinite(scrollTop)) {
      navElement.scrollTop = scrollTop;
    }
  }, [pathname]);

  useEffect(() => {
    const navElement = navRef.current;
    if (!navElement || typeof window === "undefined") {
      return;
    }

    const handleScroll = () => {
      window.sessionStorage.setItem(
        SIDEBAR_SCROLL_STORAGE_KEY,
        String(navElement.scrollTop)
      );
    };

    navElement.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      navElement.removeEventListener("scroll", handleScroll);
    };
  }, []);

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
      <nav ref={navRef} className="h-[calc(100vh-4rem)] overflow-y-auto px-3 pb-4">
        {modules.map((moduleItem) => (
          <div key={moduleItem.moduleId} className="mb-5">
            <p className="mb-2 px-3 text-base font-extrabold uppercase tracking-wide text-slate-800">
              {moduleItem.label}
            </p>
            <div>
              {moduleItem.links.map((link) => {
                const linkHref = getSidebarLinkHref(link);
                const isActive = activeHref === linkHref;
                return (
                  <Link
                    key={link.id}
                    href={linkHref}
                    className={`mb-1 flex items-center rounded-md px-3 py-2.5 text-[15px] font-medium leading-6 transition ${
                      isActive
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    {getSidebarLinkLabel(link)}
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
