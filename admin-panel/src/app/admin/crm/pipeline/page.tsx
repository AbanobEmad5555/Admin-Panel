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

const formatCurrency = (amount: number) => {
  return `${new Intl.NumberFormat("en-EG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)} EGP`;
};

const formatDate = (value: string) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getErrorMessage = (error: unknown) => {
  if (typeof error === "object" && error !== null) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    return axiosError.response?.data?.message ?? "Something went wrong.";
  }
  return "Something went wrong.";
};

const getStatusTheme = (status: OrderStatus) => {
  switch (status) {
    case "Pending":
      return "bg-slate-100 text-slate-700";
    case "Confirmed":
      return "bg-blue-100 text-blue-700";
    case "Out For Delivery":
      return "bg-orange-100 text-orange-700";
    case "Delivered":
      return "bg-purple-100 text-purple-700";
    case "Completed":
      return "bg-emerald-100 text-emerald-700";
    case "Canceled":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

const updateOrderStatus = async (orderId: number, status: OrderStatus) => {
  const apiStatus = STATUS_TO_API[status];

  if (apiStatus === "CONFIRMED") {
    await api.put(`/orders/${orderId}/confirm`);
    return;
  }

  if (apiStatus === "OUT_FOR_DELIVERY") {
    await api.put(`/orders/${orderId}/out-for-delivery`);
    return;
  }

  if (apiStatus === "DELIVERED") {
    await api.put(`/orders/${orderId}/delivered`);
    return;
  }

  if (apiStatus === "COMPLETED") {
    await api.put(`/orders/${orderId}/complete`);
    return;
  }

  await api.patch(`/orders/${orderId}/status`, {
    status: apiStatus,
  });
};

export default function CrmPipelinePage() {
  const [isMounted, setIsMounted] = useState(false);
  const [columns, setColumns] = useState<ColumnsState>(createEmptyColumns);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const candidates = [
        "/orders?page=1&limit=1000",
        "/orders?page=1&limit=200",
        "/orders?page=1",
        "/orders",
      ];

      let list: ApiOrder[] = [];
      let lastError: unknown = null;

      for (const endpoint of candidates) {
        try {
          const response = await api.get<ApiResponse<OrdersPayload>>(endpoint);
          list = extractOrders(response.data);
          lastError = null;
          break;
        } catch (err) {
          lastError = err;
        }
      }

      if (lastError) {
        throw lastError;
      }

      const normalizedOrders = list
        .map(normalizeOrder)
        .filter((order): order is OrderCard => order !== null);

      setColumns(groupOrdersByStatus(normalizedOrders));
    } catch (err) {
      setError(getErrorMessage(err) || "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, []);

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
        await updateOrderStatus(movedOrder.id, destinationStatus);
      } catch (err) {
        setColumns(previousColumns);
        setError(getErrorMessage(err) || "Failed to update order status.");
      } finally {
        setIsUpdating(false);
      }
    },
    [columns, isUpdating]
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
      <AdminLayout>
        <div className="flex min-h-[420px] items-center justify-center p-6">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-600" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="px-6 pt-2">
          <h1 className="text-3xl font-bold text-slate-900">CRM Pipeline</h1>
          <p className="mt-1 text-sm text-slate-500">
            Drag and drop orders across pipeline stages.
          </p>
        </div>

        {error ? (
          <div className="mx-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="flex min-h-[420px] items-center justify-center px-6 pb-6">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-600" />
          </div>
        ) : (
          <DragDropContext onDragEnd={(result) => void onDragEnd(result)}>
            <div className="flex gap-6 overflow-x-auto p-6">
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
                        className={`w-[350px] shrink-0 rounded-xl bg-gray-50 p-4 shadow-sm transition ${
                          dropSnapshot.isDraggingOver ? "ring-2 ring-slate-300" : ""
                        }`}
                      >
                        <div className="mb-4 flex items-start justify-between gap-3">
                          <div>
                            <h2 className="text-base font-semibold text-slate-900">{status}</h2>
                            <p className="mt-1 text-xs text-slate-500">
                              {orders.length} order{orders.length === 1 ? "" : "s"}
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
                            <div className="rounded-lg border border-dashed border-slate-300 bg-white/70 px-3 py-6 text-center text-sm text-slate-500">
                              No orders in this stage.
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
                                  className={`cursor-pointer rounded-lg bg-white p-4 shadow transition hover:shadow-md ${
                                    dragSnapshot.isDragging ? "rotate-1 shadow-lg" : ""
                                  }`}
                                >
                                  <div className="mb-2 flex items-start justify-between gap-3">
                                    <p className="text-sm font-semibold text-slate-900">
                                      Order #{order.id}
                                    </p>
                                    <span
                                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${theme}`}
                                    >
                                      {status}
                                    </span>
                                  </div>

                                  <p className="text-sm font-medium text-slate-700">
                                    {order.customerName}
                                  </p>

                                  <div className="mt-3 space-y-1 text-xs text-slate-500">
                                    <p>Total: {formatCurrency(order.total)}</p>
                                    <p>Payment: {order.paymentMethod}</p>
                                    <p>Created: {formatDate(order.createdAt)}</p>
                                  </div>

                                  <div className="mt-4">
                                    <Link
                                      href={`/admin/orders/${order.id}`}
                                      className="inline-flex rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                                    >
                                      View
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
