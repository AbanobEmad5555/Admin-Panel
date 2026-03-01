"use client";

import Link from "next/link";
import AdminLayout from "@/components/layout/AdminLayout";

type POSLayoutProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

const navItems = [
  { href: "/admin/pos", label: "POS Terminal" },
  { href: "/admin/pos/daily-report", label: "Daily Report" },
  { href: "/admin/pos/session-report", label: "Session Report" },
  { href: "/admin/pos/top-products", label: "Top Products" },
];

export default function POSLayout({ title, description, children }: POSLayoutProps) {
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
              {item.label}
            </Link>
          ))}
        </div>

        {children}
      </div>
    </AdminLayout>
  );
}
