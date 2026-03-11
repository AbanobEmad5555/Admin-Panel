"use client";

import { useState } from "react";
import POSLayout from "@/modules/pos/components/POSLayout";
import ReportsTable from "@/modules/pos/components/ReportsTable";
import { useTopProducts } from "@/modules/pos/hooks/useReports";
import { useLocalization } from "@/modules/localization/LocalizationProvider";
import { formatEGP } from "@/lib/currency";

const today = () => new Date().toISOString().slice(0, 10);

export default function PosTopProductsPage() {
  const { language } = useLocalization();
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(today());
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading, isError } = useTopProducts({ from, to, page, limit });

  const text =
    language === "ar"
      ? {
          title: "أفضل المنتجات",
          description: "الأكثر مبيعًا مع ترقيم الصفحات وفلتر نطاق التاريخ.",
          from: "من",
          to: "إلى",
          page: "الصفحة",
          loading: "جارٍ تحميل أفضل المنتجات...",
          failed: "تعذر تحميل أفضل المنتجات.",
          product: "المنتج",
          qtySold: "الكمية المباعة",
          revenue: "الإيراد",
          pageOf: (current: number, total: number) => `الصفحة ${current} من ${total}`,
          previous: "السابق",
          next: "التالي",
        }
      : {
          title: "Top Products",
          description: "Best sellers with pagination and date range filter.",
          from: "From",
          to: "To",
          page: "Page",
          loading: "Loading top products...",
          failed: "Failed to load top products.",
          product: "Product",
          qtySold: "Qty Sold",
          revenue: "Revenue",
          pageOf: (current: number, total: number) => `Page ${current} of ${total}`,
          previous: "Previous",
          next: "Next",
        };

  return (
    <POSLayout title={text.title} description={text.description}>
      <div className="grid grid-cols-1 gap-3 rounded-xl bg-white p-4 shadow-sm md:grid-cols-3">
        <div>
          <label className="text-sm font-medium text-slate-700">{text.from}</label>
          <input
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">{text.to}</label>
          <input
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">{text.page}</label>
          <input
            type="number"
            min="1"
            value={page}
            onChange={(event) => setPage(Number(event.target.value) || 1)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-xl bg-white p-6 text-sm text-slate-500">{text.loading}</div>
      ) : null}
      {isError ? (
        <div className="rounded-xl bg-rose-50 p-6 text-sm text-rose-700">{text.failed}</div>
      ) : null}

      <ReportsTable
        columns={[
          { key: "name", label: text.product },
          { key: "qtySold", label: text.qtySold },
          { key: "revenue", label: text.revenue },
        ]}
        rows={(data?.items ?? []).map((item) => ({
          name: item.name,
          qtySold: item.qtySold,
          revenue: formatEGP(item.revenue),
        }))}
      />

      <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-600">{text.pageOf(data?.page ?? page, data?.totalPages ?? 1)}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={(data?.page ?? page) <= 1}
            className="rounded border border-slate-300 px-3 py-2 text-xs text-slate-700 disabled:opacity-40"
          >
            {text.previous}
          </button>
          <button
            type="button"
            onClick={() => setPage((prev) => prev + 1)}
            disabled={Boolean(data && data.page >= data.totalPages)}
            className="rounded border border-slate-300 px-3 py-2 text-xs text-slate-700 disabled:opacity-40"
          >
            {text.next}
          </button>
        </div>
      </div>
    </POSLayout>
  );
}
