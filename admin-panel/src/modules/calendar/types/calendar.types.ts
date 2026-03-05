export const ORDER_DELIVERY_STATUSES = [
  "DELIVERED",
  "OUT_FOR_DELIVERY",
  "CONFIRMED",
  "PENDING",
  "CANCELLED",
] as const;

export type OrderDeliveryStatus = (typeof ORDER_DELIVERY_STATUSES)[number];

export type CalendarViewMode = "dayGridMonth" | "timeGridWeek";
export type DeliveryMethod = "STANDARD" | "EXPRESS";

export type PaginationInput = {
  page?: number;
  limit?: number;
};

export type CalendarOrderQueryInput = PaginationInput & {
  month: string;
};

export type CalendarOrder = {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  orderTotal: number;
  status: OrderDeliveryStatus;
  deliveryDate: string;
  deliveryEndDate?: string | null;
};

export type CalendarManualEvent = {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  color: string;
  allDay?: boolean;
};

export type CalendarEventMutationPayload = {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  color: string;
  allDay?: boolean;
};

export type DeliveryMethodConfig = {
  deliveryDays: number;
  deliveryCost: number;
};

export type DeliverySettings = {
  defaultDeliveryMethod: DeliveryMethod;
  STANDARD: DeliveryMethodConfig;
  EXPRESS: DeliveryMethodConfig;
};

export type DeliverySettingsPayload = DeliverySettings;

export type UpdateOrderDeliveryDatePayload = {
  deliveryDate: string;
};

export type CalendarOrderEventExtendedProps = {
  eventType: "order";
  orderId: string;
  orderNumber: string;
  customerName: string;
  orderTotal: number;
  status: OrderDeliveryStatus;
  deliveryDate: string;
};

export type CalendarManualEventExtendedProps = {
  eventType: "manual";
  manualEventId: string;
  description?: string;
  color: string;
};

export type CalendarEventExtendedProps =
  | CalendarOrderEventExtendedProps
  | CalendarManualEventExtendedProps;
