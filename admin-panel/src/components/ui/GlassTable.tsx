import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type GlassTableProps = HTMLAttributes<HTMLDivElement> & {
  tableClassName?: string;
};

export default function GlassTable({
  className,
  tableClassName,
  children,
  ...props
}: GlassTableProps) {
  return (
    <div
      className={cn(
        "glass-table overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_14px_36px_rgba(2,6,23,0.35)] backdrop-blur-xl",
        className
      )}
      {...props}
    >
      <div className={cn("overflow-x-auto", tableClassName)}>{children}</div>
    </div>
  );
}
