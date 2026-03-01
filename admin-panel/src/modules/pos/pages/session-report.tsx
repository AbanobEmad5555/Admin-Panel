"use client";

import { useState } from "react";
import POSLayout from "@/modules/pos/components/POSLayout";
import ReportsTable from "@/modules/pos/components/ReportsTable";
import { useCurrentSession } from "@/modules/pos/hooks/useSession";
import { useSessionReport } from "@/modules/pos/hooks/useReports";
import { formatEGP } from "@/lib/currency";

export default function PosSessionReportPage() {
  const { data: currentSession } = useCurrentSession();
  const [sessionId, setSessionId] = useState("");
  const effectiveSessionId = sessionId.trim() || currentSession?.id;
  const { data, isLoading, isError } = useSessionReport(effectiveSessionId);

  return (
    <POSLayout
      title="Session Report"
      description="Inspect sales and payment activity for one POS session."
    >
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <label className="text-sm font-medium text-slate-700">Session ID</label>
        <input
          value={sessionId}
          onChange={(event) => setSessionId(event.target.value)}
          placeholder={currentSession?.id ? `Current: ${currentSession.id}` : "Enter session id"}
          className="mt-1 w-full max-w-sm rounded border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      {isLoading ? <div className="rounded-xl bg-white p-6 text-sm text-slate-500">Loading session report...</div> : null}
      {isError ? <div className="rounded-xl bg-rose-50 p-6 text-sm text-rose-700">Failed to load session report.</div> : null}

      {data ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-xl bg-white p-4 shadow-sm"><p className="text-xs text-slate-500">Total Sales</p><p className="text-xl font-bold text-violet-700">{formatEGP(data.totalSales)}</p></div>
          <div className="rounded-xl bg-white p-4 shadow-sm"><p className="text-xs text-slate-500">Total Tax</p><p className="text-xl font-bold text-violet-700">{formatEGP(data.totalTax)}</p></div>
          <div className="rounded-xl bg-white p-4 shadow-sm"><p className="text-xs text-slate-500">Total Discount</p><p className="text-xl font-bold text-violet-700">{formatEGP(data.totalDiscount)}</p></div>
          <div className="rounded-xl bg-white p-4 shadow-sm"><p className="text-xs text-slate-500">Orders</p><p className="text-xl font-bold text-violet-700">{data.ordersCount}</p></div>
        </div>
      ) : null}

      <ReportsTable
        columns={[
          { key: "id", label: "Order ID" },
          { key: "status", label: "Status" },
          { key: "total", label: "Total" },
        ]}
        rows={(data?.orders ?? []).map((order) => ({
          id: order.id,
          status: order.status ?? "-",
          total: formatEGP(order.total),
        }))}
      />
    </POSLayout>
  );
}
