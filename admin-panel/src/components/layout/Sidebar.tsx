"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  Bell,
  Boxes,
  CalendarDays,
  CreditCard,
  Gem,
  Globe,
  LayoutDashboard,
  MonitorSmartphone,
  ShieldCheck,
  ShoppingBag,
  TicketPercent,
  Users,
  Wallet,
} from "lucide-react";
import { useAdminAuth } from "@/features/admin-auth/AdminAuthProvider";
import type { AdminNavigationLink, AdminNavigationModule } from "@/features/admin-auth/types";
import { cn } from "@/lib/cn";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

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

const moduleIcons = {
  dashboards: LayoutDashboard,
  inventory: Boxes,
  crm: Users,
  calendar: CalendarDays,
  pos: MonitorSmartphone,
  invoices: CreditCard,
  purchases: Wallet,
  website: Globe,
  "promo-codes": TicketPercent,
  team: ShieldCheck,
  "loyalty-program": Gem,
  system: Bell,
} as const;

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

export const getActiveSidebarHref = (pathname: string, links: Array<Pick<AdminNavigationLink, "href">>) => {
  const normalizedPath = normalizePathname(pathname);

  return (
    links
      .map((link) => getSidebarLinkHref(link))
      .filter((href) => {
        const normalizedHref = normalizePathname(href);
        return normalizedPath === normalizedHref || (normalizedHref !== "/" && normalizedPath.startsWith(`${normalizedHref}/`));
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
      window.sessionStorage.setItem(SIDEBAR_SCROLL_STORAGE_KEY, String(navElement.scrollTop));
    };

    navElement.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      navElement.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <aside
      className={`sticky top-0 hidden h-screen w-72 shrink-0 px-4 py-4 md:block ${
        direction === "rtl" ? "border-l border-white/10" : "border-r border-white/10"
      }`}
    >
      <Link
        href="/"
        className="group mb-4 flex items-center gap-3 rounded-3xl border border-white/10 bg-white/6 px-5 py-4 shadow-[0_18px_40px_rgba(2,6,23,0.36)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/8"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/30 bg-[linear-gradient(135deg,rgba(6,182,212,0.2),rgba(168,85,247,0.22))] shadow-[0_0_24px_rgba(56,189,248,0.22)]">
          <ShoppingBag className="h-5 w-5 text-cyan-100" />
        </div>
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200/70">Control Center</p>
          <p className="text-lg font-semibold tracking-[-0.03em] text-slate-50">{t("app.name")}</p>
        </div>
      </Link>
      <nav
        ref={navRef}
        className="admin-scrollbar h-[calc(100vh-7rem)] overflow-y-auto rounded-[2rem] border border-white/8 bg-white/[0.04] px-3 py-4 backdrop-blur-xl"
      >
        {modules.map((moduleItem) => (
          <div key={moduleItem.moduleId} className="mb-5">
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {moduleItem.label}
            </p>
            <div>
              {moduleItem.links.map((link) => {
                const linkHref = getSidebarLinkHref(link);
                const isActive = activeHref === linkHref;
                const Icon = moduleIcons[moduleItem.moduleId as keyof typeof moduleIcons] ?? LayoutDashboard;

                return (
                  <Link
                    key={link.id}
                    href={linkHref}
                    className={cn(
                      "relative mb-1.5 flex items-center gap-3 overflow-hidden rounded-2xl border px-3 py-3 text-sm font-medium tracking-[-0.02em] transition-all duration-300",
                      isActive
                        ? cn(
                            "border-cyan-300/20 bg-[linear-gradient(135deg,rgba(34,211,238,0.16),rgba(59,130,246,0.12),rgba(168,85,247,0.14))] text-slate-50 shadow-[0_12px_30px_rgba(2,6,23,0.3),0_0_28px_rgba(56,189,248,0.12)] before:absolute before:inset-y-3 before:w-0.5 before:rounded-full before:bg-cyan-300 before:content-['']",
                            direction === "rtl" ? "before:right-1.5" : "before:left-1.5"
                          )
                        : "border-transparent text-slate-300 hover:-translate-y-0.5 hover:border-white/10 hover:bg-white/7 hover:text-white"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-xl border text-slate-400 transition-all",
                        isActive ? "border-cyan-300/20 bg-cyan-400/12 text-cyan-100" : "border-white/10 bg-white/6"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="truncate">{getSidebarLinkLabel(link)}</span>
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
