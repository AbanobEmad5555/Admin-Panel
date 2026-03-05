import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getCalendarOrders } from "@/modules/calendar/api/calendarApi";
import { calendarQueryKeys } from "@/modules/calendar/hooks/queryKeys";

export const useCalendarOrders = (month: string) =>
  useQuery({
    queryKey: calendarQueryKeys.orders(month),
    queryFn: async () =>
      getCalendarOrders(month).then((orders) =>
        orders.filter(
          (order) =>
            order.status !== "CANCELLED" &&
            order.status !== "PENDING",
        ),
      ),
    enabled: Boolean(month),
    placeholderData: keepPreviousData,
  });
