"use client";

import { useMemo, useState } from "react";
import { Loader2, Settings2 } from "lucide-react";
import { toast } from "sonner";
import HomeAuthAction from "@/components/layout/HomeAuthAction";
import Button from "@/components/ui/Button";
import GradientCard from "@/components/ui/GradientCard";
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
import type {
  DashboardLayoutItem,
  DashboardModuleRecord,
} from "@/modules/dashboard-layout/types/dashboardLayout.types";
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
import { useAdminTokenPresence } from "@/lib/useAdminTokenPresence";

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

  const visibleModules = useMemo<DashboardModuleRecord[]>(
    () =>
      toDashboardModuleRecords(getVisibleModules(layout))
        .map((module) => ({
          ...module,
          route: getDashboardModuleRoute(module.moduleId, profile),
        }))
        .filter(
          (
            module
          ): module is DashboardModuleRecord => typeof module.route === "string"
        ),
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
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_26%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.22),transparent_28%),linear-gradient(180deg,#0f172a_0%,#020617_100%)] px-6 py-8 md:px-10 lg:px-14">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.08),transparent_24%),radial-gradient(circle_at_78%_16%,rgba(168,85,247,0.12),transparent_22%),radial-gradient(circle_at_50%_100%,rgba(236,72,153,0.08),transparent_30%)]"
      />

      <div className="relative mx-auto w-full max-w-7xl space-y-6">
        <GradientCard padding="md" glow className="overflow-visible rounded-[2rem]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <HomeAuthAction />
              {hasPermission(["notifications.view", "notifications.preferences"]) ? (
                <NotificationBell />
              ) : null}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsCustomizeOpen(true)}
                disabled={!canCustomizeDashboard}
              >
                <Settings2 className="h-4 w-4" />
                {text.customize}
              </Button>
              {isSaving ? (
                <span className="inline-flex items-center gap-2 text-sm text-slate-300">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {text.saving}
                </span>
              ) : null}
            </div>
            <LanguageSwitcher />
          </div>
        </GradientCard>

        <GradientCard as="header" padding="lg" glow className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/80">
            Control Center
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-50 md:text-4xl">
            {text.title}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-300 md:text-base">
            {text.subtitle}
          </p>
        </GradientCard>

        <div className="space-y-6">
          {renderContent()}

          {hasToken && dashboardLayoutQuery.isError && navigationLayout.length === 0 ? (
            <GradientCard
              padding="md"
              className="mx-auto max-w-2xl border-amber-300/25 bg-amber-500/12 text-sm text-amber-100"
            >
              {text.loadError}
            </GradientCard>
          ) : null}
        </div>
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
