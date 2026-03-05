export const calendarQueryKeys = {
  orders: (month: string) => ["calendar-orders", month] as const,
  ordersPrefix: () => ["calendar-orders"] as const,
  events: (month: string) => ["calendar-events", month] as const,
  eventsPrefix: () => ["calendar-events"] as const,
  settings: () => ["calendar-delivery-settings"] as const,
};

