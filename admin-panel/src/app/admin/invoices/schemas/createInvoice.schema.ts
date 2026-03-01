import { z } from "zod";

export const createInvoiceFromOrderSchema = z.object({
  orderType: z.enum(["ORDER", "TEMP_ORDER", "POS_ORDER"]),
  orderId: z.string().trim().min(1, "Order ID is required"),
  mode: z.enum(["DRAFT", "POSTED"]).default("DRAFT"),
  sendEmail: z.boolean().default(false),
  forceNew: z.boolean().default(false),
});

export type CreateInvoiceFromOrderSchema = z.infer<typeof createInvoiceFromOrderSchema>;

export const addInvoicePaymentSchema = z.object({
  method: z.string().trim().min(1, "Payment method is required"),
  amount: z.coerce.number().gt(0, "Amount must be greater than 0"),
  reference: z.string().trim().optional(),
});

export type AddInvoicePaymentSchema = z.infer<typeof addInvoicePaymentSchema>;

