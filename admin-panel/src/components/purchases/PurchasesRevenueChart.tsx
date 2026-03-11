"use client";

import { useLocalization } from "@/modules/localization/LocalizationProvider";

type PurchasesRevenueChartProps = {
  labels: string[];
  purchases: number[];
  revenue: number[];
};

const toPath = (values: number[], width: number, height: number, maxValue: number) => {
  if (values.length === 0) {
    return "";
  }

  const stepX = values.length > 1 ? width / (values.length - 1) : width;
  return values
    .map((value, index) => {
      const x = index * stepX;
      const y = height - (value / maxValue) * height;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
};

export default function PurchasesRevenueChart({
  labels,
  purchases,
  revenue,
}: PurchasesRevenueChartProps) {
  const { language } = useLocalization();
  const maxValue = Math.max(...purchases, ...revenue, 1);
  const width = 560;
  const height = 220;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">
          {language === "ar" ? "المشتريات مقابل الإيرادات" : "Purchases vs Revenue"}
        </h3>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-slate-700" />
            {language === "ar" ? "المشتريات" : "Purchases"}
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-600" />
            {language === "ar" ? "الإيرادات" : "Revenue"}
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height + 30}`} className="h-[260px] min-w-[560px] w-full">
          <path d={toPath(purchases, width, height, maxValue)} fill="none" stroke="#334155" strokeWidth="3" />
          <path d={toPath(revenue, width, height, maxValue)} fill="none" stroke="#059669" strokeWidth="3" />
          {labels.map((label, index) => {
            const x = labels.length > 1 ? (index * width) / (labels.length - 1) : 0;
            return (
              <text key={label} x={x} y={height + 20} textAnchor="middle" className="fill-slate-500 text-[10px]">
                {label}
              </text>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
