"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import Button from "@/components/ui/Button";
import api from "@/services/api";
import { useCreateInvoiceFromOrder } from "@/app/admin/invoices/hooks/useCreateInvoiceFromOrder";
import {
  createInvoiceFromOrderSchema,
  type CreateInvoiceFromOrderSchema,
} from "@/app/admin/invoices/schemas/createInvoice.schema";
import type { InvoiceSource } from "@/app/admin/invoices/services/invoice.types";

type ErrorPayload = {
  message?: string;
  data?: { id?: string; invoiceId?: string };
};

type OrderOption = {
  id: string;
  label: string;
};

const toStringSafe = (value: unknown) => {
  if (value === null || value === undefined) return "";
  return String(value);
};

const parseAddress = (value: unknown): Record<string, unknown> | null => {
  if (!value) return null;
  if (typeof value === "object") return value as Record<string, unknown>;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object") {
        return parsed as Record<string, unknown>;
      }
      return null;
    } catch {
      return null;
    }
  }
  return null;
};

const getCustomerName = (row: Record<string, unknown>) => {
  const customer = (row.customer ?? {}) as Record<string, unknown>;
  const user = (row.user ?? {}) as Record<string, unknown>;
  const address = parseAddress(row.address ?? row.shippingAddress);
  return (
    toStringSafe(row.userName) ||
    toStringSafe(row.user_name) ||
    toStringSafe(row.username) ||
    toStringSafe(row.customerName) ||
    toStringSafe(row.customer_name) ||
    toStringSafe(row.fullName) ||
    toStringSafe(row.full_name) ||
    toStringSafe(user.name) ||
    toStringSafe(user.fullName) ||
    toStringSafe(user.full_name) ||
    toStringSafe(user.userName) ||
    toStringSafe(user.user_name) ||
    toStringSafe(user.username) ||
    toStringSafe(customer.name) ||
    toStringSafe(customer.fullName) ||
    toStringSafe(customer.full_name) ||
    toStringSafe(address?.fullName) ||
    toStringSafe(address?.full_name) ||
    toStringSafe(address?.fullname) ||
    toStringSafe(address?.name) ||
    toStringSafe(row.customerName) ||
    "Customer"
  );
};

const normalizeOrderOptions = (orderType: InvoiceSource, payload: unknown): OrderOption[] => {
  const record = (payload ?? {}) as Record<string, unknown>;
  const raw =
    (Array.isArray(payload) ? payload : null) ??
    (Array.isArray(record.orders) ? record.orders : null) ??
    (Array.isArray(record.tempOrders) ? record.tempOrders : null) ??
    (Array.isArray(record.posOrders) ? record.posOrders : null) ??
    (Array.isArray(record.items) ? record.items : null) ??
    (Array.isArray(record.data) ? record.data : null) ??
    [];

  return raw
    .map((entry) => {
      const row = (entry ?? {}) as Record<string, unknown>;
      const id = toStringSafe(row.id ?? row.orderId ?? row.uuid);
      if (!id) return null;
      const customerName = getCustomerName(row);
      return {
        id,
        label: `${id} - ${customerName}`,
      } satisfies OrderOption;
    })
    .filter((entry): entry is OrderOption => Boolean(entry));
};

