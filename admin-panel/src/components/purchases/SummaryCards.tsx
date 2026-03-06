import { Banknote, ChartNoAxesCombined, CircleDollarSign, Package, ShoppingBag, TrendingUp, Wallet } from "lucide-react";
import { formatEGP } from "@/lib/currency";

type SummaryCardsProps = {
  totalPurchases: number;
  totalCosts: number;
  revenue: number;
  grossProfit: number;
  netProfit: number;
  avgPurchaseCost: number;
  totalOrders: number;
};

const cardBase =
  "rounded-xl border border-slate-200 bg-white p-4 shadow-sm";

export default function SummaryCards({
  totalPurchases,
  totalCosts,
  revenue,
  grossProfit,
  netProfit,
  avgPurchaseCost,
  totalOrders,
}: SummaryCardsProps) {
  const items = [
    { label: "Total Purchases", value: formatEGP(totalPurchases), icon: Package },
    { label: "Total Costs", value: formatEGP(totalCosts), icon: Wallet },
    { label: "Revenue", value: formatEGP(revenue), icon: CircleDollarSign },
    { label: "Gross Profit", value: formatEGP(grossProfit), icon: TrendingUp },
    { label: "Net Profit", value: formatEGP(netProfit), icon: Banknote },
    { label: "Average Purchase Cost", value: formatEGP(avgPurchaseCost), icon: ChartNoAxesCombined },
    { label: "Total Orders", value: String(totalOrders), icon: ShoppingBag },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <article key={item.label} className={cardBase}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
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
