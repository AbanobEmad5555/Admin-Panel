import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

const toneStyles: Record<BadgeTone, string> = {
  neutral: "border-white/10 bg-white/8 text-slate-200",
  info: "border-cyan-400/25 bg-cyan-500/12 text-cyan-100",
  success: "border-emerald-400/25 bg-emerald-500/12 text-emerald-100",
  warning: "border-amber-400/25 bg-amber-500/12 text-amber-100",
  danger: "border-rose-400/25 bg-rose-500/12 text-rose-100",
};

export default function Badge({ tone = "neutral", className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold tracking-[-0.02em]",
        toneStyles[tone],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
