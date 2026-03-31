"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { syncAdminTokenCookie } from "@/lib/auth";
import { useAdminAuth } from "@/features/admin-auth/AdminAuthProvider";

export const useAuth = () => {
  const router = useRouter();
  const {
    isAuthenticated,
    isBootstrapping,
    mustChangePassword,
    profile,
    permissions,
    legacyRole,
    isStaffAccount,
    refreshAuth,
    hasPermission,
  } = useAdminAuth();

  useEffect(() => {
    if (isAuthenticated === false) {
      router.replace("/login");
      return;
    }

    if (isAuthenticated === true) {
      syncAdminTokenCookie();
    }
  }, [isAuthenticated, router]);

  return {
    isAuthenticated,
    isBootstrapping,
    mustChangePassword,
    profile,
    permissions,
    legacyRole,
    isStaffAccount,
    refreshAuth,
    hasPermission,
  };
};
