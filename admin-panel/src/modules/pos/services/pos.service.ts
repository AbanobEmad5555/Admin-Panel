import api from "@/services/api";
import type {
  CloseSessionInput,
  CreateOrderInput,
  DailyReport,
  OpenSessionInput,
  PayOrderInput,
  PosOrder,
  PosSession,
  RefundOrderInput,
  SessionReport,
  TopProductsParams,
  TopProductsResult,
} from "@/modules/pos/types";
import type { PosProduct } from "@/modules/pos/store/pos.store";

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string | null;
  data?: T;
};

const unwrap = <T>(value: unknown): T => {
  const envelope = (value ?? {}) as ApiEnvelope<T>;
  if (typeof envelope === "object" && "data" in envelope) {
    return (envelope.data ?? ({} as T)) as T;
  }
  return value as T;
};

const extractImageValue = (value: unknown): string => {
  if (Array.isArray(value)) {
    for (const item of value) {
      const candidate = extractImageValue(item);
      if (candidate) {
        return candidate;
      }
    }
    return "";
  }

  if (typeof value === "string") {
    if (!value.trim()) {
      return "";
    }
    if (value.trim().startsWith("[")) {
      try {
        return extractImageValue(JSON.parse(value));
      } catch {
        return value;
      }
    }
    return value;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return (
      (record.url as string) ||
      (record.imageUrl as string) ||
      (record.image_url as string) ||
      (record.path as string) ||
      (record.image as string) ||
      ""
    );
  }

  return "";
};

const resolveImageUrl = (product: Record<string, unknown>): string => {
  const raw =
    extractImageValue(product.images) ||
    extractImageValue(product.imageUrls) ||
    extractImageValue(product.imagesUrl) ||
    extractImageValue(product.images_url) ||
    extractImageValue(product.image) ||
    extractImageValue(product.imageUrl) ||
    extractImageValue(product.image_url);

  if (!raw) {
    return "";
  }

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }

  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  return `${base.replace(/\/$/, "")}/${raw.replace(/^\//, "")}`;
};

const toNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return 0;
};

const toOptionalNumber = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }
  const parsed = toNumber(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const normalizeOrderItems = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => {
    const row = (item ?? {}) as Record<string, unknown>;
    return {
      productId: String(row.productId ?? row.id ?? ""),
      name: String(row.name ?? row.productName ?? "Item"),
      qty: Math.max(0, toNumber(row.qty ?? row.quantity ?? 0)),
      unitPrice: Math.max(0, toNumber(row.unitPrice ?? row.price ?? 0)),
      discount: toOptionalNumber(row.discount),
    };
  });
};

const normalizeOrderPayments = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((line) => {
    const payment = (line ?? {}) as Record<string, unknown>;
    const method = String(
      payment.method ?? payment.type ?? payment.paymentMethod ?? payment.channel ?? "CASH"
    ).toUpperCase();
    return {
      method: method as "CASH" | "CARD" | "WALLET",
      amount: toNumber(payment.amount ?? payment.value ?? payment.total ?? 0),
      reference: payment.reference
        ? String(payment.reference)
        : payment.ref
          ? String(payment.ref)
          : undefined,
    };
  });
};

