"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import AdminLayout from "@/components/layout/AdminLayout";
import { assignOrderDeliveryDateForOutForDelivery } from "@/lib/deliveryScheduling";
import { useLocalization } from "@/modules/localization/LocalizationProvider";
import api from "@/services/api";

type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Out For Delivery"
  | "Delivered"
  | "Completed"
  | "Canceled";

type OrderCard = {
  id: number;
  customerName: string;
  total: number;
  status: OrderStatus;
  paymentMethod: string;
  createdAt: string;
};

type ApiOrder = {
  id?: number | string;
  customerName?: string | null;
  total?: number | string | null;
  totalAmount?: number | string | null;
  totalPrice?: number | string | null;
  status?: string | null;
  paymentMethod?: string | null;
  paymentType?: string | null;
  createdAt?: string | null;
  created_at?: string | null;
  user?: {
    name?: string | null;
    fullName?: string | null;
    full_name?: string | null;
    username?: string | null;
  } | null;
  customer?: {
    name?: string | null;
    fullName?: string | null;
    full_name?: string | null;
  } | null;
  address?: {
    fullName?: string | null;
    full_name?: string | null;
    fullname?: string | null;
    name?: string | null;
  } | null;
};

type OrdersPayload = {
  orders?: ApiOrder[];
};

type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  pagination?: {
    totalItems?: number;
    currentPage?: number;
    totalPages?: number;
    limit?: number;
  };
};

type ColumnsState = Record<OrderStatus, OrderCard[]>;

const STATUS_ORDER: OrderStatus[] = [
  "Pending",
  "Confirmed",
  "Out For Delivery",
  "Delivered",
  "Completed",
  "Canceled",
];

const STATUS_TO_API: Record<OrderStatus, string> = {
  Pending: "PENDING",
  Confirmed: "CONFIRMED",
  "Out For Delivery": "OUT_FOR_DELIVERY",
  Delivered: "DELIVERED",
  Completed: "COMPLETED",
  Canceled: "CANCELLED",
};

const createEmptyColumns = (): ColumnsState => ({
  Pending: [],
  Confirmed: [],
  "Out For Delivery": [],
  Delivered: [],
  Completed: [],
  Canceled: [],
});

const toNumber = (value: unknown): number => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const normalizeStatus = (value: string | null | undefined): OrderStatus => {
  const normalized = (value ?? "")
    .replace(/[\s-]+/g, "_")
    .toUpperCase()
    .trim();

  switch (normalized) {
    case "CONFIRMED":
      return "Confirmed";
    case "OUT_FOR_DELIVERY":
      return "Out For Delivery";
    case "DELIVERED":
      return "Delivered";
    case "COMPLETED":
      return "Completed";
    case "CANCELED":
    case "CANCELLED":
      return "Canceled";
    default:
      return "Pending";
  }
};

const resolveCustomerName = (order: ApiOrder): string => {
  return (
    order.customerName ??
    order.user?.fullName ??
    order.user?.full_name ??
    order.user?.name ??
    order.user?.username ??
    order.customer?.fullName ??
    order.customer?.full_name ??
    order.customer?.name ??
    order.address?.fullName ??
    order.address?.full_name ??
    order.address?.fullname ??
    order.address?.name ??
    "Unknown"
  );
};

const normalizeOrder = (order: ApiOrder): OrderCard | null => {
  const id = Number(order.id);
  if (!Number.isFinite(id)) {
    return null;
  }

  return {
    id,
    customerName: resolveCustomerName(order),
    total: toNumber(order.total ?? order.totalAmount ?? order.totalPrice),
    status: normalizeStatus(order.status),
    paymentMethod: order.paymentMethod ?? order.paymentType ?? "N/A",
    createdAt: order.createdAt ?? order.created_at ?? "",
  };
};

const groupOrdersByStatus = (orders: OrderCard[]): ColumnsState => {
  const columns = createEmptyColumns();
  for (const order of orders) {
    columns[order.status].push(order);
  }
  return columns;
};

