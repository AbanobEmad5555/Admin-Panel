import { calendarQueryKeys } from "./queryKeys";

export const getManualEventMutationInvalidationKeys = (month: string) =>
  [
    calendarQueryKeys.events(month),
    calendarQueryKeys.eventsPrefix(),
  ] as const;

export const getOrderDeliveryDateInvalidationKeys = (month: string) =>
  [
    calendarQueryKeys.orders(month),
    calendarQueryKeys.ordersPrefix(),
  ] as const;

