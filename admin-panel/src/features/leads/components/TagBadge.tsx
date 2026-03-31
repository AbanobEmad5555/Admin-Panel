import Badge from "@/components/ui/Badge";
import type { LeadTag } from "@/features/leads/types";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

type TagBadgeProps = {
  tag: LeadTag | string;
};

const normalizeTag = (tag: LeadTag | string) =>
  tag === "CUSTOMER" ? "Customer" : tag === "POTENTIAL" ? "Potential" : tag;

export default function TagBadge({ tag }: TagBadgeProps) {
  const { language } = useLocalization();
  const normalizedTag = normalizeTag(tag);
  const localizedTag =
    language === "ar"
      ? {
          Potential: "محتمل",
          Customer: "عميل",
          VIP: "كبار العملاء",
        }[normalizedTag as LeadTag] ?? normalizedTag
      : normalizedTag;

  const tone =
    normalizedTag === "VIP"
      ? "warning"
      : normalizedTag === "Customer"
        ? "info"
        : "neutral";

  return <Badge tone={tone}>{localizedTag}</Badge>;
}
