import { formatEGP } from "@/lib/currency";

type CostSlice = {
  label: string;
  value: number;
  color: string;
};

type CostsBreakdownChartProps = {
  slices: CostSlice[];
};

const getConic = (slices: CostSlice[]) => {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0) || 1;
  let current = 0;
  return slices
    .map((slice) => {
      const start = (current / total) * 360;
      current += slice.value;
      const end = (current / total) * 360;
      return `${slice.color} ${start}deg ${end}deg`;
    })
    .join(", ");
};

export default function CostsBreakdownChart({ slices }: CostsBreakdownChartProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-slate-900">Costs Breakdown</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[220px_1fr]">
        <div className="mx-auto flex h-[220px] w-[220px] items-center justify-center rounded-full" style={{ background: `conic-gradient(${getConic(slices)})` }}>
          <div className="h-[120px] w-[120px] rounded-full bg-white" />
        </div>
        <div className="space-y-2">
          {slices.map((slice) => (
            <div key={slice.label} className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-sm">
              <span className="inline-flex items-center gap-2 text-slate-700">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: slice.color }} />
                {slice.label}
              </span>
              <span className="font-medium text-slate-900">{formatEGP(slice.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
