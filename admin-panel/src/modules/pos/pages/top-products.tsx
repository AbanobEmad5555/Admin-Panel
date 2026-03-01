"use client";

import { useState } from "react";
import POSLayout from "@/modules/pos/components/POSLayout";
import ReportsTable from "@/modules/pos/components/ReportsTable";
import { useTopProducts } from "@/modules/pos/hooks/useReports";
import { formatEGP } from "@/lib/currency";

const today = () => new Date().toISOString().slice(0, 10);

export default function PosTopProductsPage() {
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(today());
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading, isError } = useTopProducts({ from, to, page, limit });

  return (
    <POSLayout
      title="Top Products"
      description="Best sellers with pagination and date range filter."
    >
      <div className="grid grid-cols-1 gap-3 rounded-xl bg-white p-4 shadow-sm md:grid-cols-3">
        <div>
          <label className="text-sm font-medium text-slate-700">From</label>
          <input
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">To</label>
          <input
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Page</label>
          <input
            type="number"
            min="1"
            value={page}
            onChange={(event) => setPage(Number(event.target.value) || 1)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {isLoading ? <div className="rounded-xl bg-white p-6 text-sm text-slate-500">Loading top products...</div> : null}
      {isError ? <div className="rounded-xl bg-rose-50 p-6 text-sm text-rose-700">Failed to load top products.</div> : null}

      <ReportsTable
        columns={[
          { key: "name", label: "Product" },
          { key: "qtySold", label: "Qty Sold" },
          { key: "revenue", label: "Revenue" },
        ]}
        rows={(data?.items ?? []).map((item) => ({
          name: item.name,
          qtySold: item.qtySold,
          revenue: formatEGP(item.revenue),
        }))}
      />

      <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-600">
          Page {data?.page ?? page} of {data?.totalPages ?? 1}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={(data?.page ?? page) <= 1}
            className="rounded border border-slate-300 px-3 py-2 text-xs text-slate-700 disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setPage((prev) => prev + 1)}
            disabled={Boolean(data && (data.page >= data.totalPages))}
            className="rounded border border-slate-300 px-3 py-2 text-xs text-slate-700 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </POSLayout>
  );
}
