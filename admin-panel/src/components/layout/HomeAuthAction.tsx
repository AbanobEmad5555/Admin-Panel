"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { ADMIN_TOKEN_EVENT, clearAdminToken, getAdminToken } from "@/lib/auth";
import { useHasHydrated } from "@/lib/useHasHydrated";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

const subscribe = (onStoreChange: () => void) => {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleChange = () => onStoreChange();
  window.addEventListener("storage", handleChange);
  window.addEventListener(ADMIN_TOKEN_EVENT, handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(ADMIN_TOKEN_EVENT, handleChange);
  };
};

export default function HomeAuthAction() {
  const router = useRouter();
  const mounted = useHasHydrated();
  const isSignedIn = useSyncExternalStore(
    subscribe,
    () => Boolean(getAdminToken()),
    () => false
  );
  const { language } = useLocalization();

  const handleSignOut = () => {
    clearAdminToken();
    router.replace("/login");
  };

  if (!mounted) {
    return <div className="h-9 w-20 rounded-md border border-slate-300 bg-white" aria-hidden="true" />;
  }

  if (isSignedIn) {
    return (
      <button
        type="button"
        onClick={handleSignOut}
        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100"
      >
        {language === "ar" ? "تسجيل الخروج" : "Sign out"}
      </button>
    );
  }

  return (
    <Link
      href="/login"
      className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100"
    >
      {language === "ar" ? "تسجيل الدخول" : "Sign in"}
    </Link>
  );
}
