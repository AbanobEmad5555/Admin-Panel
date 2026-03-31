import type { LucideIcon } from "lucide-react";
import GradientCard from "@/components/ui/GradientCard";

type StatsCardProps = {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
};

export default function StatsCard({ label, value, hint, icon: Icon }: StatsCardProps) {
  return (
    <GradientCard as="article" glow interactive padding="md">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
          <p className="text-2xl font-semibold tracking-[-0.03em] text-slate-50">{value}</p>
          {hint ? <p className="text-xs text-slate-400">{hint}</p> : null}
        </div>
        {Icon ? (
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/20 bg-[linear-gradient(135deg,rgba(34,211,238,0.16),rgba(168,85,247,0.18))] text-cyan-100 shadow-[0_0_24px_rgba(56,189,248,0.18)]">
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
    </GradientCard>
  );
}
