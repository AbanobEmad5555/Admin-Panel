"use client";

import { useState } from "react";
import type { OpenSessionInput } from "@/modules/pos/types";

type SessionModalProps = {
  open: boolean;
  pending: boolean;
  onSubmit: (payload: OpenSessionInput) => Promise<void>;
};

export default function SessionModal({ open, pending, onSubmit }: SessionModalProps) {
  const [storeId, setStoreId] = useState("MAIN-STORE");
  const [openingBalance, setOpeningBalance] = useState(500);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <h3 className="text-lg font-bold text-slate-900">Open POS Session</h3>
        <p className="mt-1 text-sm text-slate-500">Session is required before creating orders.</p>
        <div className="mt-4 space-y-3">
          <input
            value={storeId}
            onChange={(event) => setStoreId(event.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            placeholder="Store ID"
          />
          <input
            type="number"
            min="0"
            value={openingBalance}
            onChange={(event) => setOpeningBalance(Number(event.target.value))}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            placeholder="Opening Balance"
          />
        </div>
        <button
          type="button"
          disabled={pending || !storeId.trim()}
          onClick={() => onSubmit({ storeId: storeId.trim(), openingBalance })}
          className="mt-4 w-full rounded bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-violet-300"
        >
          {pending ? "Opening..." : "Open Session"}
        </button>
      </div>
    </div>
  );
}
