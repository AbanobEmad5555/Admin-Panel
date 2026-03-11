"use client";

import Link from "next/link";
import DataTable from "@/components/table/DataTable";
import InvoiceStatusBadge from "@/app/admin/invoices/components/InvoiceStatusBadge";
import type { InvoiceListItem } from "@/app/admin/invoices/services/invoice.types";
import { formatEGP } from "@/lib/currency";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

const toDate = (value?: string | null) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString();
};

export default function InvoiceTable({ rows }: { rows: InvoiceListItem[] }) {
  const { language } = useLocalization();
  const text =
    language === "ar"
      ? {
          invoiceNumber: "رقم الفاتورة",
          customerName: "اسم العميل",
          source: "المصدر",
          status: "الحالة",
          issueDate: "تاريخ الإصدار",
          dueDate: "تاريخ الاستحقاق",
          grandTotal: "الإجمالي الكلي",
          remainingAmount: "المبلغ المتبقي",
          actions: "الإجراءات",
          view: "عرض",
        }
      : {
          invoiceNumber: "Invoice Number",
          customerName: "Customer Name",
          source: "Source",
          status: "Status",
          issueDate: "Issue Date",
          dueDate: "Due Date",
          grandTotal: "Grand Total",
          remainingAmount: "Remaining Amount",
          actions: "Actions",
          view: "View",
        };
  return (
    <DataTable
      columns={[
        {
          key: "invoiceNumber",
          header: text.invoiceNumber,
          render: (value, row) => (
            <Link href={`/admin/invoices/${row.id}`} className="font-medium text-violet-700 hover:underline">
              {String(value)}
            </Link>
          ),
        },
        { key: "customerName", header: text.customerName },
        { key: "source", header: text.source },
        {
          key: "status",
          header: text.status,
          render: (value) => <InvoiceStatusBadge status={value as InvoiceListItem["status"]} />,
        },
        {
          key: "issueDate",
          header: text.issueDate,
          render: (value) => toDate(value as string | null),
        },
        {
          key: "dueDate",
          header: text.dueDate,
          render: (value) => toDate(value as string | null),
        },
        {
          key: "grandTotal",
          header: text.grandTotal,
          render: (value) => formatEGP(value as number),
        },
        {
          key: "remainingAmount",
          header: text.remainingAmount,
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
          header: text.actions,
          render: (value) => (
            <Link
              href={`/admin/invoices/${String(value)}`}
              className="inline-flex rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              {text.view}
            </Link>
          ),
        },
      ]}
      rows={rows}
    />
  );
}
