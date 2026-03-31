"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AdminLayout from "@/components/layout/AdminLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { assignOrderDeliveryDateForOutForDelivery } from "@/lib/deliveryScheduling";
import { extractList } from "@/lib/extractList";
import { useLocalization } from "@/modules/localization/LocalizationProvider";
import api from "@/services/api";

type Order = {
  id: number;
  user?: {
    id?: number;
    name?: string | null;
    email?: string | null;
    fullName?: string | null;
    full_name?: string | null;
    username?: string | null;
  } | null;
  address?: {
    fullName?: string | null;
    full_name?: string | null;
    fullname?: string | null;
    name?: string | null;
    area?: string | null;
    city?: string | null;
    phone?: string | null;
  } | null;
  customer?: {
    name?: string | null;
    fullName?: string | null;
    full_name?: string | null;
  } | null;
  totalAmount?: number | string | null;
  totalPrice?: number | string | null;
  paymentType?: string | null;
  status: string;
  createdAt: string;
};

type ApiListResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    totalItems?: number;
    currentPage?: number;
    totalPages?: number;
    limit?: number;
  };
};

type OrdersResponse = {
  orders: Order[];
  pagination: {
    totalItems: number;
    currentPage: number;
    totalPages: number;
    limit: number;
  };
};

type Category = {
  id: number;
  name: string;
};

type TempOrder = {
  orderId: number | string;
  userName?: string | null;
  customerName?: string | null;
  fullName?: string | null;
  mobileNumber?: string | null;
  address?: string | null;
  totalAmount?: number | string | null;
  totalPrice?: number | string | null;
  paymentMethod?: string | null;
  status?: string | null;
  createdAt?: string | null;
};

type PosOrderRow = {
  id: string | number;
  tempOrderId?: string | number | null;
  customerName?: string | null;
  customerMobileNumber?: string | null;
  total?: number | string | null;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  status?: string | null;
  createdAt?: string | null;
};

const STATUS_OPTIONS = [
  "PENDING",
  "CONFIRMED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "COMPLETED",
] as const;

const TEMP_STATUS_FLOW = [
  "TEMP",
  "PENDING",
  "CONFIRMED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
] as const;
type TempStatus = (typeof TEMP_STATUS_FLOW)[number];

const TEMP_STATUS_DROPDOWN = TEMP_STATUS_FLOW.filter(
  (status) => status !== "TEMP" && status !== "PENDING"
) as Array<(typeof TEMP_STATUS_FLOW)[number]>;
const SECONDARY_TABLE_PAGE_SIZE = 10;

const formatCurrency = (value: number) =>
  `${new Intl.NumberFormat("en-EG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)} EGP`;

