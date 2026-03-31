import Badge from "@/components/ui/Badge";
import type { TeamStatus } from "@/features/team/types";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

type StatusBadgeProps = {
  status: TeamStatus;
};

const toneMap: Record<TeamStatus, "success" | "warning" | "info" | "danger"> = {
  ACTIVE: "success",
  SUSPENDED: "warning",
  VACATION: "info",
  TERMINATED: "danger",
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const { language } = useLocalization();

  const labelMap: Record<TeamStatus, { en: string; ar: string }> = {
    ACTIVE: { en: "ACTIVE", ar: "نشط" },
    SUSPENDED: { en: "SUSPENDED", ar: "موقوف" },
    VACATION: { en: "VACATION", ar: "إجازة" },
    TERMINATED: { en: "TERMINATED", ar: "منتهي" },
  };

  return <Badge tone={toneMap[status]}>{labelMap[status][language]}</Badge>;
}
