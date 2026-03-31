"use client";

import { useMemo, useRef, useState } from "react";
import type FullCalendar from "@fullcalendar/react";
import type { DatesSetArg, EventClickArg } from "@fullcalendar/core";
import { format } from "date-fns";
import { toast } from "sonner";
import AdminLayout from "@/components/layout/AdminLayout";
import { useLocalization } from "@/modules/localization/LocalizationProvider";
import CalendarToolbar from "@/modules/calendar/components/CalendarToolbar";
import DeliverySettingsPanel from "@/modules/calendar/components/DeliverySettingsPanel";
import FullCalendarView from "@/modules/calendar/components/FullCalendarView";
import ManualEventModal from "@/modules/calendar/components/ManualEventModal";
import OrderDeliveryDateModal from "@/modules/calendar/components/OrderDeliveryDateModal";
import OrderEventModal from "@/modules/calendar/components/OrderEventModal";
import { useCalendarEvents } from "@/modules/calendar/hooks/useCalendarEvents";
import {
  useCreateCalendarEvent,
  useDeleteCalendarEvent,
  useUpdateCalendarEvent,
  useUpdateDeliverySettings,
  useUpdateOrderDeliveryDate,
} from "@/modules/calendar/hooks/useCalendarMutations";
import { useCalendarOrders } from "@/modules/calendar/hooks/useCalendarOrders";
import { useDeliverySettings } from "@/modules/calendar/hooks/useDeliverySettings";
import type {
  CalendarEventExtendedProps,
  CalendarManualEvent,
  CalendarOrderEventExtendedProps,
  CalendarViewMode,
} from "@/modules/calendar/types/calendar.types";
import { getOrderStatusColor } from "@/modules/calendar/utils/calendarColors";
import { toMonthParam } from "@/modules/calendar/utils/date";
import { getApiErrorMessage } from "@/modules/calendar/utils/error";
import {
  eventDateRangeToPayload,
  mapCalendarItemsToEventInputs,
} from "@/modules/calendar/utils/calendarMappers";

const INITIAL_DATE = new Date();

const toCalendarView = (value: string): CalendarViewMode =>
  value === "timeGridWeek" ? "timeGridWeek" : "dayGridMonth";

type CalendarMutationArg = {
  event: {
    start: Date | null;
    end: Date | null;
    extendedProps: unknown;
  };
  revert: () => void;
};

