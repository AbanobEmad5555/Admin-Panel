import { useQuery } from "@tanstack/react-query";
import { invoiceApi } from "@/app/admin/invoices/services/invoice.api";
import type { InvoiceListFilters } from "@/app/admin/invoices/services/invoice.types";

export const useInvoices = (filters: InvoiceListFilters) =>
  useQuery({
    queryKey: ["invoices", filters],
    queryFn: () => invoiceApi.getInvoices(filters),
  });

