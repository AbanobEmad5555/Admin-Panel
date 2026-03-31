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
      ? "border-emerald-400/20 bg-emerald-500/12"
      : tone === "danger"
        ? "border-rose-400/20 bg-rose-500/12"
        : tone === "muted"
          ? "border-white/10 bg-white/6"
          : "border-cyan-400/20 bg-[linear-gradient(135deg,rgba(34,211,238,0.12),rgba(168,85,247,0.1))]";

  return (
    <div className={`rounded-2xl border p-4 shadow-[0_14px_32px_rgba(2,6,23,0.28)] backdrop-blur-xl ${toneClass}`}>
      <p className="text-sm text-slate-300">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-50">{value}</p>
    </div>
  );
}
