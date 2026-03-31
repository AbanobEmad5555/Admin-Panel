"use client";

export default function DashboardLayoutSkeleton() {
  return (
    <section className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm"
        >
          <div className="mx-auto mb-6 h-20 w-20 animate-pulse rounded-full bg-slate-100" />
          <div className="mx-auto h-6 w-1/2 animate-pulse rounded bg-slate-100" />
          <div className="mx-auto mt-4 h-4 w-3/4 animate-pulse rounded bg-slate-100" />
          <div className="mx-auto mt-2 h-4 w-2/3 animate-pulse rounded bg-slate-100" />
        </div>
      ))}
    </section>
  );
}
