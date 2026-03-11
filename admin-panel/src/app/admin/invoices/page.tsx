"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import Button from "@/components/ui/Button";
import InvoiceFilters from "@/app/admin/invoices/components/InvoiceFilters";
import InvoiceTable from "@/app/admin/invoices/components/InvoiceTable";
import { useInvoices } from "@/app/admin/invoices/hooks/useInvoices";
import type { InvoiceListFilters } from "@/app/admin/invoices/services/invoice.types";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

const PAGE_SIZE = 10;

export default function InvoicesListPage() {
  const { language } = useLocalization();
  const [filters, setFilters] = useState<InvoiceListFilters>({
    page: 1,
    limit: PAGE_SIZE,
    sortBy: "issueDate",
    sortOrder: "desc",
  });

  const { data, isLoading, isError, refetch } = useInvoices(filters);
  const page = data?.page ?? filters.page ?? 1;
  const totalPages = data?.totalPages ?? 1;

  const rows = useMemo(() => data?.items ?? [], [data?.items]);
  const text =
    language === "ar"
      ? {
          layoutTitle: "الفواتير",
          title: "الفواتير",
          subtitle: "إدارة فواتير العملاء والمدفوعات والإشعارات الدائنة.",
          refresh: "تحديث",
          createFromOrder: "إنشاء من طلب",
          loadError: "فشل تحميل الفواتير.",
          emptyTitle: "لا توجد فواتير",
          emptySubtitle: "عدّل عوامل التصفية أو أنشئ فاتورة من طلب.",
          createInvoice: "إنشاء فاتورة",
          previous: "السابق",
          next: "التالي",
          page: "الصفحة",
          of: "من",
        }
      : {
          layoutTitle: "Invoices",
          title: "Invoices",
          subtitle: "Manage customer invoices, payments & credit notes.",
          refresh: "Refresh",
          createFromOrder: "Create From Order",
          loadError: "Failed to load invoices.",
          emptyTitle: "No invoices found",
          emptySubtitle: "Adjust your filters or create an invoice from an order.",
          createInvoice: "Create Invoice",
          previous: "Previous",
          next: "Next",
          page: "Page",
          of: "of",
        };

  return (
    <AdminLayout title={text.layoutTitle}>
      <section className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">{text.title}</h1>
              <p className="text-sm text-slate-500">{text.subtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" onClick={() => void refetch()}>
                {text.refresh}
              </Button>
              <Link href="/admin/invoices/create-from-order">
                <Button type="button">{text.createFromOrder}</Button>
              </Link>
            </div>
          </div>
        </div>

        <InvoiceFilters
          value={filters}
          onChange={(next) => setFilters({ ...next, page: 1, limit: PAGE_SIZE })}
        />

        {isLoading ? (
          <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="h-8 animate-pulse rounded bg-slate-200" />
            <div className="h-8 animate-pulse rounded bg-slate-200" />
            <div className="h-8 animate-pulse rounded bg-slate-200" />
          </div>
        ) : null}

        {isError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 shadow-sm">
            {text.loadError}
          </div>
        ) : null}

        {!isLoading && !isError && rows.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">{text.emptyTitle}</h2>
            <p className="mt-1 text-sm text-slate-500">{text.emptySubtitle}</p>
            <div className="mt-4">
              <Link href="/admin/invoices/create-from-order">
                <Button type="button">{text.createInvoice}</Button>
              </Link>
            </div>
          </div>
        ) : null}

        {!isLoading && !isError && rows.length > 0 ? <InvoiceTable rows={rows} /> : null}

        {!isLoading && !isError && rows.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <Button
              type="button"
              variant="secondary"
              disabled={page <= 1}
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  page: Math.max(1, (prev.page ?? 1) - 1),
                }))
              }
            >
              {text.previous}
            </Button>
            <div className="text-sm text-slate-600">
              {text.page} <span className="font-semibold">{page}</span> {text.of}{" "}
              <span className="font-semibold">{totalPages}</span>
            </div>
            <Button
              type="button"
              variant="secondary"
              disabled={page >= totalPages}
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  page: Math.min(totalPages, (prev.page ?? 1) + 1),
                }))
              }
            >
              {text.next}
            </Button>
          </div>
        ) : null}
      </section>
    </AdminLayout>
  );
}

