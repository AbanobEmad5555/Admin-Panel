type ProfitTrendChartProps = {
  labels: string[];
  grossProfit: number[];
  netProfit: number[];
};

const toLine = (values: number[], width: number, height: number, maxValue: number) => {
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

export default function ProfitTrendChart({
  labels,
  grossProfit,
  netProfit,
}: ProfitTrendChartProps) {
  const width = 560;
  const height = 220;
  const maxValue = Math.max(...grossProfit, ...netProfit, 1);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Profit Trend</h3>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-sky-600" />
            Gross Profit
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-600" />
            Net Profit
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height + 30}`} className="h-[260px] min-w-[560px] w-full">
          <path d={toArea(grossProfit, width, height, maxValue)} fill="rgba(2,132,199,0.18)" />
          <path d={toArea(netProfit, width, height, maxValue)} fill="rgba(5,150,105,0.2)" />
          <path d={toLine(grossProfit, width, height, maxValue)} fill="none" stroke="#0284c7" strokeWidth="2.5" />
          <path d={toLine(netProfit, width, height, maxValue)} fill="none" stroke="#059669" strokeWidth="2.5" />
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
