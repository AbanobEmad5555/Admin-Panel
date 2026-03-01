import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invoiceApi } from "@/app/admin/invoices/services/invoice.api";

export const useRefreshInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoiceApi.refreshInvoice(id),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ["invoice", data.id] });
      void queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
};

