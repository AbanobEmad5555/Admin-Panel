"use client";

import Link from "next/link";
import AdminLayout from "@/components/layout/AdminLayout";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

type POSLayoutProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

const navItems = [
  { href: "/admin/pos", key: "posTerminal" },
  { href: "/admin/pos/daily-report", key: "dailyReport" },
  { href: "/admin/pos/session-report", key: "sessionReport" },
  { href: "/admin/pos/top-products", key: "topProducts" },
] as const;

export default function POSLayout({ title, description, children }: POSLayoutProps) {
  const { language } = useLocalization();

  const labels =
    language === "ar"
      ? {
          posTerminal: "محطة نقطة البيع",
          dailyReport: "التقرير اليومي",
          sessionReport: "تقرير الجلسة",
          topProducts: "أفضل المنتجات",
        }
      : {
          posTerminal: "POS Terminal",
          dailyReport: "Daily Report",
          sessionReport: "Session Report",
          topProducts: "Top Products",
        };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="rounded-xl bg-gradient-to-r from-violet-700 via-fuchsia-600 to-indigo-600 p-5 text-white shadow-md">
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-violet-100">{description}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md border border-violet-200 bg-white px-3 py-2 text-sm font-medium text-violet-700 transition hover:bg-violet-50"
            >
              {labels[item.key]}
            </Link>
          ))}
        </div>

        {children}
      </div>
    </AdminLayout>
  );
}
