"use client";

import Button from "@/components/ui/Button";
import AdminLayout from "@/components/layout/AdminLayout";

export default function InvoicesError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <AdminLayout title="Invoices Error">
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-rose-700">Something went wrong</h2>
        <p className="mt-2 text-sm text-rose-700">{error.message}</p>
        <div className="mt-4">
          <Button type="button" onClick={reset}>
            Try again
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}

