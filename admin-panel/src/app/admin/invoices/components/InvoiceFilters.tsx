"use client";

import type { InvoiceListFilters, InvoiceSource, InvoiceStatus } from "@/app/admin/invoices/services/invoice.types";

type Props = {
  value: InvoiceListFilters;
  onChange: (next: InvoiceListFilters) => void;
};

const STATUS_OPTIONS: Array<{ label: string; value: InvoiceStatus | "" }> = [
  { label: "All Statuses", value: "" },
  { label: "DRAFT", value: "DRAFT" },
  { label: "POSTED", value: "POSTED" },
  { label: "SENT", value: "SENT" },
  { label: "PARTIAL", value: "PARTIAL" },
  { label: "PAID", value: "PAID" },
  { label: "OVERDUE", value: "OVERDUE" },
  { label: "CANCELED", value: "CANCELED" },
];

const SOURCE_OPTIONS: Array<{ label: string; value: InvoiceSource | "" }> = [
  { label: "All Sources", value: "" },
  { label: "ORDER", value: "ORDER" },
  { label: "TEMP_ORDER", value: "TEMP_ORDER" },
  { label: "POS_ORDER", value: "POS_ORDER" },
];

export default function InvoiceFilters({ value, onChange }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="text-xs font-medium text-slate-600">Status</label>
          <select
            value={value.status ?? ""}
            onChange={(event) => onChange({ ...value, status: event.target.value as InvoiceStatus | "" })}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Order Type</label>
          <select
            value={value.orderType ?? ""}
            onChange={(event) => onChange({ ...value, orderType: event.target.value as InvoiceSource | "" })}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          >
            {SOURCE_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Date From</label>
          <input
            type="date"
            value={value.dateFrom ?? ""}
            onChange={(event) => onChange({ ...value, dateFrom: event.target.value || undefined })}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Date To</label>
          <input
            type="date"
            value={value.dateTo ?? ""}
            onChange={(event) => onChange({ ...value, dateTo: event.target.value || undefined })}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Customer</label>
          <input
            type="text"
            value={value.customer ?? ""}
            onChange={(event) => onChange({ ...value, customer: event.target.value || undefined })}
            placeholder="Search customer"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Min Total</label>
          <input
            type="number"
            min={0}
            value={value.minTotal ?? ""}
            onChange={(event) =>
              onChange({
                ...value,
                minTotal: event.target.value ? Number(event.target.value) : undefined,
              })
            }
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Max Total</label>
          <input
            type="number"
            min={0}
            value={value.maxTotal ?? ""}
            onChange={(event) =>
              onChange({
                ...value,
                maxTotal: event.target.value ? Number(event.target.value) : undefined,
              })
            }
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Sort By</label>
          <select
            value={value.sortBy ?? "issueDate"}
            onChange={(event) => onChange({ ...value, sortBy: event.target.value })}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="issueDate">Issue Date</option>
            <option value="dueDate">Due Date</option>
            <option value="grandTotal">Grand Total</option>
            <option value="status">Status</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Sort Order</label>
          <select
            value={value.sortOrder ?? "desc"}
            onChange={(event) => onChange({ ...value, sortOrder: event.target.value as "asc" | "desc" })}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>
    </div>
  );
}

