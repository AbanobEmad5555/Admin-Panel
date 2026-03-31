"use client";

import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/features/admin-auth/AdminAuthProvider";
import { clearAdminToken } from "@/lib/auth";
import LanguageSwitcher from "@/modules/localization/components/LanguageSwitcher";
import { useLocalization } from "@/modules/localization/LocalizationProvider";
import NotificationBell from "@/modules/notifications/components/NotificationBell";

export default function Header() {
  const router = useRouter();
  const { t } = useLocalization();
  const { profile, hasPermission } = useAdminAuth();

  const handleSignOut = () => {
    clearAdminToken();
    router.replace("/login");
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="text-sm font-medium text-slate-600">{t("header.admin")}</div>
      <div className="flex items-center gap-4">
        {hasPermission(["notifications.view", "notifications.preferences"]) ? <NotificationBell /> : null}
        <LanguageSwitcher />
        <div className="text-sm text-slate-500">
          {profile?.staffRole?.name
            ? `${profile.staffRole.name} · ${profile.email}`
            : profile?.email || t("header.signedInAsAdmin")}
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100"
        >
          {t("header.signOut")}
        </button>
      </div>
    </header>
  );
}
