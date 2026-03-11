 "use client";

import { Pencil, Trash2 } from "lucide-react";
import { formatEGP } from "@/lib/currency";
import { costCategoryArabicLabels, costCategoryLabels } from "@/components/purchases/constants";
import type { CostRow } from "@/components/purchases/types";
import { useLocalization } from "@/modules/localization/LocalizationProvider";
import LocalizedDisplayText from "@/modules/shared/components/LocalizedDisplayText";

type CostsTableProps = {
  rows: CostRow[];
  onEdit: (row: CostRow) => void;
  onDelete: (row: CostRow) => void;
};

export default function CostsTable({ rows, onEdit, onDelete }: CostsTableProps) {
  const { language } = useLocalization();
  const text =
    language === "ar"
      ? {
          costName: "اسم المصروف",
          category: "الفئة",
          amount: "المبلغ",
          date: "التاريخ",
          notes: "الملاحظات",
          actions: "الإجراءات",
          editCost: "تعديل المصروف",
          deleteCost: "حذف المصروف",
        }
      : {
          costName: "Cost Name",
          category: "Category",
          amount: "Amount",
          date: "Date",
          notes: "Notes",
          actions: "Actions",
          editCost: "Edit cost",
          deleteCost: "Delete cost",
        };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-[860px] w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-semibold">{text.costName}</th>
              <th className="px-4 py-3 font-semibold">{text.category}</th>
              <th className="px-4 py-3 font-semibold">{text.amount}</th>
              <th className="px-4 py-3 font-semibold">{text.date}</th>
              <th className="px-4 py-3 font-semibold">{text.notes}</th>
              <th className="px-4 py-3 font-semibold">{text.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.map((row) => (
              <tr key={row.id} className="text-slate-700">
                <td className="px-4 py-3 font-medium text-slate-900">
                  <LocalizedDisplayText
                    valueEn={row.costNameEn}
                    valueAr={row.costNameAr}
                    legacyValue={row.name}
                  />
                </td>
                <td className="px-4 py-3">
                  {language === "ar"
                    ? costCategoryArabicLabels[row.category]
                    : costCategoryLabels[row.category]}
                </td>
                <td className="px-4 py-3">{formatEGP(row.amount)}</td>
                <td className="px-4 py-3">{row.date}</td>
                <td className="px-4 py-3">{row.notes || "-"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(row)}
                      className="rounded-md border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                      aria-label={text.editCost}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(row)}
                      className="rounded-md border border-rose-200 p-2 text-rose-600 transition hover:bg-rose-50"
                      aria-label={text.deleteCost}
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
