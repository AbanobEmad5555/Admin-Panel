"use client";

import type { CartItem } from "@/modules/pos/store/pos.store";
import { formatEGP } from "@/lib/currency";

type CartPanelProps = {
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  customerName: string;
  customerMobileNumber: string;
  note: string;
  loyaltyProgramCode: string;
  onQtyChange: (productId: string, qty: number) => void;
  onRemove: (productId: string) => void;
  onCustomerNameChange: (value: string) => void;
  onCustomerMobileNumberChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onLoyaltyProgramCodeChange: (value: string) => void;
  onResetProgram: () => void;
  canRefund: boolean;
  onOpenRefund: () => void;
  onOpenPayment: () => void;
};

const keypad = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "C"];

export default function CartPanel(props: CartPanelProps) {
  const {
    items,
    subtotal,
    tax,
    discount,
    total,
    customerName,
    customerMobileNumber,
    note,
    loyaltyProgramCode,
    onQtyChange,
    onRemove,
    onCustomerNameChange,
    onCustomerMobileNumberChange,
    onNoteChange,
    onLoyaltyProgramCodeChange,
    onResetProgram,
    canRefund,
    onOpenRefund,
    onOpenPayment,
  } = props;

  return (
    <div className="w-full rounded-2xl bg-white p-4 shadow-md lg:w-[360px]">
      <h2 className="text-lg font-bold text-slate-900">Cart</h2>

      <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
        {items.length === 0 ? (
          <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-500">No items added yet.</p>
        ) : null}
        {items.map((item) => (
          <div key={item.productId} className="rounded-md border border-slate-200 p-2">
            <p className="text-sm font-semibold text-slate-800">{item.name}</p>
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onQtyChange(item.productId, item.qty - 1)}
                className="rounded border px-2 py-1 text-xs"
              >
                -
              </button>
              <span className="min-w-6 text-center text-sm">{item.qty}</span>
              <button
                type="button"
                onClick={() => onQtyChange(item.productId, item.qty + 1)}
                className="rounded border px-2 py-1 text-xs"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => onRemove(item.productId)}
                className="ml-auto rounded border border-rose-200 px-2 py-1 text-xs text-rose-600"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        <label className="text-xs font-medium text-slate-600">Customer Name</label>
        <input
          value={customerName}
          onChange={(event) => onCustomerNameChange(event.target.value)}
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          placeholder="Customer name"
        />

        <label className="text-xs font-medium text-slate-600">Customer Mobile Number</label>
        <input
          value={customerMobileNumber}
          onChange={(event) => onCustomerMobileNumberChange(event.target.value)}
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          placeholder="Customer mobile number"
        />

        <label className="text-xs font-medium text-slate-600">Customer Note</label>
        <textarea
          value={note}
          onChange={(event) => onNoteChange(event.target.value)}
          rows={2}
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          placeholder="Add a note"
        />

        <label className="text-xs font-medium text-slate-600">Loyalty / Program Code</label>
        <div className="flex gap-2">
          <input
            value={loyaltyProgramCode}
            onChange={(event) => onLoyaltyProgramCodeChange(event.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            placeholder="Enter code"
          />
          <button
            type="button"
            onClick={onResetProgram}
            className="rounded border border-slate-300 px-3 py-2 text-xs text-slate-700"
          >
            Reset
          </button>
        </div>
        <p className="text-xs text-slate-500">All customer fields are optional.</p>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {keypad.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              if (key === "C") {
                onLoyaltyProgramCodeChange("");
                return;
              }
              onLoyaltyProgramCodeChange(`${loyaltyProgramCode}${key}`);
            }}
            className="rounded bg-violet-50 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-100"
          >
            {key}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-1 rounded-md bg-slate-50 p-3 text-sm">
        <p className="flex justify-between"><span>Subtotal</span><span>{formatEGP(subtotal)}</span></p>
        <p className="flex justify-between"><span>Tax</span><span>{formatEGP(tax)}</span></p>
        <p className="flex justify-between"><span>Discount</span><span>{formatEGP(discount)}</span></p>
        <p className="flex justify-between text-base font-bold text-slate-900"><span>Total</span><span>{formatEGP(total)}</span></p>
      </div>

      <div className="mt-4 flex gap-2">
        {canRefund ? (
          <button
            type="button"
            onClick={onOpenRefund}
            className="w-1/2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700"
          >
            Refund
          </button>
        ) : null}
        <button
          type="button"
          onClick={onOpenPayment}
          className={`${canRefund ? "w-1/2" : "w-full"} rounded-md bg-violet-600 px-3 py-2 text-sm font-bold text-white shadow hover:bg-violet-700`}
        >
          Payment
        </button>
      </div>
    </div>
  );
}
