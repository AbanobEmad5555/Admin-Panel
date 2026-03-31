"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import type { AdminLanguage } from "@/modules/localization/types";
import type { DashboardModuleRecord } from "@/modules/dashboard-layout/types/dashboardLayout.types";

type HiddenModulesListProps = {
  title: string;
  modules: DashboardModuleRecord[];
  language: AdminLanguage;
  isSaving: boolean;
  onToggleVisibility: (moduleId: DashboardModuleRecord["moduleId"], isVisible: boolean) => void;
};

const PAGE_SIZE = 5;

export default function HiddenModulesList({
  title,
  modules,
  language,
  isSaving,
  onToggleVisibility,
}: HiddenModulesListProps) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(modules.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);

  const pageModules = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return modules.slice(start, start + PAGE_SIZE);
  }, [currentPage, modules]);

  const labels = {
    module: language === "ar" ? "الوحدة" : "Module",
    description: language === "ar" ? "الوصف" : "Description",
    status: language === "ar" ? "الحالة" : "Status",
    action: language === "ar" ? "الإجراء" : "Action",
    enabled: language === "ar" ? "متاحة" : "Enabled",
    comingSoon: language === "ar" ? "قريبًا" : "Coming Soon",
    empty: language === "ar" ? "لا توجد وحدات هنا الآن." : "Nothing here right now.",
    hide: language === "ar" ? "إخفاء" : "Hide",
    show: language === "ar" ? "إظهار" : "Show",
    previous: language === "ar" ? "السابق" : "Previous",
    next: language === "ar" ? "التالي" : "Next",
    page: language === "ar" ? "صفحة" : "Page",
    of: language === "ar" ? "من" : "of",
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {modules.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
          {labels.empty}
        </p>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full table-fixed bg-white text-left">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">{labels.module}</th>
                  <th className="px-4 py-3">{labels.description}</th>
                  <th className="px-4 py-3">{labels.status}</th>
                  <th className="px-4 py-3 text-right">{labels.action}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {pageModules.map((module) => {
                  const copy = module.copy[language];

                  return (
                    <tr key={module.moduleId} className="align-top">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 font-medium text-slate-900">
                          <span>{copy.title}</span>
                          {!module.enabled ? <Lock className="h-4 w-4 text-slate-400" /> : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{copy.description}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {module.enabled ? labels.enabled : labels.comingSoon}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => onToggleVisibility(module.moduleId, !module.isVisible)}
                          disabled={isSaving}
                          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {module.isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          {module.isVisible ? labels.hide : labels.show}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {pageCount > 1 ? (
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={currentPage === 1}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {labels.previous}
              </button>
              <span className="text-sm text-slate-500">
                {labels.page} {currentPage} {labels.of} {pageCount}
              </span>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                disabled={currentPage === pageCount}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {labels.next}
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
