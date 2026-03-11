"use client";

import type { InvoiceListFilters, InvoiceSource, InvoiceStatus } from "@/app/admin/invoices/services/invoice.types";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

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
  const { language } = useLocalization();
  const statusOptions: Array<{ label: string; value: InvoiceStatus | "" }> =
    language === "ar"
      ? [
          { label: "كل الحالات", value: "" },
          { label: "مسودة", value: "DRAFT" },
          { label: "مرحلة", value: "POSTED" },
          { label: "مرسلة", value: "SENT" },
          { label: "مدفوع جزئيًا", value: "PARTIAL" },
          { label: "مدفوعة", value: "PAID" },
          { label: "متأخرة", value: "OVERDUE" },
          { label: "ملغاة", value: "CANCELED" },
        ]
      : STATUS_OPTIONS;
  const sourceOptions: Array<{ label: string; value: InvoiceSource | "" }> =
    language === "ar"
      ? [
          { label: "كل المصادر", value: "" },
          { label: "طلب", value: "ORDER" },
          { label: "طلب مؤقت", value: "TEMP_ORDER" },
          { label: "طلب نقطة بيع", value: "POS_ORDER" },
        ]
      : SOURCE_OPTIONS;
  const text =
    language === "ar"
      ? {
          status: "الحالة",
          orderType: "نوع الطلب",
          dateFrom: "من تاريخ",
          dateTo: "إلى تاريخ",
          customer: "العميل",
          customerPlaceholder: "ابحث عن عميل",
          minTotal: "الحد الأدنى للإجمالي",
          maxTotal: "الحد الأقصى للإجمالي",
          sortBy: "ترتيب حسب",
          issueDate: "تاريخ الإصدار",
          dueDate: "تاريخ الاستحقاق",
          grandTotal: "الإجمالي الكلي",
          sortOrder: "اتجاه الترتيب",
          descending: "تنازلي",
          ascending: "تصاعدي",
        }
      : {
          status: "Status",
          orderType: "Order Type",
          dateFrom: "Date From",
          dateTo: "Date To",
          customer: "Customer",
          customerPlaceholder: "Search customer",
          minTotal: "Min Total",
          maxTotal: "Max Total",
          sortBy: "Sort By",
          issueDate: "Issue Date",
          dueDate: "Due Date",
          grandTotal: "Grand Total",
          sortOrder: "Sort Order",
          descending: "Descending",
          ascending: "Ascending",
        };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="text-xs font-medium text-slate-600">{text.status}</label>
          <select
            value={value.status ?? ""}
            onChange={(event) => onChange({ ...value, status: event.target.value as InvoiceStatus | "" })}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          >
            {statusOptions.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">{text.orderType}</label>
          <select
            value={value.orderType ?? ""}
            onChange={(event) => onChange({ ...value, orderType: event.target.value as InvoiceSource | "" })}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          >
            {sourceOptions.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">{text.dateFrom}</label>
          <input
            type="date"
            value={value.dateFrom ?? ""}
            onChange={(event) => onChange({ ...value, dateFrom: event.target.value || undefined })}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">{text.dateTo}</label>
          <input
            type="date"
            value={value.dateTo ?? ""}
            onChange={(event) => onChange({ ...value, dateTo: event.target.value || undefined })}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">{text.customer}</label>
          <input
            type="text"
            value={value.customer ?? ""}
            onChange={(event) => onChange({ ...value, customer: event.target.value || undefined })}
            placeholder={text.customerPlaceholder}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">{text.minTotal}</label>
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
          <label className="text-xs font-medium text-slate-600">{text.maxTotal}</label>
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
          <label className="text-xs font-medium text-slate-600">{text.sortBy}</label>
          <select
            value={value.sortBy ?? "issueDate"}
            onChange={(event) => onChange({ ...value, sortBy: event.target.value })}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="issueDate">{text.issueDate}</option>
            <option value="dueDate">{text.dueDate}</option>
            <option value="grandTotal">{text.grandTotal}</option>
            <option value="status">Status</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">{text.sortOrder}</label>
          <select
            value={value.sortOrder ?? "desc"}
            onChange={(event) => onChange({ ...value, sortOrder: event.target.value as "asc" | "desc" })}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="desc">{text.descending}</option>
            <option value="asc">{text.ascending}</option>
          </select>
        </div>
      </div>
    </div>
  );
}

