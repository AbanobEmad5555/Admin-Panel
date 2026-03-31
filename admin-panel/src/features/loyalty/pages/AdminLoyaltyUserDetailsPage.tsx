"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import type { AxiosError } from "axios";
import { toast } from "sonner";
import AdminLayout from "@/components/layout/AdminLayout";
import Button from "@/components/ui/Button";
import { LoyaltyActionModal } from "@/features/loyalty/components/LoyaltyActionModal";
import { LoyaltyHistoryTable } from "@/features/loyalty/components/LoyaltyHistoryTable";
import { LoyaltyMetricCard } from "@/features/loyalty/components/LoyaltyMetricCard";
import { StatePanel } from "@/features/loyalty/components/StatePanel";
import {
  useManualAdjustPoints,
  useManualExpirePoints,
  useResetLoyaltyUser,
} from "@/features/loyalty/hooks/useLoyaltyMutations";
import {
  useLoyaltyUserHistory,
  useLoyaltyUserSummary,
} from "@/features/loyalty/hooks/useLoyaltyQueries";
import { formatDateTime, formatPoints } from "@/features/loyalty/utils/formatters";
import { useLoyaltyPermissions } from "@/features/loyalty/utils/permissions";
import { buildHistoryParams, parseHistoryParams } from "@/features/loyalty/utils/urlState";
import {
  LOYALTY_TRANSACTION_SOURCE_OPTIONS,
  LOYALTY_TRANSACTION_STATUS_OPTIONS,
  LOYALTY_TRANSACTION_TYPE_OPTIONS,
  type LoyaltyActionMode,
} from "@/features/loyalty/types";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

const getStatus = (error: unknown) => (error as AxiosError)?.response?.status;
const getMessage = (error: unknown, fallback: string) =>
  ((error as AxiosError<{ message?: string }>)?.response?.data?.message ?? fallback);

