import api from "@/services/api";
import type {
  CalendarEventMutationPayload,
  CalendarOrder,
  CalendarManualEvent,
  DeliverySettings,
  DeliverySettingsPayload,
  PaginationInput,
  UpdateOrderDeliveryDatePayload,
} from "@/modules/calendar/types/calendar.types";
import {
  mapCalendarEventsResponse,
  mapCalendarOrdersResponse,
  normalizeCalendarManualEvent,
  normalizeCalendarOrder,
  normalizeDeliverySettings,
  unwrapApiData,
} from "@/modules/calendar/utils/calendarMappers";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 200;
const isDev = process.env.NODE_ENV !== "production";

const logSettingsDebug = (label: string, payload: unknown) => {
  if (!isDev) {
    return;
  }
  console.log(`[calendar-settings] ${label}`, payload);
};

const normalizeSettingsPayload = (payload: DeliverySettingsPayload) => ({
  defaultDeliveryMethod: payload.defaultDeliveryMethod,
  methods: {
    STANDARD: {
      deliveryDays: Number(payload.STANDARD.deliveryDays),
      deliveryCost: Number(payload.STANDARD.deliveryCost),
    },
    EXPRESS: {
      deliveryDays: Number(payload.EXPRESS.deliveryDays),
      deliveryCost: Number(payload.EXPRESS.deliveryCost),
    },
  },
  STANDARD: {
    deliveryDays: Number(payload.STANDARD.deliveryDays),
    deliveryCost: Number(payload.STANDARD.deliveryCost),
  },
  EXPRESS: {
    deliveryDays: Number(payload.EXPRESS.deliveryDays),
    deliveryCost: Number(payload.EXPRESS.deliveryCost),
  },
});

const toLegacySettingsPayload = (payload: DeliverySettingsPayload) => ({
  default_delivery_method: payload.defaultDeliveryMethod,
  standard_delivery_days: Number(payload.STANDARD.deliveryDays),
  standard_delivery_cost: Number(payload.STANDARD.deliveryCost),
  express_delivery_days: Number(payload.EXPRESS.deliveryDays),
  express_delivery_cost: Number(payload.EXPRESS.deliveryCost),
});

const buildMonthParams = (
  month: string,
  pagination?: PaginationInput,
) => ({
  month,
  page: pagination?.page ?? DEFAULT_PAGE,
  limit: pagination?.limit ?? DEFAULT_LIMIT,
});

export const calendarApi = {
  async getCalendarOrders(
    month: string,
    pagination?: PaginationInput,
  ): Promise<CalendarOrder[]> {
    const response = await api.get("/api/admin/calendar/orders", {
      params: buildMonthParams(month, pagination),
    });
    return mapCalendarOrdersResponse(response.data);
  },

  async getCanceledOrders(
    month: string,
    pagination?: PaginationInput,
  ): Promise<CalendarOrder[]> {
    try {
      const response = await api.get("/api/admin/calendar/orders/canceled", {
        params: buildMonthParams(month, pagination),
      });
      return mapCalendarOrdersResponse(response.data);
    } catch (error) {
      const status = (error as { response?: { status?: number } }).response?.status;
      if (status !== 404) {
        throw error;
      }

      const fallback = await api.get("/api/admin/calendar/orders", {
        params: {
          ...buildMonthParams(month, pagination),
          status: "CANCELLED",
        },
      });
      return mapCalendarOrdersResponse(fallback.data);
    }
  },

  async getCalendarEvents(month: string): Promise<CalendarManualEvent[]> {
    const response = await api.get("/api/admin/calendar/events", {
      params: { month },
    });
    return mapCalendarEventsResponse(response.data);
  },

  async createCalendarEvent(
    payload: CalendarEventMutationPayload,
  ): Promise<CalendarManualEvent> {
    const response = await api.post("/api/admin/calendar/events", payload);
    const data = unwrapApiData<unknown>(response.data);
    return normalizeCalendarManualEvent(data);
  },

  async updateCalendarEvent(
    id: string,
    payload: Partial<CalendarEventMutationPayload>,
  ): Promise<CalendarManualEvent> {
    const response = await api.patch(`/api/admin/calendar/events/${id}`, payload);
    const data = unwrapApiData<unknown>(response.data);
    return normalizeCalendarManualEvent(data);
  },

  async deleteCalendarEvent(id: string): Promise<void> {
    await api.delete(`/api/admin/calendar/events/${id}`);
  },

  async getDeliverySettings(): Promise<DeliverySettings> {
    const response = await api.get("/api/admin/calendar/settings");
    logSettingsDebug("GET raw response", response.data);
    const data = unwrapApiData<unknown>(response.data);
    logSettingsDebug("GET unwrapped data", data);
    const normalized = normalizeDeliverySettings(data);
    logSettingsDebug("GET normalized settings", normalized);
    return normalized;
  },

  async updateDeliverySettings(
    payload: DeliverySettingsPayload,
  ): Promise<DeliverySettings> {
    const normalizedPayload = normalizeSettingsPayload(payload);
    logSettingsDebug("PATCH requested payload", normalizedPayload);
    let response;

    try {
      response = await api.patch("/api/admin/calendar/settings", normalizedPayload);
      logSettingsDebug("PATCH success (normalized payload)", response.data);
    } catch (error) {
      const status = (error as { response?: { status?: number; data?: unknown } }).response
        ?.status;
      const errorData = (error as { response?: { data?: unknown } }).response?.data;
      logSettingsDebug("PATCH error (normalized payload)", {
        status,
        errorData,
      });
      if (status !== 400 && status !== 422) {
        throw error;
      }

      const legacyPayload = toLegacySettingsPayload(payload);
      logSettingsDebug("PATCH fallback payload", legacyPayload);
      response = await api.patch(
        "/api/admin/calendar/settings",
        legacyPayload,
      );
      logSettingsDebug("PATCH success (legacy payload)", response.data);
    }

    const data = unwrapApiData<unknown>(response.data);
    logSettingsDebug("PATCH unwrapped data", data);
    const normalized = normalizeDeliverySettings(data);
    logSettingsDebug("PATCH normalized settings", normalized);
    return normalized;
  },

  async updateOrderDeliveryDate(
    orderId: string,
    payload: UpdateOrderDeliveryDatePayload,
  ): Promise<CalendarOrder> {
    const response = await api.patch(
      `/api/admin/orders/${orderId}/delivery-date`,
      payload,
    );
    const data = unwrapApiData<unknown>(response.data);
    return normalizeCalendarOrder(data);
  },
};

export const {
  getCalendarOrders,
  getCanceledOrders,
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  getDeliverySettings,
  updateDeliverySettings,
  updateOrderDeliveryDate,
} = calendarApi;
