import type { InvoiceLine } from "@/app/admin/invoices/services/invoice.types";
import { formatEGP } from "@/lib/currency";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

export default function InvoiceLineTable({ lines }: { lines: InvoiceLine[] }) {
  const { language } = useLocalization();
  const text =
    language === "ar"
      ? {
          empty: "لا توجد بنود للفاتورة.",
          image: "الصورة",
          product: "المنتج",
          description: "الوصف",
          quantity: "الكمية",
          unitPrice: "سعر الوحدة",
          discount: "الخصم",
          tax: "الضريبة",
          lineTotal: "إجمالي السطر",
          noImage: "لا صورة",
        }
      : {
          empty: "No invoice lines found.",
          image: "Image",
          product: "Product",
          description: "Description",
          quantity: "Qty",
          unitPrice: "Unit Price",
          discount: "Discount",
          tax: "Tax",
          lineTotal: "Line Total",
          noImage: "No image",
        };
  if (!lines.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm">
        {text.empty}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[980px] text-left text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th className="px-4 py-3 font-medium">{text.image}</th>
            <th className="px-4 py-3 font-medium">{text.product}</th>
            <th className="px-4 py-3 font-medium">{text.description}</th>
            <th className="px-4 py-3 font-medium">{text.quantity}</th>
            <th className="px-4 py-3 font-medium">{text.unitPrice}</th>
            <th className="px-4 py-3 font-medium">{text.discount}</th>
            <th className="px-4 py-3 font-medium">{text.tax}</th>
            <th className="px-4 py-3 font-medium">{text.lineTotal}</th>
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
                    {text.noImage}
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
