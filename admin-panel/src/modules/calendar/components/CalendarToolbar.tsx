"use client";

import { useRef } from "react";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, GitBranch, Plus, Settings2 } from "lucide-react";
import type { CalendarViewMode } from "@/modules/calendar/types/calendar.types";

type CalendarToolbarProps = {
  title: string;
  currentView: CalendarViewMode;
  isLoading: boolean;
  selectedMonth: string;
  selectedDate: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onJumpToDate: (date: string) => void;
  onSelectMonth: (month: string) => void;
  onAddEvent: () => void;
  onOpenSettings: () => void;
  onViewChange: (view: CalendarViewMode) => void;
};

const viewButtonClass = (isActive: boolean) =>
  `rounded-md px-3 py-1.5 text-sm font-medium transition ${
    isActive
      ? "bg-slate-900 text-white"
      : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
  }`;

export default function CalendarToolbar({
  title,
  currentView,
  isLoading,
  selectedMonth,
  selectedDate,
  onPrev,
  onNext,
  onToday,
  onJumpToDate,
  onSelectMonth,
  onAddEvent,
  onOpenSettings,
  onViewChange,
}: CalendarToolbarProps) {
  const monthInputRef = useRef<HTMLInputElement | null>(null);
  const dateInputRef = useRef<HTMLInputElement | null>(null);

  const openNativePicker = (input: HTMLInputElement | null) => {
    if (!input) {
      return;
    }
    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }
    input.focus();
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onToday}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100"
          >
            Today
          </button>

          <button
            type="button"
            onClick={onPrev}
            className="rounded-md border border-slate-300 bg-white p-1.5 text-slate-700 transition hover:bg-slate-100"
            aria-label="Previous period"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onNext}
            className="rounded-md border border-slate-300 bg-white p-1.5 text-slate-700 transition hover:bg-slate-100"
            aria-label="Next period"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="ml-1 inline-flex items-center gap-2 rounded-md bg-slate-50 px-3 py-1.5">
            <CalendarDays className="h-4 w-4 text-slate-600" />
            <span className="text-sm font-semibold text-slate-900">{title}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label
            className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-600"
            onClick={() => openNativePicker(monthInputRef.current)}
          >
            Month
            <input
              ref={monthInputRef}
              type="month"
              value={selectedMonth}
              onChange={(event) => onSelectMonth(event.target.value)}
              className="w-32 cursor-pointer rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-900"
              onClick={() => openNativePicker(monthInputRef.current)}
            />
          </label>

          <label
            className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-600"
            onClick={() => openNativePicker(dateInputRef.current)}
          >
            Jump To
            <input
              ref={dateInputRef}
              type="date"
              value={selectedDate}
              onChange={(event) => onJumpToDate(event.target.value)}
              className="w-32 cursor-pointer rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-900"
              onClick={() => openNativePicker(dateInputRef.current)}
            />
          </label>

          <button
            type="button"
            onClick={() => onViewChange("dayGridMonth")}
            className={viewButtonClass(currentView === "dayGridMonth")}
          >
            Month
          </button>
          <button
            type="button"
            onClick={() => onViewChange("timeGridWeek")}
            className={viewButtonClass(currentView === "timeGridWeek")}
          >
            Week
          </button>
          <button
            type="button"
            onClick={onAddEvent}
            className="inline-flex items-center gap-2 rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-600"
          >
            <Plus className="h-4 w-4" />
            Add Event
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            <Settings2 className="h-4 w-4" />
            Delivery Settings
          </button>
          <Link
            href="/admin/crm/pipeline"
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            <GitBranch className="h-4 w-4" />
            Order Pipeline
          </Link>
        </div>
      </div>

      {isLoading ? (
        <p className="mt-3 text-xs text-slate-500">Loading calendar data...</p>
      ) : null}
    </div>
  );
}

