import { useMemo } from "react";
import Link from "next/link";
import { ChevronRight, Eye } from "lucide-react";
import { StatePanel } from "@/features/loyalty/components/StatePanel";
import { formatDateTime, formatPoints } from "@/features/loyalty/utils/formatters";
import type {
  LoyaltyOverviewConsumedAccount,
  LoyaltyOverviewCurrentAccount,
  LoyaltyOverviewExpiringAccount,
  PaginatedResult,
} from "@/features/loyalty/types";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

type LoyaltyOverviewAccountsTableProps =
  | {
      mode: "current";
      title: string;
      description: string;
      rows: PaginatedResult<LoyaltyOverviewCurrentAccount>;
    }
  | {
      mode: "expiring";
      title: string;
      description: string;
      rows: PaginatedResult<LoyaltyOverviewExpiringAccount>;
    }
  | {
      mode: "consumed";
      title: string;
      description: string;
      rows: PaginatedResult<LoyaltyOverviewConsumedAccount>;
    };

export function LoyaltyOverviewAccountsTable(props: LoyaltyOverviewAccountsTableProps) {
  const { language, t } = useLocalization();
  const align = language === "ar" ? "text-right" : "text-left";
  const rows = useMemo(() => props.rows.items, [props.rows.items]);
  const currentRows = props.mode === "current" ? props.rows.items : [];
  const expiringRows = props.mode === "expiring" ? props.rows.items : [];
  const consumedRows = props.mode === "consumed" ? props.rows.items : [];
  const currentPage = props.rows.page;
  const totalPages = props.rows.totalPages;

  if (rows.length === 0) {
    return (
      <StatePanel
        title={props.title}
        description={props.description}
      />
    );
  }

  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{props.title}</h2>
          <p className="text-sm text-slate-500">{props.description}</p>
        </div>
      </div>
      {rows.length === 0 ? (
        <StatePanel
          title={t("loyalty.state.emptySummary.title", "No summary data")}
          description={t(
            "loyalty.state.emptySummary.description",
            "Try widening the date range or removing filters."
          )}
        />
      ) : null}
      {rows.length > 0 ? (
      <div className="overflow-x-auto">
        <table className={`min-w-[960px] w-full text-sm ${align}`}>
          <thead className="bg-slate-50 text-slate-900">
            <tr>
              <th className="px-4 py-3 font-semibold">{t("field.fullName", "Full Name")}</th>
              <th className="px-4 py-3 font-semibold">{t("field.email", "Email")}</th>
              {props.mode === "current" ? (
                <>
                  <th className="px-4 py-3 font-semibold">{t("loyalty.table.availablePoints", "Available points")}</th>
                  <th className="px-4 py-3 font-semibold">{t("loyalty.table.pendingPoints", "Pending points")}</th>
                  <th className="px-4 py-3 font-semibold">{t("loyalty.table.lastActivity", "Last activity")}</th>
                </>
              ) : null}
              {props.mode === "expiring" ? (
                <>
                  <th className="px-4 py-3 font-semibold">{t("loyalty.table.expiringPoints", "Expiring points")}</th>
                  <th className="px-4 py-3 font-semibold">{t("loyalty.table.expiresAt", "Expiration date")}</th>
                  <th className="px-4 py-3 font-semibold">{t("loyalty.table.daysLeft", "Days left")}</th>
                </>
              ) : null}
              {props.mode === "consumed" ? (
                <>
                  <th className="px-4 py-3 font-semibold">{t("loyalty.table.redeemedPoints", "Consumed points")}</th>
                  <th className="px-4 py-3 font-semibold">{t("loyalty.table.lastActivity", "Last activity")}</th>
                </>
              ) : null}
              <th className="px-4 py-3 font-semibold">{t("common.actions", "Actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {props.mode === "current"
              ? currentRows.map((row) => (
                  <tr key={row.userId} className="text-slate-900">
                    <td className="px-4 py-3">
                      <div className="font-medium">{row.name}</div>
                      <div className="text-xs text-slate-500">#{row.userId}</div>
                    </td>
                    <td className="px-4 py-3">{row.email}</td>
                    <td className="px-4 py-3">{formatPoints(row.availablePoints, language)}</td>
                    <td className="px-4 py-3">{formatPoints(row.pendingPoints, language)}</td>
                    <td className="px-4 py-3">{formatDateTime(row.lastLedgerAt, language)}</td>
                    <td className="px-4 py-3">
                      <ActionCell userId={row.userId} />
                    </td>
                  </tr>
                ))
              : null}
            {props.mode === "expiring"
              ? expiringRows.map((row) => (
                  <tr key={row.userId} className="text-slate-900">
                    <td className="px-4 py-3">
                      <div className="font-medium">{row.name}</div>
                      <div className="text-xs text-slate-500">#{row.userId}</div>
                    </td>
                    <td className="px-4 py-3">{row.email}</td>
                    <td className="px-4 py-3">{formatPoints(row.expiringPoints, language)}</td>
                    <td className="px-4 py-3">{formatDateTime(row.expiresAt, language)}</td>
                    <td className="px-4 py-3">{row.daysLeft}</td>
                    <td className="px-4 py-3">
                      <ActionCell userId={row.userId} />
                    </td>
                  </tr>
                ))
              : null}
            {props.mode === "consumed"
              ? consumedRows.map((row) => (
                  <tr key={row.userId} className="text-slate-900">
                    <td className="px-4 py-3">
                      <div className="font-medium">{row.name}</div>
                      <div className="text-xs text-slate-500">#{row.userId}</div>
                    </td>
                    <td className="px-4 py-3">{row.email}</td>
                    <td className="px-4 py-3">{formatPoints(row.redeemedPoints, language)}</td>
                    <td className="px-4 py-3">{formatDateTime(row.lastLedgerAt, language)}</td>
                    <td className="px-4 py-3">
                      <ActionCell userId={row.userId} />
                    </td>
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      </div>
      ) : null}
      {rows.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3">
          <div />
          <div className="text-sm text-slate-600">
            {t("notifications.page", "Page")}{" "}
            <span className="font-semibold text-slate-900">{currentPage}</span>{" "}
            {t("notifications.of", "of")}{" "}
            <span className="font-semibold text-slate-900">{totalPages}</span>
          </div>
          <div />
        </div>
      ) : null}
    </section>
  );
}

function ActionCell({ userId }: { userId: number }) {
  const { t } = useLocalization();

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/admin/loyalty/users/${userId}`}
        className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
      >
        <Eye className="h-4 w-4" />
        {t("loyalty.action.viewProfile", "View")}
      </Link>
      <Link
        href={`/admin/loyalty/users/${userId}`}
        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900"
      >
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
