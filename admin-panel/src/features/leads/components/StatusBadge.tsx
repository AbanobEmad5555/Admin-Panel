import Badge from "@/components/ui/Badge";
import type { LeadStatus } from "@/features/leads/types";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

type StatusBadgeProps = {
  status: LeadStatus | string;
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const { language } = useLocalization();
  const localizedStatus =
    language === "ar"
      ? {
          New: "جديد",
          Contacted: "تم التواصل",
          Interested: "مهتم",
          Negotiating: "تفاوض",
          Won: "مكتسب",
          Lost: "مفقود",
        }[status as LeadStatus] ?? status
      : status;

  const tone =
    status === "Won"
      ? "success"
      : status === "Lost"
        ? "danger"
        : status === "Negotiating"
          ? "warning"
          : status === "Interested" || status === "Contacted"
            ? "info"
            : "neutral";

  return <Badge tone={tone}>{localizedStatus}</Badge>;
}
