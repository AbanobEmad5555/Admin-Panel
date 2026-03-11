import type { TeamStatus } from "@/features/team/types";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

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
  const { language } = useLocalization();

  const labelMap: Record<TeamStatus, { en: string; ar: string }> = {
    ACTIVE: { en: "ACTIVE", ar: "نشط" },
    SUSPENDED: { en: "SUSPENDED", ar: "موقوف" },
    VACATION: { en: "VACATION", ar: "إجازة" },
    TERMINATED: { en: "TERMINATED", ar: "منتهي" },
  };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${colorMap[status]}`}>
      {labelMap[status][language]}
    </span>
  );
}
