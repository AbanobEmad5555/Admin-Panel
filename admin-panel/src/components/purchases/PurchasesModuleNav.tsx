"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Receipt, Truck } from "lucide-react";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

const tabs = [
  { href: "/purchases", fallbackLabel: "Purchases", icon: Truck },
  { href: "/purchases/costs", fallbackLabel: "Operational Costs", icon: Receipt },
  { href: "/purchases/summary", fallbackLabel: "Summary", icon: BarChart3 },
] as const;

export default function PurchasesModuleNav() {
  const pathname = usePathname();
  const { t } = useLocalization();
  const labels = {
    "/purchases": t("nav.purchases") || "Purchases",
    "/purchases/costs": t("nav.operationalCosts") || "Operational Costs",
    "/purchases/summary": t("nav.summary") || "Summary",
  } as const;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
      <nav className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon className="h-4 w-4" />
              {labels[tab.href] ?? tab.fallbackLabel}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
