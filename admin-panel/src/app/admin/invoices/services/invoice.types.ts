export type InvoiceSource = "ORDER" | "TEMP_ORDER" | "POS_ORDER";

export type InvoiceStatus =
  | "DRAFT"
  | "POSTED"
  | "SENT"
  | "PARTIAL"
  | "PAID"
  | "OVERDUE"
  | "CANCELED";

export type InvoiceListFilters = {
  page?: number;
  limit?: number;
  status?: InvoiceStatus | "";
  orderType?: InvoiceSource | "";
  dateFrom?: string;
  dateTo?: string;
  customer?: string;
  minTotal?: number;
  maxTotal?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export type InvoiceListItem = {
  id: string;
  invoiceNumber: string;
  customerName: string;
  source: InvoiceSource;
  sourceOrderId?: string | null;
  status: InvoiceStatus;
  issueDate?: string | null;
  dueDate?: string | null;
  grandTotal: number;
  remainingAmount: number;
};

export type InvoiceLine = {
  id: string;
  productId?: string | number | null;
  productName: string;
  imageUrl?: string;
  description?: string | null;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  lineTotal: number;
};

export type InvoicePayment = {
  id: string;
  method: string;
  amount: number;
  status?: string;
  date?: string | null;
  reference?: string | null;
};

export type InvoiceDetails = {
  id: string;
  invoiceNumber: string;
  source: InvoiceSource;
  sourceOrderId?: string | null;
  status: InvoiceStatus;
  customerName: string;
  customerEmail?: string | null;
  customerMobile?: string | null;
  issueDate?: string | null;
  dueDate?: string | null;
  sentAt?: string | null;
  emailStatus?: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
  paidAmount: number;
  remainingAmount: number;
  canceledAt?: string | null;
  lines: InvoiceLine[];
  payments: InvoicePayment[];
  canRefresh: boolean;
  canPost: boolean;
  canSend: boolean;
  canAddPayment: boolean;
  canCancel: boolean;
};

export type InvoiceListResponse = {
  items: InvoiceListItem[];
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
};

export type CreateInvoiceFromOrderInput = {
  orderType: InvoiceSource;
  orderId: string;
  mode: "DRAFT" | "POSTED";
  sendEmail: boolean;
  forceNew: boolean;
};

export type CreateInvoiceFromOrderResult = {
  id: string;
  invoiceNumber?: string;
  existed?: boolean;
};

export type AddInvoicePaymentInput = {
  method: string;
  amount: number;
  reference?: string;
};
