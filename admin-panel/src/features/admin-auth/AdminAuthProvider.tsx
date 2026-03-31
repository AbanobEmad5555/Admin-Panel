"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ADMIN_MUST_CHANGE_PASSWORD_COOKIE,
  ADMIN_PROFILE_STORAGE_KEY,
  ADMIN_TOKEN_EVENT,
  ADMIN_PERMISSIONS_STORAGE_KEY,
  clearAdminSessionMetadata,
  getAdminToken,
  setAdminSessionMetadata,
} from "@/lib/auth";
import { adminAuthApi } from "@/features/admin-auth/api/adminAuth.api";
import { hasPermission, type PermissionCheck } from "@/features/admin-auth/permissions";
import type { AdminAuthMe } from "@/features/admin-auth/types";

type AdminAuthContextValue = {
  isAuthenticated: boolean | null;
  isBootstrapping: boolean;
  profile: AdminAuthMe | null;
  permissions: string[];
  legacyRole: string | null;
  mustChangePassword: boolean;
  isStaffAccount: boolean;
  refreshAuth: () => Promise<AdminAuthMe | null>;
  clearAuthState: () => void;
  hasPermission: (required?: PermissionCheck) => boolean;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

const loadProfileFromStorage = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(ADMIN_PROFILE_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AdminAuthMe;
  } catch {
    return null;
  }
};

const shouldBootstrapAdminAuth = () =>
  typeof window !== "undefined" && Boolean(getAdminToken());

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<AdminAuthMe | null>(() => loadProfileFromStorage());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(() =>
    typeof window === "undefined" ? null : Boolean(getAdminToken())
  );
  const [isBootstrapping, setIsBootstrapping] = useState(() => shouldBootstrapAdminAuth());
  const bootstrapPromiseRef = useRef<Promise<AdminAuthMe | null> | null>(null);

  const clearAuthState = useCallback(() => {
    setProfile(null);
    setIsAuthenticated(false);
    clearAdminSessionMetadata();
  }, []);

  const refreshAuth = useCallback(async () => {
    const token = getAdminToken();
    if (!token) {
      clearAuthState();
      return null;
    }

    if (bootstrapPromiseRef.current) {
      return bootstrapPromiseRef.current;
    }

    const promise = (async () => {
      setIsBootstrapping(true);
      setIsAuthenticated(true);

      try {
        const nextProfile = await adminAuthApi.getAdminAuthMe();
        setProfile(nextProfile);
        setAdminSessionMetadata(nextProfile);
        return nextProfile;
      } catch (error) {
        clearAuthState();
        throw error;
      } finally {
        setIsBootstrapping(false);
        bootstrapPromiseRef.current = null;
      }
    })();

    bootstrapPromiseRef.current = promise;
    return promise;
  }, [clearAuthState]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleTokenChange = () => {
      const token = getAdminToken();
      if (!token) {
        clearAuthState();
        return;
      }

      setIsAuthenticated(true);
      void refreshAuth().catch(() => {
        // Response interceptor handles forced navigation on expired sessions.
      });
    };

    const token = getAdminToken();
    if (!token) {
      clearAuthState();
      return;
    }

    void refreshAuth().catch(() => {
      // Response interceptor handles forced navigation on expired sessions.
    });

    window.addEventListener(ADMIN_TOKEN_EVENT, handleTokenChange);
    return () => {
      window.removeEventListener(ADMIN_TOKEN_EVENT, handleTokenChange);
    };
  }, [clearAuthState, refreshAuth]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (profile) {
      window.localStorage.setItem(ADMIN_PROFILE_STORAGE_KEY, JSON.stringify(profile));
      window.localStorage.setItem(
        ADMIN_PERMISSIONS_STORAGE_KEY,
        JSON.stringify(profile.permissions ?? [])
      );
      document.cookie = `${ADMIN_MUST_CHANGE_PASSWORD_COOKIE}=${profile.mustChangePassword ? "1" : "0"}; path=/`;
      return;
    }

    window.localStorage.removeItem(ADMIN_PROFILE_STORAGE_KEY);
    window.localStorage.removeItem(ADMIN_PERMISSIONS_STORAGE_KEY);
    document.cookie = `${ADMIN_MUST_CHANGE_PASSWORD_COOKIE}=0; path=/`;
  }, [profile]);

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      isAuthenticated,
      isBootstrapping,
      profile,
      permissions: profile?.permissions ?? [],
      legacyRole: profile?.legacyRole ?? null,
      mustChangePassword: Boolean(profile?.mustChangePassword),
      isStaffAccount: Boolean(profile?.isStaffAccount),
      refreshAuth,
      clearAuthState,
      hasPermission: (required) => hasPermission(profile?.permissions, required),
    }),
    [clearAuthState, isAuthenticated, isBootstrapping, profile, refreshAuth]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider.");
  }
  return context;
};

export const __testing = {
  shouldBootstrapAdminAuth,
};
