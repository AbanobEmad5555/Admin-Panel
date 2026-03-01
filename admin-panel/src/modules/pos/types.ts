export type PosPaymentMethod = "CASH" | "CARD" | "WALLET";

export type PosSession = {
  id: string;
  storeId: string;
  status: "OPEN" | "CLOSED";
  openingBalance: number;
  expectedClosingBalance?: number;
  closedAt?: string;
  openedAt?: string;
  totalSales?: number;
  ordersCount?: number;
};

export type PosOrderItemInput = {
  productId: string;
  name: string;
  variantId?: number;
  qty: number;
  unitPrice: number;
  discount?: number;
  tax?: number;
};

export type PosOrder = {
  id: string;
  sessionId?: string;
  customerName?: string;
  customerMobileNumber?: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  paidAmount?: number;
  dueAmount?: number;
  change?: number;
  tempOrderId?: number | null;
  createdAt?: string;
  items: PosOrderItemInput[];
  payments?: PosPaymentLine[];
};

export type PosPaymentLine = {
  method: PosPaymentMethod;
  amount: number;
  reference?: string;
};

export type OpenSessionInput = {
  storeId: string;
  openingBalance: number;
};

export type CloseSessionInput = {
  sessionId: string;
  closingBalance: number;
};

export type CreateOrderInput = {
  sessionId?: string;
  customerName?: string;
  customerMobileNumber?: string;
  note?: string;
  loyaltyProgramCode?: string;
  items: PosOrderItemInput[];
  payments?: PosPaymentLine[];
  discountAmount?: number;
  taxAmount?: number;
};

export type PayOrderInput = {
  payments: PosPaymentLine[];
};

export type RefundOrderInput = {
  reason: string;
  method: PosPaymentMethod;
  reference?: string;
};

export type DailyReport = {
  date: string;
  totalSales: number;
  totalTax: number;
  totalDiscount: number;
  ordersCount: number;
  paymentBreakdown: Array<{ method: PosPaymentMethod; amount: number }>;
};

export type SessionReport = {
  sessionId: string;
  totalSales: number;
  totalTax: number;
  totalDiscount: number;
  ordersCount: number;
  paymentBreakdown: Array<{ method: PosPaymentMethod; amount: number }>;
  orders: PosOrder[];
};

export type TopProduct = {
  productId: string;
  name: string;
  qtySold: number;
  revenue: number;
};

export type TopProductsParams = {
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
};

export type TopProductsResult = {
  items: TopProduct[];
  page: number;
  totalPages: number;
  totalItems: number;
};