export default function AdminCalendarPage() {
  const { language } = useLocalization();
  const text = useMemo(
    () =>
      language === "ar"
        ? {
            title: "تقويم عمليات التوصيل",
            subtitle: "إدارة جداول التوصيل والأحداث التشغيلية وتعديلات مواعيد التسليم على مستوى الطلب.",
            loadOrdersError: "فشل تحميل طلبات التوصيل.",
            loadEventsError: "فشل تحميل الأحداث اليدوية.",
            eventUpdated: "تم تحديث الحدث اليدوي.",
            eventCreated: "تم إنشاء الحدث اليدوي.",
            saveEventError: "فشل حفظ الحدث اليدوي.",
            eventDeleted: "تم حذف الحدث اليدوي.",
            deleteEventError: "فشل حذف الحدث اليدوي.",
            eventTimingUpdated: "تم تحديث توقيت الحدث اليدوي.",
            updateTimingError:
              "تعذر تحديث توقيت الحدث. قد يتعارض مع قيود التوصيل الحالية.",
            settingsSaved: "تم حفظ إعدادات التوصيل.",
            saveSettingsError: "فشل حفظ إعدادات التوصيل.",
            deliveryDateUpdated: "تم تحديث موعد تسليم الطلب.",
            updateDeliveryDateError: "فشل تحديث موعد تسليم الطلب.",
            legend: "دليل حالة الطلب",
            emptyMessage: "لا توجد عمليات توصيل أو أحداث تشغيلية في هذه الفترة.",
            loadSettingsError: "فشل تحميل إعدادات التوصيل.",
          }
        : {
            title: "Delivery Operations Calendar",
            subtitle:
              "Manage delivery timelines, operational events, and order-level delivery overrides.",
            loadOrdersError: "Failed to load delivery orders.",
            loadEventsError: "Failed to load manual events.",
            eventUpdated: "Manual event updated.",
            eventCreated: "Manual event created.",
            saveEventError: "Failed to save manual event.",
            eventDeleted: "Manual event deleted.",
            deleteEventError: "Failed to delete manual event.",
            eventTimingUpdated: "Manual event timing updated.",
            updateTimingError:
              "Could not update event timing. It may overlap delivery constraints.",
            settingsSaved: "Delivery settings saved.",
            saveSettingsError: "Failed to save delivery settings.",
            deliveryDateUpdated: "Order delivery date updated.",
            updateDeliveryDateError: "Failed to update order delivery date.",
            legend: "Order Status Legend",
            emptyMessage: "No deliveries or operational events found for this period.",
            loadSettingsError: "Failed to load delivery settings.",
          },
    [language],
  );

  const calendarRef = useRef<FullCalendar | null>(null);
  const [month, setMonth] = useState(toMonthParam(INITIAL_DATE));
  const [selectedDate, setSelectedDate] = useState(format(INITIAL_DATE, "yyyy-MM-dd"));
  const [view, setView] = useState<CalendarViewMode>("dayGridMonth");
  const [title, setTitle] = useState(format(INITIAL_DATE, "MMMM yyyy"));

  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [editingManualEvent, setEditingManualEvent] = useState<CalendarManualEvent | null>(
    null,
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<CalendarOrderEventExtendedProps | null>(
    null,
  );
  const [isDeliveryDateModalOpen, setIsDeliveryDateModalOpen] = useState(false);

  const ordersQuery = useCalendarOrders(month);
  const eventsQuery = useCalendarEvents(month);
  const settingsQuery = useDeliverySettings();

  const createEventMutation = useCreateCalendarEvent();
  const updateEventMutation = useUpdateCalendarEvent();
  const deleteEventMutation = useDeleteCalendarEvent();
  const updateSettingsMutation = useUpdateDeliverySettings();
  const updateOrderDeliveryDateMutation = useUpdateOrderDeliveryDate();

  const orders = useMemo(() => ordersQuery.data ?? [], [ordersQuery.data]);
  const manualEvents = useMemo(() => eventsQuery.data ?? [], [eventsQuery.data]);
  const manualEventsById = useMemo(
    () => new Map(manualEvents.map((event) => [event.id, event] as const)),
    [manualEvents],
  );

  const calendarEvents = useMemo(
    () => mapCalendarItemsToEventInputs(orders, manualEvents),
    [orders, manualEvents],
  );

  const isCalendarLoading = ordersQuery.isLoading || eventsQuery.isLoading;
  const calendarErrorMessage = ordersQuery.error
    ? getApiErrorMessage(ordersQuery.error, text.loadOrdersError)
    : eventsQuery.error
      ? getApiErrorMessage(eventsQuery.error, text.loadEventsError)
      : null;

  const goToPrev = () => {
    calendarRef.current?.getApi().prev();
  };

  const goToNext = () => {
    calendarRef.current?.getApi().next();
  };

  const goToToday = () => {
    calendarRef.current?.getApi().today();
  };

  const jumpToDate = (date: string) => {
    if (!date) {
      return;
    }
    calendarRef.current?.getApi().gotoDate(date);
  };

  const jumpToMonth = (monthValue: string) => {
    if (!monthValue) {
      return;
    }
    calendarRef.current?.getApi().gotoDate(`${monthValue}-01`);
  };

  const changeView = (nextView: CalendarViewMode) => {
    setView(nextView);
    calendarRef.current?.getApi().changeView(nextView);
  };

  const handleDatesSet = (arg: DatesSetArg) => {
    const anchorDate = arg.view.calendar.getDate();
    setMonth(toMonthParam(anchorDate));
    setSelectedDate(format(anchorDate, "yyyy-MM-dd"));
    setTitle(arg.view.title);
    setView(toCalendarView(arg.view.type));
  };

  const openCreateManualEvent = () => {
    setEditingManualEvent(null);
    setIsManualModalOpen(true);
  };

  const closeManualModal = () => {
    setIsManualModalOpen(false);
    setEditingManualEvent(null);
  };

  const handleEventClick = (arg: EventClickArg) => {
    const extendedProps = arg.event.extendedProps as CalendarEventExtendedProps;
    if (extendedProps.eventType === "order") {
      setSelectedOrder(extendedProps);
      return;
    }

    const selected = manualEventsById.get(extendedProps.manualEventId);
    if (!selected) {
      return;
    }

    setEditingManualEvent(selected);
    setIsManualModalOpen(true);
  };

  const handleSaveManualEvent = async (payload: {
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    color: string;
  }) => {
    try {
      if (editingManualEvent) {
        await updateEventMutation.mutateAsync({
          id: editingManualEvent.id,
          payload,
          month,
        });
        toast.success(text.eventUpdated);
      } else {
        await createEventMutation.mutateAsync({
          payload,
          month,
        });
        toast.success(text.eventCreated);
      }
      closeManualModal();
    } catch (error) {
      toast.error(getApiErrorMessage(error, text.saveEventError));
    }
  };

  const handleDeleteManualEvent = async () => {
    if (!editingManualEvent) {
      return;
    }

    try {
      await deleteEventMutation.mutateAsync({
        id: editingManualEvent.id,
        month,
      });
      toast.success(text.eventDeleted);
      closeManualModal();
    } catch (error) {
      toast.error(getApiErrorMessage(error, text.deleteEventError));
    }
  };

  const handleManualEventTimeMutation = async (arg: CalendarMutationArg) => {
    const extendedProps = arg.event.extendedProps as CalendarEventExtendedProps;
    if (extendedProps.eventType !== "manual") {
      arg.revert();
      return;
    }

    try {
      const datePayload = eventDateRangeToPayload({
        start: arg.event.start,
        end: arg.event.end,
      });
      await updateEventMutation.mutateAsync({
        id: extendedProps.manualEventId,
        payload: datePayload,
        month,
      });
      toast.success(text.eventTimingUpdated);
    } catch (error) {
      arg.revert();
      toast.error(getApiErrorMessage(error, text.updateTimingError));
    }
  };

  const openOrderInNewTab = () => {
    if (!selectedOrder || typeof window === "undefined") {
      return;
    }
    window.open(`/admin/orders/${selectedOrder.orderId}`, "_blank", "noopener,noreferrer");
  };

  const openDeliveryDateModal = () => {
    setIsDeliveryDateModalOpen(true);
  };

  const closeOrderModal = () => {
    setSelectedOrder(null);
  };

  const closeDeliveryDateModal = () => {
    setIsDeliveryDateModalOpen(false);
  };

  const handleSaveDeliverySettings = async (payload: {
    defaultDeliveryMethod: "STANDARD" | "EXPRESS";
    STANDARD: { deliveryDays: number; deliveryCost: number };
    EXPRESS: { deliveryDays: number; deliveryCost: number };
  }) => {
    try {
      await updateSettingsMutation.mutateAsync({ payload });
      toast.success(text.settingsSaved);
      setIsSettingsOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, text.saveSettingsError));
    }
  };

  const handleSaveOrderDeliveryDate = async (payload: { deliveryDate: string }) => {
    if (!selectedOrder) {
      return;
    }

    try {
      await updateOrderDeliveryDateMutation.mutateAsync({
        orderId: selectedOrder.orderId,
        payload,
        month,
      });
      toast.success(text.deliveryDateUpdated);
      setIsDeliveryDateModalOpen(false);
      setSelectedOrder(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error, text.updateDeliveryDateError));
    }
  };

  return (
    <AdminLayout requiredPermissions={["calendar.view"]}>
      <section className="space-y-4">
        <header className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">{text.title}</h1>
          <p className="text-sm text-slate-500">{text.subtitle}</p>
        </header>

        <CalendarToolbar
          title={title}
          currentView={view}
          selectedMonth={month}
          selectedDate={selectedDate}
          isLoading={isCalendarLoading}
          onPrev={goToPrev}
          onNext={goToNext}
          onToday={goToToday}
          onJumpToDate={jumpToDate}
          onSelectMonth={jumpToMonth}
          onAddEvent={openCreateManualEvent}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onViewChange={changeView}
        />

        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 shadow-sm">
          <span className="font-semibold text-slate-800">{text.legend}:</span>
          {(["OUT_FOR_DELIVERY", "DELIVERED", "CONFIRMED"] as const).map((status) => (
            <span key={status} className="inline-flex items-center gap-1">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: getOrderStatusColor(status) }}
              />
              {status.replace(/_/g, " ")}
            </span>
          ))}
        </div>

        {calendarErrorMessage ? (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
            {calendarErrorMessage}
          </p>
        ) : null}

        <FullCalendarView
          calendarRef={calendarRef}
          events={calendarEvents}
          view={view}
          loading={isCalendarLoading}
          emptyMessage={text.emptyMessage}
          onDatesSet={handleDatesSet}
          onEventClick={handleEventClick}
          onEventDrop={(arg) => void handleManualEventTimeMutation(arg)}
          onEventResize={(arg) => void handleManualEventTimeMutation(arg)}
        />
      </section>

      <ManualEventModal
        isOpen={isManualModalOpen}
        initialEvent={editingManualEvent}
        isSubmitting={createEventMutation.isPending || updateEventMutation.isPending}
        isDeleting={deleteEventMutation.isPending}
        onClose={closeManualModal}
        onSubmit={handleSaveManualEvent}
        onDelete={handleDeleteManualEvent}
      />

      <OrderEventModal
        isOpen={Boolean(selectedOrder)}
        order={selectedOrder}
        onClose={closeOrderModal}
        onOpenOrder={openOrderInNewTab}
        onEditDeliveryDate={openDeliveryDateModal}
      />

      <OrderDeliveryDateModal
        isOpen={isDeliveryDateModalOpen}
        order={selectedOrder}
        isSubmitting={updateOrderDeliveryDateMutation.isPending}
        onClose={closeDeliveryDateModal}
        onSubmit={handleSaveOrderDeliveryDate}
      />

      <DeliverySettingsPanel
        isOpen={isSettingsOpen}
        isLoading={settingsQuery.isLoading}
        settings={settingsQuery.data}
        isSaving={updateSettingsMutation.isPending}
        errorMessage={
          settingsQuery.error
            ? getApiErrorMessage(settingsQuery.error, text.loadSettingsError)
            : null
        }
        onClose={() => setIsSettingsOpen(false)}
        onSubmit={handleSaveDeliverySettings}
      />
    </AdminLayout>
  );
}
