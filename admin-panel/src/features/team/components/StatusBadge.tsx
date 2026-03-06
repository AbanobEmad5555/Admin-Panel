import type { TeamStatus } from "@/features/team/types";

type StatusBadgeProps = {
  status: TeamStatus;
};

const colorMap: Record<TeamStatus, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  SUSPENDED: "bg-amber-100 text-amber-700",
  VACATION: "bg-sky-100 text-sky-700",
  TERMINATED: "bg-rose-100 text-rose-700",
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${colorMap[status]}`}>
      {status}
    </span>
  );
}
