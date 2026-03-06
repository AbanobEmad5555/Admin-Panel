"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/layout/AdminLayout";
import CostsBreakdownChart from "@/components/purchases/CostsBreakdownChart";
import ProfitTrendChart from "@/components/purchases/ProfitTrendChart";
import PurchasesModuleNav from "@/components/purchases/PurchasesModuleNav";
import PurchasesRevenueChart from "@/components/purchases/PurchasesRevenueChart";
import SummaryCards from "@/components/purchases/SummaryCards";
import { summarySeries } from "@/components/purchases/mock-data";
import { getPurchasesStorageEventName, loadCostRows, loadPurchaseRows } from "@/components/purchases/storage";
import api from "@/services/api";
import type { CostRow, PurchaseRow } from "@/components/purchases/types";

type Period = "Day" | "Month" | "Quarter" | "Year";
type PeriodSeries = {
  labels: string[];
  keys: string[];
};

const buildSeries = (period: Period): PeriodSeries => {
  const now = new Date();
  if (period === "Day") {
    return { labels: ["Today"], keys: ["today"] };
  }

  if (period === "Month") {
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const labels = Array.from({ length: daysInMonth }, (_, index) => `${index + 1}`);
    return { labels, keys: labels };
  }

  if (period === "Quarter") {
    const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
    const labels = [0, 1, 2].map((offset) =>
      new Date(now.getFullYear(), quarterStartMonth + offset, 1).toLocaleDateString("en-US", {
        month: "short",
      })
    );
    return { labels, keys: labels.map((label) => label.toLowerCase()) };
  }

  const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return { labels, keys: labels.map((label) => label.toLowerCase()) };
};

const toDate = (value?: string) => {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const inRange = (date: Date, start: Date, end: Date) =>
  date.getTime() >= start.getTime() && date.getTime() <= end.getTime();

const monthShort = (date: Date) =>
  date.toLocaleDateString("en-US", { month: "short" }).toLowerCase();

const getRange = (period: Period) => {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  if (period === "Day") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }

  if (period === "Month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start, end };
  }

  if (period === "Quarter") {
    const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
    const start = new Date(now.getFullYear(), quarterStartMonth, 1);
    return { start, end };
  }

  const start = new Date(now.getFullYear(), 0, 1);
  return { start, end };
};

const getBucketKey = (date: Date, period: Period): string => {
  if (period === "Day") {
    return "today";
  }
  if (period === "Month") {
    return String(date.getDate());
  }
  return monthShort(date);
};

const extractSalesPayload = (payload: unknown) => {
  const record = (payload ?? {}) as Record<string, unknown>;
  const safeNumber = (value: unknown) => {
    if (typeof value === "number") {
      return value;
    }
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };
  return {
    revenue: safeNumber(
      record.totalSales ?? record.total ?? record.amount ?? record.sales ?? record.value
    ),
    orders: safeNumber(
      record.totalOrders ?? record.orders ?? record.orderCount ?? record.count
    ),
  };
};

const salesEndpointMap: Record<Period, string> = {
  Day: "/sales/today",
  Month: "/sales/this-month",
  Quarter: "/sales/this-quarter",
  Year: "/sales/this-year",
};

