"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { AxiosError } from "axios";
import AdminLayout from "@/components/layout/AdminLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { LoyaltyUsersTable } from "@/features/loyalty/components/LoyaltyUsersTable";
import { StatePanel } from "@/features/loyalty/components/StatePanel";
import { useLoyaltyUsers } from "@/features/loyalty/hooks/useLoyaltyQueries";
import { buildUsersParams, parseUsersParams } from "@/features/loyalty/utils/urlState";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

const getStatus = (error: unknown) => (error as AxiosError)?.response?.status;
const getMessage = (error: unknown, fallback: string) =>
  ((error as AxiosError<{ message?: string }>)?.response?.data?.message ?? fallback);

export default function AdminLoyaltyUsersPage() {
  const { t } = useLocalization();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const params = useMemo(
    () => parseUsersParams(new URLSearchParams(searchParams.toString())),
    [searchParams]
  );

  const query = useLoyaltyUsers(params);
  const rows = query.data?.items ?? [];
  const statusCode = getStatus(query.error);

  const setParams = (next: typeof params) => {
    router.replace(`${pathname}?${buildUsersParams(next).toString()}`);
  };

  const noSearchResults = params.search.length > 0 && rows.length === 0;

  return (
    <AdminLayout title={t("loyalty.page.users.title", "Loyalty Users")}>
      <section className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">
            {t("loyalty.breadcrumb.root", "Loyalty")} / {t("loyalty.breadcrumb.users", "Users")}
          </div>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            {t("loyalty.page.users.title", "Loyalty Users")}
          </h1>
          <p className="text-sm text-slate-500">
            {t("loyalty.page.users.subtitle", "Paginated loyalty balances across customers with server-side filtering and sorting.")}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                {t("common.search", "Search")}
              </label>
              <Input
                value={params.search}
                placeholder={t("loyalty.placeholder.searchUsers", "Search by name or email")}
                onChange={(event) => setParams({ ...params, page: 1, search: event.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                {t("common.status", "Status")}
              </label>
              <select
                value={params.status ?? ""}
                onChange={(event) =>
                  setParams({
                    ...params,
                    page: 1,
                    status: event.target.value ? (event.target.value as typeof params.status) : undefined,
                  })
                }
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              >
                <option value="">{t("common.all", "All")}</option>
                <option value="ACTIVE">{t("common.active", "Active")}</option>
                <option value="INACTIVE">{t("common.inactive", "Inactive")}</option>
                <option value="BLOCKED">{t("loyalty.userStatus.blocked", "Blocked")}</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                {t("common.sort", "Sort")}
              </label>
              <select
                value={`${params.sortBy ?? "lastLedgerAt"}:${params.sortOrder ?? "desc"}`}
                onChange={(event) => {
                  const [sortBy, sortOrder] = event.target.value.split(":") as [
                    NonNullable<typeof params.sortBy>,
                    NonNullable<typeof params.sortOrder>,
                  ];
                  setParams({
                    ...params,
                    page: 1,
                    sortBy,
                    sortOrder,
                  });
                }}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              >
                <option value="lastLedgerAt:desc">{t("loyalty.sort.newest", "Newest")}</option>
                <option value="lastLedgerAt:asc">{t("loyalty.sort.oldest", "Oldest")}</option>
                <option value="updatedAt:desc">{t("loyalty.sort.updatedNewest", "Recently updated")}</option>
                <option value="availablePoints:desc">{t("loyalty.sort.availableHigh", "Available points: high to low")}</option>
                <option value="availablePoints:asc">{t("loyalty.sort.availableLow", "Available points: low to high")}</option>
                <option value="pendingPoints:desc">{t("loyalty.sort.pendingHigh", "Pending points: high to low")}</option>
                <option value="redeemedPoints:desc">{t("loyalty.sort.redeemedHigh", "Redeemed points: high to low")}</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() =>
                  setParams({
                    page: 1,
                    limit: params.limit,
                    search: "",
                    sortBy: "lastLedgerAt",
                    sortOrder: "desc",
                    status: undefined,
                  })
                }
              >
                {t("loyalty.action.resetFilters", "Reset filters")}
              </Button>
            </div>
          </div>
        </div>

        {query.isLoading ? (
          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="h-10 animate-pulse rounded bg-slate-200" />
            <div className="h-10 animate-pulse rounded bg-slate-200" />
            <div className="h-10 animate-pulse rounded bg-slate-200" />
          </div>
        ) : null}

        {query.isError && statusCode === 403 ? (
          <StatePanel
            title={t("loyalty.state.permission.title", "Permission denied")}
            description={t("loyalty.state.usersPermission.description", "You do not have permission to view loyalty users.")}
            tone="warning"
          />
        ) : null}

        {query.isError && statusCode !== 403 ? (
          <StatePanel
            title={t("loyalty.state.usersError.title", "Failed to load loyalty users")}
            description={getMessage(query.error, t("common.error", "Something went wrong."))}
            tone="danger"
          />
        ) : null}

        {!query.isLoading && !query.isError && rows.length === 0 ? (
          <StatePanel
            title={
              noSearchResults
                ? t("loyalty.state.noSearchResults.title", "No matching users")
                : t("loyalty.state.emptyUsers.title", "No loyalty users found")
            }
            description={
              noSearchResults
                ? t("loyalty.state.noSearchResults.description", "Try a different search term or clear status filters.")
                : t("loyalty.state.emptyUsers.description", "No loyalty balances have been generated yet.")
            }
          />
        ) : null}

        {!query.isLoading && !query.isError && rows.length > 0 ? (
          <>
            <LoyaltyUsersTable
              rows={rows}
              sortBy={params.sortBy}
              sortOrder={params.sortOrder}
              onSort={(column) =>
                setParams({
                  ...params,
                  page: 1,
                  sortBy: column,
                  sortOrder:
                    params.sortBy === column && params.sortOrder === "desc" ? "asc" : "desc",
                })
              }
            />
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <Button
                type="button"
                variant="secondary"
                disabled={(query.data?.page ?? 1) <= 1}
                onClick={() => setParams({ ...params, page: Math.max(1, params.page - 1) })}
              >
                {t("common.previous", "Previous")}
              </Button>
              <div className="text-sm text-slate-600">
                {t("notifications.page", "Page")}{" "}
                <span className="font-semibold text-slate-900">{query.data?.page ?? 1}</span>{" "}
                {t("notifications.of", "of")}{" "}
                <span className="font-semibold text-slate-900">{query.data?.totalPages ?? 1}</span>
              </div>
              <Button
                type="button"
                variant="secondary"
                disabled={(query.data?.page ?? 1) >= (query.data?.totalPages ?? 1)}
                onClick={() =>
                  setParams({
                    ...params,
                    page: Math.min(query.data?.totalPages ?? 1, params.page + 1),
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
