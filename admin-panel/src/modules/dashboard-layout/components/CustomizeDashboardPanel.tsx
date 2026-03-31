"use client";

import Modal from "@/components/ui/Modal";
import HiddenModulesList from "@/modules/dashboard-layout/components/HiddenModulesList";
import type { DashboardModuleRecord } from "@/modules/dashboard-layout/types/dashboardLayout.types";
import type { AdminLanguage } from "@/modules/localization/types";

type CustomizeDashboardPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  language: AdminLanguage;
  visibleModules: DashboardModuleRecord[];
  hiddenModules: DashboardModuleRecord[];
  isSaving: boolean;
  onToggleVisibility: (moduleId: DashboardModuleRecord["moduleId"], isVisible: boolean) => void;
};

const copy = {
  en: {
    title: "Customize Dashboard",
    description:
      "Reorder modules from the dashboard and hide or restore them from the tables below. Changes save automatically.",
    visibleModules: "Visible Modules",
    hiddenModules: "Hidden Modules",
  },
  ar: {
    title: "تخصيص لوحة الوحدات",
    description:
      "رتّب الوحدات من لوحة الإدارة، وأخفِ أو أظهر الوحدات من الجداول التالية. يتم حفظ التغييرات تلقائيًا.",
    visibleModules: "الوحدات الظاهرة",
    hiddenModules: "الوحدات المخفية",
  },
} as const;

export default function CustomizeDashboardPanel({
  isOpen,
  onClose,
  language,
  visibleModules,
  hiddenModules,
  isSaving,
  onToggleVisibility,
}: CustomizeDashboardPanelProps) {
  const text = copy[language];

  return (
    <Modal title={text.title} isOpen={isOpen} onClose={onClose} panelClassName="max-w-5xl">
      <div className="space-y-6">
        <p className="text-sm text-slate-300">{text.description}</p>
        <HiddenModulesList
          key={`visible-${visibleModules.map((module) => module.moduleId).join("-")}`}
          title={text.visibleModules}
          modules={visibleModules}
          language={language}
          isSaving={isSaving}
          onToggleVisibility={onToggleVisibility}
        />
        <HiddenModulesList
          key={`hidden-${hiddenModules.map((module) => module.moduleId).join("-")}`}
          title={text.hiddenModules}
          modules={hiddenModules}
          language={language}
          isSaving={isSaving}
          onToggleVisibility={onToggleVisibility}
        />
      </div>
    </Modal>
  );
}
