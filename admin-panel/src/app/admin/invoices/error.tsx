"use client";

import Button from "@/components/ui/Button";
import AdminLayout from "@/components/layout/AdminLayout";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

export default function InvoicesError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const { language } = useLocalization();
  const text =
    language === "ar"
      ? {
          title: "خطأ في الفواتير",
          heading: "حدث خطأ ما",
          retry: "إعادة المحاولة",
        }
      : {
          title: "Invoices Error",
          heading: "Something went wrong",
          retry: "Try again",
        };

  return (
    <AdminLayout title={text.title}>
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-rose-700">{text.heading}</h2>
        <p className="mt-2 text-sm text-rose-700">{error.message}</p>
        <div className="mt-4">
          <Button type="button" onClick={reset}>
            {text.retry}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}