const normalizePosOrder = (value: unknown): PosOrder => {
  const order = (value ?? {}) as Record<string, unknown>;
  const customer = (order.customer ?? {}) as Record<string, unknown>;
  const user = (order.user ?? {}) as Record<string, unknown>;
  const subtotal = toNumber(order.subtotal ?? order.subTotal);
  const tax = toNumber(order.tax ?? order.taxAmount);
  const discount = toNumber(order.discount ?? order.discountAmount);
  const total = toNumber(
    order.total ??
      order.totalAmount ??
      order.grandTotal ??
      order.finalAmount ??
      subtotal + tax - discount
  );
  const paidAmount = toNumber(order.paidAmount ?? order.paid ?? 0);
  const dueAmount = toNumber(order.dueAmount ?? Math.max(0, total - paidAmount));
  const change = toNumber(order.change ?? Math.max(0, paidAmount - total));
  const rawTempOrderId =
    order.tempOrderId ?? order.temp_order_id ?? order.tempOrderID ?? null;
  const normalizedPayments = normalizeOrderPayments(
    order.payments ?? order.paymentLines ?? order.paymentDetails ?? order.transactions
  );
  const fallbackPaymentMethod =
    normalizedPayments.length > 0
      ? normalizedPayments.map((line) => line.method).join(", ")
      : undefined;

  return {
    id: String(order.id ?? ""),
    sessionId: order.sessionId ? String(order.sessionId) : undefined,
    customerName: String(
      order.customerName ??
        order.customer_name ??
        customer.name ??
        customer.fullName ??
        user.name ??
        "Walk-in Customer"
    ),
    customerMobileNumber: order.customerMobileNumber
      ? String(order.customerMobileNumber)
      : order.customer_mobile_number
        ? String(order.customer_mobile_number)
        : order.mobileNumber
          ? String(order.mobileNumber)
          : undefined,
    subtotal,
    tax,
    discount,
    total,
    status: order.status ? String(order.status) : undefined,
    paymentMethod: order.paymentMethod
      ? String(order.paymentMethod)
      : order.paymentType
        ? String(order.paymentType)
        : order.method
          ? String(order.method)
          : fallbackPaymentMethod,
    paymentStatus: order.paymentStatus ? String(order.paymentStatus) : undefined,
    paidAmount,
    dueAmount,
    change,
    tempOrderId:
      rawTempOrderId === null || rawTempOrderId === undefined || rawTempOrderId === ""
        ? null
        : toNumber(rawTempOrderId),
    createdAt: order.createdAt ? String(order.createdAt) : undefined,
    items: normalizeOrderItems(order.items),
    payments: normalizedPayments.length > 0 ? normalizedPayments : undefined,
  };
};

const normalizePaymentBreakdown = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.map((row) => {
      const record = (row ?? {}) as Record<string, unknown>;
      return {
        method: String(record.method ?? record.type ?? "UNKNOWN") as "CASH" | "CARD" | "WALLET",
        amount: toNumber(record.amount ?? record.total ?? record.value),
      };
    });
  }

  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).map(([method, amount]) => ({
      method: method.toUpperCase() as "CASH" | "CARD" | "WALLET",
      amount: toNumber(amount),
    }));
  }

  return [];
};

const normalizeDailyReport = (value: unknown, date: string): DailyReport => {
  const payload = (value ?? {}) as Record<string, unknown>;
  const summary = (payload.summary ?? payload.totals ?? payload.report ?? payload) as Record<
    string,
    unknown
  >;

  const totalSales = toNumber(
    summary.totalSales ??
      summary.totalAmount ??
      summary.totalRevenue ??
      summary.sales ??
      payload.totalSales ??
      payload.totalAmount ??
      payload.totalRevenue
  );
  const totalTax = toNumber(
    summary.totalTax ?? summary.taxAmount ?? summary.tax ?? payload.totalTax ?? payload.taxAmount
  );
  const totalDiscount = toNumber(
    summary.totalDiscount ??
      summary.discountAmount ??
      summary.discount ??
      payload.totalDiscount ??
      payload.discountAmount
  );
  const ordersCount = toNumber(
    summary.ordersCount ??
      summary.totalOrders ??
      summary.orderCount ??
      payload.ordersCount ??
      payload.totalOrders ??
      payload.orderCount
  );

  const paymentBreakdownSource =
    payload.paymentBreakdown ??
    payload.payments ??
    payload.paymentMethods ??
    summary.paymentBreakdown ??
    summary.payments ??
    summary.paymentMethods ??
    {
      CASH: summary.cash ?? payload.cash ?? 0,
      CARD: summary.card ?? payload.card ?? 0,
      WALLET: summary.wallet ?? payload.wallet ?? 0,
    };

  return {
    date: String(payload.date ?? summary.date ?? date),
    totalSales,
    totalTax,
    totalDiscount,
    ordersCount,
    paymentBreakdown: normalizePaymentBreakdown(paymentBreakdownSource),
  };
};

