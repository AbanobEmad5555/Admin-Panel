"use client";

type NotificationsSkeletonProps = {
  rows?: number;
  compact?: boolean;
};

export default function NotificationsSkeleton({
  rows = 4,
  compact = false,
}: NotificationsSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className={`animate-pulse rounded-xl border border-slate-200 bg-white ${compact ? "p-3" : "p-4"}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-2/3 rounded bg-slate-200" />
              <div className="h-3 w-full rounded bg-slate-100" />
              <div className="h-3 w-5/6 rounded bg-slate-100" />
            </div>
            <div className="h-5 w-16 rounded-full bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
