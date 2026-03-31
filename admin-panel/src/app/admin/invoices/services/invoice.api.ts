import api from "@/services/api";
import { extractList } from "@/lib/extractList";
import type {
  AddInvoicePaymentInput,
  CreateInvoiceFromOrderInput,
  CreateInvoiceFromOrderResult,
  InvoiceDetails,
  InvoiceLine,
  InvoiceListFilters,
  InvoiceListItem,
  InvoiceListResponse,
  InvoicePayment,
  InvoiceSource,
  InvoiceStatus,
} from "@/app/admin/invoices/services/invoice.types";

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

type UnknownRecord = Record<string, unknown>;

const unwrap = <T>(value: unknown): T => {
  const envelope = (value ?? {}) as ApiEnvelope<T>;
  if (typeof envelope === "object" && "data" in envelope) {
    return (envelope.data ?? ({} as T)) as T;
  }
  return value as T;
};

const toNumber = (value: unknown, fallback = 0) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
};

const toStringSafe = (value: unknown, fallback = "") => {
  if (value === null || value === undefined) {
    return fallback;
  }
  return String(value);
};

const firstNonEmptyString = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value !== "string") {
      if (value !== null && value !== undefined) {
        const asString = String(value).trim();
        if (asString) return asString;
      }
      continue;
    }
    const trimmed = value.trim();
    if (trimmed) return trimmed;
  }
  return "";
};

const toInvoiceStatus = (value: unknown): InvoiceStatus => {
  const normalized = toStringSafe(value, "DRAFT").toUpperCase();
  if (
    normalized === "DRAFT" ||
    normalized === "POSTED" ||
    normalized === "SENT" ||
    normalized === "PARTIAL" ||
    normalized === "PAID" ||
    normalized === "OVERDUE" ||
    normalized === "CANCELED"
  ) {
    return normalized;
  }
  if (normalized === "CANCELLED") {
    return "CANCELED";
  }
  return "DRAFT";
};

const toInvoiceSource = (value: unknown): InvoiceSource => {
  const normalized = toStringSafe(value, "ORDER").toUpperCase();
  if (normalized === "ORDER" || normalized === "TEMP_ORDER" || normalized === "POS_ORDER") {
    return normalized;
  }
  return "ORDER";
};

const toImageUrl = (value: unknown): string | undefined => {
  if (!value) return undefined;
  if (typeof value === "string") {
    if (!value.trim()) return undefined;
    if (value.startsWith("http://") || value.startsWith("https://")) {
      return value;
    }
    const base = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/$/, "");
    return `${base}/${value.replace(/^\//, "")}`;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = toImageUrl(item);
      if (found) return found;
    }
    return undefined;
  }

  if (typeof value === "object") {
    const row = value as UnknownRecord;
    return (
      toImageUrl(row.url) ||
      toImageUrl(row.image) ||
      toImageUrl(row.imageUrl) ||
      toImageUrl(row.path)
    );
  }

  return undefined;
};

const normalizeLine = (value: unknown): InvoiceLine => {
  const row = (value ?? {}) as UnknownRecord;
  const product = (row.product ?? {}) as UnknownRecord;
  const quantity = toNumber(row.quantity ?? row.qty ?? 0);
  const unitPrice = toNumber(row.unitPrice ?? row.price ?? 0);
  const discount = toNumber(row.discount ?? row.discountAmount ?? 0);
  const tax = toNumber(row.tax ?? row.taxAmount ?? 0);
  const lineTotal = toNumber(row.lineTotal ?? row.total ?? quantity * unitPrice - discount + tax);

  return {
    id: toStringSafe(row.id, `${row.productId ?? "line"}-${Math.random()}`),
    productId: (row.productId ?? product.id ?? null) as string | number | null,
    productName: toStringSafe(
      row.productName ?? row.name ?? product.name,
      `Product #${toStringSafe(row.productId ?? product.id, "N/A")}`,
    ),
    imageUrl: toImageUrl(row.imageUrl ?? row.image ?? row.images ?? product.imageUrl ?? product.image ?? product.images),
    description: toStringSafe(row.description, "") || null,
    quantity,
    unitPrice,
    discount,
    tax,
    lineTotal,
  };
};

