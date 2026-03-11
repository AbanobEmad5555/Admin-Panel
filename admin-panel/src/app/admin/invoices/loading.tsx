 "use client";

import AdminLayout from "@/components/layout/AdminLayout";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

export default function LoadingInvoicesPage() {
  const { language } = useLocalization();
  return (
    <AdminLayout title={language === "ar" ? "الفواتير" : "Invoices"}>
      <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="h-8 animate-pulse rounded bg-slate-200" />
        <div className="h-8 animate-pulse rounded bg-slate-200" />
        <div className="h-8 animate-pulse rounded bg-slate-200" />
      </div>
    </AdminLayout>
  );
}

