import type { ReactNode } from "react";

type StatePanelProps = {
  title: string;
  description?: string;
  tone?: "default" | "warning" | "danger";
  action?: ReactNode;
};

export function StatePanel({
  title,
  description,
  tone = "default",
  action,
}: StatePanelProps) {
  const toneClass =
    tone === "danger"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-slate-200 bg-white text-slate-700";

  return (
    <div className={`rounded-xl border p-5 shadow-sm ${toneClass}`}>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        {description ? <p className="text-sm">{description}</p> : null}
        {action ? <div className="pt-2">{action}</div> : null}
      </div>
    </div>
  );
}
