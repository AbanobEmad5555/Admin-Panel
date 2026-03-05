import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  updateCalendarEvent,
  updateDeliverySettings,
  updateOrderDeliveryDate,
} from "@/modules/calendar/api/calendarApi";
import {
  getManualEventMutationInvalidationKeys,
  getOrderDeliveryDateInvalidationKeys,
} from "@/modules/calendar/hooks/mutationKeys";
import { calendarQueryKeys } from "@/modules/calendar/hooks/queryKeys";
import type {
  CalendarEventMutationPayload,
  DeliverySettingsPayload,
  UpdateOrderDeliveryDatePayload,
} from "@/modules/calendar/types/calendar.types";

type UpdateEventInput = {
  id: string;
  payload: Partial<CalendarEventMutationPayload>;
  month: string;
};

type DeleteEventInput = {
  id: string;
  month: string;
};

type UpdateSettingsInput = {
  payload: DeliverySettingsPayload;
};

type UpdateOrderDeliveryDateInput = {
  orderId: string;
  payload: UpdateOrderDeliveryDatePayload;
  month: string;
};

export const useCreateCalendarEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      payload,
    }: {
      payload: CalendarEventMutationPayload;
      month: string;
    }) => createCalendarEvent(payload),
    onSuccess: async (_data, variables) => {
      const keys = getManualEventMutationInvalidationKeys(variables.month);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: keys[0] }),
        queryClient.invalidateQueries({ queryKey: keys[1] }),
      ]);
    },
  });
};

export const useUpdateCalendarEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateEventInput) =>
      updateCalendarEvent(input.id, input.payload),
    onSuccess: async (_data, variables) => {
      const keys = getManualEventMutationInvalidationKeys(variables.month);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: keys[0] }),
        queryClient.invalidateQueries({ queryKey: keys[1] }),
      ]);
    },
  });
};

export const useDeleteCalendarEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: DeleteEventInput) => deleteCalendarEvent(input.id),
    onSuccess: async (_data, variables) => {
      const keys = getManualEventMutationInvalidationKeys(variables.month);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: keys[0] }),
        queryClient.invalidateQueries({ queryKey: keys[1] }),
      ]);
    },
  });
};

export const useUpdateDeliverySettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateSettingsInput) =>
      updateDeliverySettings(input.payload),
    onSuccess: async (updatedSettings) => {
      queryClient.setQueryData(calendarQueryKeys.settings(), updatedSettings);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: calendarQueryKeys.settings(),
        }),
        queryClient.invalidateQueries({
          queryKey: calendarQueryKeys.ordersPrefix(),
        }),
      ]);
    },
  });
};

export const useUpdateOrderDeliveryDate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateOrderDeliveryDateInput) =>
      updateOrderDeliveryDate(input.orderId, input.payload),
    onSuccess: async (_data, variables) => {
      const keys = getOrderDeliveryDateInvalidationKeys(variables.month);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: keys[0] }),
        queryClient.invalidateQueries({ queryKey: keys[1] }),
      ]);
    },
  });
};