export default function PurchasesSummaryPage() {
  const [period, setPeriod] = useState<Period>("Month");
  const activeSeries = useMemo(() => buildSeries(period), [period]);
  const [purchaseRows, setPurchaseRows] = useState<PurchaseRow[]>([]);
  const [costRows, setCostRows] = useState<CostRow[]>([]);
  const [salesTotals, setSalesTotals] = useState({ revenue: 0, orders: 0 });
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesError, setSalesError] = useState("");

  useEffect(() => {
    const reload = () => {
      setPurchaseRows(loadPurchaseRows());
      setCostRows(loadCostRows());
    };
    reload();

    const eventName = getPurchasesStorageEventName();
    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key.includes("purchases_module_")) {
        reload();
      }
    };

    window.addEventListener(eventName, reload);
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", reload);
    return () => {
      window.removeEventListener(eventName, reload);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", reload);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchSales = async () => {
      setSalesLoading(true);
      setSalesError("");
      try {
        const response = await api.get(salesEndpointMap[period]);
        if (!mounted) {
          return;
        }
        const payload = response.data?.data ?? response.data;
        setSalesTotals(extractSalesPayload(payload));
      } catch {
        if (!mounted) {
          return;
        }
        setSalesTotals({ revenue: 0, orders: 0 });
        setSalesError("Unable to load sales totals for selected period.");
      } finally {
        if (mounted) {
          setSalesLoading(false);
        }
      }
    };
    void fetchSales();
    return () => {
      mounted = false;
    };
  }, [period]);

  const { purchasesByBucket, costsByBucket, filteredCosts } = useMemo(() => {
    const keys = new Set(activeSeries.keys);
    const init = () =>
      Object.fromEntries(activeSeries.keys.map((key) => [key, 0])) as Record<string, number>;
    const purchasesMap = init();
    const costsMap = init();
    const range = getRange(period);

    const costs: CostRow[] = [];

    purchaseRows.forEach((row) => {
      const date = toDate(row.expectedArrival);
      if (!date || !inRange(date, range.start, range.end)) {
        return;
      }
      const bucket = getBucketKey(date, period);
      if (!keys.has(bucket)) {
        return;
      }
      purchasesMap[bucket] += Number(row.totalCost || 0);
    });

    costRows.forEach((row) => {
      const date = toDate(row.date);
      if (!date || !inRange(date, range.start, range.end)) {
        return;
      }
      const bucket = getBucketKey(date, period);
      if (!keys.has(bucket)) {
        return;
      }
      costsMap[bucket] += Number(row.amount || 0);
      costs.push(row);
    });

    return {
      purchasesByBucket: purchasesMap,
      costsByBucket: costsMap,
      filteredCosts: costs,
    };
  }, [activeSeries.keys, costRows, period, purchaseRows]);

  const revenueByBucket = useMemo(() => {
    const map = Object.fromEntries(activeSeries.keys.map((key) => [key, 0])) as Record<string, number>;
    const purchaseValues = activeSeries.keys.map((key) => purchasesByBucket[key]);
    const purchaseTotal = purchaseValues.reduce((sum, value) => sum + value, 0);
    if (activeSeries.keys.length === 0) {
      return map;
    }

    if (purchaseTotal > 0) {
      activeSeries.keys.forEach((key) => {
        const ratio = purchasesByBucket[key] / purchaseTotal;
        map[key] = salesTotals.revenue * ratio;
      });
    } else {
      const evenShare = salesTotals.revenue / activeSeries.keys.length;
      activeSeries.keys.forEach((key) => {
        map[key] = evenShare;
      });
    }
    return map;
  }, [activeSeries.keys, purchasesByBucket, salesTotals.revenue]);

  const stats = useMemo(() => {
    const purchases = activeSeries.keys.map((key) => purchasesByBucket[key]);
    const costs = activeSeries.keys.map((key) => costsByBucket[key]);
    const totalPurchases = purchases.reduce((sum, value) => sum + value, 0);
    const totalCosts = costs.reduce((sum, value) => sum + value, 0);
    const revenue = salesTotals.revenue;
    const grossProfit = revenue - totalPurchases;
    const netProfit = grossProfit - totalCosts;
    const purchaseCount = purchases.filter((value) => value > 0).length;
    return {
      totalPurchases,
      totalCosts,
      revenue,
      grossProfit,
      netProfit,
      avgPurchaseCost: purchaseCount > 0 ? totalPurchases / purchaseCount : 0,
      totalOrders: salesTotals.orders,
    };
  }, [activeSeries.keys, costsByBucket, purchasesByBucket, salesTotals.orders, salesTotals.revenue]);

  const costSlices = useMemo(
    () => {
      const categories = new Map<string, number>();
      filteredCosts.forEach((cost) => {
        categories.set(cost.category, (categories.get(cost.category) ?? 0) + cost.amount);
      });
      const baseColors = summarySeries.costBreakdown;
      return baseColors
        .map((item) => ({
          label: item.label,
          color: item.color,
          value: Math.round(categories.get(item.label) ?? categories.get(item.label === "Misc" ? "Miscellaneous" : item.label) ?? 0),
        }))
        .filter((item) => item.value > 0);
    },
    [filteredCosts]
  );

  const purchasesSeries = activeSeries.keys.map((key) => purchasesByBucket[key]);
  const revenueSeries = activeSeries.keys.map((key) => revenueByBucket[key]);
  const grossProfitSeries = activeSeries.keys.map((key) => revenueByBucket[key] - purchasesByBucket[key]);
  const netProfitSeries = activeSeries.keys.map(
    (key) => revenueByBucket[key] - purchasesByBucket[key] - costsByBucket[key]
  );

  return (
    <AdminLayout>
      <section className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Purchases Summary</h1>
              <p className="text-sm text-slate-500">Financial analytics for purchasing and operational performance</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toast.success("Summary CSV export queued.")}
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
              <button
                type="button"
                onClick={() => toast.success("Summary Excel export queued.")}
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Export Excel
              </button>
              <span className="text-sm font-medium text-slate-600">Period</span>
              <select
                value={period}
                onChange={(event) => setPeriod(event.target.value as Period)}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value="Day">Day</option>
                <option value="Month">Month</option>
                <option value="Quarter">Quarter</option>
                <option value="Year">Year</option>
              </select>
            </div>
          </div>
        </div>

        <PurchasesModuleNav />

        <SummaryCards
          totalPurchases={stats.totalPurchases}
          totalCosts={stats.totalCosts}
          revenue={stats.revenue}
          grossProfit={stats.grossProfit}
          netProfit={stats.netProfit}
          avgPurchaseCost={stats.avgPurchaseCost}
          totalOrders={stats.totalOrders}
        />

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <PurchasesRevenueChart
            labels={activeSeries.labels}
            purchases={purchasesSeries}
            revenue={revenueSeries}
          />
          <CostsBreakdownChart slices={costSlices.length > 0 ? costSlices : summarySeries.costBreakdown.map((item) => ({ ...item, value: 0 }))} />
        </div>

        <ProfitTrendChart
          labels={activeSeries.labels}
          grossProfit={grossProfitSeries}
          netProfit={netProfitSeries}
        />

        <p className="text-xs text-slate-500">
          Viewing analytics for: <span className="font-semibold text-slate-700">{period}</span>
        </p>
        {salesLoading ? <p className="text-xs text-slate-500">Loading sales totals...</p> : null}
        {salesError ? <p className="text-xs text-rose-600">{salesError}</p> : null}
      </section>
    </AdminLayout>
  );
}
