"use client";

import { useState } from "react";
import type { PosPaymentMethod, RefundOrderInput } from "@/modules/pos/types";

type RefundModalProps = {
  open: boolean;
  pending: boolean;
  onClose: () => void;
  onSubmit: (orderId: string, payload: RefundOrderInput) => Promise<void>;
};

const methods: PosPaymentMethod[] = ["CASH", "CARD", "WALLET"];

export default function RefundModal({ open, pending, onClose, onSubmit }: RefundModalProps) {
  const [orderId, setOrderId] = useState("");
  const [reason, setReason] = useState("");
  const [method, setMethod] = useState<PosPaymentMethod>("CASH");
  const [reference, setReference] = useState("");

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
        <h3 className="text-lg font-bold text-slate-900">Refund Order</h3>
        <p className="mt-1 text-xs text-slate-500">Supervisor action only.</p>

        <div className="mt-4 space-y-3">
          <input
            value={orderId}
            onChange={(event) => setOrderId(event.target.value)}
            placeholder="Order ID"
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Refund reason"
            rows={3}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            value={method}
            onChange={(event) => setMethod(event.target.value as PosPaymentMethod)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          >
            {methods.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <input
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            placeholder="Reference"
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="mt-4 flex gap-2">
          <button type="button" onClick={onClose} className="w-1/2 rounded border px-3 py-2 text-sm">
            Cancel
          </button>
          <button
            type="button"
            disabled={pending || !orderId.trim() || !reason.trim()}
            onClick={() =>
              onSubmit(orderId.trim(), {
                reason: reason.trim(),
                method,
                reference: reference.trim() || undefined,
              })
            }
            className="w-1/2 rounded bg-rose-600 px-3 py-2 text-sm font-semibold text-white disabled:bg-rose-300"
          >
            {pending ? "Refunding..." : "Submit Refund"}
          </button>
        </div>
      </div>
    </div>
  );
}
