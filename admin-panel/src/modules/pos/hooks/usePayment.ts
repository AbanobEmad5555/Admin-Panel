import { useMutation, useQueryClient } from "@tanstack/react-query";
import { posService } from "@/modules/pos/services/pos.service";
import type { PayOrderInput } from "@/modules/pos/types";

export const usePayOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: { orderId: string; payload: PayOrderInput }) =>
      posService.payOrder(args.orderId, args.payload),
    onSuccess: (_, args) => {
      void queryClient.invalidateQueries({ queryKey: ["pos", "order", args.orderId] });
      void queryClient.invalidateQueries({ queryKey: ["pos", "report"] });
    },
  });
};
