import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invoiceApi } from "@/app/admin/invoices/services/invoice.api";
import type { AddInvoicePaymentInput } from "@/app/admin/invoices/services/invoice.types";

export const useInvoiceDetails = (id?: string) =>
  useQuery({
    queryKey: ["invoice", id],
    queryFn: () => invoiceApi.getInvoiceById(id as string),
    enabled: Boolean(id),
  });

export const usePostInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoiceApi.postInvoice(id),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ["invoice", data.id] });
      void queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
};

export const useSendInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoiceApi.sendInvoice(id),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ["invoice", data.id] });
      void queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
};

export const useAddInvoicePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; payload: AddInvoicePaymentInput }) =>
      invoiceApi.addPayment(params.id, params.payload),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ["invoice", data.id] });
      void queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
};

export const useCancelInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoiceApi.cancelInvoice(id),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ["invoice", data.id] });
      void queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
};

