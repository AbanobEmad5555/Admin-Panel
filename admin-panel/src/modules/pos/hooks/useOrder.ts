import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { posService } from "@/modules/pos/services/pos.service";
import type { CreateOrderInput, RefundOrderInput } from "@/modules/pos/types";

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOrderInput) => posService.createOrder(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["pos", "report"] });
    },
  });
};

export const useOrderById = (orderId?: string) =>
  useQuery({
    queryKey: ["pos", "order", orderId],
    queryFn: () => posService.getOrderById(orderId as string),
    enabled: Boolean(orderId),
  });

export const usePosOrderDetails = (orderId?: string) =>
  useQuery({
    queryKey: ["pos", "order", "details", orderId],
    queryFn: () => posService.getPosOrderRaw(orderId as string),
    enabled: Boolean(orderId),
  });

export const useRefundOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: { orderId: string; payload: RefundOrderInput }) =>
      posService.refundOrder(args.orderId, args.payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["pos", "report"] });
    },
  });
};
