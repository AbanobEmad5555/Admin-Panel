"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { AxiosError } from "axios";
import AdminLayout from "@/components/layout/AdminLayout";
import Button from "@/components/ui/Button";
import GradientCard from "@/components/ui/GradientCard";
import PageHeader from "@/components/ui/PageHeader";
import type { DashboardQueryParams, DashboardRange } from "@/modules/dashboard/api/dashboard.types";
import DashboardOrdersPreviewTable from "@/modules/dashboard/components/DashboardOrdersPreviewTable";
import DashboardSeriesChart from "@/modules/dashboard/components/DashboardSeriesChart";
import DashboardSummaryCards from "@/modules/dashboard/components/DashboardSummaryCards";
import { useDashboardData } from "@/modules/dashboard/hooks/useDashboardData";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

const DASHBOARD_ORDERS_LIMIT = 5;

const isDashboardRange = (value: string | null): value is DashboardRange =>
  value === "7d" || value === "30d" || value === "90d" || value === "thisMonth" || value === "custom";

const parseDashboardParams = (searchParams: URLSearchParams): DashboardQueryParams => {
  const range = searchParams.get("range");
  const ordersLimit = Number(searchParams.get("ordersLimit") ?? DASHBOARD_ORDERS_LIMIT);

  return {
    range: isDashboardRange(range) ? range : "30d",
    startDate: searchParams.get("startDate")?.trim() || undefined,
    endDate: searchParams.get("endDate")?.trim() || undefined,
    ordersLimit: Number.isFinite(ordersLimit) ? Math.min(20, Math.max(1, ordersLimit)) : DASHBOARD_ORDERS_LIMIT,
  };
};

const buildDashboardQuery = (params: DashboardQueryParams) => {
  const search = new URLSearchParams();
  search.set("range", params.range ?? "30d");
  search.set("ordersLimit", String(params.ordersLimit ?? DASHBOARD_ORDERS_LIMIT));

  if (params.range === "custom") {
    if (params.startDate) {
      search.set("startDate", params.startDate);
    }
    if (params.endDate) {
      search.set("endDate", params.endDate);
    }
  }

  return search;
};

const getApiErrorMessage = (error: unknown, fallback: string) =>
  ((error as AxiosError<{ message?: string }>)?.response?.data?.message ?? fallback);

type DashboardCustomRangeFieldsProps = {
  initialStartDate: string;
  initialEndDate: string;
  onApply: (startDate: string, endDate: string) => void;
  labels: {
    startDate: string;
    endDate: string;
    applyFilters: string;
    customRequired: string;
    customInvalid: string;
  };
};

function DashboardCustomRangeFields({
  initialStartDate,
  initialEndDate,
  onApply,
  labels,
}: DashboardCustomRangeFieldsProps) {
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const error =
    !startDate || !endDate
      ? labels.customRequired
      : startDate > endDate
        ? labels.customInvalid
        : "";

  return (
    <>
      <label className="space-y-2 text-sm text-slate-300">
        <span className="font-medium">{labels.startDate}</span>
        <input
          type="date"
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
          className="w-full sm:min-w-40"
        />
      </label>
      <label className="space-y-2 text-sm text-slate-300">
        <span className="font-medium">{labels.endDate}</span>
        <input
          type="date"
          value={endDate}
          onChange={(event) => setEndDate(event.target.value)}
          className="w-full sm:min-w-40"
        />
      </label>
      <Button type="button" onClick={() => onApply(startDate, endDate)} disabled={Boolean(error)}>
        {labels.applyFilters}
      </Button>
      {error ? (
        <p className="w-full rounded-2xl border border-amber-300/20 bg-amber-500/12 px-3 py-2 text-sm text-amber-100">
          {error}
        </p>
      ) : null}
    </>
  );
}