const normalizePayment = (value: unknown): InvoicePayment => {
  const row = (value ?? {}) as UnknownRecord;
  return {
    id: toStringSafe(row.id, `${row.method ?? "payment"}-${Math.random()}`),
    method: toStringSafe(row.method ?? row.type, "UNKNOWN").toUpperCase(),
    amount: toNumber(row.amount ?? row.value ?? 0),
    status: toStringSafe(row.status, "") || undefined,
    date: toStringSafe(row.date ?? row.createdAt, "") || undefined,
    reference: toStringSafe(row.reference ?? row.ref, "") || undefined,
  };
};

const normalizeInvoiceListItem = (value: unknown): InvoiceListItem => {
  const row = (value ?? {}) as UnknownRecord;
  const customer = (row.customer ?? {}) as UnknownRecord;
  const user = (row.user ?? {}) as UnknownRecord;
  const order = (row.order ?? row.sourceOrder ?? {}) as UnknownRecord;
  const orderCustomer = (order.customer ?? {}) as UnknownRecord;
  const orderUser = (order.user ?? {}) as UnknownRecord;
  return {
    id: toStringSafe(row.id),
    invoiceNumber: toStringSafe(row.invoiceNumber ?? row.number ?? row.code, "N/A"),
    customerName:
      firstNonEmptyString(
        row.customerName,
        row.customer_name,
        row.customerFullName,
        customer.name,
        customer.fullName,
        customer.full_name,
        user.name,
        user.fullName,
        user.full_name,
        order.customerName,
        order.customer_name,
        orderCustomer.name,
        orderCustomer.fullName,
        orderCustomer.full_name,
        orderUser.name,
        orderUser.fullName,
        orderUser.full_name,
      ) || "Walk-in Customer",
    source: toInvoiceSource(row.source ?? row.orderType),
    sourceOrderId: toStringSafe(row.sourceOrderId ?? row.orderId ?? row.sourceId, "") || null,
    status: toInvoiceStatus(row.status),
    issueDate: toStringSafe(row.issueDate ?? row.issuedAt, "") || null,
    dueDate: toStringSafe(row.dueDate, "") || null,
    grandTotal: toNumber(row.grandTotal ?? row.total ?? row.totalAmount),
    remainingAmount: toNumber(row.remainingAmount ?? row.balance ?? row.dueAmount),
  };
};

const extractCustomerNameFromAny = (value: unknown) => {
  const row = (value ?? {}) as UnknownRecord;
  const customer = (row.customer ?? {}) as UnknownRecord;
  const user = (row.user ?? {}) as UnknownRecord;
  const address = (row.address ?? row.shippingAddress ?? {}) as UnknownRecord;

  return (
    firstNonEmptyString(
      row.customerName,
      row.customer_name,
      row.userName,
      row.user_name,
      row.username,
      row.fullName,
      row.full_name,
      customer.name,
      customer.fullName,
      customer.full_name,
      customer.username,
      user.name,
      user.fullName,
      user.full_name,
      user.userName,
      user.user_name,
      user.username,
      address.fullName,
      address.full_name,
      address.name,
    ) || ""
  );
};

type ResolvedCustomerInfo = {
  name?: string | null;
  email?: string | null;
  mobile?: string | null;
};

const extractCustomerInfoFromAny = (value: unknown): ResolvedCustomerInfo => {
  const row = (value ?? {}) as UnknownRecord;
  const customer = (row.customer ?? {}) as UnknownRecord;
  const user = (row.user ?? {}) as UnknownRecord;
  const address = (row.address ?? row.shippingAddress ?? {}) as UnknownRecord;

  return {
    name: extractCustomerNameFromAny(value) || null,
    email:
      firstNonEmptyString(
        row.customerEmail,
        row.email,
        customer.email,
        user.email,
      ) || null,
    mobile:
      firstNonEmptyString(
        row.customerMobile,
        row.customerMobileNumber,
        row.mobile,
        row.mobileNumber,
        customer.mobile,
        customer.mobileNumber,
        customer.phone,
        user.mobile,
        user.mobileNumber,
        user.phone,
        address.phone,
      ) || null,
  };
};

