"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import POSLayout from "@/modules/pos/components/POSLayout";
import ReportsTable from "@/modules/pos/components/ReportsTable";
import { useDailyReport, usePosOrdersByDate } from "@/modules/pos/hooks/useReports";
import { usePosProducts } from "@/modules/pos/hooks/useProducts";
import { useLocalization } from "@/modules/localization/LocalizationProvider";
import { formatEGP } from "@/lib/currency";

const today = () => new Date().toISOString().slice(0, 10);

const toNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return 0;
};

const normalizePaymentBreakdown = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.map((row) => {
      const record = (row ?? {}) as Record<string, unknown>;
      return {
        method: String(record.method ?? record.type ?? "UNKNOWN"),
        amount: toNumber(record.amount ?? record.total),
      };
    });
  }

  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).map(([method, amount]) => ({
      method,
      amount: toNumber(amount),
    }));
  }

  return [];
};

const extractImageValue = (value: unknown): string => {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) {
    for (const entry of value) {
      const candidate = extractImageValue(entry);
      if (candidate) return candidate;
    }
    return "";
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return (
      (typeof record.url === "string" ? record.url : "") ||
      (typeof record.imageUrl === "string" ? record.imageUrl : "") ||
      (typeof record.image === "string" ? record.image : "") ||
      (typeof record.path === "string" ? record.path : "")
    );
  }
  return "";
};

type ProductPreviewMap = Map<string, { name: string; imageUrl?: string }>;

const getOrderItemNamesPreview = (
  items: unknown,
  productMap: ProductPreviewMap,
  unnamedItemLabel: string,
  productPrefixLabel: string,
  moreLabel: string
): string => {
  if (!Array.isArray(items) || items.length === 0) return "-";
  const names = items
    .map((entry) => {
      const item = (entry ?? {}) as Record<string, unknown>;
      const productId = item.productId ? String(item.productId) : "";
      const mappedName = productId ? productMap.get(productId)?.name : "";
      if (mappedName) return mappedName;
      const name =
        item.name ??
        item.productName ??
        (item.product as Record<string, unknown> | undefined)?.name;
      if (typeof name === "string" && name.trim()) return name.trim();
      return productId ? `${productPrefixLabel} #${productId}` : unnamedItemLabel;
    })
    .filter(Boolean);

  if (names.length <= 2) return names.join(", ");
  return `${names.slice(0, 2).join(", ")} +${names.length - 2} ${moreLabel}`;
};

const getOrderItemImage = (items: unknown, productMap: ProductPreviewMap): string => {
  if (!Array.isArray(items) || items.length === 0) return "";
  for (const entry of items) {
    const item = (entry ?? {}) as Record<string, unknown>;
    const productId = item.productId ? String(item.productId) : "";
    const mappedImage = productId ? productMap.get(productId)?.imageUrl : "";
    if (mappedImage) return mappedImage;
    const nestedProduct = (item.product ?? {}) as Record<string, unknown>;
    const image =
      extractImageValue(item.imageUrl) ||
      extractImageValue(item.image) ||
      extractImageValue(item.images) ||
      extractImageValue(item.productImage) ||
      extractImageValue(nestedProduct.imageUrl) ||
      extractImageValue(nestedProduct.image) ||
      extractImageValue(nestedProduct.images);
    if (image) return image;
  }
  return "";
};

