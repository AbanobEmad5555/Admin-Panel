import { Pencil, Trash2 } from "lucide-react";
import { formatEGP } from "@/lib/currency";
import { costCategoryLabels } from "@/components/purchases/constants";
import type { CostRow } from "@/components/purchases/types";

type CostsTableProps = {
  rows: CostRow[];
  onEdit: (row: CostRow) => void;
  onDelete: (row: CostRow) => void;
};

export default function CostsTable({ rows, onEdit, onDelete }: CostsTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-[860px] w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Cost Name</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Amount</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Notes</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.map((row) => (
              <tr key={row.id} className="text-slate-700">
                <td className="px-4 py-3 font-medium text-slate-900">{row.name}</td>
                <td className="px-4 py-3">{costCategoryLabels[row.category]}</td>
                <td className="px-4 py-3">{formatEGP(row.amount)}</td>
                <td className="px-4 py-3">{row.date}</td>
                <td className="px-4 py-3">{row.notes || "-"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(row)}
                      className="rounded-md border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                      aria-label="Edit cost"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(row)}
                      className="rounded-md border border-rose-200 p-2 text-rose-600 transition hover:bg-rose-50"
                      aria-label="Delete cost"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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
