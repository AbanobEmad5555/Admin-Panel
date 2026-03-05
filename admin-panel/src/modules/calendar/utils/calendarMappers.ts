import type { EventInput } from "@fullcalendar/core";
import { addHours } from "date-fns";
import { DEFAULT_MANUAL_EVENT_COLOR, getOrderStatusColor } from "./calendarColors";
import { utcIsoToDateTimeInputValue } from "./date";
import type {
  CalendarEventMutationPayload,
  CalendarManualEvent,
  CalendarManualEventExtendedProps,
  CalendarOrder,
  CalendarOrderEventExtendedProps,
  DeliveryMethod,
  DeliverySettings,
  OrderDeliveryStatus,
} from "../types/calendar.types";

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord =>
  value && typeof value === "object" ? (value as UnknownRecord) : {};

const toStringSafe = (value: unknown, fallback = "") => {
  if (value === null || value === undefined) {
    return fallback;
  }
  return String(value);
};

const toStableHash = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
};

const hasExplicitTime = (value: string) => {
  if (!value) {
    return false;
  }
  return /T\d{2}:\d{2}/.test(value);
};

const isMidnightDate = (date: Date) =>
  date.getUTCHours() === 0 &&
  date.getUTCMinutes() === 0 &&
  date.getUTCSeconds() === 0 &&
  date.getUTCMilliseconds() === 0;

const toNumberSafe = (value: unknown, fallback = 0) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
};

const toBooleanSafe = (value: unknown, fallback = false) => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") {
      return true;
    }
    if (normalized === "false") {
      return false;
    }
  }
  return fallback;
};

