"use client";

import { useMemo, useState } from "react";
import { Loader2, Settings2 } from "lucide-react";
import { toast } from "sonner";
import HomeAuthAction from "@/components/layout/HomeAuthAction";
import { useAdminAuth } from "@/features/admin-auth/AdminAuthProvider";
import {
  canRenderDashboardModuleEntry,
  getDashboardModuleRoute,
} from "@/features/admin-auth/permissions";
import NotificationBell from "@/modules/notifications/components/NotificationBell";
import DashboardGrid from "@/modules/dashboard-layout/components/DashboardGrid";
import DashboardLayoutSkeleton from "@/modules/dashboard-layout/components/DashboardLayoutSkeleton";
import CustomizeDashboardPanel from "@/modules/dashboard-layout/components/CustomizeDashboardPanel";
import { useDashboardLayout } from "@/modules/dashboard-layout/hooks/useDashboardLayout";
import { useSaveDashboardLayout } from "@/modules/dashboard-layout/hooks/useSaveDashboardLayout";
import { useUpdateDashboardModuleVisibility } from "@/modules/dashboard-layout/hooks/useUpdateDashboardModuleVisibility";
import { useAdminTokenPresence } from "@/lib/useAdminTokenPresence";
import type { DashboardLayoutItem } from "@/modules/dashboard-layout/types/dashboardLayout.types";
import {
  ensureLayoutHasNavigationModules,
  getHiddenModules,
  getNavigationDashboardLayout,
  getVisibleModules,
  mergeLayoutWithNavigation,
  reorderVisibleLayout,
  setModuleVisibility,
  toDashboardModuleRecords,
} from "@/modules/dashboard-layout/utils/layoutHelpers";
import LanguageSwitcher from "@/modules/localization/components/LanguageSwitcher";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

const copy = {
  en: {
    title: "Admin Modules",
    subtitle: "Manage and control all system modules from one place",
    customize: "Customize",
    saving: "Saving...",
    saved: "Dashboard layout saved",
    loadError: "Unable to load your dashboard layout.",
    saveError: "Unable to save dashboard layout.",
    visibilityError: "Unable to update module visibility.",
    retry: "Retry",
  },
  ar: {
    title: "وحدات الإدارة",
    subtitle: "أدر وتحكم في جميع وحدات النظام من مكان واحد",
    customize: "تخصيص",
    saving: "جارٍ الحفظ...",
    saved: "تم حفظ تخطيط اللوحة",
    loadError: "تعذر تحميل تخطيط اللوحة.",
    saveError: "تعذر حفظ تخطيط اللوحة.",
    visibilityError: "تعذر تحديث ظهور الوحدة.",
    retry: "إعادة المحاولة",
  },
} as const;