const toDateKey = (value: unknown): string | null => {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const normalizeMethod = (value: unknown): "CASH" | "CARD" | "WALLET" | null => {
  const method = String(value ?? "").trim().toUpperCase();
  if (method === "CASH" || method === "CARD" || method === "WALLET") {
    return method;
  }
  return null;
};

const fetchPosOrdersList = async (): Promise<PosOrder[]> => {
  const endpoints = ["/api/pos/order?page=1&limit=1000", "/api/pos/orders?page=1&limit=1000", "/admin/pos/orders?page=1&limit=1000"];
  let lastError: unknown = null;

  for (const endpoint of endpoints) {
    try {
      const response = await api.get(endpoint);
      const payload = unwrap<unknown>(response.data);
      const record = (payload ?? {}) as Record<string, unknown>;
      const raw =
        (Array.isArray(payload) ? payload : null) ??
        (Array.isArray(record.orders) ? record.orders : null) ??
        (Array.isArray(record.posOrders) ? record.posOrders : null) ??
        (Array.isArray(record.items) ? record.items : null) ??
        (Array.isArray(record.data) ? record.data : null) ??
        [];

      return raw.map((item) => normalizePosOrder(item));
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error("Failed to fetch POS orders");
};

const sortByCreatedAtDesc = (orders: PosOrder[]) => {
  return [...orders].sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });
};

const aggregateDailyReportFromOrders = (orders: PosOrder[], date: string): DailyReport => {
  const targetDate = date.trim();
  const filtered = orders.filter((order) => toDateKey(order.createdAt) === targetDate);

  const totals = filtered.reduce(
    (acc, order) => {
      acc.totalSales += toNumber(order.total);
      acc.totalTax += toNumber(order.tax);
      acc.totalDiscount += toNumber(order.discount);
      return acc;
    },
    { totalSales: 0, totalTax: 0, totalDiscount: 0 }
  );

  const payments = { CASH: 0, CARD: 0, WALLET: 0 };
  for (const order of filtered) {
    if (Array.isArray(order.payments) && order.payments.length > 0) {
      for (const line of order.payments) {
        const method = normalizeMethod(line.method);
        if (method) {
          payments[method] += toNumber(line.amount);
        }
      }
      continue;
    }

    const fallbackMethod = normalizeMethod(order.paymentMethod);
    if (fallbackMethod) {
      payments[fallbackMethod] += toNumber(order.paidAmount ?? order.total);
    }
  }

  return {
    date: targetDate,
    totalSales: totals.totalSales,
    totalTax: totals.totalTax,
    totalDiscount: totals.totalDiscount,
    ordersCount: filtered.length,
    paymentBreakdown: [
      { method: "CASH", amount: payments.CASH },
      { method: "CARD", amount: payments.CARD },
      { method: "WALLET", amount: payments.WALLET },
    ],
  };
};

export const posService = {
  getPosOrderRaw: async (orderId: string) => {
    const response = await api.get(`/api/pos/order/${orderId}`);
    return unwrap<Record<string, unknown>>(response.data);
  },

  getPosOrders: async (date?: string) => {
    const orders = await fetchPosOrdersList();
    const sorted = sortByCreatedAtDesc(orders);
    if (!date) {
      return sorted;
    }
    return sorted.filter((order) => toDateKey(order.createdAt) === date);
  },

  getProducts: async () => {
    const response = await api.get("/products?page=1&limit=500");
    const payload = unwrap<unknown>(response.data);
    const record = (payload ?? {}) as Record<string, unknown>;
    const raw =
      (Array.isArray(payload) ? payload : null) ??
      (Array.isArray(record.products) ? record.products : null) ??
      (Array.isArray(record.items) ? record.items : null) ??
      (Array.isArray(record.rows) ? record.rows : null) ??
      (Array.isArray(record.data) ? record.data : null) ??
      [];

    return raw
      .map((item) => {
        const product = (item ?? {}) as Record<string, unknown>;
        return {
          id: String(product.id ?? ""),
          name: String(product.name ?? "Unnamed Product"),
          category: String(
            (product.category as { name?: string } | undefined)?.name ??
              product.categoryName ??
              "General"
          ),
          price: toNumber(
            product.priceAfterDiscount ?? product.price ?? product.priceBeforeDiscount
          ),
          imageUrl: resolveImageUrl(product),
          variantId: toOptionalNumber(
            product.variantId ?? (product.variant as { id?: number } | undefined)?.id
          ),
          stock: toOptionalNumber(product.stock) ?? 0,
        } satisfies PosProduct;
      })
      .filter((product) => product.id && product.price >= 0);
  },

  openSession: async (payload: OpenSessionInput) => {
    const response = await api.post("/api/pos/session/open", payload);
    return unwrap<PosSession>(response.data);
  },

  closeSession: async (payload: CloseSessionInput) => {
    const response = await api.post("/api/pos/session/close", payload);
    return unwrap<PosSession>(response.data);
  },

  getCurrentSession: async () => {
    const response = await api.get("/api/pos/session/current");
    return unwrap<PosSession | null>(response.data);
  },

  getSessionById: async (id: string) => {
    const response = await api.get(`/api/pos/session/${id}`);
    return unwrap<PosSession>(response.data);
  },

  createOrder: async (payload: CreateOrderInput) => {
    const normalizeProductId = (value: string) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : value;
    };

    const createOrderPayload = {
      ...payload,
      items: payload.items.map((item) => ({
        productId: normalizeProductId(item.productId),
        variantId: item.variantId,
        quantity: toNumber(item.qty),
        price: toNumber(item.unitPrice),
        discount: toOptionalNumber(item.discount),
        tax: toOptionalNumber(item.tax),
      })),
      payments: Array.isArray(payload.payments)
        ? payload.payments.map((payment) => ({
            method: payment.method,
            amount: toNumber(payment.amount),
            reference: payment.reference,
          }))
        : undefined,
      discountAmount: toOptionalNumber(payload.discountAmount),
      taxAmount: toOptionalNumber(payload.taxAmount),
    };

    const response = await api.post("/api/pos/order", createOrderPayload);
    return normalizePosOrder(unwrap<unknown>(response.data));
  },

  getOrderById: async (orderId: string) => {
    const response = await api.get(`/api/pos/order/${orderId}`);
    return normalizePosOrder(unwrap<unknown>(response.data));
  },

  payOrder: async (orderId: string, payload: PayOrderInput) => {
    const response = await api.post(`/api/pos/order/${orderId}/pay`, payload);
    return normalizePosOrder(unwrap<unknown>(response.data));
  },

  refundOrder: async (orderId: string, payload: RefundOrderInput) => {
    const response = await api.post(`/api/pos/order/${orderId}/refund`, payload);
    return normalizePosOrder(unwrap<unknown>(response.data));
  },

  getDailyReport: async (date: string) => {
    const [dailyResponse, ordersList] = await Promise.allSettled([
      api.get(`/api/pos/report/daily?date=${encodeURIComponent(date)}`),
      fetchPosOrdersList(),
    ]);

    const dailyFromEndpoint =
      dailyResponse.status === "fulfilled"
        ? normalizeDailyReport(unwrap<unknown>(dailyResponse.value.data), date)
        : normalizeDailyReport({}, date);

    if (ordersList.status !== "fulfilled") {
      return dailyFromEndpoint;
    }

    const dailyFromOrders = aggregateDailyReportFromOrders(ordersList.value, date);
    const hasOrdersData = dailyFromOrders.ordersCount > 0;

    if (!hasOrdersData) {
      return dailyFromEndpoint;
    }

    const hasPaymentBreakdownData = dailyFromOrders.paymentBreakdown.some((row) => row.amount > 0);
    return {
      ...dailyFromOrders,
      paymentBreakdown: hasPaymentBreakdownData
        ? dailyFromOrders.paymentBreakdown
        : dailyFromEndpoint.paymentBreakdown,
    };
  },

  getSessionReport: async (sessionId: string) => {
    const response = await api.get(`/api/pos/report/session/${sessionId}`);
    return unwrap<SessionReport>(response.data);
  },

  getTopProducts: async (params: TopProductsParams) => {
    const response = await api.get("/api/pos/report/top-products", { params });
    return unwrap<TopProductsResult>(response.data);
  },
};
