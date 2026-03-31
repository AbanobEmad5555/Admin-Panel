type LoyaltyMetricCardProps = {
  label: string;
  value: string;
  tone?: "default" | "positive" | "muted" | "danger";
};

export function LoyaltyMetricCard({
  label,
  value,
  tone = "default",
}: LoyaltyMetricCardProps) {
  const toneClass =
    tone === "positive"
      ? "border-emerald-200 bg-emerald-50"
      : tone === "danger"
        ? "border-rose-200 bg-rose-50"
        : tone === "muted"
          ? "border-slate-200 bg-slate-50"
          : "border-slate-200 bg-white";

  return (
    <div className={`rounded-xl border p-4 shadow-sm ${toneClass}`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}