export default function HomePage() {
  const { language } = useLocalization();
  const text = copy[language];
  const { profile, hasPermission } = useAdminAuth();
  const hasToken = useAdminTokenPresence();
  const dashboardLayoutQuery = useDashboardLayout();
  const saveDashboardLayoutMutation = useSaveDashboardLayout();
  const updateDashboardModuleVisibilityMutation = useUpdateDashboardModuleVisibility();
  const [optimisticLayout, setOptimisticLayout] = useState<DashboardLayoutItem[] | null>(null);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const navigationLayout = useMemo(
    () => getNavigationDashboardLayout(profile?.navigation),
    [profile?.navigation]
  );
  const queryLayout = useMemo(() => {
    const serverLayout = (dashboardLayoutQuery.data as DashboardLayoutItem[] | undefined) ?? [];
    return ensureLayoutHasNavigationModules(
      mergeLayoutWithNavigation(serverLayout, navigationLayout),
      navigationLayout
    );
  }, [dashboardLayoutQuery.data, navigationLayout]);
  const layout = useMemo(
    () =>
      (optimisticLayout ?? queryLayout).filter((item) =>
        canRenderDashboardModuleEntry(item.moduleId, profile)
      ),
    [optimisticLayout, profile, queryLayout]
  );

  const isSaving =
    saveDashboardLayoutMutation.isPending || updateDashboardModuleVisibilityMutation.isPending;
  const canCustomizeDashboard = !hasToken || !dashboardLayoutQuery.isError;
  const visibleModules = useMemo(
    () =>
      toDashboardModuleRecords(getVisibleModules(layout)).map((module) => ({
        ...module,
        route: getDashboardModuleRoute(module.moduleId, profile),
      })),
    [layout, profile]
  );
  const hiddenModules = useMemo(
    () => toDashboardModuleRecords(getHiddenModules(layout)),
    [layout]
  );

  const handleReorder = (
    activeId: DashboardLayoutItem["moduleId"],
    overId: DashboardLayoutItem["moduleId"]
  ) => {
    if (isSaving) {
      return;
    }

    const previousLayout = layout;
    const nextLayout = reorderVisibleLayout(layout, activeId, overId);

    if (JSON.stringify(previousLayout) === JSON.stringify(nextLayout)) {
      return;
    }

    setOptimisticLayout(nextLayout);

    if (!hasToken) {
      return;
    }

    saveDashboardLayoutMutation.mutate(nextLayout, {
      onSuccess: () => {
        setOptimisticLayout(null);
        toast.success(text.saved);
      },
      onError: () => {
        setOptimisticLayout(previousLayout);
        toast.error(text.saveError);
      },
    });
  };

  const handleToggleVisibility = (
    moduleId: DashboardLayoutItem["moduleId"],
    isVisible: boolean
  ) => {
    if (isSaving) {
      return;
    }

    const previousLayout = layout;
    const nextLayout = setModuleVisibility(layout, moduleId, isVisible);
    setOptimisticLayout(nextLayout);

    if (!hasToken) {
      return;
    }

    updateDashboardModuleVisibilityMutation.mutate(
      { moduleId, isVisible, fallbackModules: nextLayout },
      {
        onSuccess: () => {
          setOptimisticLayout(null);
          toast.success(text.saved);
        },
        onError: () => {
          setOptimisticLayout(previousLayout);
          toast.error(text.visibilityError);
        },
      }
    );
  };

  const renderContent = () => {
    if (hasToken && dashboardLayoutQuery.isLoading && queryLayout.length === 0) {
      return <DashboardLayoutSkeleton />;
    }

    return (
      <DashboardGrid
        key={visibleModules.map((module) => module.moduleId).join("-")}
        modules={visibleModules}
        language={language}
        isSaving={isSaving}
        onReorder={handleReorder}
      />
    );
  };

  return (
    <main className="min-h-screen bg-slate-50/80 px-6 py-10 md:px-10 lg:px-14">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <HomeAuthAction />
            {hasPermission(["notifications.view", "notifications.preferences"]) ? <NotificationBell /> : null}
            <button
              type="button"
              onClick={() => setIsCustomizeOpen(true)}
              disabled={!canCustomizeDashboard}
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100"
            >
              <Settings2 className="h-4 w-4" />
              {text.customize}
            </button>
            {isSaving ? (
              <span className="inline-flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                {text.saving}
              </span>
            ) : null}
          </div>
          <LanguageSwitcher />
        </div>

        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            {text.title}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-500 md:text-base">
            {text.subtitle}
          </p>
        </header>

        {renderContent()}

        {hasToken && dashboardLayoutQuery.isError && navigationLayout.length === 0 ? (
          <div className="mx-auto mt-6 max-w-2xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {text.loadError}
          </div>
        ) : null}
      </div>

      <CustomizeDashboardPanel
        isOpen={isCustomizeOpen}
        onClose={() => setIsCustomizeOpen(false)}
        language={language}
        visibleModules={visibleModules}
        hiddenModules={hiddenModules}
        isSaving={isSaving}
        onToggleVisibility={handleToggleVisibility}
      />
    </main>
  );
}
