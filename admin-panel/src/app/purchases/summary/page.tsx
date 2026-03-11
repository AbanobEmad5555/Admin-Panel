"use client";

import { useEffect, useMemo, useState } from "react";
import type { AxiosError } from "axios";
import { Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/layout/AdminLayout";
import { costBreakdownPalette, costCategoryArabicLabels } from "@/components/purchases/constants";
import CostsBreakdownChart from "@/components/purchases/CostsBreakdownChart";
import ProfitTrendChart from "@/components/purchases/ProfitTrendChart";
import PurchasesModuleNav from "@/components/purchases/PurchasesModuleNav";
import PurchasesRevenueChart from "@/components/purchases/PurchasesRevenueChart";
import SummaryCards from "@/components/purchases/SummaryCards";
import { purchasesSummaryApi, type SummaryPeriod } from "@/features/purchases/api/purchases.api";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

type Period = "Day" | "Month" | "Quarter" | "Year";

const periodMap: Record<Period, SummaryPeriod> = {
  Day: "day",
  Month: "month",
  Quarter: "quarter",
  Year: "year",
};

const buildSeries = (period: Period, language: "en" | "ar") => {
  const now = new Date();

  if (period === "Day") {
    return { labels: [language === "ar" ? "اليوم" : "Today"], keys: ["today"] };
  }

  if (period === "Month") {
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const labels = Array.from({ length: daysInMonth }, (_, index) => `${index + 1}`);
    return { labels, keys: labels };
  }

  if (period === "Quarter") {
    const locale = language === "ar" ? "ar-EG" : "en-US";
    const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
    const labels = [0, 1, 2].map((offset) =>
      new Date(now.getFullYear(), quarterStartMonth + offset, 1).toLocaleDateString(locale, {
        month: "short",
      })
    );
    return { labels, keys: labels.map((label) => label.toLowerCase()) };
  }

  const labels =
    language === "ar"
      ? ["ينا", "فبر", "مار", "أبر", "ماي", "يون", "يول", "أغس", "سبت", "أكت", "نوف", "ديس"]
      : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return { labels, keys: labels.map((label) => label.toLowerCase()) };
};

const resolveBucketValue = (buckets: Record<string, number>, key: string) => {
  if (Object.prototype.hasOwnProperty.call(buckets, key)) {
    return buckets[key];
  }

  const normalizedKey = key.trim().toLowerCase();
  const match = Object.entries(buckets).find(
    ([bucketKey]) => bucketKey.trim().toLowerCase() === normalizedKey
  );
  return match?.[1] ?? 0;
};

const getApiErrorMessage = (error: unknown, fallback: string) =>
  ((error as AxiosError<{ message?: string }>)?.response?.data?.message ?? fallback);

export default function PurchasesSummaryPage() {
  const { language } = useLocalization();
  const text = {
    title: language === "ar" ? "ملخص المشتريات" : "Purchases Summary",
    subtitle:
      language === "ar"
        ? "تحليلات مالية لأداء المشتريات والمصاريف التشغيلية"
        : "Financial analytics for purchasing and operational performance",
    exportCsv: language === "ar" ? "تصدير CSV" : "Export CSV",
    exportExcel: language === "ar" ? "تصدير Excel" : "Export Excel",
    csvQueued: language === "ar" ? "تمت جدولة تصدير CSV للملخص." : "Summary CSV export queued.",
    excelQueued: language === "ar" ? "تمت جدولة تصدير Excel للملخص." : "Summary Excel export queued.",
    period: language === "ar" ? "الفترة" : "Period",
    day: language === "ar" ? "يوم" : "Day",
    month: language === "ar" ? "شهر" : "Month",
    quarter: language === "ar" ? "ربع سنة" : "Quarter",
    year: language === "ar" ? "سنة" : "Year",
    loadError:
      language === "ar" ? "تعذر تحميل ملخص المشتريات." : "Unable to load purchases summary.",
    viewingAnalytics: language === "ar" ? "عرض التحليلات للفترة:" : "Viewing analytics for:",
    loadingSummary: language === "ar" ? "جارٍ تحميل الملخص..." : "Loading summary...",
  };

  const [period, setPeriod] = useState<Period>("Month");
  const activeSeries = useMemo(() => buildSeries(period, language), [period, language]);
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof purchasesSummaryApi.get>> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const fetchSummary = async () => {
      setIsLoading(true);
      setError("");
      try {
        const data = await purchasesSummaryApi.get(periodMap[period]);
        if (!mounted) {
          return;
        }
        setSummary(data);
      } catch (requestError) {
        if (!mounted) {
          return;
        }
        setSummary(null);
        setError(getApiErrorMessage(requestError, text.loadError));
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void fetchSummary();
    return () => {
      mounted = false;
    };
  }, [period, text.loadError]);

  const purchasesSeries = activeSeries.keys.map((key) =>
    resolveBucketValue(summary?.purchasesByBucket ?? {}, key)
  );
  const revenueSeries = activeSeries.keys.map((key) =>
    resolveBucketValue(summary?.revenueByBucket ?? {}, key)
  );
  const grossProfitSeries = activeSeries.keys.map((key) =>
    resolveBucketValue(summary?.grossProfitByBucket ?? {}, key)
  );
  const netProfitSeries = activeSeries.keys.map((key) =>
    resolveBucketValue(summary?.netProfitByBucket ?? {}, key)
  );
  const costSlices = costBreakdownPalette.map((item) => ({
    label:
      language === "ar"
        ? costCategoryArabicLabels[item.key as keyof typeof costCategoryArabicLabels]
        : item.label,
    color: item.color,
    value: Math.round(resolveBucketValue(summary?.costBreakdownByCategory ?? {}, item.key)),
  }));

  return (
    <AdminLayout>
      <section className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{text.title}</h1>
              <p className="text-sm text-slate-500">{text.subtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toast.success(text.csvQueued)}
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
              >
                <Download className="h-4 w-4" />
                {text.exportCsv}
              </button>
              <button
                type="button"
                onClick={() => toast.success(text.excelQueued)}
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
              >
                <FileSpreadsheet className="h-4 w-4" />
                {text.exportExcel}
              </button>
              <span className="text-sm font-medium text-slate-600">{text.period}</span>
              <select
                value={period}
                onChange={(event) => setPeriod(event.target.value as Period)}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value="Day">{text.day}</option>
                <option value="Month">{text.month}</option>
                <option value="Quarter">{text.quarter}</option>
                <option value="Year">{text.year}</option>
              </select>
            </div>
          </div>
        </div>

        <PurchasesModuleNav />

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700 shadow-sm">
            {error}
          </div>
        ) : (
          <>
            <SummaryCards
              totalPurchases={summary?.totalPurchases ?? 0}
              totalOperationalCosts={summary?.totalOperationalCosts ?? 0}
              totalCosts={summary?.totalExpenses ?? 0}
              revenue={summary?.revenue ?? 0}
              grossProfit={summary?.grossProfit ?? 0}
              netProfit={summary?.netProfit ?? 0}
              avgPurchaseCost={summary?.avgPurchaseCost ?? 0}
              totalOrders={summary?.totalOrders ?? 0}
            />

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <PurchasesRevenueChart
                labels={activeSeries.labels}
                purchases={purchasesSeries}
                revenue={revenueSeries}
              />
              <CostsBreakdownChart slices={costSlices} />
            </div>

            <ProfitTrendChart
              labels={activeSeries.labels}
              grossProfit={grossProfitSeries}
              netProfit={netProfitSeries}
            />
          </>
        )}

        <p className="text-xs text-slate-500">
          {text.viewingAnalytics}{" "}
          <span className="font-semibold text-slate-700">
            {text[period.toLowerCase() as "day" | "month" | "quarter" | "year"]}
          </span>
        </p>
        {isLoading ? <p className="text-xs text-slate-500">{text.loadingSummary}</p> : null}
      </section>
    </AdminLayout>
  );
}
