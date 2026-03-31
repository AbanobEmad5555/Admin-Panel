"use client";

import { Banknote, ChartColumnBig, CreditCard, ShoppingBag, Store, Wallet } from "lucide-react";
import StatsCard from "@/components/ui/StatsCard";
import type { DashboardSummary } from "@/modules/dashboard/api/dashboard.types";
import { formatDashboardCurrency } from "@/modules/dashboard/utils/dashboardFormatters";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

type DashboardSummaryCardsProps = {
  summary: DashboardSummary;
};

export default function DashboardSummaryCards({ summary }: DashboardSummaryCardsProps) {
  const { language } = useLocalization();
  const labels =
    language === "ar"
      ? {
          totalOrders: "إجمالي الطلبات",
          onlineOrders: "طلبات المتجر",
          posOrders: "طلبات نقطة البيع",
          tempOrders: "الطلبات المؤقتة",
          totalExpenses: "إجمالي المصروفات",
          totalRevenue: "إجمالي الإيرادات",
          totalProfit: "إجمالي الربح",
          totalNetIncome: "صافي الدخل",
        }
      : {
          totalOrders: "Total Orders",
          onlineOrders: "Online Orders",
          posOrders: "POS Orders",
          tempOrders: "Temp Orders",
          totalExpenses: "Total Expenses",
          totalRevenue: "Total Revenue",
          totalProfit: "Total Profit",
          totalNetIncome: "Net Income",
        };

  const items = [
    { key: "totalOrders", label: labels.totalOrders, value: String(summary.totalOrders), icon: ShoppingBag },
    { key: "onlineOrders", label: labels.onlineOrders, value: String(summary.onlineOrdersCount), icon: CreditCard },
    { key: "posOrders", label: labels.posOrders, value: String(summary.posOrdersCount), icon: Store },
    { key: "tempOrders", label: labels.tempOrders, value: String(summary.tempOrdersCount), icon: Wallet },
    { key: "totalExpenses", label: labels.totalExpenses, value: formatDashboardCurrency(summary.totalExpenses), icon: Wallet },
    { key: "totalRevenue", label: labels.totalRevenue, value: formatDashboardCurrency(summary.totalRevenue), icon: CreditCard },
    { key: "totalProfit", label: labels.totalProfit, value: formatDashboardCurrency(summary.totalProfit), icon: ChartColumnBig },
    { key: "totalNetIncome", label: labels.totalNetIncome, value: formatDashboardCurrency(summary.totalNetIncome), icon: Banknote },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <StatsCard key={item.key} label={item.label} value={item.value} icon={item.icon} />
      ))}
    </div>
  );
}
