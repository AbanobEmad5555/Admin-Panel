import type { InvoiceDetails } from "@/app/admin/invoices/services/invoice.types";
import { formatEGP } from "@/lib/currency";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

type RowProps = {
  label: string;
  value: number;
  className?: string;
};

function TotalRow({ label, value, className }: RowProps) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-slate-600">{label}</span>
      <span className={className ?? "font-medium text-slate-900"}>{formatEGP(value)}</span>
    </div>
  );
}

export default function InvoiceTotalsCard({ invoice }: { invoice: InvoiceDetails }) {
  const { language } = useLocalization();
  const text =
    language === "ar"
      ? {
          totals: "الإجماليات",
          subtotal: "الإجمالي الفرعي",
          discount: "الخصم",
          tax: "الضريبة",
          grandTotal: "الإجمالي الكلي",
          paidAmount: "المبلغ المدفوع",
          remainingAmount: "المبلغ المتبقي",
        }
      : {
          totals: "Totals",
          subtotal: "Subtotal",
          discount: "Discount",
          tax: "Tax",
          grandTotal: "Grand Total",
          paidAmount: "Paid Amount",
          remainingAmount: "Remaining Amount",
        };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">{text.totals}</h3>
      <div className="mt-2 border-t border-slate-100 pt-2">
        <TotalRow label={text.subtotal} value={invoice.subtotal} />
        <TotalRow label={text.discount} value={invoice.discount} />
        <TotalRow label={text.tax} value={invoice.tax} />
        <TotalRow label={text.grandTotal} value={invoice.grandTotal} className="font-semibold text-slate-900" />
        <TotalRow label={text.paidAmount} value={invoice.paidAmount} className="font-semibold text-emerald-700" />
        <TotalRow
          label={text.remainingAmount}
          value={invoice.remainingAmount}
          className={invoice.remainingAmount > 0 ? "font-semibold text-rose-700" : "font-semibold text-slate-900"}
        />
      </div>
    </div>
  );
}
