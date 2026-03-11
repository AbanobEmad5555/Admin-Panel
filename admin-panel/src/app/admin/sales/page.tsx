"use client";

import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { useLocalization } from "@/modules/localization/LocalizationProvider";
import api from "@/services/api";

type SalesSnapshotData = {
  totalSales: number;
  totalOrders: number;
  rangeLabel: string;
  startDate?: string;
  endDate?: string;
};

type BestSellerData = {
  productName: string | null;
  quantity: number;
};

type TopProduct = {
  id: string;
  name: string;
  quantity: number;
};

type SnapshotState = {
  data: SalesSnapshotData | null;
  loading: boolean;
  error: string;
};

type BestSellerState = {
  data: BestSellerData | null;
  loading: boolean;
  error: string;
};

type TopProductsState = {
  data: TopProduct[];
  loading: boolean;
  error: string;
};

type KpiFrame = {
  key: string;
  title: string;
  endpoint: string;
};

type BestSellerFrame = {
  key: string;
  label: string;
  endpoint: string;
};

type UnknownRecord = Record<string, unknown>;

const TOP_PRODUCTS_PER_PAGE = 10;

const safeNumber = (value: unknown): number => {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const formatCurrency = (value: number) => {
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
  return `${formatted} EGP`;
};

const formatShortDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const deduceRangeLabel = (payload: unknown) => {
  if (!payload) {
    return "";
  }
  const record = payload as UnknownRecord;

  const stringCandidate =
    typeof record.rangeLabel === "string" && record.rangeLabel.trim().length > 0
      ? record.rangeLabel.trim()
      : undefined;

  if (stringCandidate) {
    return stringCandidate;
  }

  const startDateCandidate = record.startDate ?? record.start_date;
  const endDateCandidate = record.endDate ?? record.end_date;
  const startDate = typeof startDateCandidate === "string" ? startDateCandidate : undefined;
  const endDate = typeof endDateCandidate === "string" ? endDateCandidate : undefined;

  if (startDate && endDate) {
    const startLabel = formatShortDate(startDate);
    const endLabel = formatShortDate(endDate);
    if (startLabel && endLabel && startLabel !== endLabel) {
      return `${startLabel} — ${endLabel}`;
    }
    return startLabel;
  }

  if (startDate) {
    return formatShortDate(startDate);
  }

  if (endDate) {
    return formatShortDate(endDate);
  }

  return "";
};

const createSnapshotState = (frames: KpiFrame[]) =>
  frames.reduce((acc, frame) => {
    acc[frame.key] = { data: null, loading: true, error: "" };
    return acc;
  }, {} as Record<string, SnapshotState>);

const createBestSellerState = (frames: BestSellerFrame[]) =>
  frames.reduce((acc, frame) => {
    acc[frame.key] = { data: null, loading: true, error: "" };
    return acc;
  }, {} as Record<string, BestSellerState>);

const normalizeSnapshotPayload = (payload: unknown): SalesSnapshotData => {
  const record = (payload ?? {}) as UnknownRecord;
  return {
    totalSales: safeNumber(record.totalSales),
    totalOrders: safeNumber(record.totalOrders),
    rangeLabel: deduceRangeLabel(record),
    startDate: typeof record.startDate === "string" ? record.startDate : undefined,
    endDate: typeof record.endDate === "string" ? record.endDate : undefined,
  };
};

const normalizeBestSellerPayload = (payload: unknown): BestSellerData => {
  const record = (payload ?? {}) as UnknownRecord;
  const product = (record.product ?? {}) as UnknownRecord;
  return {
    productName:
      (typeof product.name === "string" ? product.name : null) ??
      (typeof record.name === "string" ? record.name : null) ??
      (typeof record.title === "string" ? record.title : null) ??
      (typeof record.productName === "string" ? record.productName : null) ??
      (typeof record.product_title === "string" ? record.product_title : null),
    quantity: safeNumber(
      record.quantity ??
        record.qty ??
        record.soldQuantity ??
        record.totalQuantity ??
        record.total ??
        record.count ??
        record.amount ??
        record.value
    ),
  };
};

const normalizeTopProductItem = (item: unknown, index: number): TopProduct => {
  const record = (item ?? {}) as UnknownRecord;
  return {
    id: String(record.id ?? record.productId ?? record.sku ?? index),
    name:
      (typeof record.name === "string" ? record.name : "") ||
      (typeof record.productName === "string" ? record.productName : "") ||
      (typeof record.title === "string" ? record.title : "") ||
      (typeof record.label === "string" ? record.label : "") ||
      (typeof record.product_title === "string" ? record.product_title : "") ||
      text.unnamedProduct,
    quantity: safeNumber(
      record.quantity ??
        record.qty ??
        record.soldQuantity ??
        record.totalQuantity ??
        record.total ??
        record.count ??
        record.amount ??
        record.value
    ),
  };
};

export default function SalesDashboardPage() {
  const { language } = useLocalization();
  const text = useMemo(
    () =>
      language === "ar"
        ? {
          today: "اليوم",
          thisMonth: "هذا الشهر",
          thisQuarter: "هذا الربع",
          thisYear: "هذا العام",
          lastMonth: "الشهر الماضي",
          insights: "الرؤى",
          title: "لوحة المبيعات",
          subtitle: "لقطة مباشرة للإيرادات وأفضل المبيعات وزخم المنتجات.",
          totalSalesFor: "إجمالي المبيعات خلال",
          orders: "طلبات",
          lastYear: "العام الماضي",
          historicalSales: "إجمالي المبيعات التاريخي للمقارنة",
          bestSellers: "الأكثر مبيعًا",
          bestSellersSubtitle: "أفضل منتج أداءً لكل إطار زمني",
          bestSellerPerformance: "أداء أفضل مبيعًا باستخدام بيانات التنفيذ",
          quantitySoldFor: "الكمية المباعة لأفضل منتج خلال",
          quantity: "الكمية",
          noBestSeller: "لا يوجد أفضل مبيعًا بعد",
          topProducts: "أفضل المنتجات",
          topProductsSubtitle: "أفضل 10 منتجات مرتبة حسب الوحدات المشحونة",
          sortHint: "مرر فوق العناوين لتغيير اتجاه الفرز",
          noTopProducts: "لا توجد منتجات الأعلى مبيعًا بعد.",
          page: "الصفحة",
          of: "من",
          prev: "السابق",
          next: "التالي",
          product: "المنتج",
          sortByProductName: "الترتيب حسب اسم المنتج",
          sortByQuantity: "الترتيب حسب إجمالي الكمية المباعة",
          unnamedProduct: "منتج بدون اسم",
          }
        : {
          today: "Today",
          thisMonth: "This Month",
          thisQuarter: "This Quarter",
          thisYear: "This Year",
          lastMonth: "Last Month",
          insights: "Insights",
          title: "Sales Dashboard",
          subtitle: "Live snapshot of revenue, best sellers, and product momentum.",
          totalSalesFor: "Total sales for",
          orders: "orders",
          lastYear: "Last Year",
          historicalSales: "Historical total sales for reference",
          bestSellers: "Best Sellers",
          bestSellersSubtitle: "Top-performing product for each timeframe",
          bestSellerPerformance: "Best seller ecommerce performance using fulfillment data",
          quantitySoldFor: "Quantity sold for best seller during",
          quantity: "Quantity",
          noBestSeller: "No best seller yet",
          topProducts: "Top Products",
          topProductsSubtitle: "Top 10 products sorted by units shipped",
          sortHint: "Hover the headers to change the sort direction",
          noTopProducts: "No top-selling products yet.",
          page: "Page",
          of: "of",
          prev: "Prev",
          next: "Next",
          product: "Product",
          sortByProductName: "Sort by product name",
          sortByQuantity: "Sort by total quantity sold",
          unnamedProduct: "Unnamed product",
          },
    [language]
  );

  const kpiTimeframes = useMemo<KpiFrame[]>(() => {
    return [
      {
        key: "today",
        title: text.today,
        endpoint: "/sales/today",
      },
      {
        key: "thisMonth",
        title: text.thisMonth,
        endpoint: "/sales/this-month",
      },
      {
        key: "thisQuarter",
        title: text.thisQuarter,
        endpoint: "/sales/this-quarter",
      },
      {
        key: "thisYear",
        title: text.thisYear,
        endpoint: "/sales/this-year",
      },
    ];
  }, [text]);

  const bestSellerTimeframes = useMemo<BestSellerFrame[]>(() => {
    return [
      {
        key: "today",
        label: text.today,
        endpoint: "/sales/best-seller/today",
      },
      {
        key: "thisMonth",
        label: text.thisMonth,
        endpoint: "/sales/best-seller/this-month",
      },
      {
        key: "lastMonth",
        label: text.lastMonth,
        endpoint: "/sales/best-seller/last-month",
      },
      {
        key: "thisYear",
        label: text.thisYear,
        endpoint: "/sales/best-seller/this-year",
      },
    ];
  }, [text]);

  const lastYearLabel = useMemo(
    () => (new Date().getFullYear() - 1).toString(),
    []
  );

  const [kpiState, setKpiState] = useState<Record<string, SnapshotState>>(() =>
    createSnapshotState(kpiTimeframes)
  );
  const [bestSellerState, setBestSellerState] = useState<
    Record<string, BestSellerState>
  >(() => createBestSellerState(bestSellerTimeframes));

  const [lastYearState, setLastYearState] = useState<{
    data: SalesSnapshotData | null;
    loading: boolean;
    error: string;
  }>({ data: null, loading: true, error: "" });

  const [topProductsState, setTopProductsState] = useState<TopProductsState>({
    data: [],
    loading: true,
    error: "",
  });

  const [sortKey, setSortKey] = useState<"name" | "quantity">("quantity");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let isMounted = true;

    kpiTimeframes.forEach((frame) => {
      (async () => {
        if (!isMounted) {
          return;
        }
        setKpiState((prev) => ({
          ...prev,
          [frame.key]: {
            ...prev[frame.key],
            loading: true,
            error: "",
          },
        }));

        try {
          const response = await api.get(frame.endpoint);
          if (!isMounted) {
            return;
          }
          const payload = response.data?.data ?? response.data;
          const normalized = normalizeSnapshotPayload(payload);

          if (!isMounted) {
            return;
          }

          setKpiState((prev) => ({
            ...prev,
            [frame.key]: {
              data: normalized,
              loading: false,
              error: "",
            },
          }));
        } catch {
          if (!isMounted) {
            return;
          }
          setKpiState((prev) => ({
            ...prev,
            [frame.key]: {
              ...prev[frame.key],
              loading: false,
              error: "Unable to load totals.",
            },
          }));
        }
      })();
    });

    return () => {
      isMounted = false;
    };
  }, [kpiTimeframes]);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      setLastYearState((prev) => ({
        ...prev,
        loading: true,
        error: "",
      }));
      try {
        const response = await api.get("/sales/last-year");
        if (!isMounted) {
          return;
        }
        const payload = response.data?.data ?? response.data;
        const normalized = normalizeSnapshotPayload(payload);

        if (!isMounted) {
          return;
        }
        setLastYearState({ data: normalized, loading: false, error: "" });
      } catch {
        if (!isMounted) {
          return;
        }
        setLastYearState({
          data: null,
          loading: false,
          error: "Unable to load last year totals.",
        });
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [lastYearLabel]);

  useEffect(() => {
    let isMounted = true;

    bestSellerTimeframes.forEach((frame) => {
      (async () => {
        if (!isMounted) {
          return;
        }
        setBestSellerState((prev) => ({
          ...prev,
          [frame.key]: {
            ...prev[frame.key],
            loading: true,
            error: "",
          },
        }));

        try {
          const response = await api.get(frame.endpoint);
          if (!isMounted) {
            return;
          }
          const payload = response.data?.data ?? response.data;
          const normalized = normalizeBestSellerPayload(payload);

          if (!isMounted) {
            return;
          }

          setBestSellerState((prev) => ({
            ...prev,
            [frame.key]: {
              data: normalized,
              loading: false,
              error: "",
            },
          }));
        } catch {
          if (!isMounted) {
            return;
          }
          setBestSellerState((prev) => ({
            ...prev,
            [frame.key]: {
              ...prev[frame.key],
              loading: false,
              error: "Unable to load best sellers.",
            },
          }));
        }
      })();
    });

    return () => {
      isMounted = false;
    };
  }, [bestSellerTimeframes]);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      setTopProductsState((prev) => ({
        ...prev,
        loading: true,
        error: "",
      }));

      try {
        const response = await api.get("/sales/top-products");
        if (!isMounted) {
          return;
        }
        const payload = response.data?.data ?? response.data;
        let rawList: unknown[] = [];

        if (Array.isArray(payload)) {
          rawList = payload;
        } else if (Array.isArray(payload?.items)) {
          rawList = payload.items;
        } else if (Array.isArray(payload?.products)) {
          rawList = payload.products;
        } else if (Array.isArray(payload?.data)) {
          rawList = payload.data;
        }

        const normalizedList = rawList.map((item, index) =>
          normalizeTopProductItem(item, index)
        );

        if (!isMounted) {
          return;
        }

        setTopProductsState({
          data: normalizedList,
          loading: false,
          error: "",
        });
      } catch {
        if (!isMounted) {
          return;
        }
        setTopProductsState({
          data: [],
          loading: false,
          error: "Unable to load top products.",
        });
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const sortedProducts = useMemo(() => {
    const list = [...topProductsState.data];
    list.sort((a, b) => {
      if (sortKey === "quantity") {
        return sortDirection === "asc"
          ? a.quantity - b.quantity
          : b.quantity - a.quantity;
      }
      return sortDirection === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    });
    return list;
  }, [topProductsState.data, sortDirection, sortKey]);

  const totalPages = Math.max(
    1,
    Math.ceil(sortedProducts.length / TOP_PRODUCTS_PER_PAGE)
  );
  const effectiveCurrentPage = Math.min(currentPage, totalPages);

  const paginatedProducts = sortedProducts.slice(
    (effectiveCurrentPage - 1) * TOP_PRODUCTS_PER_PAGE,
    effectiveCurrentPage * TOP_PRODUCTS_PER_PAGE
  );

  const maxQuantity = sortedProducts.reduce(
    (max, product) => Math.max(max, product.quantity),
    0
  );

  const handleSort = (key: "name" | "quantity") => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDirection("desc");
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <header className="space-y-1">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            {text.insights}
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            {text.title}
          </h1>
          <p className="text-sm text-slate-500">
            {text.subtitle}
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpiTimeframes.map((frame) => {
            const state = kpiState[frame.key];
            const total = state?.data?.totalSales ?? 0;
            const rangeLabel = state?.data?.rangeLabel || "Range unavailable";
            const totalOrders = state?.data?.totalOrders ?? 0;

            return (
              <article
                key={frame.key}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-600">
                    {frame.title}
                  </p>
                  <span
                    className="text-xs text-slate-400"
                    title={`${text.totalSalesFor} ${frame.title}`}
                  >
                    ℹ
                  </span>
                </div>

                {state?.loading ? (
                  <div className="mt-4 h-10 w-3/4 animate-pulse rounded-lg bg-slate-100" />
                ) : (
                  <p className="mt-4 text-3xl font-semibold text-emerald-600">
                    {formatCurrency(total)}
                  </p>
                )}

                <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">
                  {rangeLabel}
                </p>
                {!state?.loading && !state?.error ? (
                  <p className="mt-1 text-xs text-slate-500">{totalOrders} {text.orders}</p>
                ) : null}

                {state?.error && (
                  <p className="mt-3 text-xs text-rose-600">
                    {state.error}
                  </p>
                )}
              </article>
            );
          })}
        </section>

        <section>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{text.lastYear}</p>
                <p className="text-xs text-slate-500">
                  Jan 1 — Dec 31 {lastYearLabel}
                </p>
              </div>
              <span
                className="text-xs text-slate-400"
                title={text.historicalSales}
              >
                ℹ
              </span>
            </div>
            <div className="mt-4">
              {lastYearState.loading ? (
                <div className="h-12 w-32 animate-pulse rounded-lg bg-slate-100" />
              ) : (
                <p className="text-3xl font-semibold text-emerald-600">
                  {formatCurrency(lastYearState.data?.totalSales ?? 0)}
                </p>
              )}
              {lastYearState.error && (
                <p className="mt-2 text-xs text-rose-600">
                  {lastYearState.error}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {text.bestSellers}
              </h2>
              <p className="text-sm text-slate-500">
                {text.bestSellersSubtitle}
              </p>
            </div>
            <span
              className="text-xs text-slate-400"
              title={text.bestSellerPerformance}
            >
              ℹ
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {bestSellerTimeframes.map((frame) => {
              const state = bestSellerState[frame.key];
              const product = state?.data;
              const hasProduct = Boolean(product?.productName);

              return (
                <article
                  key={frame.key}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-600">
                      {frame.label}
                    </p>
                    <span
                      className="text-xs text-slate-400"
                      title={`${text.quantitySoldFor} ${frame.label}`}
                    >
                      ℹ
                    </span>
                  </div>

                  <div className="mt-5 space-y-1">
                    {state?.loading ? (
                      <div className="h-10 w-48 animate-pulse rounded-lg bg-slate-100" />
                    ) : state?.error ? (
                      <p className="text-xs text-rose-600">{state.error}</p>
                    ) : hasProduct ? (
                      <>
                        <p className="text-lg font-semibold text-slate-900">
                          {product?.productName}
                        </p>
                        <p className="text-sm text-slate-500">
                          {text.quantity}:{" "}
                          <span className="text-emerald-600">
                            {product?.quantity ?? 0}
                          </span>
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-slate-500">
                        {text.noBestSeller}
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {text.topProducts}
              </h2>
              <p className="text-sm text-slate-500">
                {text.topProductsSubtitle}
              </p>
            </div>
            <span
              className="text-xs text-slate-400"
              title={text.sortHint}
            >
              ℹ
            </span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {topProductsState.loading ? (
              <div className="space-y-4 p-6">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="space-y-3">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
                    <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
                  </div>
                ))}
              </div>
            ) : sortedProducts.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-slate-500">
                {text.noTopProducts}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full table-fixed border-collapse">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-6 py-3 text-left">
                          <button
                            type="button"
                            className="flex items-center gap-1 font-semibold"
                            onClick={() => handleSort("name")}
                            title={text.sortByProductName}
                          >
                            {text.product}
                            {sortKey === "name" && (
                              <span className="text-slate-400">
                                {sortDirection === "asc" ? "↑" : "↓"}
                              </span>
                            )}
                          </button>
                        </th>
                        <th className="px-6 py-3 text-left">
                          <button
                            type="button"
                            className="flex items-center gap-1 font-semibold"
                            onClick={() => handleSort("quantity")}
                            title={text.sortByQuantity}
                          >
                            {text.quantity}
                            {sortKey === "quantity" && (
                              <span className="text-slate-400">
                                {sortDirection === "asc" ? "↑" : "↓"}
                              </span>
                            )}
                          </button>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm text-slate-900">
                      {paginatedProducts.map((product) => {
                        const barWidth =
                          maxQuantity > 0
                            ? Math.round((product.quantity / maxQuantity) * 100)
                            : 0;

                        return (
                          <tr key={product.id}>
                            <td className="px-6 py-4">
                              <p className="font-medium">{product.name}</p>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-semibold text-slate-900">
                                {product.quantity}
                              </div>
                              <div
                                className="mt-2 h-2 rounded-full bg-slate-100"
                                aria-hidden="true"
                              >
                                <div
                                  className="h-2 rounded-full bg-emerald-500"
                                  style={{ width: `${barWidth}%` }}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-col gap-3 border-t border-slate-100 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    {text.page} {effectiveCurrentPage} {text.of} {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handlePrevPage}
                      disabled={effectiveCurrentPage === 1}
                      className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {text.prev}
                    </button>
                    <button
                      type="button"
                      onClick={handleNextPage}
                      disabled={effectiveCurrentPage === totalPages}
                      className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {text.next}
                    </button>
                  </div>
                </div>
              </>
            )}

            {topProductsState.error && (
              <p className="px-6 py-3 text-xs text-rose-600">
                {topProductsState.error}
              </p>
            )}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
