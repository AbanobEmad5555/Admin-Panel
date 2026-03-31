import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type GradientCardElement = "div" | "section" | "article" | "header";

type GradientCardProps = HTMLAttributes<HTMLDivElement> & {
  as?: GradientCardElement;
  glow?: boolean;
  interactive?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
};

const paddingStyles = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
} as const;

export default function GradientCard({
  as = "div",
  glow = false,
  interactive = false,
  padding = "md",
  className,
  children,
  ...props
}: GradientCardProps) {
  const Component = as;

  return (
    <Component
      className={cn(
        "relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_14px_36px_rgba(2,6,23,0.35),0_0_40px_rgba(0,0,0,0.32)]",
        glow &&
          "before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.18),transparent_44%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.12),transparent_38%)] before:opacity-100",
        interactive && "transition-all duration-300 ease-out hover:-translate-y-1 hover:bg-white/[0.075] hover:shadow-[0_18px_48px_rgba(2,6,23,0.42),0_0_36px_rgba(56,189,248,0.18)]",
        paddingStyles[padding],
        className
      )}
      {...props}
    >
      <div className="relative">{children}</div>
    </Component>
  );
}