const formatDate = (value: string) => {
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

const toNumberValue = (value: unknown) => {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

const getErrorMessage = (error: unknown) => {
  if (typeof error === "object" && error !== null) {
    const anyError = error as { response?: { data?: { message?: string } } };
    return anyError.response?.data?.message ?? "Something went wrong.";
  }
  return "Something went wrong.";
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

const getAddressObject = (address: Order["address"]) => {
  if (!address) {
    return null;
  }
  if (typeof address === "string") {
    try {
      return JSON.parse(address) as Order["address"];
    } catch {
      return null;
    }
  }
  return address;
};

const getAddressValue = (order: Order, field: "phone" | "area") => {
  const address = getAddressObject(order.address);
  return address?.[field] ?? "-";
};

const getCustomerName = (order: Order) => {
  const address = getAddressObject(order.address);
  return (
    order.user?.name ||
    order.user?.fullName ||
    order.user?.full_name ||
    order.user?.username ||
    order.customer?.name ||
    order.customer?.fullName ||
    order.customer?.full_name ||
    address?.fullName ||
    address?.full_name ||
    address?.fullname ||
    address?.name ||
    "Unknown"
  );
};

const getTempOrderDisplayName = (order: TempOrder) =>
  order.customerName ??
  order.userName ??
  order.fullName ??
  "Unknown";

const getTempOrderAmount = (order: TempOrder) => {
  const value = toNumberValue(order.totalAmount ?? order.totalPrice);
  if (value === null) {
    return "-";
  }
  return formatCurrency(Number(value));
};

const getPosOrderCustomerName = (order: PosOrderRow) =>
  order.customerName ?? "Walk-in Customer";

const getPosOrderAmount = (order: PosOrderRow) => {
  const value = toNumberValue(order.total);
  if (value === null) {
    return "-";
  }
  return formatCurrency(Number(value));
};

type ParsedNumberList = {
  numbers: number[];
  invalidEntries: string[];
};

const parseCommaSeparatedNumbers = (value: string): ParsedNumberList => {
  const numbers: number[] = [];
  const invalidEntries: string[] = [];
  for (const segment of value.split(",")) {
    const trimmed = segment.trim();
    if (!trimmed) {
      continue;
    }
    const parsed = Number(trimmed);
    if (Number.isNaN(parsed)) {
      invalidEntries.push(trimmed);
      continue;
    }
    numbers.push(parsed);
  }
  return { numbers, invalidEntries };
};

const isValidPhoneNumber = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }
  const normalized = trimmed.replace(/[^\d+]/g, "");
  return /^\+?\d{7,15}$/.test(normalized);
};

const getProductIdFromRecord = (record: Record<string, unknown>) => {
  const candidates = [
    record.id,
    record.productId,
    record.product_id,
    record.itemId,
    record.item_id,
  ];
  for (const candidate of candidates) {
    if (candidate === undefined || candidate === null) {
      continue;
    }
    const parsed = Number(candidate);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return null;
};

const isRecordActive = (record: Record<string, unknown>) => {
  if (typeof record.isActive === "boolean") {
    return record.isActive;
  }
  if (typeof record.is_active === "boolean") {
    return record.is_active;
  }
  if (typeof record.active === "boolean") {
    return record.active;
  }
  const statusValue =
    (record.status as string | undefined) ??
    (record.state as string | undefined) ??
    (record.statusName as string | undefined);
  if (typeof statusValue === "string") {
    const normalized = statusValue.toLowerCase();
    if (["inactive", "disabled", "archived", "deleted", "blocked"].includes(normalized)) {
      return false;
    }
  }
  return true;
};

const normalizeTempStatus = (status?: string | null): TempStatus =>
  (((status ?? "TEMP").replace(/\s+/g, "_").toUpperCase() === "CANCELED"
    ? "CANCELLED"
    : (status ?? "TEMP").replace(/\s+/g, "_").toUpperCase()) as TempStatus);

const TEMP_STATUS_ENDPOINTS: Record<string, string> = {
  CONFIRMED: "confirm",
  OUT_FOR_DELIVERY: "out-for-delivery",
  DELIVERED: "delivered",
  COMPLETED: "complete",
  CANCELLED: "cancel",
};

const isTempStatusOptionDisabled = (
  currentStatus: string | null | undefined,
  targetStatus: string
) => {
  const normalizedCurrent = normalizeTempStatus(currentStatus);
  const normalizedTarget = normalizeTempStatus(targetStatus);
  if (normalizedCurrent === "CANCELLED") {
    return normalizedTarget !== "CANCELLED";
  }
  if (normalizedTarget === normalizedCurrent) {
    return false;
  }
  if (normalizedTarget === "TEMP" || normalizedTarget === "PENDING") {
    return true;
  }
  const currentIndex = TEMP_STATUS_FLOW.indexOf(normalizedCurrent);
  const targetIndex = TEMP_STATUS_FLOW.indexOf(normalizedTarget);
  if (currentIndex === -1 || targetIndex === -1) {
    return true;
  }
  if (targetIndex <= currentIndex) {
    return true;
  }
  return !(normalizedTarget in TEMP_STATUS_ENDPOINTS);
};

function AdminOrdersPageContent() {
  const { language } = useLocalization();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [error, setError] = useState("");
  const [rowLoading, setRowLoading] = useState<Record<number, boolean>>({});
  const [toastMessage, setToastMessage] = useState("");
  const [toastError, setToastError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [orderIdFilter, setOrderIdFilter] = useState("");
  const [customerNameFilter, setCustomerNameFilter] = useState("");
  const [isTempOrderModalOpen, setIsTempOrderModalOpen] = useState(false);
  const [tempUserName, setTempUserName] = useState("");
  const [tempMobileNumber, setTempMobileNumber] = useState("");
  const [tempItemIds, setTempItemIds] = useState("");
  const [tempItemsCount, setTempItemsCount] = useState("");
  const [tempAddress, setTempAddress] = useState("");
  const [tempFieldErrors, setTempFieldErrors] = useState<Record<string, string>>(
    {}
  );
  const [tempSubmitError, setTempSubmitError] = useState("");
  const [isTempOrderSubmitting, setIsTempOrderSubmitting] = useState(false);
  const [activeProductIds, setActiveProductIds] = useState<number[]>([]);
  const [isActiveProductsLoading, setIsActiveProductsLoading] = useState(false);
  const [activeProductsError, setActiveProductsError] = useState("");
  const [tempOrders, setTempOrders] = useState<TempOrder[]>([]);
  const [isTempOrdersLoading, setIsTempOrdersLoading] = useState(true);
  const [tempOrdersError, setTempOrdersError] = useState("");
  const [tempRowLoading, setTempRowLoading] = useState<Record<string, boolean>>(
    {}
  );
  const [tempOrdersPage, setTempOrdersPage] = useState(1);
  const [posOrders, setPosOrders] = useState<PosOrderRow[]>([]);
  const [isPosOrdersLoading, setIsPosOrdersLoading] = useState(true);
  const [posOrdersError, setPosOrdersError] = useState("");
  const [posOrdersPage, setPosOrdersPage] = useState(1);
  const onlineSectionRef = useRef<HTMLDivElement | null>(null);
  const tempSectionRef = useRef<HTMLDivElement | null>(null);
  const posSectionRef = useRef<HTMLDivElement | null>(null);
  const sectionParam = searchParams.get("section");
  const focusedOrderId = searchParams.get("orderId")?.trim() ?? "";
  const text =
    language === "ar"
      ? {
          title: "الطلبات",
          subtitle: "تابع وأدر طلبات العملاء.",
          createTempOrder: "إنشاء طلب مؤقت",
          status: "الحالة",
          category: "الفئة",
          all: "الكل",
          orderId: "رقم الطلب",
          customerName: "اسم العميل",
          customerNamePlaceholder: "اسم العميل",
          applyFilters: "تطبيق الفلاتر",
          clearFilters: "مسح الفلاتر",
          noOrdersFound: "لا توجد طلبات.",
          loading: "جارٍ التحميل...",
          showing: (from: number, to: number, total: number) => `عرض ${from}-${to} من ${total}`,
          mobile: "الهاتف",
          area: "المنطقة",
          totalAmount: "المبلغ الإجمالي",
          paymentMethod: "طريقة الدفع",
          currentStatus: "الحالة الحالية",
          createdAt: "تاريخ الإنشاء",
          view: "عرض",
          actions: "الإجراءات",
          previous: "السابق",
          next: "التالي",
          tempOrders: "الطلبات المؤقتة",
          tempOrdersSubtitle: "طلبات نقدية يدوية أنشأها المسؤولون.",
          refreshing: "جارٍ التحديث...",
          refresh: "تحديث",
          noTempOrders: "لا توجد طلبات مؤقتة بعد.",
          address: "العنوان",
          posOrders: "طلبات نقطة البيع",
          posOrdersSubtitle: "جميع الطلبات المنشأة من محطة نقطة البيع.",
          noPosOrders: "لا توجد طلبات نقطة بيع.",
          posOrderId: "رقم طلب نقطة البيع",
          tempOrderId: "رقم الطلب المؤقت",
          paymentStatus: "حالة الدفع",
          createTempOrderTitle: "إنشاء طلب مؤقت",
          customerNameInput: "اسم العميل",
          customerNameInputPlaceholder: "أدخل اسم العميل",
          mobileNumber: "رقم الهاتف",
          itemIds: "أرقام المنتجات مفصولة بفواصل",
          quantities: "الكميات مفصولة بفواصل",
          invalidIds: (values: string) => `معرّفات غير صالحة: ${values}`,
          invalidQuantities: (values: string) => `كميات غير صالحة: ${values}`,
          refreshingActiveProducts: "جارٍ تحديث قائمة المنتجات النشطة...",
          deliveryAddress: "عنوان التوصيل",
          paymentMethodLabel: "طريقة الدفع",
          cancel: "إلغاء",
          creating: "جارٍ الإنشاء...",
          cash: "نقدي",
          customerNameTooShort: "يجب أن لا يقل الاسم عن 3 أحرف.",
          invalidPhone: "أدخل رقم هاتف صالحًا.",
          addressRequired: "العنوان مطلوب.",
          itemIdsRequired: "أدخل رقم منتج واحد على الأقل.",
          itemIdsPositive: "يجب أن تكون أرقام المنتجات أعدادًا صحيحة موجبة.",
          quantitiesRequired: "أدخل الكميات لكل منتج.",
          quantitiesPositive: "يجب أن تكون الكميات أعدادًا صحيحة موجبة.",
          countsMismatchText: (a: number, b: number) => `يجب أن يتطابق عدد أرقام المنتجات (${a}) مع عدد الكميات (${b}).`,
        }
      : {
          title: "Orders",
          subtitle: "Track and manage customer orders.",
          createTempOrder: "Create Temp Order",
          status: "Status",
          category: "Category",
          all: "All",
          orderId: "Order ID",
          customerName: "Customer Name",
          customerNamePlaceholder: "Customer name",
          applyFilters: "Apply Filters",
          clearFilters: "Clear Filters",
          noOrdersFound: "No orders found.",
          loading: "Loading...",
          showing: (from: number, to: number, total: number) => `Showing ${from}-${to} of ${total}`,
          mobile: "Mobile",
          area: "Area",
          totalAmount: "Total Amount",
          paymentMethod: "Payment Method",
          currentStatus: "Current Status",
          createdAt: "Created At",
          view: "View",
          actions: "Actions",
          previous: "Previous",
          next: "Next",
          tempOrders: "Temp Orders",
          tempOrdersSubtitle: "Manual cash-only requests created by admins.",
          refreshing: "Refreshing...",
          refresh: "Refresh",
          noTempOrders: "No temporary orders yet.",
          address: "Address",
          posOrders: "POS Orders",
          posOrdersSubtitle: "All orders created from POS terminal.",
          noPosOrders: "No POS orders found.",
          posOrderId: "POS Order ID",
          tempOrderId: "Temp Order ID",
          paymentStatus: "Payment Status",
          createTempOrderTitle: "Create Temp Order",
          customerNameInput: "Customer Name",
          customerNameInputPlaceholder: "Enter customer name",
          mobileNumber: "Mobile Number",
          itemIds: "Item IDs (comma separated)",
          quantities: "Quantities (comma separated)",
          invalidIds: (values: string) => `Invalid ID(s): ${values}`,
          invalidQuantities: (values: string) => `Invalid quantity(ies): ${values}`,
          refreshingActiveProducts: "Refreshing active product list...",
          deliveryAddress: "Delivery address",
          paymentMethodLabel: "Payment method",
          cancel: "Cancel",
          creating: "Creating...",
          cash: "CASH",
          customerNameTooShort: "Name must be at least 3 characters long.",
          invalidPhone: "Enter a valid phone number.",
          addressRequired: "Address is required.",
          itemIdsRequired: "Provide at least one product ID.",
          itemIdsPositive: "Product IDs must be positive whole numbers.",
          quantitiesRequired: "Provide quantities for every product.",
          quantitiesPositive: "Quantities must be positive whole numbers.",
          countsMismatchText: (a: number, b: number) => `Product IDs (${a}) and quantities (${b}) counts must match.`,
        };

  const getStatusLabel = useCallback(
    (status?: string | null) => {
      const normalized = normalizeTempStatus(status ?? "");
      if (language === "ar") {
        switch (normalized) {
          case "TEMP":
            return "مؤقت";
          case "PENDING":
            return "قيد الانتظار";
          case "CONFIRMED":
            return "مؤكد";
          case "OUT_FOR_DELIVERY":
            return "خرج للتسليم";
          case "DELIVERED":
            return "تم التسليم";
          case "COMPLETED":
            return "مكتمل";
          case "CANCELLED":
            return "ملغي";
          default:
            return String(normalized).replace(/_/g, " ");
        }
      }

      switch (normalized) {
        case "OUT_FOR_DELIVERY":
          return "Out For Delivery";
        case "CANCELLED":
          return "Cancelled";
        default:
          return normalized.replace(/_/g, " ");
      }
    },
    [language]
  );

  useEffect(() => {
    fetchOrders(1, true);
    fetchCategories();
  }, []);

  const parsedItemIdData = useMemo(
    () => parseCommaSeparatedNumbers(tempItemIds),
    [tempItemIds]
  );
  const parsedItemsCountData = useMemo(
    () => parseCommaSeparatedNumbers(tempItemsCount),
    [tempItemsCount]
  );
  const itemIdsCount = parsedItemIdData.numbers.length;
  const itemsCountCount = parsedItemsCountData.numbers.length;
  const itemCountsMismatch =
    (itemIdsCount > 0 || itemsCountCount > 0) && itemIdsCount !== itemsCountCount;
  const activeProductIdSet = useMemo(
    () => new Set(activeProductIds),
    [activeProductIds]
  );
  const tempOrdersTotalPages = Math.max(
    1,
    Math.ceil(tempOrders.length / SECONDARY_TABLE_PAGE_SIZE)
  );
  const posOrdersTotalPages = Math.max(
    1,
    Math.ceil(posOrders.length / SECONDARY_TABLE_PAGE_SIZE)
  );
  const pagedTempOrders = useMemo(() => {
    const start = (tempOrdersPage - 1) * SECONDARY_TABLE_PAGE_SIZE;
    return tempOrders.slice(start, start + SECONDARY_TABLE_PAGE_SIZE);
  }, [tempOrders, tempOrdersPage]);
  const pagedPosOrders = useMemo(() => {
    const start = (posOrdersPage - 1) * SECONDARY_TABLE_PAGE_SIZE;
    return posOrders.slice(start, start + SECONDARY_TABLE_PAGE_SIZE);
  }, [posOrders, posOrdersPage]);

  useEffect(() => {
    if (tempOrdersPage > tempOrdersTotalPages) {
      setTempOrdersPage(tempOrdersTotalPages);
    }
  }, [tempOrdersPage, tempOrdersTotalPages]);

  useEffect(() => {
    if (posOrdersPage > posOrdersTotalPages) {
      setPosOrdersPage(posOrdersTotalPages);
    }
  }, [posOrdersPage, posOrdersTotalPages]);

  useEffect(() => {
    if (sectionParam === "online") {
      onlineSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (sectionParam === "pos" && !isPosOrdersLoading) {
      posSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (sectionParam !== "temp" || isTempOrdersLoading) {
      return;
    }

    if (focusedOrderId) {
      const targetIndex = tempOrders.findIndex(
        (order) => String(order.orderId).trim() === focusedOrderId,
      );
      if (targetIndex >= 0) {
        const targetPage = Math.floor(targetIndex / SECONDARY_TABLE_PAGE_SIZE) + 1;
        if (targetPage !== tempOrdersPage) {
          setTempOrdersPage(targetPage);
          return;
        }
      }
    }

    tempSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [
    focusedOrderId,
    isPosOrdersLoading,
    isTempOrdersLoading,
    posOrders,
    sectionParam,
    tempOrders,
    tempOrdersPage,
  ]);

  const fetchOrders = async (page: number, initial = false) => {
    if (initial) {
      setIsLoading(true);
    } else {
      setIsPageLoading(true);
    }
    setError("");
    try {
      const params = new URLSearchParams();
      const safePage = Math.max(1, page);
      params.set("page", String(safePage));
      params.set("limit", String(limit));
      if (statusFilter !== "ALL") {
        params.set("status", statusFilter);
      }
      if (categoryFilter) {
        params.set("categoryId", categoryFilter);
      }
      if (orderIdFilter.trim()) {
        params.set("orderId", orderIdFilter.trim());
      }
      if (customerNameFilter.trim()) {
        params.set("customerName", customerNameFilter.trim());
      }
      const response = await api.get<ApiListResponse<OrdersResponse>>(
        `/orders?${params.toString()}`
      );
      const payload = response.data?.data;
      setOrders(extractList<Order>(payload));
      setCurrentPage(payload?.pagination?.currentPage ?? safePage);
      setTotalPages(payload?.pagination?.totalPages ?? 1);
      setTotalItems(payload?.pagination?.totalItems ?? 0);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
      setIsPageLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get<ApiListResponse<Category[]>>(
        "/categories"
      );
      setCategories(extractList<Category>(response.data?.data ?? response.data));
    } catch {
      setCategories([]);
    }
  };

  const loadActiveProducts = useCallback(async () => {
    setIsActiveProductsLoading(true);
    setActiveProductsError("");
    try {
      const records: unknown[] = [];
      let page = 1;
      let totalPages = 1;

      do {
        const response = await api.get<ApiListResponse<unknown>>(
          `/products?page=${page}&limit=100`
        );
        const payload = response.data?.data ?? response.data ?? {};
        records.push(...extractList<unknown>(payload));

        const pagination = extractPaginationMeta(response.data);
        const nextTotalPages = Number(
          pagination.totalPages ??
            Math.ceil(
              Number(pagination.totalItems ?? records.length) /
                Math.max(1, Number(pagination.limit ?? 100))
            )
        );
        totalPages =
          Number.isFinite(nextTotalPages) && nextTotalPages > 0
            ? nextTotalPages
            : page;
        page += 1;
      } while (page <= totalPages);

      const activeIds = records.reduce<number[]>((acc, entry) => {
        if (typeof entry !== "object" || entry === null) {
          return acc;
        }
        const recordEntry = entry as Record<string, unknown>;
        if (!isRecordActive(recordEntry)) {
          return acc;
        }
        const id = getProductIdFromRecord(recordEntry);
        if (id === null) {
          return acc;
        }
        acc.push(id);
        return acc;
      }, []);
      setActiveProductIds(Array.from(new Set(activeIds)));
    } catch {
      setActiveProductIds([]);
      setActiveProductsError("Could not load active products.");
    } finally {
      setIsActiveProductsLoading(false);
    }
  }, []);

  const fetchTempOrders = useCallback(async () => {
    setIsTempOrdersLoading(true);
    setTempOrdersError("");
    try {
      const rows: TempOrder[] = [];
      let page = 1;
      let totalPages = 1;

      do {
        const response = await api.get<ApiListResponse<unknown>>(
          `/admin/temp-orders?page=${page}&limit=100`
        );
        const payload = response.data?.data ?? response.data ?? {};
        const record = payload as Record<string, unknown>;
        rows.push(
          ...extractList<TempOrder>(payload).length > 0
            ? extractList<TempOrder>(payload)
            : Array.isArray(record.tempOrders)
              ? (record.tempOrders as TempOrder[])
              : []
        );

        const pagination =
          (record.pagination as Record<string, unknown> | undefined) ??
          response.data?.pagination ??
          {};
        const nextTotalPages = Number(
          pagination.totalPages ??
            Math.ceil(
              Number(pagination.totalItems ?? 0) /
                Math.max(1, Number(pagination.limit ?? 100))
            ) ??
            1
        );
        totalPages = Number.isFinite(nextTotalPages) && nextTotalPages > 0 ? nextTotalPages : 1;
        page += 1;
      } while (page <= totalPages);

      setTempOrders(rows);
      setTempOrdersPage(1);
    } catch (err) {
      setTempOrders([]);
      setTempOrdersError(getErrorMessage(err));
    } finally {
      setIsTempOrdersLoading(false);
    }
  }, []);

  const fetchPosOrders = useCallback(async () => {
    setIsPosOrdersLoading(true);
    setPosOrdersError("");
    try {
      const rows: PosOrderRow[] = [];
      let page = 1;
      let totalPages = 1;

      do {
        const response = await api.get<ApiListResponse<unknown>>(`/api/pos/orders?page=${page}&limit=10`);
        const payload = response.data?.data ?? response.data ?? {};
        const record = payload as Record<string, unknown>;
        rows.push(
          ...extractList<PosOrderRow>(payload).length > 0
            ? extractList<PosOrderRow>(payload)
            : Array.isArray(record.posOrders)
              ? (record.posOrders as PosOrderRow[])
              : []
        );

        const pagination =
          (record.pagination as Record<string, unknown> | undefined) ??
          response.data?.pagination ??
          {};
        const nextTotalPages = Number(
          pagination.totalPages ??
            Math.ceil(
              Number(pagination.totalItems ?? 0) /
                Math.max(1, Number(pagination.limit ?? 10))
            ) ??
            1
        );
        totalPages = Number.isFinite(nextTotalPages) && nextTotalPages > 0 ? nextTotalPages : 1;
        page += 1;
      } while (page <= totalPages);

      setPosOrders(rows);
      setPosOrdersPage(1);
    } catch (error) {
      setPosOrders([]);
      setPosOrdersError(getErrorMessage(error));
    }
    finally {
      setIsPosOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActiveProducts();
  }, [loadActiveProducts]);

  useEffect(() => {
    fetchTempOrders();
  }, [fetchTempOrders]);

  useEffect(() => {
    fetchPosOrders();
  }, [fetchPosOrders]);

  const resetTempOrderForm = () => {
    setTempUserName("");
    setTempMobileNumber("");
    setTempItemIds("");
    setTempItemsCount("");
    setTempAddress("");
    setTempFieldErrors({});
    setTempSubmitError("");
  };

  const handleOpenTempOrderModal = () => {
    resetTempOrderForm();
    loadActiveProducts();
    setIsTempOrderModalOpen(true);
  };

  const handleCloseTempOrderModal = () => {
    setIsTempOrderModalOpen(false);
    resetTempOrderForm();
  };

  const handleCreateTempOrder = async () => {
    setTempFieldErrors({});
    setTempSubmitError("");
    const validationErrors: Record<string, string> = {};
    const trimmedName = tempUserName.trim();
    if (trimmedName.length < 3) {
      validationErrors.userName = text.customerNameTooShort;
    }
    if (!isValidPhoneNumber(tempMobileNumber)) {
      validationErrors.mobileNumber = text.invalidPhone;
    }
    if (!tempAddress.trim()) {
      validationErrors.address = text.addressRequired;
    }
    if (itemIdsCount === 0) {
      validationErrors.itemIds = text.itemIdsRequired;
    } else if (parsedItemIdData.invalidEntries.length > 0) {
      validationErrors.itemIds = `Invalid ID(s): ${parsedItemIdData.invalidEntries.join(
        ", "
      )}`;
    } else if (
      !parsedItemIdData.numbers.every(
        (value) => Number.isInteger(value) && value > 0
      )
    ) {
      validationErrors.itemIds = text.itemIdsPositive;
    }
    if (itemsCountCount === 0) {
      validationErrors.itemsCount = text.quantitiesRequired;
    } else if (parsedItemsCountData.invalidEntries.length > 0) {
      validationErrors.itemsCount = `Invalid quantity(ies): ${parsedItemsCountData.invalidEntries.join(
        ", "
      )}`;
    } else if (
      !parsedItemsCountData.numbers.every(
        (value) => Number.isInteger(value) && value > 0
      )
    ) {
      validationErrors.itemsCount = text.quantitiesPositive;
    }
    if (itemCountsMismatch) {
      validationErrors.itemsCount =
        "Number of product IDs must match the number of quantities.";
    }
    if (activeProductIdSet.size > 0 && parsedItemIdData.numbers.length > 0) {
      const missing = parsedItemIdData.numbers.filter(
        (id) => !activeProductIdSet.has(id)
      );
      if (missing.length > 0) {
        validationErrors.itemIds = `Product ID${
          missing.length > 1 ? "s" : ""
        } not found or inactive: ${missing.join(", ")}`;
      }
    }
    if (Object.keys(validationErrors).length > 0) {
      setTempFieldErrors(validationErrors);
      return;
    }

    setIsTempOrderSubmitting(true);
    try {
      const payload = {
        userName: trimmedName,
        mobileNumber: tempMobileNumber.trim(),
        itemIds: parsedItemIdData.numbers,
        itemsCount: parsedItemsCountData.numbers,
        address: tempAddress.trim(),
        paymentMethod: "CASH",
      };
      const response = await api.post("/admin/temp-orders", payload);
      const responseData =
        response.data?.data ?? response.data ?? ({} as Record<string, unknown>);
      const createdOrderId = (responseData as Record<string, unknown>).orderId ??
        (responseData as Record<string, unknown>).id ??
        null;
      setToastError("");
      setToastMessage(
        typeof createdOrderId === "number"
          ? `Temp order #${createdOrderId} created.`
          : "Temporary order created."
      );
      setIsTempOrderModalOpen(false);
      resetTempOrderForm();
      await fetchOrders(currentPage);
      await fetchTempOrders();
    } catch (err) {
      const axiosError = err as { response?: { status?: number } };
      const message =
        axiosError.response?.status === 401
          ? "Unauthorized access. Please log in as an admin."
          : getErrorMessage(err);
      setTempSubmitError(message);
      setToastError(message);
    } finally {
      setIsTempOrderSubmitting(false);
    }
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    fetchOrders(1);
  };

  const handleClearFilters = () => {
    setStatusFilter("ALL");
    setCategoryFilter("");
    setOrderIdFilter("");
    setCustomerNameFilter("");
    setCurrentPage(1);
    fetchOrders(1);
  };

  useEffect(() => {
    if (!toastMessage && !toastError) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setToastMessage("");
      setToastError("");
    }, 5000);
    return () => window.clearTimeout(timeout);
  }, [toastMessage, toastError]);

  const handleStatusChange = async (order: Order, nextStatus: string) => {
    if (order.status === nextStatus) {
      return;
    }
    const previousStatus = order.status;
    setOrders((prev) =>
      prev.map((item) =>
        item.id === order.id ? { ...item, status: nextStatus } : item
      )
    );
    setRowLoading((prev) => ({ ...prev, [order.id]: true }));
    setToastMessage("");
    setToastError("");
    try {
      if (nextStatus === "CONFIRMED") {
        await api.put(`/orders/${order.id}/confirm`);
      } else if (nextStatus === "OUT_FOR_DELIVERY") {
        await api.put(`/orders/${order.id}/out-for-delivery`);
        const assignment = await assignOrderDeliveryDateForOutForDelivery(order.id);
        if (!assignment.success) {
          setToastError(
            "Order moved to Out For Delivery, but assigning delivery date failed.",
          );
        } else {
          setToastMessage("Order status updated and delivery date assigned.");
        }
        } else if (nextStatus === "DELIVERED") {
          await api.put(`/orders/${order.id}/delivered`);
        } else if (nextStatus === "COMPLETED") {
          await api.put(`/orders/${order.id}/complete`);
        } else if (nextStatus === "CANCELLED") {
          await api.put(`/orders/${order.id}/cancel`);
        } else {
          await api.patch(`/orders/${order.id}/status`, { status: nextStatus });
        }
      if (nextStatus !== "OUT_FOR_DELIVERY") {
        setToastMessage("Order status updated.");
      }
      await fetchOrders(currentPage);
    } catch (err) {
      setOrders((prev) =>
        prev.map((item) =>
          item.id === order.id ? { ...item, status: previousStatus } : item
        )
      );
      setToastError(getErrorMessage(err));
    } finally {
      setRowLoading((prev) => ({ ...prev, [order.id]: false }));
    }
  };

  const handleTempOrderStatusChange = async (
    order: TempOrder,
    nextStatus: string
  ) => {
    const normalizedNext = normalizeTempStatus(nextStatus);
    const normalizedCurrent = normalizeTempStatus(order.status);
    if (normalizedNext === normalizedCurrent) {
      return;
    }
    const endpoint = TEMP_STATUS_ENDPOINTS[normalizedNext];
    if (!endpoint) {
      return;
    }
    const previousStatus = order.status ?? normalizedCurrent;
    const orderKey = String(order.orderId);
    setTempOrders((prev) =>
      prev.map((item) =>
        String(item.orderId) === orderKey ? { ...item, status: nextStatus } : item
      )
    );
    setTempRowLoading((prev) => ({ ...prev, [orderKey]: true }));
    setToastMessage("");
    setToastError("");
    try {
      await api.put(`/admin/temp-orders/${order.orderId}/${endpoint}`);
      setToastMessage("Temporary order status updated.");
      await fetchTempOrders();
    } catch (err) {
      setTempOrders((prev) =>
        prev.map((item) =>
          String(item.orderId) === orderKey
            ? { ...item, status: previousStatus }
            : item
        )
      );
      setToastError(getErrorMessage(err));
    } finally {
      setTempRowLoading((prev) => ({ ...prev, [orderKey]: false }));
    }
  };

  return (
    <AdminLayout requiredPermissions={["orders.view"]}>
      <div className="space-y-6">
        {toastMessage ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
            {toastMessage}
          </div>
        ) : null}
        {toastError ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
            {toastError}
          </div>
        ) : null}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{text.title}</h1>
            <p className="text-sm text-slate-500">
              {text.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleOpenTempOrderModal}>{text.createTempOrder}</Button>
          </div>
        </div>

        <div
          ref={onlineSectionRef}
          id="online-orders-section"
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">{text.status}</label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value="ALL">{text.all}</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {getStatusLabel(status)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {text.category}
              </label>
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value="">{text.all}</option>
                {categories.map((category) => (
                  <option key={category.id} value={String(category.id)}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {text.orderId}
              </label>
              <input
                type="number"
                value={orderIdFilter}
                onChange={(event) => setOrderIdFilter(event.target.value)}
                placeholder={text.orderId}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {text.customerName}
              </label>
              <input
                value={customerNameFilter}
                onChange={(event) => setCustomerNameFilter(event.target.value)}
                placeholder={text.customerNamePlaceholder}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleApplyFilters}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              {text.applyFilters}
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              {text.clearFilters}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-8 w-full animate-pulse rounded bg-slate-200" />
              <div className="h-8 w-full animate-pulse rounded bg-slate-200" />
              <div className="h-8 w-full animate-pulse rounded bg-slate-200" />
            </div>
          ) : error ? (
            <p className="text-sm text-rose-600">{error}</p>
          ) : orders.length === 0 ? (
            <p className="text-sm text-slate-500">{text.noOrdersFound}</p>
          ) : (
            <div className="overflow-x-auto">
              {isPageLoading ? (
                <div className="mb-3 text-xs text-slate-500">{text.loading}</div>
              ) : null}
              {totalItems > 0 ? (
                <div className="mb-3 text-xs text-slate-500">
                  {text.showing(
                    (currentPage - 1) * limit + 1,
                    Math.min(currentPage * limit, totalItems),
                    totalItems
                  )}
                </div>
              ) : null}
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="py-2 pr-4 font-medium">{text.orderId}</th>
                    <th className="py-2 pr-4 font-medium">{text.customerName}</th>
                    <th className="py-2 pr-4 font-medium">{text.mobile}</th>
                    <th className="py-2 pr-4 font-medium">{text.area}</th>
                    <th className="py-2 pr-4 font-medium">{text.totalAmount}</th>
                    <th className="py-2 pr-4 font-medium">{text.paymentMethod}</th>
                    <th className="py-2 pr-4 font-medium">{text.currentStatus}</th>
                    <th className="py-2 pr-4 font-medium">{text.createdAt}</th>
                    <th className="py-2 pr-4 font-medium">{text.view}</th>
                    <th className="py-2 font-medium">{text.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {orders.map((order) => {
                    const orderPath = `/admin/orders/${order.id}`;
                    return (
                      <tr key={order.id} className="text-slate-700">
                        <td className="py-3 pr-4">
                          <Link
                            href={orderPath}
                            className="text-slate-900 hover:underline"
                          >
                            {order.id}
                          </Link>
                        </td>
                        <td className="py-3 pr-4">
                          <Link
                            href={orderPath}
                            className="text-slate-900 hover:underline"
                          >
                            {getCustomerName(order)}
                          </Link>
                        </td>
                        <td className="py-3 pr-4">
                          {getAddressValue(order, "phone")}
                        </td>
                        <td className="py-3 pr-4">
                          {getAddressValue(order, "area")}
                        </td>
                        <td className="py-3 pr-4">
                          {toNumberValue(
                            order.totalAmount ?? order.totalPrice
                          ) !== null
                            ? formatCurrency(
                                Number(order.totalAmount ?? order.totalPrice)
                              )
                            : "-"}
                        </td>
                        <td className="py-3 pr-4">
                          {order.paymentType ?? "-"}
                        </td>
                        <td className="py-3 pr-4">
                          {getStatusLabel(order.status)}
                        </td>
                        <td className="py-3 pr-4">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="py-3 pr-4">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
                          >
                            {text.view}
                          </Link>
                        </td>
                        <td className="py-3">
                          <select
                            value={order.status}
                            onChange={(event) =>
                              handleStatusChange(order, event.target.value)
                            }
                            disabled={rowLoading[order.id]}
                            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                          >
                            {STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>
                                {getStatusLabel(status)}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {totalPages > 1 ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => fetchOrders(currentPage - 1)}
              disabled={currentPage === 1 || isPageLoading}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {text.previous}
            </button>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                (page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => fetchOrders(page)}
                    disabled={isPageLoading}
                    className={`rounded-md px-3 py-2 text-sm transition ${
                      page === currentPage
                        ? "bg-slate-900 text-white"
                        : "border border-slate-300 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
            </div>
            <button
              type="button"
              onClick={() => fetchOrders(currentPage + 1)}
              disabled={currentPage === totalPages || isPageLoading}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {text.next}
            </button>
          </div>
        ) : null}
      </div>

      <div
        ref={tempSectionRef}
        id="temp-orders-section"
        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{text.tempOrders}</h2>
            <p className="text-sm text-slate-500">
              {text.tempOrdersSubtitle}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={fetchTempOrders}
              disabled={isTempOrdersLoading}
            >
              {isTempOrdersLoading ? text.refreshing : text.refresh}
            </Button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          {isTempOrdersLoading ? (
            <div className="space-y-3">
              <div className="h-8 w-full animate-pulse rounded bg-slate-200" />
              <div className="h-8 w-full animate-pulse rounded bg-slate-200" />
            </div>
          ) : tempOrdersError ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {tempOrdersError}
            </p>
          ) : tempOrders.length === 0 ? (
            <p className="text-sm text-slate-500">
              {text.noTempOrders}
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="py-2 pr-4 font-medium">{text.orderId}</th>
                  <th className="py-2 pr-4 font-medium">{text.customerName}</th>
                  <th className="py-2 pr-4 font-medium">{text.mobile}</th>
                  <th className="py-2 pr-4 font-medium">{text.address}</th>
                  <th className="py-2 pr-4 font-medium">{text.totalAmount}</th>
                  <th className="py-2 pr-4 font-medium">{text.paymentMethod}</th>
                  <th className="py-2 pr-4 font-medium">{text.status}</th>
                  <th className="py-2 pr-4 font-medium">{text.createdAt}</th>
                  <th className="py-2 font-medium">{text.view}</th>
                  <th className="py-2 font-medium">{text.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {pagedTempOrders.map((order) => (
                  <tr
                    key={String(order.orderId) + order.createdAt}
                    className={
                      focusedOrderId && String(order.orderId).trim() === focusedOrderId
                        ? "bg-amber-50"
                        : undefined
                    }
                  >
                    <td className="py-3 pr-4">{order.orderId ?? "-"}</td>
                    <td className="py-3 pr-4">
                      {getTempOrderDisplayName(order)}
                    </td>
                    <td className="py-3 pr-4">
                      {order.mobileNumber ?? "-"}
                    </td>
                    <td className="py-3 pr-4">{order.address ?? "-"}</td>
                    <td className="py-3 pr-4">
                      {getTempOrderAmount(order)}
                    </td>
                    <td className="py-3 pr-4">
                      {order.paymentMethod ?? text.cash}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-900">
                        {getStatusLabel(order.status ?? "TEMP")}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      {order.createdAt ? formatDate(order.createdAt) : "-"}
                    </td>
                    <td className="py-3 pr-4">
                      <button
                        type="button"
                        className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                      >
                        {text.view}
                      </button>
                    </td>
                    <td className="py-3 pr-4">
                      <select
                        value={normalizeTempStatus(order.status)}
                        onChange={(event) =>
                          handleTempOrderStatusChange(order, event.target.value)
                        }
                        disabled={
                          tempRowLoading[String(order.orderId)] ||
                          isTempOrdersLoading
                        }
                        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                      >
                        {TEMP_STATUS_DROPDOWN.map((status) => (
                          <option
                            key={status}
                            value={status}
                            disabled={isTempStatusOptionDisabled(
                              order.status,
                              status
                            )}
                          >
                            {getStatusLabel(status)}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {!isTempOrdersLoading && !tempOrdersError && tempOrders.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setTempOrdersPage((prev) => Math.max(1, prev - 1))}
              disabled={tempOrdersPage === 1}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {text.previous}
            </button>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: tempOrdersTotalPages }, (_, index) => index + 1).map(
                (page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setTempOrdersPage(page)}
                    className={`rounded-md px-3 py-2 text-sm transition ${
                      page === tempOrdersPage
                        ? "bg-slate-900 text-white"
                        : "border border-slate-300 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
            </div>
            <button
              type="button"
              onClick={() =>
                setTempOrdersPage((prev) => Math.min(tempOrdersTotalPages, prev + 1))
              }
              disabled={tempOrdersPage === tempOrdersTotalPages}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {text.next}
            </button>
          </div>
        ) : null}
      </div>

      <div
        ref={posSectionRef}
        id="pos-orders-section"
        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{text.posOrders}</h2>
            <p className="text-sm text-slate-500">
              {text.posOrdersSubtitle}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={fetchPosOrders}
              disabled={isPosOrdersLoading}
            >
              {isPosOrdersLoading ? text.refreshing : text.refresh}
            </Button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          {isPosOrdersLoading ? (
            <div className="space-y-3">
              <div className="h-8 w-full animate-pulse rounded bg-slate-200" />
              <div className="h-8 w-full animate-pulse rounded bg-slate-200" />
            </div>
          ) : posOrdersError ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {posOrdersError}
            </p>
          ) : posOrders.length === 0 ? (
            <p className="text-sm text-slate-500">{text.noPosOrders}</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="py-2 pr-4 font-medium">{text.posOrderId}</th>
                  <th className="py-2 pr-4 font-medium">{text.tempOrderId}</th>
                  <th className="py-2 pr-4 font-medium">{text.customerName}</th>
                  <th className="py-2 pr-4 font-medium">{text.mobile}</th>
                  <th className="py-2 pr-4 font-medium">{text.totalAmount}</th>
                  <th className="py-2 pr-4 font-medium">{text.paymentMethod}</th>
                  <th className="py-2 pr-4 font-medium">{text.paymentStatus}</th>
                  <th className="py-2 pr-4 font-medium">{text.currentStatus}</th>
                  <th className="py-2 pr-4 font-medium">{text.createdAt}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {pagedPosOrders.map((order, index) => (
                  <tr key={`${order.id}-${order.createdAt ?? index}`}>
                    <td className="py-3 pr-4">
                      <Link
                        href={`/admin/pos/orders/${order.id}`}
                        className="text-slate-900 hover:underline"
                      >
                        {order.id ?? "-"}
                      </Link>
                    </td>
                    <td className="py-3 pr-4">{order.tempOrderId ?? "-"}</td>
                    <td className="py-3 pr-4">{getPosOrderCustomerName(order)}</td>
                    <td className="py-3 pr-4">{order.customerMobileNumber ?? "-"}</td>
                    <td className="py-3 pr-4">{getPosOrderAmount(order)}</td>
                    <td className="py-3 pr-4">{order.paymentMethod ?? "-"}</td>
                    <td className="py-3 pr-4">{order.paymentStatus ?? "-"}</td>
                    <td className="py-3 pr-4">{order.status ?? "-"}</td>
                    <td className="py-3 pr-4">
                      {order.createdAt ? formatDate(order.createdAt) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {!isPosOrdersLoading && !posOrdersError && posOrders.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setPosOrdersPage((prev) => Math.max(1, prev - 1))}
              disabled={posOrdersPage === 1}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {text.previous}
            </button>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: posOrdersTotalPages }, (_, index) => index + 1).map(
                (page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setPosOrdersPage(page)}
                    className={`rounded-md px-3 py-2 text-sm transition ${
                      page === posOrdersPage
                        ? "bg-slate-900 text-white"
                        : "border border-slate-300 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
            </div>
            <button
              type="button"
              onClick={() =>
                setPosOrdersPage((prev) => Math.min(posOrdersTotalPages, prev + 1))
              }
              disabled={posOrdersPage === posOrdersTotalPages}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {text.next}
            </button>
          </div>
        ) : null}
      </div>

      <Modal
        title={text.createTempOrderTitle}
        isOpen={isTempOrderModalOpen}
        onClose={handleCloseTempOrderModal}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              {text.customerNameInput}
            </label>
            <Input
              value={tempUserName}
              onChange={(event) => setTempUserName(event.target.value)}
              placeholder={text.customerNameInputPlaceholder}
            />
            {tempFieldErrors.userName ? (
              <p className="text-xs text-rose-600">{tempFieldErrors.userName}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              {text.mobileNumber}
            </label>
            <Input
              type="tel"
              value={tempMobileNumber}
              onChange={(event) => setTempMobileNumber(event.target.value)}
              placeholder="+20 10 0000 0000"
            />
            {tempFieldErrors.mobileNumber ? (
              <p className="text-xs text-rose-600">
                {tempFieldErrors.mobileNumber}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              {text.itemIds}
            </label>
            <Input
              value={tempItemIds}
              onChange={(event) => setTempItemIds(event.target.value)}
              placeholder="1,4,7"
            />
            {tempFieldErrors.itemIds ? (
              <p className="text-xs text-rose-600">{tempFieldErrors.itemIds}</p>
            ) : parsedItemIdData.invalidEntries.length > 0 ? (
              <p className="text-xs text-rose-600">
                {text.invalidIds(parsedItemIdData.invalidEntries.join(", "))}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              {text.quantities}
            </label>
            <Input
              value={tempItemsCount}
              onChange={(event) => setTempItemsCount(event.target.value)}
              placeholder="5,2,3"
            />
            {tempFieldErrors.itemsCount ? (
              <p className="text-xs text-rose-600">
                {tempFieldErrors.itemsCount}
              </p>
            ) : parsedItemsCountData.invalidEntries.length > 0 ? (
              <p className="text-xs text-rose-600">
                {text.invalidQuantities(parsedItemsCountData.invalidEntries.join(", "))}
              </p>
            ) : null}
            {!tempFieldErrors.itemsCount && itemCountsMismatch ? (
              <p className="text-xs text-rose-600">
                {text.countsMismatchText(itemIdsCount, itemsCountCount)}
              </p>
            ) : null}
          </div>
          {isActiveProductsLoading ? (
            <p className="text-xs text-slate-500">
              {text.refreshingActiveProducts}
            </p>
          ) : activeProductsError ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {activeProductsError}
            </p>
          ) : null}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              {text.address}
            </label>
            <textarea
              value={tempAddress}
              onChange={(event) => setTempAddress(event.target.value)}
              rows={3}
              placeholder={text.deliveryAddress}
              className="min-h-[96px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
            {tempFieldErrors.address ? (
              <p className="text-xs text-rose-600">{tempFieldErrors.address}</p>
            ) : null}
          </div>
          <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <span>{text.paymentMethodLabel}</span>
            <span className="font-semibold text-slate-900">{text.cash}</span>
          </div>
          {tempSubmitError ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {tempSubmitError}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={handleCloseTempOrderModal}
              disabled={isTempOrderSubmitting}
            >
              {text.cancel}
            </Button>
            <Button
              onClick={handleCreateTempOrder}
              disabled={isTempOrderSubmitting || itemCountsMismatch}
            >
              {isTempOrderSubmitting ? text.creating : text.createTempOrder}
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={null}>
      <AdminOrdersPageContent />
    </Suspense>
  );
}
