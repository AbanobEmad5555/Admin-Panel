"use client";

import Link from "next/link";
import DataTable from "@/components/table/DataTable";
import InvoiceStatusBadge from "@/app/admin/invoices/components/InvoiceStatusBadge";
import type { InvoiceListItem } from "@/app/admin/invoices/services/invoice.types";
import { formatEGP } from "@/lib/currency";

const toDate = (value?: string | null) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString();
};

export default function InvoiceTable({ rows }: { rows: InvoiceListItem[] }) {
  return (
    <DataTable
      columns={[
        {
          key: "invoiceNumber",
          header: "Invoice Number",
          render: (value, row) => (
            <Link href={`/admin/invoices/${row.id}`} className="font-medium text-violet-700 hover:underline">
              {String(value)}
            </Link>
          ),
        },
        { key: "customerName", header: "Customer Name" },
        { key: "source", header: "Source" },
        {
          key: "status",
          header: "Status",
          render: (value) => <InvoiceStatusBadge status={value as InvoiceListItem["status"]} />,
        },
        {
          key: "issueDate",
          header: "Issue Date",
          render: (value) => toDate(value as string | null),
        },
        {
          key: "dueDate",
          header: "Due Date",
          render: (value) => toDate(value as string | null),
        },
        {
          key: "grandTotal",
          header: "Grand Total",
          render: (value) => formatEGP(value as number),
        },
        {
          key: "remainingAmount",
          header: "Remaining Amount",
          render: (value) => {
            const remaining = value as number;
            return (
              <span className={remaining > 0 ? "font-semibold text-rose-700" : "font-semibold text-slate-900"}>
                {formatEGP(remaining)}
              </span>
            );
          },
        },
        {
          key: "id",
          header: "Actions",
          render: (value) => (
            <Link
              href={`/admin/invoices/${String(value)}`}
              className="inline-flex rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              View
            </Link>
          ),
        },
      ]}
      rows={rows}
    />
  );
}
