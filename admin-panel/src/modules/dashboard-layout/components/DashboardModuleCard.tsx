"use client";

import type { KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { Lock, Sparkles } from "lucide-react";
import TeamModuleCard from "@/features/team/components/TeamModuleCard";
import type { DashboardModuleRecord } from "@/modules/dashboard-layout/types/dashboardLayout.types";
import type { AdminLanguage } from "@/modules/localization/types";

type DashboardModuleCardProps = {
  module: DashboardModuleRecord;
  language: AdminLanguage;
  isDragging?: boolean;
  isSaving?: boolean;
  disableNavigation?: boolean;
  dragAttributes?: DraggableAttributes;
  dragListeners?: SyntheticListenerMap;
};

export default function DashboardModuleCard({
  module,
  language,
  isDragging = false,
  isSaving = false,
  disableNavigation = false,
  dragAttributes,
  dragListeners,
}: DashboardModuleCardProps) {
  const router = useRouter();
  const Icon = module.icon;
  const copy = module.copy[language];
  const isDisabled = !module.enabled;
  const isTeamModule = module.moduleId === "team";

  const handleNavigate = () => {
    if (isDisabled || disableNavigation || isSaving) {
      return;
    }

    router.push(module.route);
  };

  return (
    <div
      role={isDisabled ? undefined : "button"}
      tabIndex={isDisabled ? -1 : 0}
      onClick={handleNavigate}
      onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleNavigate();
        }
      }}
      {...dragAttributes}
      {...dragListeners}
      className={`rounded-xl bg-white p-8 text-center shadow-sm transition duration-300 ${
        isDisabled
          ? "cursor-not-allowed border border-dashed border-slate-200 opacity-80"
          : "cursor-grab hover:scale-[1.01] hover:shadow-lg active:cursor-grabbing"
      } ${isDragging ? "shadow-xl ring-2 ring-slate-300" : ""}`}
    >
      {isTeamModule ? (
        <TeamModuleCard
          renderContentOnly
          className="[&_h2]:!text-center [&_p]:!text-center"
        />
      ) : (
        <>
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 via-indigo-100 to-cyan-100">
            <Icon className="h-10 w-10 text-slate-700" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-2xl font-bold text-slate-900">{copy.title}</h2>
              {isDisabled ? <Lock className="h-5 w-5 text-slate-400" /> : null}
            </div>
            <p className="text-sm leading-relaxed text-slate-600">{copy.description}</p>
            {isDisabled ? (
              <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                <Sparkles className="h-3.5 w-3.5" />
                {copy.comingSoon}
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
