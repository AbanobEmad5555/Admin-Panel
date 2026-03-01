import AdminLayout from "@/components/layout/AdminLayout";

export default function LoadingInvoicesPage() {
  return (
    <AdminLayout title="Invoices">
      <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="h-8 animate-pulse rounded bg-slate-200" />
        <div className="h-8 animate-pulse rounded bg-slate-200" />
        <div className="h-8 animate-pulse rounded bg-slate-200" />
      </div>
    </AdminLayout>
  );
}

