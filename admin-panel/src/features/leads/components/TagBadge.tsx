import type { LeadTag } from "@/features/leads/types";

type TagBadgeProps = {
  tag: LeadTag | string;
};

const tagStyles: Record<LeadTag, string> = {
  Potential: "bg-slate-100 text-slate-700",
  Customer: "bg-blue-100 text-blue-700",
  VIP: "bg-gradient-to-r from-yellow-200 to-amber-300 text-amber-900",
};

export default function TagBadge({ tag }: TagBadgeProps) {
  const normalizedTag = tag === "CUSTOMER" ? "Customer" : tag === "POTENTIAL" ? "Potential" : tag;
  const badgeClass = tagStyles[normalizedTag as LeadTag] ?? "bg-slate-100 text-slate-700";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass}`}>
      {normalizedTag}
    </span>
  );
}
