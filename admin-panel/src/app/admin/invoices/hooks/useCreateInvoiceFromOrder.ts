import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invoiceApi } from "@/app/admin/invoices/services/invoice.api";
import type { CreateInvoiceFromOrderInput } from "@/app/admin/invoices/services/invoice.types";

export const useCreateInvoiceFromOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateInvoiceFromOrderInput) =>
      invoiceApi.createInvoiceFromOrder(payload),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ["invoices"] });
      if (result.id) {
        void queryClient.invalidateQueries({ queryKey: ["invoice", result.id] });
      }
    },
  });
};

