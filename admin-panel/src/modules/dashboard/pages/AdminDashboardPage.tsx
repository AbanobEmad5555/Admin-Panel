"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { AxiosError } from "axios";
import AdminLayout from "@/components/layout/AdminLayout";
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
};

function DashboardCustomRangeFields({
  initialStartDate,
  initialEndDate,
  onApply,
}: DashboardCustomRangeFieldsProps) {
  const { t } = useLocalization();
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const error =
    !startDate || !endDate
      ? t("dashboard.filters.customRequired", "Start and end dates are required for a custom range.")
      : startDate > endDate
        ? t("dashboard.filters.customInvalid", "Start date must be on or before the end date.")
        : "";

  return (
    <>
      <label className="space-y-2 text-sm text-slate-700">
        <span className="font-medium">{t("dashboard.filters.startDate", "Start date")}</span>
        <input
          type="date"
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 sm:min-w-40"
        />
      </label>
      <label className="space-y-2 text-sm text-slate-700">
        <span className="font-medium">{t("dashboard.filters.endDate", "End date")}</span>
        <input
          type="date"
          value={endDate}
          onChange={(event) => setEndDate(event.target.value)}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 sm:min-w-40"
        />
      </label>
      <button
        type="button"
        onClick={() => onApply(startDate, endDate)}
        disabled={Boolean(error)}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {t("common.applyFilters", "Apply Filters")}
      </button>
      {error ? (
        <p className="w-full rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          {error}
        </p>
      ) : null}
    </>
  );
}

export default function AdminDashboardPage() {
  const { t } = useLocalization();
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
  const loadError = query.error
    ? getApiErrorMessage(query.error, t("dashboard.error.load", "Unable to load dashboard data."))
    : "";

  return (
    <AdminLayout>
      <section className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{t("dashboard.title", "Dashboard Overview")}</h1>
              <p className="text-sm text-slate-500">
                {t(
                  "dashboard.subtitle",
                  "Track the current reporting window from one backend summary payload.",
                )}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <label className="space-y-2 text-sm text-slate-700">
                <span className="font-medium">{t("dashboard.filters.range", "Range")}</span>
                <select
                  value={params.range ?? "30d"}
                  onChange={(event) => handleRangeChange(event.target.value as DashboardRange)}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 sm:min-w-40"
                >
                  <option value="7d">{t("dashboard.range.7d", "Last 7 days")}</option>
                  <option value="30d">{t("dashboard.range.30d", "Last 30 days")}</option>
                  <option value="90d">{t("dashboard.range.90d", "Last 90 days")}</option>
                  <option value="thisMonth">{t("dashboard.range.thisMonth", "This month")}</option>
                  <option value="custom">{t("dashboard.range.custom", "Custom")}</option>
                </select>
              </label>
              {params.range === "custom" ? (
                <DashboardCustomRangeFields
                  key={`${params.startDate ?? ""}:${params.endDate ?? ""}`}
                  initialStartDate={params.startDate ?? ""}
                  initialEndDate={params.endDate ?? ""}
                  onApply={handleApplyCustomRange}
                />
              ) : null}
            </div>
          </div>
          {dashboardData?.filters ? (
            <p className="mt-3 text-xs text-slate-500">
              {t("dashboard.filters.applied", "Applied window")}: {dashboardData.filters.startDate} -{" "}
              {dashboardData.filters.endDate}
            </p>
          ) : null}
        </div>

        {query.isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 8 }, (_, index) => (
                <div key={index} className="h-28 animate-pulse rounded-xl bg-slate-200" />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="h-80 animate-pulse rounded-xl bg-slate-200" />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="h-96 animate-pulse rounded-xl bg-slate-200" />
              ))}
            </div>
          </div>
        ) : loadError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p>{loadError}</p>
              <button
                type="button"
                onClick={() => query.refetch()}
                className="rounded-md border border-rose-300 bg-white px-3 py-2 text-sm text-rose-700 transition hover:bg-rose-100"
              >
                {t("dashboard.retry", "Retry")}
              </button>
            </div>
          </div>
        ) : dashboardData ? (
          <>
            <DashboardSummaryCards summary={dashboardData.summary} />

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <DashboardSeriesChart
                title={t("dashboard.charts.expenses", "Expenses")}
                subtitle={t(
                  "dashboard.charts.expensesHint",
                  "Reporting buckets returned by the shared finance summary service.",
                )}
                color="#334155"
                fill="rgba(51, 65, 85, 0.18)"
                series={dashboardData.charts.expensesSeries}
              />
              <DashboardSeriesChart
                title={t("dashboard.charts.profit", "Profit")}
                subtitle={t(
                  "dashboard.charts.profitHint",
                  "Gross profit trend for the applied reporting range.",
                )}
                color="#0284c7"
                fill="rgba(2, 132, 199, 0.18)"
                series={dashboardData.charts.profitSeries}
              />
              <DashboardSeriesChart
                title={t("dashboard.charts.netIncome", "Net Income")}
                subtitle={t(
                  "dashboard.charts.netIncomeHint",
                  "Net income trend from the same financial reporting window.",
                )}
                color="#059669"
                fill="rgba(5, 150, 105, 0.2)"
                series={dashboardData.charts.netIncomeSeries}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <DashboardOrdersPreviewTable
                title={t("dashboard.orders.posTitle", "POS Orders")}
                count={dashboardData.orders.pos.count}
                description={t("dashboard.orders.posSubtitle", "Recent orders created from the POS flow.")}
                items={dashboardData.orders.pos.items}
                emptyText={t("dashboard.orders.emptyPos", "No POS orders in this range.")}
                viewAllHref="/admin/orders?section=pos"
              />
              <DashboardOrdersPreviewTable
                title={t("dashboard.orders.tempTitle", "Temp Orders")}
                count={dashboardData.orders.temp.count}
                description={t(
                  "dashboard.orders.tempSubtitle",
                  "Manual temporary orders created in the admin panel.",
                )}
                items={dashboardData.orders.temp.items}
                emptyText={t("dashboard.orders.emptyTemp", "No temp orders in this range.")}
                viewAllHref="/admin/orders?section=temp"
              />
              <DashboardOrdersPreviewTable
                title={t("dashboard.orders.onlineTitle", "Online Orders")}
                count={dashboardData.orders.online.count}
                description={t(
                  "dashboard.orders.onlineSubtitle",
                  "Recent customer checkout orders from the online storefront.",
                )}
                items={dashboardData.orders.online.items}
                emptyText={t("dashboard.orders.emptyOnline", "No online orders in this range.")}
                viewAllHref="/admin/orders?section=online"
              />
            </div>
          </>
        ) : null}
      </section>
    </AdminLayout>
  );
}
