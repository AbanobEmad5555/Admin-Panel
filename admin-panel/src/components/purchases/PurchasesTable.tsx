import { CheckCircle2, Pencil, RefreshCcw, Trash2 } from "lucide-react";
import { formatEGP } from "@/lib/currency";
import PurchaseStatusBadge from "@/components/purchases/PurchaseStatusBadge";
import type { PurchaseRow } from "@/components/purchases/types";
import { useLocalization } from "@/modules/localization/LocalizationProvider";
import LocalizedDisplayText from "@/modules/shared/components/LocalizedDisplayText";

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
  const { language } = useLocalization();
  const text =
    language === "ar"
      ? {
          product: "المنتج",
          purchaseId: "رقم الشراء",
          supplier: "المورد",
          quantity: "الكمية",
          unitCost: "تكلفة الوحدة",
          totalCost: "التكلفة الإجمالية",
          expectedArrival: "الوصول المتوقع",
          status: "الحالة",
          actions: "الإجراءات",
          delivered: "تم التسليم",
          expected: "متوقع",
          editPurchase: "تعديل الشراء",
          deletePurchase: "حذف الشراء",
          updateStatus: "تحديث الحالة",
          approveProduct: "اعتماد المنتج",
        }
      : {
          product: "Product",
          purchaseId: "Purchase ID",
          supplier: "Supplier",
          quantity: "Quantity",
          unitCost: "Unit Cost",
          totalCost: "Total Cost",
          expectedArrival: "Expected Arrival",
          status: "Status",
          actions: "Actions",
          delivered: "Delivered",
          expected: "Expected",
          editPurchase: "Edit purchase",
          deletePurchase: "Delete purchase",
          updateStatus: "Update status",
          approveProduct: "Approve product",
        };
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className={`min-w-[980px] w-full text-sm ${language === "ar" ? "text-right" : "text-left"}`}>
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-semibold">{text.product}</th>
              <th className="px-4 py-3 font-semibold">{text.purchaseId}</th>
              <th className="px-4 py-3 font-semibold">{text.supplier}</th>
              <th className="px-4 py-3 font-semibold">{text.quantity}</th>
              <th className="px-4 py-3 font-semibold">{text.unitCost}</th>
              <th className="px-4 py-3 font-semibold">{text.totalCost}</th>
              <th className="px-4 py-3 font-semibold">{text.expectedArrival}</th>
              <th className="px-4 py-3 font-semibold">{text.status}</th>
              <th className="px-4 py-3 font-semibold">{text.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.map((row) => (
              <tr key={row.id} className="text-slate-700">
                <td className="px-4 py-3 font-medium text-slate-900">
                  <LocalizedDisplayText
                    valueEn={row.productNameEn}
                    valueAr={row.productNameAr}
                    legacyValue={row.productName}
                  />
                </td>
                <td className="px-4 py-3">{row.purchaseId}</td>
                <td className="px-4 py-3">
                  <LocalizedDisplayText
                    valueEn={row.supplierNameEn}
                    valueAr={row.supplierNameAr}
                    legacyValue={row.supplierName}
                  />
                </td>
                <td className="px-4 py-3">{row.quantity}</td>
                <td className="px-4 py-3">{formatEGP(row.unitCost)}</td>
                <td className="px-4 py-3">{formatEGP(row.totalCost)}</td>
                <td className="px-4 py-3">
                  {row.status === "DELIVERED" ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      {text.delivered}
                    </span>
                  ) : row.status === "IN_TRANSIT" ? (
                    <span className="text-slate-600">{text.expected}: {row.expectedArrivalDate || "-"}</span>
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
                      aria-label={text.editPurchase}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(row)}
                      className="rounded-md border border-rose-200 p-2 text-rose-600 transition hover:bg-rose-50"
                      aria-label={text.deletePurchase}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(row)}
                      className="rounded-md border border-amber-200 p-2 text-amber-700 transition hover:bg-amber-50"
                      aria-label={text.updateStatus}
                    >
                      <RefreshCcw className="h-4 w-4" />
                    </button>
                    {row.pendingApproval ? (
                      <button
                        type="button"
                        onClick={() => onApproveProduct(row)}
                        className="rounded-md border border-emerald-200 p-2 text-emerald-700 transition hover:bg-emerald-50"
                        aria-label={text.approveProduct}
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
