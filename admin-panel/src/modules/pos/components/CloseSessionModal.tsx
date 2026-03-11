"use client";

import { useState } from "react";
import type { PosSession } from "@/modules/pos/types";
import { formatEGP } from "@/lib/currency";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

type CloseSessionModalProps = {
  open: boolean;
  pending: boolean;
  session: PosSession | null | undefined;
  onClose: () => void;
  onSubmit: (closingBalance: number) => Promise<void>;
};

export default function CloseSessionModal({
  open,
  pending,
  session,
  onClose,
  onSubmit,
}: CloseSessionModalProps) {
  const { language } = useLocalization();
  const [closingBalance, setClosingBalance] = useState(0);

  if (!open) {
    return null;
  }

  const expected = session?.expectedClosingBalance ?? 0;
  const sales = session?.totalSales ?? 0;
  const diff = closingBalance - expected;
  const text =
    language === "ar"
      ? {
          title: "إغلاق الجلسة",
          totalSales: "إجمالي المبيعات",
          expectedBalance: "الرصيد المتوقع",
          closingBalance: "الرصيد الختامي",
          difference: "الفرق",
          cancel: "إلغاء",
          closing: "جارٍ الإغلاق...",
          closeSession: "إغلاق الجلسة",
        }
      : {
          title: "Close Session",
          totalSales: "Total Sales",
          expectedBalance: "Expected Balance",
          closingBalance: "Closing balance",
          difference: "Difference",
          cancel: "Cancel",
          closing: "Closing...",
          closeSession: "Close Session",
        };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
        <h3 className="text-lg font-bold text-slate-900">{text.title}</h3>
        <div className="mt-3 space-y-1 rounded bg-slate-50 p-3 text-sm">
          <p className="flex justify-between"><span>{text.totalSales}</span><span>{formatEGP(sales)}</span></p>
          <p className="flex justify-between"><span>{text.expectedBalance}</span><span>{formatEGP(expected)}</span></p>
        </div>

        <input
          type="number"
          min="0"
          step="0.01"
          value={closingBalance}
          onChange={(event) => setClosingBalance(Number(event.target.value))}
          className="mt-3 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          placeholder={text.closingBalance}
        />

        <p className={`mt-2 text-sm ${diff === 0 ? "text-slate-600" : "text-amber-600"}`}>
          {text.difference}: {formatEGP(diff)}
        </p>

        <div className="mt-4 flex gap-2">
          <button type="button" onClick={onClose} className="w-1/2 rounded border px-3 py-2 text-sm">
            {text.cancel}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => onSubmit(closingBalance)}
            className="w-1/2 rounded bg-violet-600 px-3 py-2 text-sm font-semibold text-white disabled:bg-violet-300"
          >
            {pending ? text.closing : text.closeSession}
          </button>
        </div>
      </div>
    </div>
  );
}
