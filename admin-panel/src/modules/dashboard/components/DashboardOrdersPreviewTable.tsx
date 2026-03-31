"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import GradientCard from "@/components/ui/GradientCard";
import GlassTable from "@/components/ui/GlassTable";
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
  const { language } = useLocalization();
  const text =
    language === "ar"
      ? {
          viewAll: "عرض الكل",
          order: "الطلب",
          customer: "العميل",
          status: "الحالة",
          payment: "الدفع",
          total: "الإجمالي",
          createdAt: "تاريخ الإنشاء",
        }
      : {
          viewAll: "View all",
          order: "Order",
          customer: "Customer",
          status: "Status",
          payment: "Payment",
          total: "Total",
          createdAt: "Created At",
        };

  return (
    <GradientCard as="section" glow padding="md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-50">{title}</h3>
            <Badge tone="info" className="min-w-8 justify-center px-2">
              {count}
            </Badge>
          </div>
          <p className="text-xs text-slate-400">{description}</p>
        </div>
        <Link href={viewAllHref}>
          <Button variant="secondary" size="sm">
            {text.viewAll}
          </Button>
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-slate-400">
          {emptyText}
        </div>
      ) : (
        <div className="mt-4">
          <GlassTable className="rounded-2xl bg-white/[0.04]">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-white/10 text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em]">{text.order}</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em]">{text.customer}</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em]">{text.status}</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em]">{text.payment}</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em]">{text.total}</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em]">{text.createdAt}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-slate-200">
                {items.map((item) => (
                  <tr
                    key={`${item.orderType}-${item.id}`}
                    className="cursor-pointer transition hover:bg-white/6"
                    onClick={() => router.push(getOrderHref(item))}
                  >
                    <td className="px-4 py-3 font-medium text-slate-50">{item.orderNumber}</td>
                    <td className="px-4 py-3">{item.customerName}</td>
                    <td className="px-4 py-3">
                      <Badge>{formatDashboardStatus(item.status)}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <p>{formatDashboardStatus(item.paymentType)}</p>
                        <p className="text-xs text-slate-500">{formatDashboardStatus(item.paymentStatus)}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">{formatDashboardCurrency(item.total)}</td>
                    <td className="px-4 py-3">{formatDashboardDateTime(item.createdAt, language)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassTable>
        </div>
      )}
    </GradientCard>
  );
}
