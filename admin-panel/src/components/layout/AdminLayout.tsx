"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { canAccessPath } from "@/features/admin-auth/permissions";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/cn";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

type AdminLayoutProps = {
  children: ReactNode;
  title?: string;
  requiredPermissions?: string[];
};

export default function AdminLayout({ children, title, requiredPermissions }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isBootstrapping, mustChangePassword, hasPermission, profile } = useAuth();
  const { direction } = useLocalization();
  const isAuthPending = isAuthenticated === null || isBootstrapping;
  const canAccess =
    requiredPermissions !== undefined ? hasPermission(requiredPermissions) : canAccessPath(profile, pathname);

  useEffect(() => {
    if (!title || typeof document === "undefined") {
      return;
    }

    document.title = title;
  }, [title]);

  useEffect(() => {
    if (isAuthenticated && mustChangePassword && pathname !== "/admin/change-password") {
      router.replace("/admin/change-password");
    }
  }, [isAuthenticated, mustChangePassword, pathname, router]);

  useEffect(() => {
    if (!isAuthPending && isAuthenticated && !canAccess) {
      router.replace(profile?.navigation?.defaultEntry ?? "/");
    }
  }, [canAccess, isAuthPending, isAuthenticated, profile?.navigation?.defaultEntry, router]);

  if (isAuthenticated === false) {
    return null;
  }

  if (isAuthPending) {
    return (
      <div className="admin-shell admin-theme flex min-h-screen items-center justify-center px-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-slate-300 shadow-[0_20px_50px_rgba(2,6,23,0.42)] backdrop-blur-xl">
          Loading admin session...
        </div>
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="admin-shell admin-theme flex min-h-screen items-center justify-center px-6" dir={direction}>
        <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-slate-300 shadow-[0_20px_50px_rgba(2,6,23,0.42)] backdrop-blur-xl">
          Redirecting...
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell admin-theme min-h-screen" dir={direction}>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="relative flex min-h-screen min-w-0 flex-1 flex-col">
          <Header />
          <main className={cn("flex-1 px-4 pb-8 pt-4 sm:px-6 lg:px-8", direction === "rtl" ? "text-right" : "")}>
            <div className="mx-auto w-full max-w-[1600px] space-y-6">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