export default function AdminDashboardPage() {
  const { language } = useLocalization();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useMemo(
    () => parseDashboardParams(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );
  const queryEnabled =
    params.range !== "custom" || Boolean(params.startDate && params.endDate && params.startDate <= params.endDate);
  const query = useDashboardData(params, queryEnabled);

  const text =
    language === "ar"
      ? {
          title: "لوحة الإدارة",
          subtitle: "تابع نافذة التقارير الحالية من ملخص بيانات موحد.",
          range: "النطاق",
          last7Days: "آخر 7 أيام",
          last30Days: "آخر 30 يومًا",
          last90Days: "آخر 90 يومًا",
          thisMonth: "هذا الشهر",
          custom: "مخصص",
          startDate: "تاريخ البداية",
          endDate: "تاريخ النهاية",
          applyFilters: "تطبيق الفلاتر",
          customRequired: "يجب إدخال تاريخ البداية والنهاية للنطاق المخصص.",
          customInvalid: "يجب أن يكون تاريخ البداية قبل أو مساويًا لتاريخ النهاية.",
          appliedWindow: "الفترة المطبقة",
          loadError: "تعذر تحميل بيانات اللوحة.",
          retry: "إعادة المحاولة",
          expenses: "المصروفات",
          expensesHint: "تجميعات التقارير المالية من نفس خدمة الملخص.",
          profit: "الربح",
          profitHint: "اتجاه الربح الإجمالي خلال الفترة المحددة.",
          netIncome: "صافي الدخل",
          netIncomeHint: "اتجاه صافي الدخل للفترة نفسها.",
          posTitle: "طلبات نقطة البيع",
          posSubtitle: "أحدث الطلبات التي أُنشئت من مسار نقطة البيع.",
          tempTitle: "الطلبات المؤقتة",
          tempSubtitle: "الطلبات المؤقتة التي أُنشئت يدويًا من لوحة الإدارة.",
          onlineTitle: "طلبات المتجر",
          onlineSubtitle: "أحدث طلبات العملاء من واجهة المتجر.",
          emptyPos: "لا توجد طلبات نقطة بيع في هذه الفترة.",
          emptyTemp: "لا توجد طلبات مؤقتة في هذه الفترة.",
          emptyOnline: "لا توجد طلبات متجر في هذه الفترة.",
        }
      : {
          title: "Dashboard Overview",
          subtitle: "Track the current reporting window from one backend summary payload.",
          range: "Range",
          last7Days: "Last 7 days",
          last30Days: "Last 30 days",
          last90Days: "Last 90 days",
          thisMonth: "This month",
          custom: "Custom",
          startDate: "Start date",
          endDate: "End date",
          applyFilters: "Apply Filters",
          customRequired: "Start and end dates are required for a custom range.",
          customInvalid: "Start date must be on or before the end date.",
          appliedWindow: "Applied window",
          loadError: "Unable to load dashboard data.",
          retry: "Retry",
          expenses: "Expenses",
          expensesHint: "Reporting buckets returned by the shared finance summary service.",
          profit: "Profit",
          profitHint: "Gross profit trend for the applied reporting range.",
          netIncome: "Net Income",
          netIncomeHint: "Net income trend from the same financial reporting window.",
          posTitle: "POS Orders",
          posSubtitle: "Recent orders created from the POS flow.",
          tempTitle: "Temp Orders",
          tempSubtitle: "Manual temporary orders created in the admin panel.",
          onlineTitle: "Online Orders",
          onlineSubtitle: "Recent customer checkout orders from the online storefront.",
          emptyPos: "No POS orders in this range.",
          emptyTemp: "No temp orders in this range.",
          emptyOnline: "No online orders in this range.",
        };

  const applyFilters = (next: DashboardQueryParams) => {
    router.replace(`${pathname}?${buildDashboardQuery(next).toString()}`, { scroll: false });
  };

  const handleRangeChange = (nextRange: DashboardRange) => {
    if (nextRange === "custom") {
      applyFilters({
        ...params,
        range: "custom",
        startDate: params.startDate,
        endDate: params.endDate,
      });
      return;
    }

    applyFilters({
      range: nextRange,
      ordersLimit: params.ordersLimit ?? DASHBOARD_ORDERS_LIMIT,
    });
  };

  const handleApplyCustomRange = (startDate: string, endDate: string) => {
    applyFilters({
      range: "custom",
      startDate,
      endDate,
      ordersLimit: params.ordersLimit ?? DASHBOARD_ORDERS_LIMIT,
    });
  };

  const dashboardData = query.data;
  const loadError = query.error ? getApiErrorMessage(query.error, text.loadError) : "";

  return (
    <AdminLayout>
      <section className="space-y-6">
        <PageHeader
          eyebrow={text.title}
          title={text.title}
          description={text.subtitle}
          actions={
            <>
              <label className="space-y-2 text-sm text-slate-300">
                <span className="font-medium">{text.range}</span>
                <select
                  value={params.range ?? "30d"}
                  onChange={(event) => handleRangeChange(event.target.value as DashboardRange)}
                  className="w-full sm:min-w-40"
                >
                  <option value="7d">{text.last7Days}</option>
                  <option value="30d">{text.last30Days}</option>
                  <option value="90d">{text.last90Days}</option>
                  <option value="thisMonth">{text.thisMonth}</option>
                  <option value="custom">{text.custom}</option>
                </select>
              </label>
              {params.range === "custom" ? (
                <DashboardCustomRangeFields
                  key={`${params.startDate ?? ""}:${params.endDate ?? ""}`}
                  initialStartDate={params.startDate ?? ""}
                  initialEndDate={params.endDate ?? ""}
                  onApply={handleApplyCustomRange}
                  labels={{
                    startDate: text.startDate,
                    endDate: text.endDate,
                    applyFilters: text.applyFilters,
                    customRequired: text.customRequired,
                    customInvalid: text.customInvalid,
                  }}
                />
              ) : null}
            </>
          }
        />

        {dashboardData?.filters ? (
          <GradientCard padding="sm" className="text-xs text-slate-400">
            {text.appliedWindow}: {dashboardData.filters.startDate} - {dashboardData.filters.endDate}
          </GradientCard>
        ) : null}

        {query.isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 8 }, (_, index) => (
                <div key={index} className="h-28 animate-pulse rounded-3xl bg-white/8" />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="h-80 animate-pulse rounded-3xl bg-white/8" />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="h-96 animate-pulse rounded-3xl bg-white/8" />
              ))}
            </div>
          </div>
        ) : loadError ? (
          <GradientCard padding="md" className="border-rose-300/20 bg-rose-500/12 text-sm text-rose-100">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p>{loadError}</p>
              <Button type="button" variant="danger" onClick={() => query.refetch()}>
                {text.retry}
              </Button>
            </div>
          </GradientCard>
        ) : dashboardData ? (
          <>
            <DashboardSummaryCards summary={dashboardData.summary} />

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <DashboardSeriesChart
                title={text.expenses}
                subtitle={text.expensesHint}
                color="#334155"
                fill="rgba(51, 65, 85, 0.18)"
                series={dashboardData.charts.expensesSeries}
              />
              <DashboardSeriesChart
                title={text.profit}
                subtitle={text.profitHint}
                color="#0284c7"
                fill="rgba(2, 132, 199, 0.18)"
                series={dashboardData.charts.profitSeries}
              />
              <DashboardSeriesChart
                title={text.netIncome}
                subtitle={text.netIncomeHint}
                color="#059669"
                fill="rgba(5, 150, 105, 0.2)"
                series={dashboardData.charts.netIncomeSeries}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <DashboardOrdersPreviewTable
                title={text.posTitle}
                count={dashboardData.orders.pos.count}
                description={text.posSubtitle}
                items={dashboardData.orders.pos.items}
                emptyText={text.emptyPos}
                viewAllHref="/admin/orders?section=pos"
              />
              <DashboardOrdersPreviewTable
                title={text.tempTitle}
                count={dashboardData.orders.temp.count}
                description={text.tempSubtitle}
                items={dashboardData.orders.temp.items}
                emptyText={text.emptyTemp}
                viewAllHref="/admin/orders?section=temp"
              />
              <DashboardOrdersPreviewTable
                title={text.onlineTitle}
                count={dashboardData.orders.online.count}
                description={text.onlineSubtitle}
                items={dashboardData.orders.online.items}
                emptyText={text.emptyOnline}
                viewAllHref="/admin/orders?section=online"
              />
            </div>
          </>
        ) : null}
      </section>
    </AdminLayout>
  );
}
