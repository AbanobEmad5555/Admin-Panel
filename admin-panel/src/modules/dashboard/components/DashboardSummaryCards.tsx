"use client";

import { Banknote, ChartColumnBig, CreditCard, ShoppingBag, Store, Wallet } from "lucide-react";
import type { DashboardSummary } from "@/modules/dashboard/api/dashboard.types";
import { formatDashboardCurrency } from "@/modules/dashboard/utils/dashboardFormatters";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

type DashboardSummaryCardsProps = {
  summary: DashboardSummary;
};

const cardBase = "rounded-xl border border-slate-200 bg-white p-4 shadow-sm";

export default function DashboardSummaryCards({ summary }: DashboardSummaryCardsProps) {
  const { t } = useLocalization();

  const items = [
    {
      key: "dashboard.summary.totalOrders",
      label: t("dashboard.summary.totalOrders", "Total Orders"),
      value: String(summary.totalOrders),
      icon: ShoppingBag,
    },
    {
      key: "dashboard.summary.onlineOrders",
      label: t("dashboard.summary.onlineOrders", "Online Orders"),
      value: String(summary.onlineOrdersCount),
      icon: CreditCard,
    },
    {
      key: "dashboard.summary.posOrders",
      label: t("dashboard.summary.posOrders", "POS Orders"),
      value: String(summary.posOrdersCount),
      icon: Store,
    },
    {
      key: "dashboard.summary.tempOrders",
      label: t("dashboard.summary.tempOrders", "Temp Orders"),
      value: String(summary.tempOrdersCount),
      icon: Wallet,
    },
    {
      key: "dashboard.summary.totalExpenses",
      label: t("dashboard.summary.totalExpenses", "Total Expenses"),
      value: formatDashboardCurrency(summary.totalExpenses),
      icon: Wallet,
    },
    {
      key: "dashboard.summary.totalRevenue",
      label: t("dashboard.summary.totalRevenue", "Total Revenue"),
      value: formatDashboardCurrency(summary.totalRevenue),
      icon: CreditCard,
    },
    {
      key: "dashboard.summary.totalProfit",
      label: t("dashboard.summary.totalProfit", "Total Profit"),
      value: formatDashboardCurrency(summary.totalProfit),
      icon: ChartColumnBig,
    },
    {
      key: "dashboard.summary.totalNetIncome",
      label: t("dashboard.summary.totalNetIncome", "Net Income"),
      value: formatDashboardCurrency(summary.totalNetIncome),
      icon: Banknote,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <article key={item.key} className={cardBase}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {item.label}
              </p>
              <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-900">{item.value}</p>
          </article>
        );
      })}
    </div>
  );
}
