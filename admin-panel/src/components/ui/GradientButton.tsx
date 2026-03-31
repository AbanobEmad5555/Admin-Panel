import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "border border-cyan-300/30 bg-[linear-gradient(135deg,rgba(6,182,212,0.95),rgba(59,130,246,0.92),rgba(168,85,247,0.92))] text-white shadow-[0_18px_40px_rgba(8,145,178,0.35),0_0_32px_rgba(56,189,248,0.22)] hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_22px_48px_rgba(8,145,178,0.42),0_0_38px_rgba(168,85,247,0.24)]",
  secondary:
    "border border-white/12 bg-white/7 text-slate-100 shadow-[0_16px_32px_rgba(2,6,23,0.28)] hover:-translate-y-0.5 hover:bg-white/10 hover:text-white",
  danger:
    "border border-rose-400/25 bg-rose-500/12 text-rose-100 shadow-[0_16px_32px_rgba(2,6,23,0.28)] hover:-translate-y-0.5 hover:bg-rose-500/18 hover:text-white",
  ghost:
    "border border-transparent bg-transparent text-slate-300 shadow-none hover:bg-white/8 hover:text-white",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 py-2 text-xs",
  md: "min-h-11 px-4 py-2.5 text-sm",
  lg: "min-h-12 px-5 py-3 text-sm",
  icon: "h-11 w-11 p-0",
};

const GradientButton = forwardRef<HTMLButtonElement, ButtonProps>(function GradientButton(
  {
    variant = "primary",
    size = "md",
    className,
    type = "button",
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold tracking-[-0.02em] transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    />
  );
});

export default GradientButton;
