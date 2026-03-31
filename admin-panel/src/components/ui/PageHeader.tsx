import type { ReactNode } from "react";
import GradientCard from "@/components/ui/GradientCard";
import { cn } from "@/lib/cn";

type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  className?: string;
};

export default function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <GradientCard as="header" glow padding="lg" className={cn("overflow-visible", className)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/80">
              {eyebrow}
            </p>
          ) : null}
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-[-0.03em] text-slate-50">{title}</h1>
            {description ? <p className="max-w-3xl text-sm text-slate-300">{description}</p> : null}
          </div>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
      </div>
    </GradientCard>
  );
}
