import type { InvoiceLine } from "@/app/admin/invoices/services/invoice.types";
import { formatEGP } from "@/lib/currency";

export default function InvoiceLineTable({ lines }: { lines: InvoiceLine[] }) {
  if (!lines.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm">
        No invoice lines found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[980px] text-left text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th className="px-4 py-3 font-medium">Image</th>
            <th className="px-4 py-3 font-medium">Product</th>
            <th className="px-4 py-3 font-medium">Description</th>
            <th className="px-4 py-3 font-medium">Qty</th>
            <th className="px-4 py-3 font-medium">Unit Price</th>
            <th className="px-4 py-3 font-medium">Discount</th>
            <th className="px-4 py-3 font-medium">Tax</th>
            <th className="px-4 py-3 font-medium">Line Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {lines.map((line) => (
            <tr key={line.id} className="text-slate-700">
              <td className="px-4 py-3">
                {line.imageUrl ? (
                  <div
                    className="h-10 w-10 rounded-md border border-slate-200 bg-cover bg-center"
                    style={{ backgroundImage: `url(${line.imageUrl})` }}
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-100 text-[10px] text-slate-500">
                    No image
                  </div>
                )}
              </td>
              <td className="px-4 py-3 font-medium text-slate-900">{line.productName}</td>
              <td className="px-4 py-3 text-slate-600">{line.description || "-"}</td>
              <td className="px-4 py-3">{line.quantity}</td>
              <td className="px-4 py-3">{formatEGP(line.unitPrice)}</td>
              <td className="px-4 py-3">{formatEGP(line.discount)}</td>
              <td className="px-4 py-3">{formatEGP(line.tax)}</td>
              <td className="px-4 py-3 font-semibold text-slate-900">{formatEGP(line.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
