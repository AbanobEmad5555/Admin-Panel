import type { InvoiceStatus } from "@/app/admin/invoices/services/invoice.types";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

const statusStyles: Record<InvoiceStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
  POSTED: "bg-blue-100 text-blue-700 border-blue-200",
  SENT: "bg-purple-100 text-purple-700 border-purple-200",
  PARTIAL: "bg-amber-100 text-amber-700 border-amber-200",
  PAID: "bg-emerald-100 text-emerald-700 border-emerald-200",
  OVERDUE: "bg-rose-100 text-rose-700 border-rose-200",
  CANCELED: "bg-red-100 text-red-800 border-red-200",
};

export default function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const { language } = useLocalization();
  const labels: Record<InvoiceStatus, string> =
    language === "ar"
      ? {
          DRAFT: "مسودة",
          POSTED: "مرحلة",
          SENT: "مرسلة",
          PARTIAL: "جزئية",
          PAID: "مدفوعة",
          OVERDUE: "متأخرة",
          CANCELED: "ملغاة",
        }
      : {
          DRAFT: "DRAFT",
          POSTED: "POSTED",
          SENT: "SENT",
          PARTIAL: "PARTIAL",
          PAID: "PAID",
          OVERDUE: "OVERDUE",
          CANCELED: "CANCELED",
        };
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

