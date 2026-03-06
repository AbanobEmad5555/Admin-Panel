import { CheckCircle2, Pencil, RefreshCcw, Trash2 } from "lucide-react";
import { formatEGP } from "@/lib/currency";
import PurchaseStatusBadge from "@/components/purchases/PurchaseStatusBadge";
import type { PurchaseRow } from "@/components/purchases/types";

type PurchasesTableProps = {
  rows: PurchaseRow[];
  onEdit: (row: PurchaseRow) => void;
  onDelete: (row: PurchaseRow) => void;
  onUpdateStatus: (row: PurchaseRow) => void;
  onApproveProduct: (row: PurchaseRow) => void;
};

export default function PurchasesTable({
  rows,
  onEdit,
  onDelete,
  onUpdateStatus,
  onApproveProduct,
}: PurchasesTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Product</th>
              <th className="px-4 py-3 font-semibold">Purchase ID</th>
              <th className="px-4 py-3 font-semibold">Supplier</th>
              <th className="px-4 py-3 font-semibold">Quantity</th>
              <th className="px-4 py-3 font-semibold">Unit Cost</th>
              <th className="px-4 py-3 font-semibold">Total Cost</th>
              <th className="px-4 py-3 font-semibold">Expected Arrival</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.map((row) => (
              <tr key={row.id} className="text-slate-700">
                <td className="px-4 py-3 font-medium text-slate-900">{row.productName}</td>
                <td className="px-4 py-3">{row.purchaseId}</td>
                <td className="px-4 py-3">{row.supplier}</td>
                <td className="px-4 py-3">{row.quantity}</td>
                <td className="px-4 py-3">{formatEGP(row.unitCost)}</td>
                <td className="px-4 py-3">{formatEGP(row.totalCost)}</td>
                <td className="px-4 py-3">
                  {row.status === "DELIVERED" ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      Delivered
                    </span>
                  ) : row.status === "IN_TRANSIT" ? (
                    <span className="text-slate-600">Expected: {row.expectedArrival || "-"}</span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <PurchaseStatusBadge status={row.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(row)}
                      className="rounded-md border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                      aria-label="Edit purchase"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(row)}
                      className="rounded-md border border-rose-200 p-2 text-rose-600 transition hover:bg-rose-50"
                      aria-label="Delete purchase"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(row)}
                      className="rounded-md border border-amber-200 p-2 text-amber-700 transition hover:bg-amber-50"
                      aria-label="Update status"
                    >
                      <RefreshCcw className="h-4 w-4" />
                    </button>
                    {row.pendingApproval ? (
                      <button
                        type="button"
                        onClick={() => onApproveProduct(row)}
                        className="rounded-md border border-emerald-200 p-2 text-emerald-700 transition hover:bg-emerald-50"
                        aria-label="Approve product"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
