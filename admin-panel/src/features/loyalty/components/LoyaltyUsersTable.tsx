import Link from "next/link";
import { ChevronRight, Eye } from "lucide-react";
import { formatDateTime, formatPoints } from "@/features/loyalty/utils/formatters";
import type { LoyaltyUserListItem, LoyaltyUsersQueryParams } from "@/features/loyalty/types";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

type LoyaltyUsersTableProps = {
  rows: LoyaltyUserListItem[];
  sortBy?: LoyaltyUsersQueryParams["sortBy"];
  sortOrder?: "asc" | "desc";
  onSort: (sortBy: NonNullable<LoyaltyUsersTableProps["sortBy"]>) => void;
};

type SortableColumn =
  | "availablePoints"
  | "pendingPoints"
  | "redeemedPoints"
  | "lastLedgerAt";

export function LoyaltyUsersTable({
  rows,
  sortBy,
  sortOrder,
  onSort,
}: LoyaltyUsersTableProps) {
  const { language, t } = useLocalization();
  const align = language === "ar" ? "text-right" : "text-left";

  const renderSort = (column: SortableColumn, label: string) => (
    <button
      type="button"
      className="inline-flex items-center gap-1 font-semibold"
      onClick={() => onSort(column)}
    >
      {label}
      {sortBy === column ? (
        <span className="text-xs text-slate-400">{sortOrder === "asc" ? "↑" : "↓"}</span>
      ) : null}
    </button>
  );

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className={`min-w-[1240px] w-full text-sm ${align}`}>
          <thead className="bg-slate-50 text-slate-900">
            <tr>
              <th className="px-4 py-3 font-semibold">{t("field.fullName", "Full Name")}</th>
              <th className="px-4 py-3 font-semibold">{t("field.email", "Email")}</th>
              <th className="px-4 py-3">{renderSort("availablePoints", t("loyalty.table.availablePoints", "Available points"))}</th>
              <th className="px-4 py-3">{renderSort("pendingPoints", t("loyalty.table.pendingPoints", "Pending points"))}</th>
              <th className="px-4 py-3">{renderSort("redeemedPoints", t("loyalty.table.redeemedPoints", "Redeemed points"))}</th>
              <th className="px-4 py-3 font-semibold">{t("loyalty.table.expiredPoints", "Expired points")}</th>
              <th className="px-4 py-3 font-semibold">{t("loyalty.table.annulledPoints", "Annulled points")}</th>
              <th className="px-4 py-3">{renderSort("lastLedgerAt", t("loyalty.table.lastActivity", "Last activity"))}</th>
              <th className="px-4 py-3 font-semibold">{t("common.actions", "Actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.map((row) => (
              <tr key={row.userId} className="text-slate-900">
                <td className="px-4 py-3">
                  <div className="font-medium">{row.name}</div>
                  <div className="text-xs text-slate-500">#{row.userId}</div>
                </td>
                <td className="px-4 py-3">{row.email}</td>
                <td className="px-4 py-3">{formatPoints(row.availablePoints, language)}</td>
                <td className="px-4 py-3">{formatPoints(row.pendingPoints, language)}</td>
                <td className="px-4 py-3">{formatPoints(row.redeemedPoints, language)}</td>
                <td className="px-4 py-3">{formatPoints(row.expiredPoints, language)}</td>
                <td className="px-4 py-3">{formatPoints(row.annulledPoints, language)}</td>
                <td className="px-4 py-3">{formatDateTime(row.lastLedgerAt, language)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/loyalty/users/${row.userId}`}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Eye className="h-4 w-4" />
                      {t("loyalty.action.viewProfile", "View")}
                    </Link>
                    <Link
                      href={`/admin/loyalty/users/${row.userId}`}
                      className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
