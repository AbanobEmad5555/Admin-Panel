import { useQuery } from "@tanstack/react-query";
import { getDeliverySettings } from "@/modules/calendar/api/calendarApi";
import { calendarQueryKeys } from "@/modules/calendar/hooks/queryKeys";

export const useDeliverySettings = () =>
  useQuery({
    queryKey: calendarQueryKeys.settings(),
    queryFn: () => getDeliverySettings(),
  });

