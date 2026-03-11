"use client";

import type { PosOrder } from "@/modules/pos/types";
import { formatEGP } from "@/lib/currency";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

type ReceiptModalProps = {
  open: boolean;
  order: PosOrder | null;
  generatingInvoice?: boolean;
  onGenerateInvoice: () => Promise<void>;
  onPrint: () => void;
  onClose: () => void;
};

export default function ReceiptModal({
  open,
  order,
  generatingInvoice = false,
  onGenerateInvoice,
  onPrint,
  onClose,
}: ReceiptModalProps) {
  const { language } = useLocalization();
  const copyValue = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // noop
    }
  };

  if (!open || !order) {
    return null;
  }
  const text =
    language === "ar"
      ? {
          title: "الإيصال",
          posOrder: "طلب نقطة البيع",
          tempOrder: "الطلب المؤقت",
          copy: "نسخ",
          subtotal: "الإجمالي الفرعي",
          tax: "الضريبة",
          discount: "الخصم",
          total: "الإجمالي",
          printInvoice: "طباعة الفاتورة",
          generating: "جارٍ الإنشاء...",
          generateInvoice: "إنشاء فاتورة",
          close: "إغلاق",
        }
      : {
          title: "Receipt",
          posOrder: "POS Order",
          tempOrder: "Temp Order",
          copy: "Copy",
          subtotal: "Subtotal",
          tax: "Tax",
          discount: "Discount",
          total: "Total",
          printInvoice: "Print Invoice",
          generating: "Generating...",
          generateInvoice: "Generate Invoice",
          close: "Close",
        };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <h3 className="text-lg font-bold text-slate-900">{text.title}</h3>
        <div className="mt-1 space-y-1 text-xs text-slate-500">
          <p className="flex items-center gap-2">
            <span>{text.posOrder}: #{order.id}</span>
            <button
              type="button"
              onClick={() => void copyValue(String(order.id))}
              className="rounded border border-slate-300 px-2 py-0.5 text-[11px] text-slate-600"
            >
              {text.copy}
            </button>
          </p>
          {order.tempOrderId ? (
            <p className="flex items-center gap-2">
              <span>{text.tempOrder}: #{order.tempOrderId}</span>
              <button
                type="button"
                onClick={() => void copyValue(String(order.tempOrderId))}
                className="rounded border border-slate-300 px-2 py-0.5 text-[11px] text-slate-600"
              >
                {text.copy}
              </button>
            </p>
          ) : null}
        </div>

        <div className="mt-3 max-h-64 space-y-2 overflow-y-auto text-sm">
          {order.items.map((item) => (
            <p key={item.productId} className="flex justify-between">
              <span>
                {item.name} x{item.qty}
              </span>
              <span>{formatEGP(item.qty * item.unitPrice)}</span>
            </p>
          ))}
        </div>

        <div className="mt-4 rounded bg-slate-50 p-3 text-sm">
          <p className="flex justify-between"><span>{text.subtotal}</span><span>{formatEGP(order.subtotal)}</span></p>
          <p className="flex justify-between"><span>{text.tax}</span><span>{formatEGP(order.tax)}</span></p>
          <p className="flex justify-between"><span>{text.discount}</span><span>{formatEGP(order.discount)}</span></p>
          <p className="flex justify-between font-bold"><span>{text.total}</span><span>{formatEGP(order.total)}</span></p>
        </div>

        <div className="no-print mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={onPrint}
            className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            {text.printInvoice}
          </button>
          <button
            type="button"
            onClick={() => void onGenerateInvoice()}
            disabled={generatingInvoice}
            className="rounded bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {generatingInvoice ? text.generating : text.generateInvoice}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            {text.close}
          </button>
        </div>
      </div>
    </div>
  );
}