export default function AdminLoyaltyUserDetailsPage() {
  const { language, t } = useLocalization();
  const permissions = useLoyaltyPermissions();
  const params = useParams<{ userId: string }>();
  const userId = Number(params.userId);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const historyParams = useMemo(
    () => parseHistoryParams(new URLSearchParams(searchParams.toString())),
    [searchParams]
  );

  const summaryQuery = useLoyaltyUserSummary(userId);
  const historyQuery = useLoyaltyUserHistory(userId, historyParams);
  const adjustMutation = useManualAdjustPoints(userId);
  const expireMutation = useManualExpirePoints(userId);
  const resetMutation = useResetLoyaltyUser(userId);
  const [activeModal, setActiveModal] = useState<LoyaltyActionMode | null>(null);

  const summary = summaryQuery.data;
  const rows = historyQuery.data?.items ?? [];
  const summaryStatus = getStatus(summaryQuery.error);
  const historyStatus = getStatus(historyQuery.error);

  const setHistoryParams = (next: typeof historyParams) => {
    router.replace(`${pathname}?${buildHistoryParams(next).toString()}`);
  };

  const pending =
    adjustMutation.isPending || expireMutation.isPending || resetMutation.isPending;

  return (
    <AdminLayout title={t("loyalty.page.userDetails.title", "Loyalty User Details")}>
      <section className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-sm text-slate-500">
                <Link href="/admin/loyalty" className="hover:text-slate-900">
                  {t("loyalty.breadcrumb.root", "Loyalty")}
                </Link>{" "}
                /{" "}
                <Link href="/admin/loyalty/users" className="hover:text-slate-900">
                  {t("loyalty.breadcrumb.users", "Users")}
                </Link>{" "}
                / #{userId}
              </div>
              <h1 className="mt-1 text-2xl font-semibold text-slate-900">
                {summary?.name ?? t("loyalty.page.userDetails.title", "Loyalty User Details")}
              </h1>
              <p className="text-sm text-slate-500">
                {summary?.email ?? t("loyalty.page.userDetails.subtitle", "Summary cards, loyalty history, and manual admin actions.")}
              </p>
              {summary?.lastLedgerAt ? (
                <p className="mt-2 text-xs text-slate-400">
                  {t("loyalty.label.lastActivity", "Last activity")}: {formatDateTime(summary.lastLedgerAt, language)}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={() => router.push("/admin/loyalty/users")}>
                {t("loyalty.action.backToUsers", "Back to users")}
              </Button>
              {permissions.canManage ? (
                <>
                  <Button type="button" onClick={() => setActiveModal("MANUAL_ADD")}>
                    {t("loyalty.action.manualAdd", "Manual add")}
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setActiveModal("MANUAL_DEDUCT")}>
                    {t("loyalty.action.manualDeduct", "Manual deduct")}
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setActiveModal("MANUAL_EXPIRE")}>
                    {t("loyalty.action.manualExpire", "Manual expire")}
                  </Button>
                  <Button type="button" variant="danger" onClick={() => setActiveModal("RESET")}>
                    {t("loyalty.action.resetUser", "Reset")}
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {permissions.isReadOnly ? (
          <StatePanel
            title={t("loyalty.state.readOnly.title", "Read-only access")}
            description={t("loyalty.state.readOnly.description", "You can review balances and history, but manage actions are not available for your role.")}
            tone="warning"
          />
        ) : null}

        {summaryQuery.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={index} className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white shadow-sm" />
            ))}
          </div>
        ) : null}

        {summaryQuery.isError && summaryStatus === 403 ? (
          <StatePanel
            title={t("loyalty.state.permission.title", "Permission denied")}
            description={t("loyalty.state.userPermission.description", "You do not have permission to view this loyalty account.")}
            tone="warning"
          />
        ) : null}

        {summaryQuery.isError && summaryStatus !== 403 ? (
          <StatePanel
            title={t("loyalty.state.userSummaryError.title", "Failed to load loyalty user")}
            description={getMessage(summaryQuery.error, t("common.error", "Something went wrong."))}
            tone="danger"
          />
        ) : null}

        {summary ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm">
              {t(
                "loyalty.policy.partialRestoreNote",
                "Cancelled redeemed orders restore only 50% of redeemed points. The remaining 50% is recorded as annulled points."
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
            <LoyaltyMetricCard label={t("loyalty.card.availablePoints", "Available points")} value={formatPoints(summary.availablePoints, language)} tone="positive" />
            <LoyaltyMetricCard label={t("loyalty.card.pendingPoints", "Pending points")} value={formatPoints(summary.pendingPoints, language)} tone="muted" />
            <LoyaltyMetricCard label={t("loyalty.card.lifetimeEarned", "Earned points")} value={formatPoints(summary.lifetimeEarned, language)} tone="positive" />
            <LoyaltyMetricCard label={t("loyalty.card.redeemedPoints", "Redeemed points")} value={formatPoints(summary.redeemedPoints, language)} />
            <LoyaltyMetricCard label={t("loyalty.card.lifetimeRedeemed", "Lifetime redeemed")} value={formatPoints(summary.lifetimeRedeemed, language)} />
            <LoyaltyMetricCard label={t("loyalty.card.expiredPoints", "Expired points")} value={formatPoints(summary.expiredPoints, language)} tone="danger" />
            <LoyaltyMetricCard label={t("loyalty.card.annulledPoints", "Annulled points")} value={formatPoints(summary.annulledPoints, language)} tone="muted" />
            </div>
          </div>
        ) : null}

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                {t("loyalty.filter.type", "Type")}
              </label>
              <select
                value={historyParams.type ?? ""}
                onChange={(event) =>
                  setHistoryParams({
                    ...historyParams,
                    page: 1,
                    type: event.target.value ? (event.target.value as typeof historyParams.type) : undefined,
                  })
                }
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              >
                <option value="">{t("common.all", "All")}</option>
                {LOYALTY_TRANSACTION_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(option.labelKey, option.value)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                {t("common.status", "Status")}
              </label>
              <select
                value={historyParams.status ?? ""}
                onChange={(event) =>
                  setHistoryParams({
                    ...historyParams,
                    page: 1,
                    status: event.target.value ? (event.target.value as typeof historyParams.status) : undefined,
                  })
                }
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              >
                <option value="">{t("common.all", "All")}</option>
                {LOYALTY_TRANSACTION_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(option.labelKey, option.value)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                {t("loyalty.filter.source", "Source")}
              </label>
              <select
                value={historyParams.source ?? ""}
                onChange={(event) =>
                  setHistoryParams({
                    ...historyParams,
                    page: 1,
                    source: event.target.value ? (event.target.value as typeof historyParams.source) : undefined,
                  })
                }
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              >
                <option value="">{t("common.all", "All")}</option>
                {LOYALTY_TRANSACTION_SOURCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(option.labelKey, option.value)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                {t("loyalty.filter.dateFrom", "Date from")}
              </label>
              <input
                type="date"
                value={historyParams.dateFrom ?? ""}
                onChange={(event) =>
                  setHistoryParams({ ...historyParams, page: 1, dateFrom: event.target.value || undefined })
                }
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                {t("loyalty.filter.dateTo", "Date to")}
              </label>
              <input
                type="date"
                value={historyParams.dateTo ?? ""}
                onChange={(event) =>
                  setHistoryParams({ ...historyParams, page: 1, dateTo: event.target.value || undefined })
                }
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              />
            </div>
          </div>
        </div>

        {historyQuery.isLoading ? (
          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="h-10 animate-pulse rounded bg-slate-200" />
            <div className="h-10 animate-pulse rounded bg-slate-200" />
            <div className="h-10 animate-pulse rounded bg-slate-200" />
          </div>
        ) : null}

        {historyQuery.isError && historyStatus === 403 ? (
          <StatePanel
            title={t("loyalty.state.permission.title", "Permission denied")}
            description={t("loyalty.state.historyPermission.description", "You do not have permission to view loyalty history.")}
            tone="warning"
          />
        ) : null}

        {historyQuery.isError && historyStatus !== 403 ? (
          <StatePanel
            title={t("loyalty.state.historyError.title", "Failed to load loyalty history")}
            description={getMessage(historyQuery.error, t("common.error", "Something went wrong."))}
            tone="danger"
          />
        ) : null}

        {!historyQuery.isLoading && !historyQuery.isError && rows.length === 0 ? (
          <StatePanel
            title={t("loyalty.state.emptyHistory.title", "No loyalty history")}
            description={t("loyalty.state.emptyHistory.description", "No transactions match the current filters for this account.")}
          />
        ) : null}

        {!historyQuery.isLoading && !historyQuery.isError && rows.length > 0 ? (
          <>
            <LoyaltyHistoryTable rows={rows} />
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <Button
                type="button"
                variant="secondary"
                disabled={(historyQuery.data?.page ?? 1) <= 1}
                onClick={() =>
                  setHistoryParams({ ...historyParams, page: Math.max(1, historyParams.page - 1) })
                }
              >
                {t("common.previous", "Previous")}
              </Button>
              <div className="text-sm text-slate-600">
                {t("notifications.page", "Page")}{" "}
                <span className="font-semibold text-slate-900">{historyQuery.data?.page ?? 1}</span>{" "}
                {t("notifications.of", "of")}{" "}
                <span className="font-semibold text-slate-900">{historyQuery.data?.totalPages ?? 1}</span>
              </div>
              <Button
                type="button"
                variant="secondary"
                disabled={(historyQuery.data?.page ?? 1) >= (historyQuery.data?.totalPages ?? 1)}
                onClick={() =>
                  setHistoryParams({
                    ...historyParams,
                    page: Math.min(historyQuery.data?.totalPages ?? 1, historyParams.page + 1),
                  })
                }
              >
                {t("common.next", "Next")}
              </Button>
            </div>
          </>
        ) : null}
      </section>

      <LoyaltyActionModal
        key={activeModal ?? "closed"}
        mode={activeModal ?? "MANUAL_ADD"}
        open={Boolean(activeModal)}
        pending={pending}
        availablePoints={summary?.availablePoints}
        onClose={() => setActiveModal(null)}
        onConfirm={(values) => {
          if (!activeModal) return;

          if (activeModal === "MANUAL_ADD" || activeModal === "MANUAL_DEDUCT") {
            adjustMutation.mutate(
              {
                action: activeModal,
                points: values.points,
                notes: values.notes,
              },
              {
                onSuccess: () => {
                  toast.success(t("loyalty.toast.adjusted", "Loyalty balance updated."));
                  setActiveModal(null);
                },
                onError: (error) => toast.error(getMessage(error, t("common.error", "Something went wrong."))),
              }
            );
            return;
          }

          if (activeModal === "MANUAL_EXPIRE") {
            expireMutation.mutate(
              {
                points: values.points,
                notes: values.notes,
              },
              {
                onSuccess: () => {
                  toast.success(t("loyalty.toast.expired", "Points expired successfully."));
                  setActiveModal(null);
                },
                onError: (error) => toast.error(getMessage(error, t("common.error", "Something went wrong."))),
              }
            );
            return;
          }

          resetMutation.mutate(
            {
              notes: values.notes,
              resetPending: values.resetPending,
            },
            {
              onSuccess: () => {
                toast.success(t("loyalty.toast.reset", "Loyalty balance reset."));
                setActiveModal(null);
              },
              onError: (error) => toast.error(getMessage(error, t("common.error", "Something went wrong."))),
            }
          );
        }}
      />
    </AdminLayout>
  );
}
