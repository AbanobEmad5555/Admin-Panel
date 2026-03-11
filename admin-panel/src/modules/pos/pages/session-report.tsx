"use client";

import { useState } from "react";
import POSLayout from "@/modules/pos/components/POSLayout";
import ReportsTable from "@/modules/pos/components/ReportsTable";
import { useCurrentSession } from "@/modules/pos/hooks/useSession";
import { useSessionReport } from "@/modules/pos/hooks/useReports";
import { useLocalization } from "@/modules/localization/LocalizationProvider";
import { formatEGP } from "@/lib/currency";

export default function PosSessionReportPage() {
  const { language } = useLocalization();
  const { data: currentSession } = useCurrentSession();
  const [sessionId, setSessionId] = useState("");
  const effectiveSessionId = sessionId.trim() || currentSession?.id;
  const { data, isLoading, isError } = useSessionReport(effectiveSessionId);

  const text =
    language === "ar"
      ? {
          title: "تقرير الجلسة",
          description: "مراجعة المبيعات ونشاط المدفوعات لجلسة نقطة بيع واحدة.",
          sessionId: "معرّف الجلسة",
          current: "الحالي",
          enterSessionId: "أدخل معرّف الجلسة",
          loading: "جارٍ تحميل تقرير الجلسة...",
          failed: "تعذر تحميل تقرير الجلسة.",
          totalSales: "إجمالي المبيعات",
          totalTax: "إجمالي الضريبة",
          totalDiscount: "إجمالي الخصم",
          orders: "الطلبات",
          orderId: "معرّف الطلب",
          status: "الحالة",
          total: "الإجمالي",
        }
      : {
          title: "Session Report",
          description: "Inspect sales and payment activity for one POS session.",
          sessionId: "Session ID",
          current: "Current",
          enterSessionId: "Enter session id",
          loading: "Loading session report...",
          failed: "Failed to load session report.",
          totalSales: "Total Sales",
          totalTax: "Total Tax",
          totalDiscount: "Total Discount",
          orders: "Orders",
          orderId: "Order ID",
          status: "Status",
          total: "Total",
        };

  return (
    <POSLayout title={text.title} description={text.description}>
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <label className="text-sm font-medium text-slate-700">{text.sessionId}</label>
        <input
          value={sessionId}
          onChange={(event) => setSessionId(event.target.value)}
          placeholder={
            currentSession?.id ? `${text.current}: ${currentSession.id}` : text.enterSessionId
          }
          className="mt-1 w-full max-w-sm rounded border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      {isLoading ? (
        <div className="rounded-xl bg-white p-6 text-sm text-slate-500">{text.loading}</div>
      ) : null}
      {isError ? (
        <div className="rounded-xl bg-rose-50 p-6 text-sm text-rose-700">{text.failed}</div>
      ) : null}

      {data ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">{text.totalSales}</p>
            <p className="text-xl font-bold text-violet-700">{formatEGP(data.totalSales)}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">{text.totalTax}</p>
            <p className="text-xl font-bold text-violet-700">{formatEGP(data.totalTax)}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">{text.totalDiscount}</p>
            <p className="text-xl font-bold text-violet-700">{formatEGP(data.totalDiscount)}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">{text.orders}</p>
            <p className="text-xl font-bold text-violet-700">{data.ordersCount}</p>
          </div>
        </div>
      ) : null}

      <ReportsTable
        columns={[
          { key: "id", label: text.orderId },
          { key: "status", label: text.status },
          { key: "total", label: text.total },
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
