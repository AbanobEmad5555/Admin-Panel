import type { LeadPriority } from "@/features/leads/types";

type PriorityBadgeProps = {
  priority: LeadPriority | string;
};

const priorityStyles: Record<LeadPriority, string> = {
  Low: "bg-slate-100 text-slate-700",
  Medium: "bg-orange-100 text-orange-700",
  High: "bg-rose-100 text-rose-700",
};

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  const badgeClass = priorityStyles[priority as LeadPriority] ?? "bg-slate-100 text-slate-700";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass}`}>
      {priority}
    </span>
  );
}
