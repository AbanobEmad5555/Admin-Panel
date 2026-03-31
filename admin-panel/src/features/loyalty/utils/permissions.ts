"use client";

import { useMemo } from "react";
import type { LoyaltyPermission } from "@/features/loyalty/types";

const STORAGE_KEYS = ["admin_permissions", "permissions", "admin_profile", "admin_user"] as const;

const readPermissionsFromStorage = (): LoyaltyPermission[] => {
  if (typeof window === "undefined") return [];

  const modernPermissions = window.localStorage.getItem("admin_permissions");
  if (modernPermissions) {
    try {
      const parsed = JSON.parse(modernPermissions) as unknown;
      if (Array.isArray(parsed)) {
        const next: LoyaltyPermission[] = [];
        if (parsed.includes("loyalty.view")) {
          next.push("LOYALTY_VIEW");
        }
        if (parsed.includes("loyalty.adjust_points") || parsed.includes("loyalty.manage")) {
          next.push("LOYALTY_MANAGE");
        }
        if (next.length > 0) {
          return next;
        }
      }
    } catch {
      // fall through to legacy storage
    }
  }

  for (const key of STORAGE_KEYS) {
    const raw = window.localStorage.getItem(key);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (item): item is LoyaltyPermission => typeof item === "string" && item.startsWith("LOYALTY_")
        );
      }
      if (parsed && typeof parsed === "object") {
        const candidate = (parsed as { permissions?: unknown }).permissions;
        if (Array.isArray(candidate)) {
          return candidate.filter(
            (item): item is LoyaltyPermission => typeof item === "string" && item.startsWith("LOYALTY_")
          );
        }
      }
    } catch {
      continue;
    }
  }

  return [];
};

export const useLoyaltyPermissions = () =>
  useMemo(() => {
    const permissions = readPermissionsFromStorage();
    const hasExplicitPermissions = permissions.length > 0;
    const canView = hasExplicitPermissions ? permissions.includes("LOYALTY_VIEW") : true;
    const canManage = hasExplicitPermissions ? permissions.includes("LOYALTY_MANAGE") : true;

    return {
      canView,
      canManage,
      isReadOnly: canView && !canManage,
      permissions,
      hasExplicitPermissions,
    };
  }, []);
