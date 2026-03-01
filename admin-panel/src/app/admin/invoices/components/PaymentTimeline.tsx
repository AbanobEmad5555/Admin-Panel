import type { InvoicePayment } from "@/app/admin/invoices/services/invoice.types";
import { formatEGP } from "@/lib/currency";

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
};

export default function PaymentTimeline({ payments }: { payments: InvoicePayment[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">Payment Timeline</h3>
      {!payments.length ? (
        <p className="mt-3 text-sm text-slate-500">No payments yet.</p>
      ) : (
        <div className="mt-3 space-y-3">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="rounded-lg border border-slate-200 bg-slate-50 p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">
                  {payment.method}
                </p>
                <p className="text-sm font-semibold text-emerald-700">
                  {formatEGP(payment.amount)}
                </p>
              </div>
              <div className="mt-1 grid grid-cols-1 gap-1 text-xs text-slate-600 sm:grid-cols-3">
                <span>Status: {payment.status || "-"}</span>
                <span>Date: {formatDateTime(payment.date)}</span>
                <span>Reference: {payment.reference || "-"}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
