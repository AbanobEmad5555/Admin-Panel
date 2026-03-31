"use client";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import GlassTable from "@/components/ui/GlassTable";
import type { PromoCodeRecord } from "@/services/promoCodesApi";
import { formatEGP } from "@/lib/currency";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

type PromoCodesTableProps = {
  promoCodes: PromoCodeRecord[];
  isLoading: boolean;
  onEdit: (item: PromoCodeRecord) => void;
  onDelete: (item: PromoCodeRecord) => void;
  onToggleStatus: (item: PromoCodeRecord) => void;
  rowLoading: Record<number, boolean>;
  emptyText?: string;
};

const formatValue = (item: PromoCodeRecord) =>
  item.type === "PERCENTAGE" ? `${item.value}%` : `${item.value}`;

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toISOString().split("T")[0];
};

const formatNumber = (value: number) => formatEGP(value);

const selectNumber = (
  first: number | null | undefined,
  second: number | null | undefined
) => {
  if (first !== undefined && first !== null) {
    return first;
  }
  if (second !== undefined && second !== null) {
    return second;
  }
  return null;
};

const selectBoolean = (first?: boolean, second?: boolean) =>
  first ?? second ?? false;

export default function PromoCodesTable({
  promoCodes,
  isLoading,
  onEdit,
  onDelete,
  onToggleStatus,
  rowLoading,
  emptyText,
}: PromoCodesTableProps) {
  const { language } = useLocalization();
  const text =
    language === "ar"
      ? {
          loading: "جارٍ تحميل أكواد الخصم...",
          empty: "لا توجد أكواد خصم بعد.",
          id: "المعرّف",
          code: "الكود",
          type: "النوع",
          value: "القيمة",
          minimumOrder: "الحد الأدنى للطلب",
          maxDiscount: "أقصى خصم",
          expireDate: "تاريخ الانتهاء",
          usagePerUser: "استخدام/مستخدم",
          totalUsage: "إجمالي الاستخدام",
          status: "الحالة",
          actions: "الإجراءات",
          active: "نشط",
          suspended: "موقوف",
          edit: "تعديل",
          delete: "حذف",
          suspend: "إيقاف",
          activate: "تفعيل",
          fixed: "ثابت",
          percentage: "نسبة مئوية",
        }
      : {
          loading: "Loading promo codes...",
          empty: "No promo codes yet. Create your first promo code.",
          id: "ID",
          code: "Code",
          type: "Type",
          value: "Value",
          minimumOrder: "Minimum Order",
          maxDiscount: "Max Discount",
          expireDate: "Expire Date",
          usagePerUser: "Usage/User",
          totalUsage: "Total Usage",
          status: "Status",
          actions: "Actions",
          active: "Active",
          suspended: "Suspended",
          edit: "Edit",
          delete: "Delete",
          suspend: "Suspend",
          activate: "Activate",
          fixed: "Fixed",
          percentage: "Percentage",
        };

  if (isLoading) {
    return <p className="text-sm text-slate-300">{text.loading}</p>;
  }

  if (promoCodes.length === 0) {
    return <p className="text-sm text-slate-300">{emptyText ?? text.empty}</p>;
  }

  return (
    <GlassTable>
      <table className="min-w-full text-sm">
        <thead className={`bg-white/[0.06] text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 ${language === "ar" ? "text-right" : "text-left"}`}>
          <tr>
            <th className="px-3 py-3">{text.id}</th>
            <th className="px-3 py-3">{text.code}</th>
            <th className="px-3 py-3">{text.type}</th>
            <th className="px-3 py-3">{text.value}</th>
            <th className="px-3 py-3">{text.minimumOrder}</th>
            <th className="px-3 py-3">{text.maxDiscount}</th>
            <th className="px-3 py-3">{text.expireDate}</th>
            <th className="px-3 py-3">{text.usagePerUser}</th>
            <th className="px-3 py-3">{text.totalUsage}</th>
            <th className="px-3 py-3">{text.status}</th>
            <th className="px-3 py-3">{text.actions}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10 text-slate-200">
          {promoCodes.map((item) => {
            const loading = rowLoading[item.id] ?? false;
            const isActive = selectBoolean(item.is_active, item.isActive);

            return (
              <tr key={item.id} className="transition hover:bg-white/[0.04]">
                <td className="px-3 py-3 font-semibold text-slate-50">{item.id}</td>
                <td className="px-3 py-3">{item.code}</td>
                <td className="px-3 py-3">
                  {item.type === "PERCENTAGE" ? text.percentage : text.fixed}
                </td>
                <td className="px-3 py-3">{formatValue(item)}</td>
                <td className="px-3 py-3">
                  {(() => {
                    const value = selectNumber(
                      item.minimum_order_price,
                      item.minimumOrderPrice
                    );
                    return value !== null ? formatNumber(value) : "-";
                  })()}
                </td>
                <td className="px-3 py-3">
                  {(() => {
                    const value = selectNumber(
                      item.max_discount_amount,
                      item.maxDiscountAmount
                    );
                    return value !== null ? formatNumber(value) : "-";
                  })()}
                </td>
                <td className="px-3 py-3">
                  {formatDate(item.expire_date ?? item.expireDate)}
                </td>
                <td className="px-3 py-3">
                  {selectNumber(item.max_usage_per_user, item.maxUsagePerUser) ?? "-"}
                </td>
                <td className="px-3 py-3">
                  {selectNumber(item.max_total_usage, item.maxTotalUsage) ?? "-"}
                </td>
                <td className="px-3 py-3">
                  <Badge tone={isActive ? "success" : "danger"}>
                    {isActive ? text.active : text.suspended}
                  </Badge>
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => onEdit(item)}
                      disabled={loading}
                      className="text-xs"
                    >
                      {text.edit}
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => onDelete(item)}
                      disabled={loading}
                      className="text-xs"
                    >
                      {text.delete}
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => onToggleStatus(item)}
                      disabled={loading}
                      className="text-xs"
                    >
                      {isActive ? text.suspend : text.activate}
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </GlassTable>
  );
}
