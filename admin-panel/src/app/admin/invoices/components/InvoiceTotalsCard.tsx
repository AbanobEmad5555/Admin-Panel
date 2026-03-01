import type { InvoiceDetails } from "@/app/admin/invoices/services/invoice.types";
import { formatEGP } from "@/lib/currency";

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
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">Totals</h3>
      <div className="mt-2 border-t border-slate-100 pt-2">
        <TotalRow label="Subtotal" value={invoice.subtotal} />
        <TotalRow label="Discount" value={invoice.discount} />
        <TotalRow label="Tax" value={invoice.tax} />
        <TotalRow label="Grand Total" value={invoice.grandTotal} className="font-semibold text-slate-900" />
        <TotalRow label="Paid Amount" value={invoice.paidAmount} className="font-semibold text-emerald-700" />
        <TotalRow
          label="Remaining Amount"
          value={invoice.remainingAmount}
          className={invoice.remainingAmount > 0 ? "font-semibold text-rose-700" : "font-semibold text-slate-900"}
        />
      </div>
    </div>
  );
}
