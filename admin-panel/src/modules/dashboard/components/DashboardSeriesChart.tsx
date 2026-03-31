"use client";

import GradientCard from "@/components/ui/GradientCard";
import type { DashboardSeriesPoint } from "@/modules/dashboard/api/dashboard.types";
import { formatDashboardCurrency } from "@/modules/dashboard/utils/dashboardFormatters";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

type DashboardSeriesChartProps = {
  title: string;
  subtitle: string;
  color: string;
  fill: string;
  series: DashboardSeriesPoint[];
};

const toLine = (values: number[], width: number, height: number, maxValue: number) => {
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

const toArea = (values: number[], width: number, height: number, maxValue: number) => {
  if (values.length === 0) {
    return "";
  }

  const line = toLine(values, width, height, maxValue);
  return `${line} L ${width} ${height} L 0 ${height} Z`;
};

export default function DashboardSeriesChart({
  title,
  subtitle,
  color,
  fill,
  series,
}: DashboardSeriesChartProps) {
  const { language } = useLocalization();
  const values = series.map((point) => point.value);
  const total = values.reduce((sum, value) => sum + value, 0);
  const width = 560;
  const height = 220;
  const maxValue = Math.max(...values, 1);

  return (
    <GradientCard as="section" glow padding="md">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-50">{title}</h3>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
            {language === "ar" ? "الإجمالي" : "Total"}
          </p>
          <p className="text-lg font-semibold text-slate-50">{formatDashboardCurrency(total)}</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height + 30}`} className="h-[260px] min-w-[560px] w-full">
          <path d={toArea(values, width, height, maxValue)} fill={fill} />
          <path d={toLine(values, width, height, maxValue)} fill="none" stroke={color} strokeWidth="3" />
          {series.map((point, index) => {
            const x = series.length > 1 ? (index * width) / (series.length - 1) : 0;
            return (
              <text
                key={`${point.label}-${index}`}
                x={x}
                y={height + 20}
                textAnchor="middle"
                className="fill-slate-500 text-[10px]"
              >
                {point.label}
              </text>
            );
          })}
        </svg>
      </div>
    </GradientCard>
  );
}