const extractPaymentsFromAny = (value: unknown): InvoicePayment[] => {
  const row = (value ?? {}) as UnknownRecord;

  const arrays = [
    row.payments,
    row.paymentHistory,
    row.paymentLines,
    row.transactions,
    row.transactionHistory,
  ];

  for (const source of arrays) {
    if (Array.isArray(source) && source.length > 0) {
      return source.map(normalizePayment);
    }
  }

  const paymentMethod = firstNonEmptyString(
    row.paymentMethod,
    row.paymentType,
    row.method,
  );
  const amount = toNumber(
    row.paidAmount ?? row.paid ?? row.totalPaid ?? row.totalAmount ?? row.total,
    0,
  );
  const status = firstNonEmptyString(row.paymentStatus, row.status);
  const createdAt = firstNonEmptyString(row.createdAt, row.issuedAt);
  const reference = firstNonEmptyString(row.reference, row.paymentReference);

  if (!paymentMethod || amount <= 0) {
    return [];
  }

  return [
    {
      id: `fallback-${paymentMethod}-${createdAt || "now"}`,
      method: paymentMethod.toUpperCase(),
      amount,
      status: status || undefined,
      date: createdAt || undefined,
      reference: reference || undefined,
    },
  ];
};

const resolveCustomerNameFromSource = async (
  source: InvoiceSource,
  sourceOrderId?: string | null,
): Promise<string | null> => {
  if (!sourceOrderId) return null;

  const readName = (responseData: unknown) => {
    const payload = unwrap<unknown>(responseData);
    const record = (payload ?? {}) as UnknownRecord;
    const nested =
      (record.order as UnknownRecord | undefined) ??
      (record.data as UnknownRecord | undefined) ??
      record;
    const extracted = extractCustomerNameFromAny(nested);
    return extracted || null;
  };

  try {
    if (source === "ORDER") {
      const response = await api.get(`/admin/orders/${sourceOrderId}`);
      return readName(response.data);
    }
    if (source === "TEMP_ORDER") {
      const response = await api.get(`/admin/temp-orders/${sourceOrderId}`);
      return readName(response.data);
    }
    const response = await api.get(`/api/pos/order/${sourceOrderId}`);
    return readName(response.data);
  } catch {
    return null;
  }
};

const resolveCustomerFromSource = async (
  source: InvoiceSource,
  sourceOrderId?: string | null,
): Promise<ResolvedCustomerInfo | null> => {
  if (!sourceOrderId) return null;

  const readInfo = (responseData: unknown) => {
    const payload = unwrap<unknown>(responseData);
    const record = (payload ?? {}) as UnknownRecord;
    const nested =
      (record.order as UnknownRecord | undefined) ??
      (record.data as UnknownRecord | undefined) ??
      record;
    return extractCustomerInfoFromAny(nested);
  };

  try {
    if (source === "ORDER") {
      const response = await api.get(`/admin/orders/${sourceOrderId}`);
      return readInfo(response.data);
    }
    if (source === "TEMP_ORDER") {
      const response = await api.get(`/admin/temp-orders/${sourceOrderId}`);
      return readInfo(response.data);
    }
    const response = await api.get(`/api/pos/order/${sourceOrderId}`);
    return readInfo(response.data);
  } catch {
    return null;
  }
};

const resolveSourcePayload = async (
  source: InvoiceSource,
  sourceOrderId?: string | null,
): Promise<UnknownRecord | null> => {
  if (!sourceOrderId) return null;
  try {
    if (source === "ORDER") {
      const response = await api.get(`/admin/orders/${sourceOrderId}`);
      const payload = unwrap<unknown>(response.data);
      const record = (payload ?? {}) as UnknownRecord;
      return ((record.order as UnknownRecord | undefined) ?? (record.data as UnknownRecord | undefined) ?? record) as UnknownRecord;
    }
    if (source === "TEMP_ORDER") {
      const response = await api.get(`/admin/temp-orders/${sourceOrderId}`);
      const payload = unwrap<unknown>(response.data);
      const record = (payload ?? {}) as UnknownRecord;
      return ((record.order as UnknownRecord | undefined) ?? (record.data as UnknownRecord | undefined) ?? record) as UnknownRecord;
    }
    const response = await api.get(`/api/pos/order/${sourceOrderId}`);
    const payload = unwrap<unknown>(response.data);
    const record = (payload ?? {}) as UnknownRecord;
    return ((record.order as UnknownRecord | undefined) ?? (record.data as UnknownRecord | undefined) ?? record) as UnknownRecord;
  } catch {
    return null;
  }
};

