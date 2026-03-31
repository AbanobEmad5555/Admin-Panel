"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { DashboardOrderPreviewItem } from "@/modules/dashboard/api/dashboard.types";
import {
  formatDashboardCurrency,
  formatDashboardDateTime,
  formatDashboardStatus,
} from "@/modules/dashboard/utils/dashboardFormatters";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

type DashboardOrdersPreviewTableProps = {
  title: string;
  count: number;
  description: string;
  items: DashboardOrderPreviewItem[];
  emptyText: string;
  viewAllHref: string;
};

const getOrderHref = (order: DashboardOrderPreviewItem) => {
  if (order.orderType === "POS") {
    return `/admin/pos/orders/${order.id}`;
  }
  if (order.orderType === "TEMP") {
    return `/admin/orders?section=temp&orderId=${encodeURIComponent(String(order.id))}`;
  }
  return `/admin/orders/${order.id}`;
};

export default function DashboardOrdersPreviewTable({
  title,
  count,
  description,
  items,
  emptyText,
  viewAllHref,
}: DashboardOrdersPreviewTableProps) {
  const router = useRouter();
  const { language, t } = useLocalization();

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
              {count}
            </span>
          </div>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
        <Link
          href={viewAllHref}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
        >
          {t("dashboard.orders.viewAll", "View all")}
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          {emptyText}
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="py-2 pr-4 font-medium">{t("dashboard.orders.orderNumber", "Order")}</th>
                <th className="py-2 pr-4 font-medium">{t("dashboard.orders.customer", "Customer")}</th>
                <th className="py-2 pr-4 font-medium">{t("dashboard.orders.status", "Status")}</th>
                <th className="py-2 pr-4 font-medium">{t("dashboard.orders.payment", "Payment")}</th>
                <th className="py-2 pr-4 font-medium">{t("dashboard.orders.total", "Total")}</th>
                <th className="py-2 pr-4 font-medium">{t("dashboard.orders.createdAt", "Created At")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {items.map((item) => (
                <tr
                  key={`${item.orderType}-${item.id}`}
                  className="cursor-pointer transition hover:bg-slate-50"
                  onClick={() => router.push(getOrderHref(item))}
                >
                  <td className="py-3 pr-4 font-medium text-slate-900">{item.orderNumber}</td>
                  <td className="py-3 pr-4">{item.customerName}</td>
                  <td className="py-3 pr-4">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                      {formatDashboardStatus(item.status)}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="space-y-1">
                      <p>{formatDashboardStatus(item.paymentType)}</p>
                      <p className="text-xs text-slate-500">{formatDashboardStatus(item.paymentStatus)}</p>
                    </div>
                  </td>
                  <td className="py-3 pr-4">{formatDashboardCurrency(item.total)}</td>
                  <td className="py-3 pr-4">{formatDashboardDateTime(item.createdAt, language)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
