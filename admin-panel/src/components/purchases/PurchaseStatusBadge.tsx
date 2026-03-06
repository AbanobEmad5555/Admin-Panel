import type { PurchaseStatus } from "@/components/purchases/types";

type PurchaseStatusBadgeProps = {
  status: PurchaseStatus;
};

const statusClassMap: Record<PurchaseStatus, string> = {
  ORDERED: "bg-blue-100 text-blue-700",
  IN_TRANSIT: "bg-amber-100 text-amber-700",
  DELIVERED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-rose-100 text-rose-700",
};

export default function PurchaseStatusBadge({ status }: PurchaseStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusClassMap[status]}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}