const normalizeInvoiceDetails = (value: unknown): InvoiceDetails => {
  const row = (value ?? {}) as UnknownRecord;
  const customer = (row.customer ?? {}) as UnknownRecord;
  const user = (row.user ?? {}) as UnknownRecord;
  const order = (row.order ?? row.sourceOrder ?? {}) as UnknownRecord;
  const orderCustomer = (order.customer ?? {}) as UnknownRecord;
  const orderUser = (order.user ?? {}) as UnknownRecord;
  const linesRaw = (row.lines ?? row.items ?? []) as unknown[];
  const paymentsRaw = (row.payments ?? row.paymentHistory ?? []) as unknown[];
  const status = toInvoiceStatus(row.status);
  const remainingAmount = toNumber(row.remainingAmount ?? row.balance ?? row.dueAmount);

  return {
    id: toStringSafe(row.id),
    invoiceNumber: toStringSafe(row.invoiceNumber ?? row.number ?? row.code, "N/A"),
    source: toInvoiceSource(row.source ?? row.orderType),
    sourceOrderId:
      toStringSafe(
        row.sourceOrderId ??
          row.orderId ??
          row.sourceId ??
          (row.order as UnknownRecord | undefined)?.id,
        "",
      ) || null,
    status,
    customerName:
      firstNonEmptyString(
        row.customerName,
        row.customer_name,
        row.customerFullName,
        customer.name,
        customer.fullName,
        customer.full_name,
        user.name,
        user.fullName,
        user.full_name,
        order.customerName,
        order.customer_name,
        orderCustomer.name,
        orderCustomer.fullName,
        orderCustomer.full_name,
        orderUser.name,
        orderUser.fullName,
        orderUser.full_name,
      ) || "Walk-in Customer",
    customerEmail:
      firstNonEmptyString(
        row.customerEmail,
        row.email,
        customer.email,
        user.email,
        (order.customer as UnknownRecord | undefined)?.email,
        (order.user as UnknownRecord | undefined)?.email,
      ) || null,
    customerMobile:
      firstNonEmptyString(
        row.customerMobile,
        row.customerMobileNumber,
        row.mobile,
        row.mobileNumber,
        customer.mobile,
        customer.mobileNumber,
        customer.phone,
        user.mobile,
        user.mobileNumber,
        user.phone,
        (order.customer as UnknownRecord | undefined)?.mobile,
        (order.customer as UnknownRecord | undefined)?.mobileNumber,
        (order.user as UnknownRecord | undefined)?.mobile,
        (order.user as UnknownRecord | undefined)?.mobileNumber,
      ) || null,
    issueDate: toStringSafe(row.issueDate ?? row.issuedAt, "") || null,
    dueDate: toStringSafe(row.dueDate, "") || null,
    sentAt: toStringSafe(row.sentAt, "") || null,
    emailStatus: toStringSafe(row.emailStatus, "") || null,
    subtotal: toNumber(row.subtotal ?? row.subTotal),
    discount: toNumber(row.discount ?? row.discountAmount),
    tax: toNumber(row.tax ?? row.taxAmount),
    grandTotal: toNumber(row.grandTotal ?? row.total ?? row.totalAmount),
    paidAmount: toNumber(row.paidAmount),
    remainingAmount,
    canceledAt: toStringSafe(row.canceledAt, "") || null,
    lines: Array.isArray(linesRaw) ? linesRaw.map(normalizeLine) : [],
    payments: Array.isArray(paymentsRaw) ? paymentsRaw.map(normalizePayment) : [],
    canRefresh: status === "DRAFT",
    canPost: status === "DRAFT",
    canSend: status === "POSTED",
    canAddPayment: status !== "CANCELED" && status !== "PAID" && remainingAmount > 0,
    canCancel: status !== "CANCELED",
  };
};