const extractOrders = (payload: unknown): ApiOrder[] => {
  if (Array.isArray(payload)) {
    return payload as ApiOrder[];
  }

  if (typeof payload !== "object" || payload === null) {
    return [];
  }

  const response = payload as {
    data?: unknown;
    orders?: unknown;
  };

  if (Array.isArray(response.orders)) {
    return response.orders as ApiOrder[];
  }

  if (response.data && typeof response.data === "object") {
    const data = response.data as {
      orders?: unknown;
      data?: unknown;
    };

    if (Array.isArray(data.orders)) {
      return data.orders as ApiOrder[];
    }

    if (Array.isArray(data.data)) {
      return data.data as ApiOrder[];
    }

    if (data.data && typeof data.data === "object") {
      const nested = data.data as { orders?: unknown };
      if (Array.isArray(nested.orders)) {
        return nested.orders as ApiOrder[];
      }
    }
  }

  return [];
};

const extractPaginationMeta = (payload: unknown) => {
  if (!payload || typeof payload !== "object") {
    return {};
  }

  const record = payload as {
    pagination?: {
      totalItems?: number;
      currentPage?: number;
      totalPages?: number;
      limit?: number;
    };
    data?: {
      pagination?: {
        totalItems?: number;
        currentPage?: number;
        totalPages?: number;
        limit?: number;
      };
    };
  };

  return record.pagination ?? record.data?.pagination ?? {};
};

const formatCurrency = (amount: number) => {
  return `${new Intl.NumberFormat("en-EG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)} EGP`;
};

const formatDate = (value: string, language: "en" | "ar") => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    return axiosError.response?.data?.message ?? fallback;
  }
  return fallback;
};

const getStatusTheme = (status: OrderStatus) => {
  switch (status) {
    case "Pending":
      return "border border-slate-400/20 bg-slate-500/15 text-slate-100";
    case "Confirmed":
      return "border border-cyan-400/25 bg-cyan-500/15 text-cyan-100";
    case "Out For Delivery":
      return "border border-amber-400/25 bg-amber-500/15 text-amber-100";
    case "Delivered":
      return "border border-violet-400/25 bg-violet-500/15 text-violet-100";
    case "Completed":
      return "border border-emerald-400/25 bg-emerald-500/15 text-emerald-100";
    case "Canceled":
      return "border border-rose-400/25 bg-rose-500/15 text-rose-100";
    default:
      return "border border-slate-400/20 bg-slate-500/15 text-slate-100";
  }
};

const updateOrderStatus = async (
  orderId: number,
  status: OrderStatus,
): Promise<{ deliveryDateAssigned: boolean }> => {
  const apiStatus = STATUS_TO_API[status];

  if (apiStatus === "CONFIRMED") {
    await api.put(`/orders/${orderId}/confirm`);
    return { deliveryDateAssigned: false };
  }

  if (apiStatus === "OUT_FOR_DELIVERY") {
    await api.put(`/orders/${orderId}/out-for-delivery`);
    const assignment = await assignOrderDeliveryDateForOutForDelivery(orderId);
    return { deliveryDateAssigned: assignment.success };
  }

  if (apiStatus === "DELIVERED") {
    await api.put(`/orders/${orderId}/delivered`);
    return { deliveryDateAssigned: false };
  }

  if (apiStatus === "COMPLETED") {
    await api.put(`/orders/${orderId}/complete`);
    return { deliveryDateAssigned: false };
  }

  if (apiStatus === "CANCELLED") {
    await api.put(`/orders/${orderId}/cancel`);
    return { deliveryDateAssigned: false };
  }

  await api.patch(`/orders/${orderId}/status`, {
    status: apiStatus,
  });
  return { deliveryDateAssigned: false };
};

