import Badge from "@/components/ui/Badge";
import type { LeadPriority } from "@/features/leads/types";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

type PriorityBadgeProps = {
  priority: LeadPriority | string;
};

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  const { language } = useLocalization();
  const localizedPriority =
    language === "ar"
      ? {
          Low: "منخفض",
          Medium: "متوسط",
          High: "مرتفع",
        }[priority as LeadPriority] ?? priority
      : priority;

  const tone =
    priority === "High" ? "danger" : priority === "Medium" ? "warning" : "neutral";

  return <Badge tone={tone}>{localizedPriority}</Badge>;
}