export const invoiceApi = {
  async getInvoices(filters: InvoiceListFilters): Promise<InvoiceListResponse> {
    const response = await api.get("/api/admin/invoices", { params: filters });
    const payload = unwrap<unknown>(response.data);
    const record = (payload ?? {}) as UnknownRecord;

    const rawItems =
      extractList<unknown>(payload).length > 0
        ? extractList<unknown>(payload)
        : Array.isArray(record.invoices)
          ? record.invoices
          : Array.isArray(record.rows)
            ? record.rows
            : [];

    const pagination = (record.pagination ?? {}) as UnknownRecord;
    const totalItems = toNumber(record.totalItems ?? pagination.totalItems ?? rawItems.length);
    const limit = Math.max(1, toNumber(record.limit ?? pagination.limit ?? filters.limit ?? 10));
    const page = Math.max(1, toNumber(record.page ?? pagination.currentPage ?? filters.page ?? 1));
    const totalPages = Math.max(1, toNumber(record.totalPages ?? pagination.totalPages ?? Math.ceil(totalItems / limit)));

    const normalizedItems = rawItems.map(normalizeInvoiceListItem);
    const enrichedItems = await Promise.all(
      normalizedItems.map(async (invoice) => {
        const isFallbackName =
          !invoice.customerName ||
          invoice.customerName.trim().toLowerCase() === "walk-in customer";
        if (!isFallbackName) {
          return invoice;
        }

        const resolvedName = await resolveCustomerNameFromSource(
          invoice.source,
          invoice.sourceOrderId,
        );

        if (!resolvedName) {
          return invoice;
        }

        return {
          ...invoice,
          customerName: resolvedName,
        };
      }),
    );

    return {
      items: enrichedItems,
      page,
      limit,
      totalItems,
      totalPages,
    };
  },

  async getInvoiceById(id: string): Promise<InvoiceDetails> {
    const response = await api.get(`/api/admin/invoices/${id}`);
    const normalized = normalizeInvoiceDetails(unwrap<unknown>(response.data));
    const needsName =
      !normalized.customerName ||
      normalized.customerName.trim().toLowerCase() === "walk-in customer";
    const needsEmail = !normalized.customerEmail;
    const needsMobile = !normalized.customerMobile;

    const needsPayments = !Array.isArray(normalized.payments) || normalized.payments.length === 0;

    if (
      !normalized.sourceOrderId ||
      (!needsName && !needsEmail && !needsMobile && !needsPayments)
    ) {
      return normalized;
    }

    const sourceCustomer = await resolveCustomerFromSource(
      normalized.source,
      normalized.sourceOrderId,
    );
    const sourcePayload = await resolveSourcePayload(
      normalized.source,
      normalized.sourceOrderId,
    );
    const sourcePayments = sourcePayload ? extractPaymentsFromAny(sourcePayload) : [];

    if (!sourceCustomer && sourcePayments.length === 0) {
      return normalized;
    }

    return {
      ...normalized,
      customerName:
        needsName && sourceCustomer?.name ? sourceCustomer.name : normalized.customerName,
      customerEmail:
        needsEmail && sourceCustomer?.email ? sourceCustomer.email : normalized.customerEmail,
      customerMobile:
        needsMobile && sourceCustomer?.mobile ? sourceCustomer.mobile : normalized.customerMobile,
      payments: needsPayments && sourcePayments.length > 0 ? sourcePayments : normalized.payments,
    };
  },

  async createInvoiceFromOrder(data: CreateInvoiceFromOrderInput): Promise<CreateInvoiceFromOrderResult> {
    const response = await api.post("/api/admin/invoices/from-order", data);
    const payload = unwrap<UnknownRecord>(response.data);

    return {
      id: toStringSafe(payload.id ?? payload.invoiceId),
      invoiceNumber: toStringSafe(payload.invoiceNumber, "") || undefined,
      existed: Boolean(payload.existed ?? payload.alreadyExists),
    };
  },

  async refreshInvoice(id: string): Promise<InvoiceDetails> {
    const response = await api.post(`/api/admin/invoices/${id}/refresh-from-source`);
    return normalizeInvoiceDetails(unwrap<unknown>(response.data));
  },

  async postInvoice(id: string): Promise<InvoiceDetails> {
    const response = await api.post(`/api/admin/invoices/${id}/post`);
    return normalizeInvoiceDetails(unwrap<unknown>(response.data));
  },

  async sendInvoice(id: string): Promise<InvoiceDetails> {
    const response = await api.post(`/api/admin/invoices/${id}/send`);
    return normalizeInvoiceDetails(unwrap<unknown>(response.data));
  },

  async addPayment(id: string, data: AddInvoicePaymentInput): Promise<InvoiceDetails> {
    const response = await api.post(`/api/admin/invoices/${id}/payments`, data);
    return normalizeInvoiceDetails(unwrap<unknown>(response.data));
  },

  async cancelInvoice(id: string): Promise<InvoiceDetails> {
    const response = await api.post(`/api/admin/invoices/${id}/cancel`);
    return normalizeInvoiceDetails(unwrap<unknown>(response.data));
  },
};