export default function CrmPipelinePage() {
  const { language } = useLocalization();
  const [isMounted, setIsMounted] = useState(false);
  const [columns, setColumns] = useState<ColumnsState>(createEmptyColumns);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const text = useMemo(
    () => ({
      genericError:
        language === "ar" ? "حدث خطأ غير متوقع." : "Something went wrong.",
      loadOrdersFailed:
        language === "ar" ? "تعذر تحميل الطلبات." : "Failed to load orders.",
      updateStatusFailed:
        language === "ar" ? "تعذر تحديث حالة الطلب." : "Failed to update order status.",
      deliveryDateFailed:
        language === "ar"
          ? "تم نقل الطلب إلى خارج للتسليم، لكن فشل تعيين تاريخ التسليم."
          : "Order moved to Out For Delivery, but assigning delivery date failed.",
      title: language === "ar" ? "مسار إدارة العملاء" : "CRM Pipeline",
      subtitle:
        language === "ar"
          ? "اسحب الطلبات وأفلتها بين مراحل المسار."
          : "Drag and drop orders across pipeline stages.",
      pending: language === "ar" ? "قيد الانتظار" : "Pending",
      confirmed: language === "ar" ? "مؤكد" : "Confirmed",
      outForDelivery: language === "ar" ? "خارج للتسليم" : "Out For Delivery",
      delivered: language === "ar" ? "تم التسليم" : "Delivered",
      completed: language === "ar" ? "مكتمل" : "Completed",
      canceled: language === "ar" ? "ملغي" : "Canceled",
      order: language === "ar" ? "طلب" : "order",
      orders: language === "ar" ? "طلبات" : "orders",
      noOrdersInStage:
        language === "ar" ? "لا توجد طلبات في هذه المرحلة." : "No orders in this stage.",
      total: language === "ar" ? "الإجمالي" : "Total",
      payment: language === "ar" ? "الدفع" : "Payment",
      created: language === "ar" ? "تم الإنشاء" : "Created",
      view: language === "ar" ? "عرض" : "View",
    }),
    [language]
  );

  const getStatusLabel = useCallback(
    (status: OrderStatus) => {
      switch (status) {
        case "Pending":
          return text.pending;
        case "Confirmed":
          return text.confirmed;
        case "Out For Delivery":
          return text.outForDelivery;
        case "Delivered":
          return text.delivered;
        case "Completed":
          return text.completed;
        case "Canceled":
          return text.canceled;
        default:
          return status;
      }
    },
    [text]
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const list: ApiOrder[] = [];
      let page = 1;
      let totalPages = 1;

      do {
        const response = await api.get<ApiResponse<OrdersPayload>>(
          `/orders?page=${page}&limit=100`
        );
        list.push(...extractOrders(response.data));

        const pagination = extractPaginationMeta(response.data);
        const nextTotalPages = Number(
          pagination.totalPages ??
            Math.ceil(
              Number(pagination.totalItems ?? list.length) /
                Math.max(1, Number(pagination.limit ?? 100))
            )
        );
        totalPages =
          Number.isFinite(nextTotalPages) && nextTotalPages > 0
            ? nextTotalPages
            : page;
        page += 1;
      } while (page <= totalPages);

      const normalizedOrders = list
        .map(normalizeOrder)
        .filter((order): order is OrderCard => order !== null);

      setColumns(groupOrdersByStatus(normalizedOrders));
    } catch (err) {
      setError(getErrorMessage(err, text.loadOrdersFailed));
    } finally {
      setLoading(false);
    }
  }, [text.loadOrdersFailed]);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  const onDragEnd = useCallback(
    async (result: DropResult) => {
      const { source, destination } = result;

      if (!destination || isUpdating) {
        return;
      }

      const sourceStatus = source.droppableId as OrderStatus;
      const destinationStatus = destination.droppableId as OrderStatus;

      if (
        sourceStatus === destinationStatus &&
        source.index === destination.index
      ) {
        return;
      }

      const previousColumns = columns;
      const sourceList = [...previousColumns[sourceStatus]];
      const [movedOrder] = sourceList.splice(source.index, 1);

      if (!movedOrder) {
        return;
      }

      const destinationList =
        sourceStatus === destinationStatus
          ? sourceList
          : [...previousColumns[destinationStatus]];

      const movedWithNewStatus: OrderCard = {
        ...movedOrder,
        status: destinationStatus,
      };

      destinationList.splice(destination.index, 0, movedWithNewStatus);

      const nextColumns: ColumnsState = {
        ...previousColumns,
        [sourceStatus]: sourceList,
        [destinationStatus]: destinationList,
      };

      setColumns(nextColumns);
      setIsUpdating(true);
      setError("");

      try {
        const result = await updateOrderStatus(movedOrder.id, destinationStatus);
        if (
          destinationStatus === "Out For Delivery" &&
          !result.deliveryDateAssigned
        ) {
          setError(text.deliveryDateFailed);
        }
      } catch (err) {
        setColumns(previousColumns);
        setError(getErrorMessage(err, text.updateStatusFailed));
      } finally {
        setIsUpdating(false);
      }
    },
    [columns, isUpdating, text.deliveryDateFailed, text.updateStatusFailed]
  );

  const columnTotals = useMemo(() => {
    const totals = {} as Record<OrderStatus, number>;
    for (const status of STATUS_ORDER) {
      totals[status] = columns[status].reduce((sum, order) => sum + order.total, 0);
    }
    return totals;
  }, [columns]);

  if (!isMounted) {
    return (
      <AdminLayout requiredPermissions={["orders.view", "temp_orders.view"]}>
        <div className="flex min-h-[420px] items-center justify-center p-6">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-cyan-300" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout requiredPermissions={["orders.view", "temp_orders.view"]}>
      <div className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-6 shadow-[0_18px_40px_rgba(2,6,23,0.32)] backdrop-blur-xl">
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-50">{text.title}</h1>
          <p className="mt-1 text-sm text-slate-300">{text.subtitle}</p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-300/20 bg-rose-500/12 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="flex min-h-[420px] items-center justify-center pb-6">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-cyan-300" />
          </div>
        ) : (
          <DragDropContext onDragEnd={(result) => void onDragEnd(result)}>
            <div className="flex gap-6 overflow-x-auto pb-6">
              {STATUS_ORDER.map((status) => {
                const orders = columns[status] ?? [];
                const theme = getStatusTheme(status);
                const revenue = columnTotals[status] ?? 0;

                return (
                  <Droppable
                    key={status}
                    droppableId={status}
                    isDropDisabled={isUpdating}
                  >
                    {(dropProvided, dropSnapshot) => (
                      <section
                        ref={dropProvided.innerRef}
                        {...dropProvided.droppableProps}
                        className={`w-[350px] shrink-0 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-[0_18px_40px_rgba(2,6,23,0.32)] backdrop-blur-xl transition ${
                          dropSnapshot.isDraggingOver ? "ring-2 ring-cyan-300/40 bg-white/8" : ""
                        }`}
                      >
                        <div className="mb-4 flex items-start justify-between gap-3">
                          <div>
                            <h2 className="text-base font-semibold text-slate-50">
                              {getStatusLabel(status)}
                            </h2>
                            <p className="mt-1 text-xs text-slate-400">
                              {orders.length} {orders.length === 1 ? text.order : text.orders}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${theme}`}
                          >
                            {formatCurrency(revenue)}
                          </span>
                        </div>

                        <div className="space-y-3">
                          {orders.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-white/10 bg-white/4 px-3 py-6 text-center text-sm text-slate-400">
                              {text.noOrdersInStage}
                            </div>
                          ) : null}

                          {orders.map((order, index) => (
                            <Draggable
                              key={order.id}
                              draggableId={String(order.id)}
                              index={index}
                              isDragDisabled={isUpdating}
                            >
                              {(dragProvided, dragSnapshot) => (
                                <article
                                  ref={dragProvided.innerRef}
                                  {...dragProvided.draggableProps}
                                  {...dragProvided.dragHandleProps}
                                  className={`cursor-pointer rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(30,41,59,0.88))] p-4 shadow-[0_18px_36px_rgba(2,6,23,0.34)] transition hover:-translate-y-0.5 hover:bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(30,41,59,0.94))] ${
                                    dragSnapshot.isDragging ? "rotate-1 ring-2 ring-cyan-300/40 shadow-[0_22px_48px_rgba(2,6,23,0.42)]" : ""
                                  }`}
                                >
                                  <div className="mb-2 flex items-start justify-between gap-3">
                                    <p className="text-sm font-semibold text-slate-50">
                                      {`${text.order} #${order.id}`}
                                    </p>
                                    <span
                                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${theme}`}
                                    >
                                      {getStatusLabel(status)}
                                    </span>
                                  </div>

                                  <p className="text-sm font-medium text-slate-200">
                                    {order.customerName}
                                  </p>

                                  <div className="mt-3 space-y-1 text-xs text-slate-400">
                                    <p>{text.total}: {formatCurrency(order.total)}</p>
                                    <p>{text.payment}: {order.paymentMethod}</p>
                                    <p>{text.created}: {formatDate(order.createdAt, language)}</p>
                                  </div>

                                  <div className="mt-4">
                                    <Link
                                      href={`/admin/orders/${order.id}`}
                                      className="inline-flex rounded-xl border border-white/10 bg-white/8 px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:bg-white/12"
                                    >
                                      {text.view}
                                    </Link>
                                  </div>
                                </article>
                              )}
                            </Draggable>
                          ))}

                          {dropProvided.placeholder}
                        </div>
                      </section>
                    )}
                  </Droppable>
                );
              })}
            </div>
          </DragDropContext>
        )}
      </div>
    </AdminLayout>
  );
}
