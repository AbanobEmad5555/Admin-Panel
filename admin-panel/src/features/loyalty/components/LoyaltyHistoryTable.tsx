import Link from "next/link";
import { LoyaltyStatusBadge } from "@/features/loyalty/components/LoyaltyStatusBadge";
import {
  formatDateTime,
  formatMoney,
  formatPoints,
} from "@/features/loyalty/utils/formatters";
import type { LoyaltyHistoryItem } from "@/features/loyalty/types";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

type LoyaltyHistoryTableProps = {
  rows: LoyaltyHistoryItem[];
};

export function LoyaltyHistoryTable({ rows }: LoyaltyHistoryTableProps) {
  const { language, t } = useLocalization();

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className={`min-w-[1560px] w-full text-sm ${language === "ar" ? "text-right" : "text-left"}`}>
          <thead className="bg-slate-50 text-slate-900">
            <tr>
              <th className="px-4 py-3 font-semibold">{t("loyalty.table.transactionId", "Transaction ID")}</th>
              <th className="px-4 py-3 font-semibold">{t("loyalty.table.type", "Type")}</th>
              <th className="px-4 py-3 font-semibold">{t("common.status", "Status")}</th>
              <th className="px-4 py-3 font-semibold">{t("loyalty.table.source", "Source")}</th>
              <th className="px-4 py-3 font-semibold">{t("loyalty.table.pointsAmount", "Points amount")}</th>
              <th className="px-4 py-3 font-semibold">{t("loyalty.table.moneyAmount", "Money amount")}</th>
              <th className="px-4 py-3 font-semibold">{t("loyalty.table.remainingPoints", "Remaining points")}</th>
              <th className="px-4 py-3 font-semibold">{t("loyalty.table.expiresAt", "Expiration date")}</th>
              <th className="px-4 py-3 font-semibold">{t("loyalty.table.effectiveAt", "Effective date")}</th>
              <th className="px-4 py-3 font-semibold">{t("loyalty.table.sourceReference", "Source reference")}</th>
              <th className="px-4 py-3 font-semibold">{t("loyalty.table.relatedOrder", "Related order")}</th>
              <th className="px-4 py-3 font-semibold">{t("loyalty.table.createdByAdmin", "Created by admin")}</th>
              <th className="px-4 py-3 font-semibold">{t("loyalty.table.createdAt", "Created at")}</th>
              <th className="px-4 py-3 font-semibold">{t("loyalty.table.notes", "Notes")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.map((row) => (
              <tr key={row.id} className="align-top text-slate-900">
                <td className="px-4 py-3 font-mono text-xs">{row.id}</td>
                <td className="px-4 py-3"><LoyaltyStatusBadge value={row.type} variant="type" /></td>
                <td className="px-4 py-3"><LoyaltyStatusBadge value={row.status} variant="status" /></td>
                <td className="px-4 py-3"><LoyaltyStatusBadge value={row.source} variant="source" /></td>
                <td className="px-4 py-3">{formatPoints(row.pointsAmount, language)}</td>
                <td className="px-4 py-3">{formatMoney(row.moneyAmount, language)}</td>
                <td className="px-4 py-3">{formatPoints(row.remainingPoints, language)}</td>
                <td className="px-4 py-3">{formatDateTime(row.expiresAt, language)}</td>
                <td className="px-4 py-3">{formatDateTime(row.effectiveAt, language)}</td>
                <td className="px-4 py-3">{row.sourceReference ?? "-"}</td>
                <td className="px-4 py-3">
                  {row.order ? (
                    <Link
                      href={`/admin/orders/${row.order.id}`}
                      className="text-slate-900 underline underline-offset-2"
                    >
                      #{row.order.id} ({row.order.status})
                    </Link>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="px-4 py-3">{row.createdByAdmin?.name ?? row.createdByAdmin?.email ?? "-"}</td>
                <td className="px-4 py-3">{formatDateTime(row.createdAt, language)}</td>
                <td className="px-4 py-3 text-slate-600">{row.notes ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
