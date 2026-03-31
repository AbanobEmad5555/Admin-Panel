"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { AxiosError } from "axios";
import AdminLayout from "@/components/layout/AdminLayout";
import Button from "@/components/ui/Button";
import { LoyaltyOverviewAccountsTable } from "@/features/loyalty/components/LoyaltyOverviewAccountsTable";
import { LoyaltyMetricCard } from "@/features/loyalty/components/LoyaltyMetricCard";
import { StatePanel } from "@/features/loyalty/components/StatePanel";
import {
  useLoyaltyOverview,
  useLoyaltySettings,
} from "@/features/loyalty/hooks/useLoyaltyQueries";
import { formatSummaryMetric } from "@/features/loyalty/utils/formatters";
import {
  buildSummaryFilters,
  getSummaryRangeDates,
  parseSummaryFilters,
} from "@/features/loyalty/utils/urlState";
import type { LoyaltySummaryTimeRange } from "@/features/loyalty/types";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

const getStatus = (error: unknown) => (error as AxiosError)?.response?.status;
const getErrorMessage = (error: unknown, fallback: string) =>
  ((error as AxiosError<{ message?: string }>)?.response?.data?.message ?? fallback);

const resetOverviewPages = <T extends Record<string, unknown>>(value: T) => ({
  ...value,
  currentPointPage: 1,
  expiringSoonPage: 1,
  consumedPage: 1,
});

export default function AdminLoyaltyOverviewPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { language, t } = useLocalization();

  const filters = useMemo(
    () => parseSummaryFilters(new URLSearchParams(searchParams.toString())),
    [searchParams]
  );

  const overviewQuery = useLoyaltyOverview(filters);
  const settingsQuery = useLoyaltySettings();
  const overview = overviewQuery.data;
  const overviewAccounts = useMemo(
    () =>
      overview
        ? {
            currentPointUsers: overview.currentPointUsers,
            expiringSoonUsers: overview.expiringSoonUsers,
            consumedUsers: overview.consumedUsers,
          }
        : null,
    [overview]
  );
  const metrics = useMemo(
    () => (overview?.summary.metrics ?? []).filter((metric) => metric.key !== "earnedPoints"),
    [overview?.summary.metrics]
  );
  const isDisabled = settingsQuery.data?.isEnabled === false;
  const statusCode = getStatus(overviewQuery.error);

  const setFilters = (next: typeof filters) => {
    router.replace(`${pathname}?${buildSummaryFilters(next).toString()}`, { scroll: false });
  };

  const applyTimeRange = (timeRange: LoyaltySummaryTimeRange) => {
    const range = getSummaryRangeDates(timeRange);
    setFilters(resetOverviewPages({
      ...filters,
      ...range,
      timeRange,
    }));
  };

  return (
    <AdminLayout title={t("loyalty.page.overview.title", "Loyalty Overview")}>
      <section className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-sm text-slate-500">
                {t("loyalty.breadcrumb.root", "Loyalty")} / {t("loyalty.breadcrumb.overview", "Overview")}
              </div>
              <h1 className="mt-1 text-2xl font-semibold text-slate-900">
                {t("loyalty.page.overview.title", "Loyalty Overview")}
              </h1>
              <p className="text-sm text-slate-500">
                {t("loyalty.page.overview.subtitle", "Cross-account reporting for loyalty activity and balances.")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={() => router.push("/admin/loyalty/settings")}>
                {t("loyalty.action.openSettings", "Open settings")}
              </Button>
              <Button type="button" variant="secondary" onClick={() => router.push("/admin/loyalty/users")}>
                {t("loyalty.action.openUsers", "Open users")}
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-5">
            <label className="space-y-1 text-sm">
              <span className="block font-medium text-slate-700">{t("loyalty.filter.timeRange", "Time range")}</span>
              <select
                value={filters.timeRange ?? "custom"}
                onChange={(event) => applyTimeRange(event.target.value as LoyaltySummaryTimeRange)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900"
              >
                <option value="day">{t("loyalty.filter.day", "Day")}</option>
                <option value="week">{t("loyalty.filter.week", "Week")}</option>
                <option value="month">{t("loyalty.filter.month", "Month")}</option>
                <option value="quarter">{t("loyalty.filter.quarter", "Quarter")}</option>
                <option value="year">{t("loyalty.filter.year", "Year")}</option>
                <option value="custom">{t("loyalty.filter.custom", "Custom")}</option>
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="block font-medium text-slate-700">{t("loyalty.filter.dateFrom", "Date from")}</span>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(event) =>
                  setFilters(
                    resetOverviewPages({
                      ...filters,
                      dateFrom: event.target.value,
                      timeRange: "custom",
                    })
                  )
                }
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="block font-medium text-slate-700">{t("loyalty.filter.dateTo", "Date to")}</span>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(event) =>
                  setFilters(
                    resetOverviewPages({
                      ...filters,
                      dateTo: event.target.value,
                      timeRange: "custom",
                    })
                  )
                }
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="block font-medium text-slate-700">{t("loyalty.filter.userId", "User ID")}</span>
              <input
                type="number"
                value={filters.userId ?? ""}
                onChange={(event) =>
                  setFilters(
                    resetOverviewPages({
                      ...filters,
                      userId: event.target.value ? Number(event.target.value) : undefined,
                    })
                  )
                }
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900"
              />
            </label>
            <div className="flex items-end">
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() =>
                  setFilters(resetOverviewPages({
                    ...getSummaryRangeDates("month"),
                    timeRange: "month",
                  }))
                }
              >
                {t("loyalty.action.resetFilters", "Reset filters")}
              </Button>
            </div>
          </div>
        </div>

        {filters.dateFrom > filters.dateTo ? (
          <StatePanel
            title={t("loyalty.state.invalidFilters.title", "Invalid filter combination")}
            description={t("loyalty.state.invalidFilters.description", "Date from must be earlier than or equal to date to.")}
            tone="warning"
          />
        ) : null}

        {isDisabled ? (
          <StatePanel
            title={t("loyalty.disabled.title", "Loyalty program disabled")}
            description={t("loyalty.disabled.description", "Reporting remains available while the program itself is switched off in settings.")}
            tone="warning"
          />
        ) : null}

        {overviewQuery.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white shadow-sm" />
            ))}
          </div>
        ) : null}

        {overviewQuery.isError && statusCode === 403 ? (
          <StatePanel
            title={t("loyalty.state.permission.title", "Permission denied")}
            description={t("loyalty.state.permission.description", "You do not have permission to view loyalty reporting.")}
            tone="warning"
          />
        ) : null}

        {overviewQuery.isError && statusCode !== 403 ? (
          <StatePanel
            title={t("loyalty.state.error.title", "Failed to load loyalty summary")}
            description={getErrorMessage(overviewQuery.error, t("common.error", "Something went wrong."))}
            tone="danger"
          />
        ) : null}

        {!overviewQuery.isLoading && !overviewQuery.isError && metrics.length === 0 ? (
          <StatePanel
            title={t("loyalty.state.emptySummary.title", "No summary data")}
            description={t("loyalty.state.emptySummary.description", "Try widening the date range or removing filters.")}
          />
        ) : null}

        {!overviewQuery.isLoading && !overviewQuery.isError && metrics.length > 0 ? (
          <div className="space-y-3">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {metrics.map((metric) => {
                const formatted = formatSummaryMetric(metric, language, t);
                return <LoyaltyMetricCard key={metric.key} label={formatted.label} value={formatted.value} />;
              })}
            </div>
            <p className="text-sm text-slate-500">
              {t(
                "loyalty.overview.summary.note",
                "Expiring-soon points are part of available points. They are shown separately as a subset, not an additional total."
              )}
            </p>
          </div>
        ) : null}

        {overviewQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-48 animate-pulse rounded-xl border border-slate-200 bg-white shadow-sm"
              />
            ))}
          </div>
        ) : null}

        {!overviewQuery.isLoading && !overviewQuery.isError && overviewAccounts ? (
          <>
            <LoyaltyOverviewAccountsTable
              mode="current"
              title={t("loyalty.overview.currentPoints.title", "Users with current loyalty points")}
              description={t(
                "loyalty.overview.currentPoints.description",
                "Customers who currently have available or pending loyalty points."
              )}
              rows={overviewAccounts.currentPointUsers}
            />
            <div className="flex justify-end">
              <Button
                type="button"
                variant="secondary"
                disabled={overviewAccounts.currentPointUsers.page <= 1}
                onClick={() =>
                  setFilters({
                    ...filters,
                    currentPointPage: Math.max(1, (filters.currentPointPage ?? 1) - 1),
                  })
                }
              >
                {t("common.previous", "Previous")}
              </Button>
              <div className="mx-4 self-center text-sm text-slate-600">
                {t("notifications.page", "Page")}{" "}
                <span className="font-semibold text-slate-900">{overviewAccounts.currentPointUsers.page}</span>{" "}
                {t("notifications.of", "of")}{" "}
                <span className="font-semibold text-slate-900">
                  {overviewAccounts.currentPointUsers.totalPages}
                </span>
              </div>
              <Button
                type="button"
                variant="secondary"
                disabled={
                  overviewAccounts.currentPointUsers.page >= overviewAccounts.currentPointUsers.totalPages
                }
                onClick={() =>
                  setFilters({
                    ...filters,
                    currentPointPage: Math.min(
                      overviewAccounts.currentPointUsers.totalPages,
                      (filters.currentPointPage ?? 1) + 1
                    ),
                  })
                }
              >
                {t("common.next", "Next")}
              </Button>
            </div>
            <LoyaltyOverviewAccountsTable
              mode="expiring"
              title={t("loyalty.overview.expiringSoon.title", "Users with points expiring in 3 days")}
              description={t(
                "loyalty.overview.expiringSoon.description",
                "Customers whose currently available loyalty points include amounts expiring within the next 3 days."
              )}
              rows={overviewAccounts.expiringSoonUsers}
            />
            <div className="flex justify-end">
              <Button
                type="button"
                variant="secondary"
                disabled={overviewAccounts.expiringSoonUsers.page <= 1}
                onClick={() =>
                  setFilters({
                    ...filters,
                    expiringSoonPage: Math.max(1, (filters.expiringSoonPage ?? 1) - 1),
                  })
                }
              >
                {t("common.previous", "Previous")}
              </Button>
              <div className="mx-4 self-center text-sm text-slate-600">
                {t("notifications.page", "Page")}{" "}
                <span className="font-semibold text-slate-900">{overviewAccounts.expiringSoonUsers.page}</span>{" "}
                {t("notifications.of", "of")}{" "}
                <span className="font-semibold text-slate-900">
                  {overviewAccounts.expiringSoonUsers.totalPages}
                </span>
              </div>
              <Button
                type="button"
                variant="secondary"
                disabled={
                  overviewAccounts.expiringSoonUsers.page >= overviewAccounts.expiringSoonUsers.totalPages
                }
                onClick={() =>
                  setFilters({
                    ...filters,
                    expiringSoonPage: Math.min(
                      overviewAccounts.expiringSoonUsers.totalPages,
                      (filters.expiringSoonPage ?? 1) + 1
                    ),
                  })
                }
              >
                {t("common.next", "Next")}
              </Button>
            </div>
            <LoyaltyOverviewAccountsTable
              mode="consumed"
              title={t("loyalty.overview.consumed.title", "Users with consumed loyalty points")}
              description={t(
                "loyalty.overview.consumed.description",
                "Customers who have already redeemed part of their loyalty balance."
              )}
              rows={overviewAccounts.consumedUsers}
            />
            <div className="flex justify-end">
              <Button
                type="button"
                variant="secondary"
                disabled={overviewAccounts.consumedUsers.page <= 1}
                onClick={() =>
                  setFilters({
                    ...filters,
                    consumedPage: Math.max(1, (filters.consumedPage ?? 1) - 1),
                  })
                }
              >
                {t("common.previous", "Previous")}
              </Button>
              <div className="mx-4 self-center text-sm text-slate-600">
                {t("notifications.page", "Page")}{" "}
                <span className="font-semibold text-slate-900">{overviewAccounts.consumedUsers.page}</span>{" "}
                {t("notifications.of", "of")}{" "}
                <span className="font-semibold text-slate-900">
                  {overviewAccounts.consumedUsers.totalPages}
                </span>
              </div>
              <Button
                type="button"
                variant="secondary"
                disabled={
                  overviewAccounts.consumedUsers.page >= overviewAccounts.consumedUsers.totalPages
                }
                onClick={() =>
                  setFilters({
                    ...filters,
                    consumedPage: Math.min(
                      overviewAccounts.consumedUsers.totalPages,
                      (filters.consumedPage ?? 1) + 1
                    ),
                  })
                }
              >
                {t("common.next", "Next")}
              </Button>
            </div>
          </>
        ) : null}
      </section>
    </AdminLayout>
  );
}
