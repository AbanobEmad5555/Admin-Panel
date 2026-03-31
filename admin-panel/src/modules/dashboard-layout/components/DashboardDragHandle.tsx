"use client";

import { GripVertical } from "lucide-react";

type DashboardDragHandleProps = {
  label: string;
  attributes?: Record<string, unknown>;
  listeners?: Record<string, unknown>;
  disabled?: boolean;
};

export default function DashboardDragHandle({
  label,
  attributes,
  listeners,
  disabled = false,
}: DashboardDragHandleProps) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-4 w-4" />
    </button>
  );
}
