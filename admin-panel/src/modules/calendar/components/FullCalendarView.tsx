"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type {
  DatesSetArg,
  EventClickArg,
  EventContentArg,
  EventInput,
} from "@fullcalendar/core";
import type { RefObject } from "react";
import type {
  CalendarEventExtendedProps,
  CalendarViewMode,
} from "@/modules/calendar/types/calendar.types";
import { formatCurrency } from "@/modules/calendar/utils/date";

type CalendarMutationArg = {
  event: {
    start: Date | null;
    end: Date | null;
    title: string;
    extendedProps: unknown;
  };
  revert: () => void;
};

type FullCalendarViewProps = {
  calendarRef: RefObject<FullCalendar | null>;
  events: EventInput[];
  view: CalendarViewMode;
  loading: boolean;
  emptyMessage: string;
  onDatesSet: (arg: DatesSetArg) => void;
  onEventClick: (arg: EventClickArg) => void;
  onEventDrop: (arg: CalendarMutationArg) => void;
  onEventResize: (arg: CalendarMutationArg) => void;
};

const renderEventContent = (arg: EventContentArg) => {
  const extended = arg.event.extendedProps as CalendarEventExtendedProps;

  if (extended.eventType === "order") {
    return (
      <div className="w-full truncate leading-tight text-slate-900">
        <div className="truncate text-[12px] font-bold tracking-tight">Order #{extended.orderNumber}</div>
        <div className="truncate text-[11px] font-semibold">{extended.customerName}</div>
        <div className="truncate text-[10px] font-medium text-slate-700">
          {formatCurrency(extended.orderTotal)} | {extended.status.replace(/_/g, " ")}
        </div>
      </div>
    );
  }

  return (
    <div className="truncate leading-tight text-slate-900">
      <div className="truncate text-[12px] font-bold tracking-tight">{arg.event.title}</div>
      {arg.timeText ? (
        <div className="truncate text-[10px] font-medium text-slate-700">{arg.timeText}</div>
      ) : null}
    </div>
  );
};

export default function FullCalendarView({
  calendarRef,
  events,
  view,
  loading,
  emptyMessage,
  onDatesSet,
  onEventClick,
  onEventDrop,
  onEventResize,
}: FullCalendarViewProps) {
  if (loading && events.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 12 }).map((_, index) => (
            <div
              key={index}
              className="h-20 animate-pulse rounded-lg border border-slate-200 bg-slate-100"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={view}
        headerToolbar={false}
        events={events}
        editable
        selectable={false}
        eventStartEditable
        eventDurationEditable
        dayMaxEvents={3}
        dayMaxEventRows={3}
        moreLinkClick="popover"
        eventDisplay="block"
        slotEventOverlap={false}
        eventMaxStack={3}
        weekends
        nowIndicator
        height="auto"
        eventClick={onEventClick}
        eventDrop={onEventDrop}
        eventResize={onEventResize}
        datesSet={onDatesSet}
        eventContent={renderEventContent}
      />

      {!loading && events.length === 0 ? (
        <div className="border-t border-slate-200 px-3 py-4 text-sm text-slate-500">
          {emptyMessage}
        </div>
      ) : null}
    </div>
  );
}
