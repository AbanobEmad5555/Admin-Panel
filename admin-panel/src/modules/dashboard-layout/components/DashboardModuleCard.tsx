"use client";

import type { KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { Lock, Sparkles } from "lucide-react";
import GradientCard from "@/components/ui/GradientCard";
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
    <GradientCard
      as="article"
      glow
      interactive={!isDisabled}
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
      className={`p-8 text-center ${
        isDisabled ? "cursor-not-allowed border-dashed opacity-80" : "cursor-grab active:cursor-grabbing"
      } ${isDragging ? "ring-2 ring-cyan-300/50 shadow-[0_22px_48px_rgba(2,6,23,0.46)]" : ""}`}
    >
      {isTeamModule ? (
        <TeamModuleCard
          renderContentOnly
          className="[&_h2]:!text-center [&_p]:!text-center"
        />
      ) : (
        <>
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[1.75rem] border border-white/10 bg-[linear-gradient(135deg,rgba(34,211,238,0.18),rgba(59,130,246,0.12),rgba(168,85,247,0.18))] shadow-[0_0_28px_rgba(56,189,248,0.18)]">
            <Icon className="h-10 w-10 text-cyan-100" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-50">{copy.title}</h2>
              {isDisabled ? <Lock className="h-5 w-5 text-slate-400" /> : null}
            </div>
            <p className="text-sm leading-relaxed text-slate-300">{copy.description}</p>
            {isDisabled ? (
              <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs font-semibold text-slate-200">
                <Sparkles className="h-3.5 w-3.5" />
                {copy.comingSoon}
              </div>
            ) : null}
          </div>
        </>
      )}
    </GradientCard>
  );
}
