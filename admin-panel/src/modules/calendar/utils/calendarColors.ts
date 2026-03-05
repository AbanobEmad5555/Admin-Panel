import type { OrderDeliveryStatus } from "../types/calendar.types";

export const ORDER_STATUS_COLOR_MAP: Record<OrderDeliveryStatus, string> = {
  DELIVERED: "#16a34a",
  OUT_FOR_DELIVERY: "#2563eb",
  CONFIRMED: "#ca8a04",
  PENDING: "#64748b",
  CANCELLED: "#e11d48",
};

export const DEFAULT_MANUAL_EVENT_COLOR = "#0f766e";

export const getOrderStatusColor = (status: OrderDeliveryStatus) =>
  ORDER_STATUS_COLOR_MAP[status] ?? ORDER_STATUS_COLOR_MAP.PENDING;
