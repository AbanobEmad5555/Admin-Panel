import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getCalendarEvents } from "@/modules/calendar/api/calendarApi";
import { calendarQueryKeys } from "@/modules/calendar/hooks/queryKeys";

export const useCalendarEvents = (month: string) =>
  useQuery({
    queryKey: calendarQueryKeys.events(month),
    queryFn: () => getCalendarEvents(month),
    enabled: Boolean(month),
    placeholderData: keepPreviousData,
  });

