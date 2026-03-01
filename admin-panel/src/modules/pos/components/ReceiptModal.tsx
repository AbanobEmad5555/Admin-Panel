"use client";

import type { PosOrder } from "@/modules/pos/types";
import { formatEGP } from "@/lib/currency";

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <h3 className="text-lg font-bold text-slate-900">Receipt</h3>
        <div className="mt-1 space-y-1 text-xs text-slate-500">
          <p className="flex items-center gap-2">
            <span>POS Order: #{order.id}</span>
            <button
              type="button"
              onClick={() => void copyValue(String(order.id))}
              className="rounded border border-slate-300 px-2 py-0.5 text-[11px] text-slate-600"
            >
              Copy
            </button>
          </p>
          {order.tempOrderId ? (
            <p className="flex items-center gap-2">
              <span>Temp Order: #{order.tempOrderId}</span>
              <button
                type="button"
                onClick={() => void copyValue(String(order.tempOrderId))}
                className="rounded border border-slate-300 px-2 py-0.5 text-[11px] text-slate-600"
              >
                Copy
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
          <p className="flex justify-between"><span>Subtotal</span><span>{formatEGP(order.subtotal)}</span></p>
          <p className="flex justify-between"><span>Tax</span><span>{formatEGP(order.tax)}</span></p>
          <p className="flex justify-between"><span>Discount</span><span>{formatEGP(order.discount)}</span></p>
          <p className="flex justify-between font-bold"><span>Total</span><span>{formatEGP(order.total)}</span></p>
        </div>

        <div className="no-print mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={onPrint}
            className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Print Invoice
          </button>
          <button
            type="button"
            onClick={() => void onGenerateInvoice()}
            disabled={generatingInvoice}
            className="rounded bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {generatingInvoice ? "Generating..." : "Generate Invoice"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
