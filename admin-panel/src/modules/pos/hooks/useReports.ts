import { useQuery } from "@tanstack/react-query";
import { posService } from "@/modules/pos/services/pos.service";
import type { TopProductsParams } from "@/modules/pos/types";

export const useDailyReport = (date: string) =>
  useQuery({
    queryKey: ["pos", "report", "daily", date],
    queryFn: () => posService.getDailyReport(date),
    enabled: Boolean(date),
  });

export const usePosOrdersByDate = (date: string) =>
  useQuery({
    queryKey: ["pos", "orders", date],
    queryFn: () => posService.getPosOrders(date),
    enabled: Boolean(date),
  });

export const useSessionReport = (sessionId?: string) =>
  useQuery({
    queryKey: ["pos", "report", "session", sessionId],
    queryFn: () => posService.getSessionReport(sessionId as string),
    enabled: Boolean(sessionId),
  });

export const useTopProducts = (params: TopProductsParams) =>
  useQuery({
    queryKey: ["pos", "report", "top-products", params],
    queryFn: () => posService.getTopProducts(params),
  });
