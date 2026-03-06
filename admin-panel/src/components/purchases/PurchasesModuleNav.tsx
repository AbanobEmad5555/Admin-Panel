"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Receipt, Truck } from "lucide-react";

const tabs = [
  { href: "/purchases", label: "Purchases", icon: Truck },
  { href: "/purchases/costs", label: "Operational Costs", icon: Receipt },
  { href: "/purchases/summary", label: "Summary", icon: BarChart3 },
];

export default function PurchasesModuleNav() {
  const pathname = usePathname();

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
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