const hexToRgba = (value: string, alpha: number) => {
  const hex = value.replace("#", "").trim();
  if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
    return `rgba(15, 23, 42, ${alpha})`;
  }
  const int = Number.parseInt(hex, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const unwrapApiData = <T>(value: unknown): T => {
  const envelope = asRecord(value);
  if ("data" in envelope) {
    return (envelope.data ?? ({} as T)) as T;
  }
  return value as T;
};

export const extractCollection = (
  payload: unknown,
  keys: string[],
): unknown[] => {
  if (Array.isArray(payload)) {
    return payload;
  }

  const record = asRecord(payload);
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  if (record.data && Array.isArray(record.data)) {
    return record.data;
  }

  return [];
};

export const normalizeOrderStatus = (value: unknown): OrderDeliveryStatus => {
  const normalized = toStringSafe(value, "PENDING")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

  if (normalized === "CANCELED") {
    return "CANCELLED";
  }

  if (
    normalized === "DELIVERED" ||
    normalized === "OUT_FOR_DELIVERY" ||
    normalized === "CONFIRMED" ||
    normalized === "PENDING" ||
    normalized === "CANCELLED"
  ) {
    return normalized;
  }
  return "PENDING";
};

const resolveOrderCustomerName = (record: UnknownRecord) => {
  const customer = asRecord(record.customer);
  const user = asRecord(record.user);
  const address = asRecord(record.address);
  return (
    toStringSafe(
      record.customerName ??
        record.customer_name ??
        customer.name ??
        customer.fullName ??
        customer.full_name ??
        user.name ??
        user.fullName ??
        user.full_name ??
        address.fullName ??
        address.full_name ??
        address.name,
      "Unknown Customer",
    ).trim() || "Unknown Customer"
  );
};

const resolveOrderDeliveryDate = (record: UnknownRecord) =>
  toStringSafe(
    record.deliveryDate ??
      record.delivery_date ??
      record.scheduledDeliveryDate ??
      record.scheduled_delivery_date ??
      record.startDate ??
      record.start_date ??
      record.date ??
      record.createdAt ??
      record.created_at,
    "",
  );

const resolveOrderDeliveryEndDate = (record: UnknownRecord) =>
  toStringSafe(
    record.deliveryEndDate ??
      record.delivery_end_date ??
      record.endDate ??
      record.end_date,
    "",
  );

export const normalizeCalendarOrder = (value: unknown): CalendarOrder => {
  const record = asRecord(value);
  const id = toStringSafe(record.id ?? record.orderId ?? record.order_id, "").trim();
  const orderNumber = toStringSafe(
    record.orderNumber ?? record.order_number ?? record.number ?? id,
    id || "N/A",
  ).trim();
  const deliveryDate = resolveOrderDeliveryDate(record);

  return {
    id: id || orderNumber,
    orderId: id || orderNumber,
    orderNumber: orderNumber || id || "N/A",
    customerName: resolveOrderCustomerName(record),
    orderTotal: toNumberSafe(
      record.orderTotal ?? record.totalAmount ?? record.totalPrice ?? record.total_amount,
      0,
    ),
    status: normalizeOrderStatus(record.status),
    deliveryDate,
    deliveryEndDate: resolveOrderDeliveryEndDate(record) || null,
  };
};

export const normalizeCalendarManualEvent = (value: unknown): CalendarManualEvent => {
  const record = asRecord(value);
  const fallbackId = `manual-${Date.now()}-${Math.round(Math.random() * 1000000)}`;
  const startDate = toStringSafe(
    record.startDate ?? record.start_date ?? record.start ?? record.date,
    "",
  );
  const endDate = toStringSafe(
    record.endDate ?? record.end_date ?? record.end,
    "",
  );
  const normalizedStart = startDate || new Date().toISOString();
  const normalizedEnd =
    endDate ||
    addHours(new Date(normalizedStart), 1).toISOString();

  return {
    id: toStringSafe(record.id ?? record.eventId ?? record.event_id, "").trim() || fallbackId,
    title: toStringSafe(record.title, "Untitled Event").trim() || "Untitled Event",
    description: toStringSafe(record.description, "").trim() || undefined,
    startDate: normalizedStart,
    endDate: normalizedEnd,
    color: toStringSafe(record.color, DEFAULT_MANUAL_EVENT_COLOR).trim() || DEFAULT_MANUAL_EVENT_COLOR,
    allDay: toBooleanSafe(record.allDay ?? record.all_day, false),
  };
};

export const normalizeDeliverySettings = (value: unknown): DeliverySettings => {
  const payload = asRecord(value);
  const nestedSettings = asRecord(payload.settings);
  const methodsNode = asRecord(payload.methods);
  const settingsMethodsNode = asRecord(nestedSettings.methods);
  const hasNestedSettings =
    "defaultDeliveryMethod" in nestedSettings ||
    "default_delivery_method" in nestedSettings ||
    "STANDARD" in nestedSettings ||
    "standard" in nestedSettings ||
    "standard_delivery_days" in nestedSettings ||
    "standardDeliveryDays" in nestedSettings;
  const settingsNode = hasNestedSettings ? nestedSettings : payload;
  const resolvedMethodsNode =
    Object.keys(settingsMethodsNode).length > 0
      ? settingsMethodsNode
      : Object.keys(methodsNode).length > 0
        ? methodsNode
        : {};

  const standard = asRecord(
    settingsNode.STANDARD ?? settingsNode.standard ?? resolvedMethodsNode.STANDARD,
  );
  const express = asRecord(
    settingsNode.EXPRESS ?? settingsNode.express ?? resolvedMethodsNode.EXPRESS,
  );
  const flatStandardDays =
    settingsNode.standardDeliveryDays ?? settingsNode.standard_delivery_days;
  const flatStandardCost =
    settingsNode.standardDeliveryCost ?? settingsNode.standard_delivery_cost;
  const flatExpressDays =
    settingsNode.expressDeliveryDays ?? settingsNode.express_delivery_days;
  const flatExpressCost =
    settingsNode.expressDeliveryCost ?? settingsNode.express_delivery_cost;
  const methodValue = toStringSafe(
    settingsNode.defaultDeliveryMethod ?? settingsNode.default_delivery_method,
    "STANDARD",
  )
    .trim()
    .toUpperCase();

  const defaultDeliveryMethod: DeliveryMethod =
    methodValue === "EXPRESS" ? "EXPRESS" : "STANDARD";

  return {
    defaultDeliveryMethod,
    STANDARD: {
      deliveryDays: Math.max(
        0,
        toNumberSafe(
          standard.deliveryDays ?? standard.delivery_days ?? flatStandardDays,
          3,
        ),
      ),
      deliveryCost: Math.max(
        0,
        toNumberSafe(
          standard.deliveryCost ?? standard.delivery_cost ?? flatStandardCost,
          0,
        ),
      ),
    },
    EXPRESS: {
      deliveryDays: Math.max(
        0,
        toNumberSafe(
          express.deliveryDays ?? express.delivery_days ?? flatExpressDays,
          1,
        ),
      ),
      deliveryCost: Math.max(
        0,
        toNumberSafe(
          express.deliveryCost ?? express.delivery_cost ?? flatExpressCost,
          0,
        ),
      ),
    },
  };
};

export const mapCalendarOrdersResponse = (value: unknown): CalendarOrder[] => {
  const payload = unwrapApiData<unknown>(value);
  const items = extractCollection(payload, ["orders", "items", "rows", "data"]);
  return items.map(normalizeCalendarOrder);
};

export const mapCalendarEventsResponse = (value: unknown): CalendarManualEvent[] => {
  const payload = unwrapApiData<unknown>(value);
  const items = extractCollection(payload, ["events", "items", "rows", "data"]);
  return items.map(normalizeCalendarManualEvent);
};

export const mapOrderToCalendarEventInput = (
  order: CalendarOrder,
): EventInput | null => {
  if (!order.deliveryDate || order.status === "CANCELLED" || order.status === "PENDING") {
    return null;
  }

  const color = getOrderStatusColor(order.status);
  const extendedProps: CalendarOrderEventExtendedProps = {
    eventType: "order",
    orderId: order.orderId,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    orderTotal: order.orderTotal,
    status: order.status,
    deliveryDate: order.deliveryDate,
  };

  const parsedStart = new Date(order.deliveryDate);
  const shouldStaggerTime =
    Number.isFinite(parsedStart.getTime()) &&
    (!hasExplicitTime(order.deliveryDate) || isMidnightDate(parsedStart));
  const hash = toStableHash(`${order.orderId}-${order.orderNumber}`);
  const staggerHour = 8 + (hash % 10);
  const staggerMinute = hash % 2 === 0 ? 0 : 30;
  const eventStart = shouldStaggerTime
    ? new Date(
        Date.UTC(
          parsedStart.getUTCFullYear(),
          parsedStart.getUTCMonth(),
          parsedStart.getUTCDate(),
          staggerHour,
          staggerMinute,
          0,
          0,
        ),
      ).toISOString()
    : order.deliveryDate;
  const fallbackEnd = addHours(new Date(eventStart), 1).toISOString();

  return {
    id: `order-${order.id}`,
    title: `Order #${order.orderNumber}`,
    start: eventStart,
    end: order.deliveryEndDate || fallbackEnd,
    allDay: false,
    editable: false,
    startEditable: false,
    durationEditable: false,
    backgroundColor: hexToRgba(color, 0.18),
    borderColor: color,
    classNames: ["calendar-event-card", "calendar-order-event"],
    textColor: "#0f172a",
    extendedProps,
  };
};

export const mapManualEventToCalendarEventInput = (
  event: CalendarManualEvent,
): EventInput => {
  const extendedProps: CalendarManualEventExtendedProps = {
    eventType: "manual",
    manualEventId: event.id,
    description: event.description,
    color: event.color,
  };

  return {
    id: `manual-${event.id}`,
    title: event.title,
    start: event.startDate,
    end: event.endDate,
    allDay: event.allDay ?? false,
    editable: true,
    startEditable: true,
    durationEditable: true,
    backgroundColor: hexToRgba(event.color, 0.16),
    borderColor: event.color,
    classNames: ["calendar-event-card", "calendar-manual-event"],
    textColor: "#0f172a",
    extendedProps,
  };
};

export const mapCalendarItemsToEventInputs = (
  orders: CalendarOrder[],
  events: CalendarManualEvent[],
) => {
  const orderEvents = orders
    .map(mapOrderToCalendarEventInput)
    .filter((item): item is EventInput => Boolean(item));

  return [
    ...orderEvents,
    ...events.map(mapManualEventToCalendarEventInput),
  ];
};

export type EventDateRangeInput = {
  start: Date | null;
  end: Date | null;
};

export const eventDateRangeToPayload = (
  range: EventDateRangeInput,
): Pick<CalendarEventMutationPayload, "startDate" | "endDate"> => {
  const start = range.start ?? new Date();
  const end = range.end ?? addHours(start, 1);
  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
};

export const manualEventToFormValues = (event: CalendarManualEvent) => ({
  title: event.title,
  description: event.description ?? "",
  startDate: utcIsoToDateTimeInputValue(event.startDate),
  endDate: utcIsoToDateTimeInputValue(event.endDate),
  color: event.color,
});
