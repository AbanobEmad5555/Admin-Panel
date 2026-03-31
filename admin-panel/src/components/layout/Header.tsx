"use client";

import { LogOut, Sparkles } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import {
  getActiveSidebarHref,
  getSidebarLinkHref,
  getSidebarLinkLabel,
  getSortedSidebarModules,
} from "@/components/layout/Sidebar";
import { useAdminAuth } from "@/features/admin-auth/AdminAuthProvider";
import { clearAdminToken } from "@/lib/auth";
import LanguageSwitcher from "@/modules/localization/components/LanguageSwitcher";
import { useLocalization } from "@/modules/localization/LocalizationProvider";
import NotificationBell from "@/modules/notifications/components/NotificationBell";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLocalization();
  const { profile, hasPermission } = useAdminAuth();
  const modules = getSortedSidebarModules(profile?.navigation?.modules ?? []);
  const activeHref = getActiveSidebarHref(pathname, modules.flatMap((moduleItem) => moduleItem.links));
  const activeModule = modules.find((moduleItem) =>
    moduleItem.links.some((link) => getSidebarLinkHref(link) === activeHref)
  );
  const activeLink = activeModule?.links.find((link) => getSidebarLinkHref(link) === activeHref);

  const handleSignOut = () => {
    clearAdminToken();
    router.replace("/login");
  };

  return (
    <header className="sticky top-0 z-40 px-4 pt-4 sm:px-6 lg:px-8">
      <div className="flex min-h-16 items-center justify-between gap-4 rounded-3xl border border-white/10 bg-[rgba(15,23,42,0.72)] px-5 py-3 shadow-[0_18px_40px_rgba(2,6,23,0.38)] backdrop-blur-2xl">
        <div className="min-w-0 space-y-1">
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200/80">
            <Sparkles className="h-3.5 w-3.5" />
            {activeModule?.label ?? t("header.admin")}
          </div>
          <div className="truncate text-sm font-medium text-slate-200">
            {activeLink ? getSidebarLinkLabel(activeLink) : t("header.admin")}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          {hasPermission(["notifications.view", "notifications.preferences"]) ? <NotificationBell /> : null}
          <LanguageSwitcher />
          <div className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-slate-300">
            {profile?.staffRole?.name ? `${profile.staffRole.name} | ${profile.email}` : profile?.email || t("header.signedInAsAdmin")}
          </div>
          <Button type="button" variant="secondary" size="sm" className="gap-2" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            {t("header.signOut")}
          </Button>
        </div>
      </div>
    </header>
  );
}
