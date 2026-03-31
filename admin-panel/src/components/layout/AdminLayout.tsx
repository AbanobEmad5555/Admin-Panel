"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { canAccessPath } from "@/features/admin-auth/permissions";
import { useAuth } from "@/hooks/useAuth";
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
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-4 text-sm text-slate-600 shadow-sm">
          Loading admin session...
        </div>
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100" dir={direction}>
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-4 text-sm text-slate-600 shadow-sm">
          Redirecting...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100" dir={direction}>
      <div className="flex">
        <Sidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <Header />
          <main className={`flex-1 p-6 ${direction === "rtl" ? "text-right" : ""}`}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
