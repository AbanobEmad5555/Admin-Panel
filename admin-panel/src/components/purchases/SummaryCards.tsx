"use client";

import {
  Banknote,
  ChartNoAxesCombined,
  CircleDollarSign,
  Package,
  ShoppingBag,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { formatEGP } from "@/lib/currency";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

type SummaryCardsProps = {
  totalPurchases: number;
  totalOperationalCosts: number;
  totalCosts: number;
  revenue: number;
  grossProfit: number;
  netProfit: number;
  avgPurchaseCost: number;
  totalOrders: number;
};

const cardBase = "rounded-xl border border-slate-200 bg-white p-4 shadow-sm";

export default function SummaryCards({
  totalPurchases,
  totalOperationalCosts,
  totalCosts,
  revenue,
  grossProfit,
  netProfit,
  avgPurchaseCost,
  totalOrders,
}: SummaryCardsProps) {
  const { language } = useLocalization();

  const items = [
    {
      label: language === "ar" ? "إجمالي المشتريات" : "Total Purchases",
      value: formatEGP(totalPurchases),
      icon: Package,
    },
    {
      label: language === "ar" ? "المصاريف التشغيلية" : "Operational Costs",
      value: formatEGP(totalOperationalCosts),
      icon: Wallet,
    },
    {
      label: language === "ar" ? "إجمالي المصروفات" : "Total Expenses",
      value: formatEGP(totalCosts),
      icon: Wallet,
    },
    {
      label: language === "ar" ? "الإيرادات" : "Revenue",
      value: formatEGP(revenue),
      icon: CircleDollarSign,
    },
    {
      label: language === "ar" ? "إجمالي الربح" : "Gross Profit",
      value: formatEGP(grossProfit),
      icon: TrendingUp,
    },
    {
      label: language === "ar" ? "صافي الربح" : "Net Profit",
      value: formatEGP(netProfit),
      icon: Banknote,
    },
    {
      label: language === "ar" ? "متوسط تكلفة الشراء" : "Average Purchase Cost",
      value: formatEGP(avgPurchaseCost),
      icon: ChartNoAxesCombined,
    },
    {
      label: language === "ar" ? "إجمالي الطلبات" : "Total Orders",
      value: String(totalOrders),
      icon: ShoppingBag,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <article key={item.label} className={cardBase}>
            <div className="flex items-center justify-between">
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
