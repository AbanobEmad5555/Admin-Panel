"use client";

import { useMemo, useState } from "react";
import type { PosPaymentLine, PosPaymentMethod } from "@/modules/pos/types";
import { formatEGP } from "@/lib/currency";

type PaymentModalProps = {
  open: boolean;
  total: number;
  pending: boolean;
  onClose: () => void;
  onSubmit: (lines: PosPaymentLine[]) => Promise<void>;
};

const methods: PosPaymentMethod[] = ["CASH", "CARD", "WALLET"];

export default function PaymentModal({ open, total, pending, onClose, onSubmit }: PaymentModalProps) {
  const [lines, setLines] = useState<PosPaymentLine[]>([{ method: "CASH", amount: total }]);

  const paid = useMemo(
    () => lines.reduce((sum, line) => sum + (Number.isFinite(line.amount) ? line.amount : 0), 0),
    [lines]
  );
  const change = Math.max(0, paid - total);
  const due = Math.max(0, total - paid);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Payment</h3>
          <button type="button" onClick={onClose} className="text-sm text-slate-500">Close</button>
        </div>

        <div className="space-y-3">
          {lines.map((line, index) => (
            <div key={`${line.method}-${index}`} className="grid grid-cols-1 gap-2 rounded border p-3 md:grid-cols-4">
              <select
                value={line.method}
                onChange={(event) =>
                  setLines((prev) =>
                    prev.map((entry, i) =>
                      i === index ? { ...entry, method: event.target.value as PosPaymentMethod } : entry
                    )
                  )
                }
                className="rounded border border-slate-300 px-2 py-2 text-sm"
              >
                {methods.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="0"
                step="0.01"
                value={line.amount}
                onChange={(event) =>
                  setLines((prev) =>
                    prev.map((entry, i) =>
                      i === index ? { ...entry, amount: Number(event.target.value) } : entry
                    )
                  )
                }
                className="rounded border border-slate-300 px-2 py-2 text-sm"
              />
              <input
                value={line.reference ?? ""}
                onChange={(event) =>
                  setLines((prev) =>
                    prev.map((entry, i) =>
                      i === index ? { ...entry, reference: event.target.value } : entry
                    )
                  )
                }
                placeholder="Reference"
                className="rounded border border-slate-300 px-2 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => setLines((prev) => prev.filter((_, i) => i !== index))}
                disabled={lines.length <= 1}
                className="rounded border border-rose-200 px-2 py-2 text-xs text-rose-600 disabled:opacity-40"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setLines((prev) => [...prev, { method: "CARD", amount: 0 }])}
          className="mt-3 rounded border border-violet-200 px-3 py-2 text-sm text-violet-700"
        >
          Add split payment
        </button>

        <div className="mt-4 rounded bg-slate-50 p-3 text-sm">
          <p className="flex justify-between"><span>Total</span><span>{formatEGP(total)}</span></p>
          <p className="flex justify-between"><span>Paid</span><span>{formatEGP(paid)}</span></p>
          <p className="flex justify-between"><span>Due</span><span>{formatEGP(due)}</span></p>
          <p className="flex justify-between font-semibold"><span>Change</span><span>{formatEGP(change)}</span></p>
        </div>

        <button
          type="button"
          onClick={() => onSubmit(lines)}
          disabled={pending || due > 0}
          className="mt-4 w-full rounded-md bg-violet-600 px-4 py-3 text-sm font-bold text-white disabled:bg-violet-300"
        >
          {pending ? "Processing..." : "Confirm Payment"}
        </button>
      </div>
    </div>
  );
}