const loadOrderOptions = async (orderType: InvoiceSource): Promise<OrderOption[]> => {
  if (orderType === "ORDER") {
    const endpoints = [
      "/orders?page=1&limit=1000",
      "/admin/orders?page=1&limit=1000",
    ];
    let lastError: unknown = null;

    for (const endpoint of endpoints) {
      try {
        const response = await api.get(endpoint);
        const payload = response.data?.data ?? response.data ?? {};
        return normalizeOrderOptions(orderType, payload);
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError ?? new Error("Failed to load orders.");
  }

  if (orderType === "TEMP_ORDER") {
    const response = await api.get("/admin/temp-orders");
    const payload = response.data?.data ?? response.data ?? {};
    return normalizeOrderOptions(orderType, payload);
  }

  const endpoints = ["/api/pos/order?page=1&limit=1000", "/api/pos/orders?page=1&limit=1000", "/admin/pos/orders?page=1&limit=1000"];
  let lastError: unknown = null;
  for (const endpoint of endpoints) {
    try {
      const response = await api.get(endpoint);
      const payload = response.data?.data ?? response.data ?? {};
      return normalizeOrderOptions(orderType, payload);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error("Failed to load POS orders.");
};

export default function CreateInvoiceFromOrderPage() {
  const router = useRouter();
  const createMutation = useCreateInvoiceFromOrder();
  const [isOrderDropdownOpen, setIsOrderDropdownOpen] = useState(false);
  const orderDropdownRef = useRef<HTMLDivElement | null>(null);

  const form = useForm<CreateInvoiceFromOrderSchema>({
    resolver: zodResolver(createInvoiceFromOrderSchema),
    defaultValues: {
      orderType: "ORDER",
      orderId: "",
      mode: "DRAFT",
      sendEmail: false,
      forceNew: false,
    },
  });

  const orderType = useWatch({ control: form.control, name: "orderType" });
  const orderIdInput = useWatch({ control: form.control, name: "orderId" });

  const selectedOrderType: InvoiceSource = orderType ?? "ORDER";
  const {
    data: orderOptions = [],
    isLoading: isOptionsLoading,
    error: optionsError,
  } = useQuery({
    queryKey: ["invoice-create-order-options", selectedOrderType],
    queryFn: () => loadOrderOptions(selectedOrderType),
  });

  const filteredOptions = useMemo(() => {
    const needle = (orderIdInput ?? "").trim().toLowerCase();
    if (!needle) return orderOptions;
    return orderOptions.filter((option) => option.label.toLowerCase().includes(needle));
  }, [orderIdInput, orderOptions]);

  useEffect(() => {
    form.setValue("orderId", "");
  }, [form, selectedOrderType]);

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      if (!orderDropdownRef.current) return;
      if (!orderDropdownRef.current.contains(event.target as Node)) {
        setIsOrderDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const result = await createMutation.mutateAsync(values);
      toast.success(
        result.existed
          ? "Invoice already existed. Redirecting to details."
          : "Invoice created successfully.",
      );
      router.push(`/admin/invoices/${result.id}`);
    } catch (error) {
      const axiosError = error as AxiosError<ErrorPayload>;
      const status = axiosError.response?.status;
      const message = axiosError.response?.data?.message ?? "Failed to create invoice.";

      if (status === 409) {
        const existingId =
          axiosError.response?.data?.data?.id ?? axiosError.response?.data?.data?.invoiceId;
        toast.error(message);
        if (existingId) {
          router.push(`/admin/invoices/${existingId}`);
        }
        return;
      }

      if (status === 422) {
        toast.error(message);
        return;
      }

      toast.error(message);
    }
  });

  return (
    <AdminLayout title="Create Invoice From Order">
      <section className="mx-auto max-w-3xl space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">Create Invoice From Order</h1>
          <p className="mt-1 text-sm text-slate-500">
            Generate invoice from ORDER, TEMP_ORDER, or POS_ORDER.
          </p>
        </div>

        <form
          onSubmit={(event) => void onSubmit(event)}
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-slate-600">Order Type</label>
              <select
                {...form.register("orderType")}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="ORDER">ORDER</option>
                <option value="TEMP_ORDER">TEMP_ORDER</option>
                <option value="POS_ORDER">POS_ORDER</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Mode</label>
              <select
                {...form.register("mode")}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="DRAFT">DRAFT</option>
                <option value="POSTED">POSTED</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">Order ID</label>
            <div ref={orderDropdownRef} className="relative mt-1">
              <input
                type="text"
                {...form.register("orderId")}
                onFocus={() => setIsOrderDropdownOpen(true)}
                onChange={(event) => {
                  form.setValue("orderId", event.target.value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  setIsOrderDropdownOpen(true);
                }}
                placeholder={isOptionsLoading ? "Loading order IDs..." : "Search and select order id"}
                className="w-full rounded border border-slate-300 px-3 py-2 pr-9 text-sm"
              />
              <button
                type="button"
                onClick={() => setIsOrderDropdownOpen((prev) => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500"
                aria-label="Toggle order list"
              >
                <ChevronDown className="h-4 w-4" />
              </button>

              {isOrderDropdownOpen ? (
                <div className="absolute z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg">
                  {filteredOptions.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-slate-500">No matching orders.</div>
                  ) : (
                    filteredOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => {
                          form.setValue("orderId", option.id, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                          setIsOrderDropdownOpen(false);
                        }}
                        className="block w-full border-b border-slate-100 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                      >
                        {option.label}
                      </button>
                    ))
                  )}
                </div>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {isOptionsLoading
                ? "Loading IDs..."
                : `${filteredOptions.length} order ID(s) available for ${selectedOrderType}.`}
            </p>
            {optionsError ? (
              <p className="mt-1 text-xs text-rose-600">
                {(optionsError as { response?: { data?: { message?: string } } })?.response?.data?.message ??
                  "Failed to load order IDs for selected type."}
              </p>
            ) : null}
            {form.formState.errors.orderId ? (
              <p className="mt-1 text-xs text-rose-600">{form.formState.errors.orderId.message}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-2 text-sm text-slate-700">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" {...form.register("sendEmail")} />
              Send email after creation
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" {...form.register("forceNew")} />
              Force new invoice
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
            <Link href="/admin/invoices">
              <Button type="button" variant="secondary">Cancel</Button>
            </Link>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Invoice"}
            </Button>
          </div>
        </form>
      </section>
    </AdminLayout>
  );
}
