import type { LeadStatus } from "@/features/leads/types";

type StatusBadgeProps = {
  status: LeadStatus | string;
};

const statusStyles: Record<LeadStatus, string> = {
  New: "bg-slate-100 text-slate-700",
  Contacted: "bg-blue-100 text-blue-700",
  Interested: "bg-purple-100 text-purple-700",
  Negotiating: "bg-orange-100 text-orange-700",
  Won: "bg-emerald-100 text-emerald-700",
  Lost: "bg-rose-100 text-rose-700",
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const badgeClass = statusStyles[status as LeadStatus] ?? "bg-slate-100 text-slate-700";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass}`}>
      {status}
    </span>
  );
}
