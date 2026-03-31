"use client";

type NotificationsEmptyStateProps = {
  title: string;
  description: string;
  compact?: boolean;
};

export default function NotificationsEmptyState({
  title,
  description,
  compact = false,
}: NotificationsEmptyStateProps) {
  return (
    <div
      className={`rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center ${
        compact ? "p-5" : "p-8"
      }`}
    >
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}