export default function PosDailyReportPage() {
  const { language } = useLocalization();
  const [date, setDate] = useState(today());
  const [ordersPage, setOrdersPage] = useState(1);
  const ordersPageSize = 10;
  const { data, isLoading, isError } = useDailyReport(date);
  const {
    data: posOrders = [],
    isLoading: isPosOrdersLoading,
    isError: isPosOrdersError,
    refetch: refetchPosOrders,
  } = usePosOrdersByDate(date);
  const { data: products = [] } = usePosProducts();

  const text =
    language === "ar"
      ? {
          title: "التقرير اليومي",
          description: "مبيعات نقطة البيع والضريبة والخصم وعدد الطلبات وتوزيع طرق الدفع.",
          date: "التاريخ",
          loadingReport: "جارٍ تحميل التقرير...",
          failedReport: "تعذر تحميل التقرير.",
          totalSales: "إجمالي المبيعات",
          totalTax: "إجمالي الضريبة",
          totalDiscount: "إجمالي الخصم",
          ordersCount: "عدد الطلبات",
          paymentMethod: "طريقة الدفع",
          amount: "المبلغ",
          posOrders: "طلبات نقطة البيع",
          posOrdersSubtitle: "جميع الطلبات المنشأة في التاريخ المحدد.",
          refresh: "تحديث",
          refreshing: "جارٍ التحديث...",
          failedPosOrders: "تعذر تحميل طلبات نقطة البيع.",
          noPosOrders: "لا توجد طلبات نقطة بيع في التاريخ المحدد.",
          posOrderId: "معرّف طلب نقطة البيع",
          itemImage: "صورة المنتج",
          itemName: "اسم المنتج",
          customerName: "اسم العميل",
          walkInCustomer: "عميل مباشر",
          mobile: "الجوال",
          totalAmount: "الإجمالي",
          paymentStatus: "حالة الدفع",
          currentStatus: "الحالة الحالية",
          createdAt: "تاريخ الإنشاء",
          action: "الإجراء",
          viewDetails: "عرض التفاصيل",
          noImage: "لا توجد صورة",
          previous: "السابق",
          next: "التالي",
          more: "أخرى",
          unnamedItem: "عنصر غير مسمى",
          productPrefix: "منتج",
        }
      : {
          title: "Daily Report",
          description: "POS sales, tax, discount, orders count, and payment method breakdown.",
          date: "Date",
          loadingReport: "Loading report...",
          failedReport: "Failed to load report.",
          totalSales: "Total Sales",
          totalTax: "Total Tax",
          totalDiscount: "Total Discount",
          ordersCount: "Orders Count",
          paymentMethod: "Payment Method",
          amount: "Amount",
          posOrders: "POS Orders",
          posOrdersSubtitle: "All orders created on selected date.",
          refresh: "Refresh",
          refreshing: "Refreshing...",
          failedPosOrders: "Failed to load POS orders.",
          noPosOrders: "No POS orders for selected date.",
          posOrderId: "POS Order ID",
          itemImage: "Item Image",
          itemName: "Item Name",
          customerName: "Customer Name",
          walkInCustomer: "Walk-in Customer",
          mobile: "Mobile",
          totalAmount: "Total Amount",
          paymentStatus: "Payment Status",
          currentStatus: "Current Status",
          createdAt: "Created At",
          action: "Action",
          viewDetails: "View Details",
          noImage: "No image",
          previous: "Previous",
          next: "Next",
          more: "more",
          unnamedItem: "Unnamed item",
          productPrefix: "Product",
        };

  const productMap = useMemo(
    () =>
      new Map(
        products.map((product) => [
          String(product.id),
          { name: product.name, imageUrl: product.imageUrl },
        ])
      ),
    [products]
  );

  const paymentRows = useMemo(() => {
    const breakdown = normalizePaymentBreakdown(data?.paymentBreakdown);
    return breakdown.map((row) => ({
      method: row.method,
      amount: formatEGP(row.amount),
    }));
  }, [data?.paymentBreakdown]);

  const ordersTotalPages = Math.max(1, Math.ceil(posOrders.length / ordersPageSize));
  const safeOrdersPage = Math.min(ordersPage, ordersTotalPages);
  const pagedPosOrders = useMemo(() => {
    const start = (safeOrdersPage - 1) * ordersPageSize;
    return posOrders.slice(start, start + ordersPageSize);
  }, [ordersPageSize, posOrders, safeOrdersPage]);

  return (
    <POSLayout title={text.title} description={text.description}>
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <label className="text-sm font-medium text-slate-700">{text.date}</label>
        <input
          type="date"
          value={date}
          onChange={(event) => {
            setDate(event.target.value);
            setOrdersPage(1);
          }}
          className="mt-1 w-full max-w-xs rounded border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      {isLoading ? (
        <div className="rounded-xl bg-white p-6 text-sm text-slate-500">{text.loadingReport}</div>
      ) : null}
      {isError ? (
        <div className="rounded-xl bg-rose-50 p-6 text-sm text-rose-700">{text.failedReport}</div>
      ) : null}

      {data ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">{text.totalSales}</p>
            <p className="text-xl font-bold text-violet-700">{formatEGP(toNumber(data.totalSales))}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">{text.totalTax}</p>
            <p className="text-xl font-bold text-violet-700">{formatEGP(toNumber(data.totalTax))}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">{text.totalDiscount}</p>
            <p className="text-xl font-bold text-violet-700">{formatEGP(toNumber(data.totalDiscount))}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">{text.ordersCount}</p>
            <p className="text-xl font-bold text-violet-700">{toNumber(data.ordersCount)}</p>
          </div>
        </div>
      ) : null}

      <ReportsTable
        columns={[
          { key: "method", label: text.paymentMethod },
          { key: "amount", label: text.amount },
        ]}
        rows={paymentRows}
      />

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{text.posOrders}</h2>
            <p className="text-sm text-slate-500">{text.posOrdersSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setOrdersPage(1);
              void refetchPosOrders();
            }}
            disabled={isPosOrdersLoading}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPosOrdersLoading ? text.refreshing : text.refresh}
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          {isPosOrdersLoading ? (
            <div className="space-y-3">
              <div className="h-8 w-full animate-pulse rounded bg-slate-200" />
              <div className="h-8 w-full animate-pulse rounded bg-slate-200" />
            </div>
          ) : isPosOrdersError ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {text.failedPosOrders}
            </p>
          ) : posOrders.length === 0 ? (
            <p className="text-sm text-slate-500">{text.noPosOrders}</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="py-2 pr-4 font-medium">{text.posOrderId}</th>
                  <th className="py-2 pr-4 font-medium">{text.itemImage}</th>
                  <th className="py-2 pr-4 font-medium">{text.itemName}</th>
                  <th className="py-2 pr-4 font-medium">{text.customerName}</th>
                  <th className="py-2 pr-4 font-medium">{text.mobile}</th>
                  <th className="py-2 pr-4 font-medium">{text.totalAmount}</th>
                  <th className="py-2 pr-4 font-medium">{text.paymentMethod}</th>
                  <th className="py-2 pr-4 font-medium">{text.paymentStatus}</th>
                  <th className="py-2 pr-4 font-medium">{text.currentStatus}</th>
                  <th className="py-2 pr-4 font-medium">{text.createdAt}</th>
                  <th className="py-2 pr-4 font-medium">{text.action}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {pagedPosOrders.map((order, index) => {
                  const itemImage = getOrderItemImage(order.items, productMap);
                  const itemName = getOrderItemNamesPreview(
                    order.items,
                    productMap,
                    text.unnamedItem,
                    text.productPrefix,
                    text.more
                  );
                  const paymentMethod =
                    order.paymentMethod ||
                    (Array.isArray(order.payments) && order.payments.length > 0
                      ? Array.from(
                          new Set(
                            order.payments
                              .map((line) => String(line.method ?? "").toUpperCase())
                              .filter((method) => Boolean(method))
                          )
                        ).join(", ")
                      : "-");

                  return (
                    <tr key={`${order.id}-${order.createdAt ?? index}`}>
                      <td className="py-3 pr-4">
                        <Link
                          href={`/admin/pos/orders/${order.id}`}
                          className="font-medium text-violet-700 hover:underline"
                        >
                          {order.id ?? "-"}
                        </Link>
                      </td>
                      <td className="py-3 pr-4">
                        {itemImage ? (
                          <div
                            className="h-10 w-10 rounded-md border border-slate-200 bg-cover bg-center"
                            style={{ backgroundImage: `url(${itemImage})` }}
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-100 text-[10px] text-slate-500">
                            {text.noImage}
                          </div>
                        )}
                      </td>
                      <td className="py-3 pr-4">{itemName}</td>
                      <td className="py-3 pr-4">{order.customerName ?? text.walkInCustomer}</td>
                      <td className="py-3 pr-4">{order.customerMobileNumber ?? "-"}</td>
                      <td className="py-3 pr-4">{formatEGP(toNumber(order.total))}</td>
                      <td className="py-3 pr-4">{paymentMethod}</td>
                      <td className="py-3 pr-4">{order.paymentStatus ?? "-"}</td>
                      <td className="py-3 pr-4">{order.status ?? "-"}</td>
                      <td className="py-3 pr-4">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString(
                              language === "ar" ? "ar-EG" : "en-US"
                            )
                          : "-"}
                      </td>
                      <td className="py-3 pr-4">
                        <Link
                          href={`/admin/pos/orders/${order.id}`}
                          className="inline-flex rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                        >
                          {text.viewDetails}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {!isPosOrdersLoading && !isPosOrdersError && posOrders.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setOrdersPage((prev) => Math.max(1, prev - 1))}
              disabled={safeOrdersPage === 1}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {text.previous}
            </button>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: ordersTotalPages }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setOrdersPage(page)}
                  className={`rounded-md px-3 py-2 text-sm ${
                    page === safeOrdersPage
                      ? "bg-slate-900 text-white"
                      : "border border-slate-300 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setOrdersPage((prev) => Math.min(ordersTotalPages, prev + 1))}
              disabled={safeOrdersPage === ordersTotalPages}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {text.next}
            </button>
          </div>
        ) : null}
      </div>
    </POSLayout>
  );
}
