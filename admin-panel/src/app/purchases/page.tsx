"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, FileSpreadsheet, Plus } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/layout/AdminLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import ConfirmDeleteModal from "@/components/purchases/ConfirmDeleteModal";
import PurchaseFilters, { type PurchaseFiltersValue } from "@/components/purchases/PurchaseFilters";
import PurchaseFormModal from "@/components/purchases/PurchaseFormModal";
import PurchasesModuleNav from "@/components/purchases/PurchasesModuleNav";
import PurchasesTable from "@/components/purchases/PurchasesTable";
import type { PurchaseFormValue, PurchaseRow } from "@/components/purchases/types";
import { purchasesApi } from "@/features/purchases/api/purchases.api";
import { useLocalization } from "@/modules/localization/LocalizationProvider";
import api from "@/services/api";

const PAGE_SIZE = 10;

type CatalogProduct = {
  id: number;
  name?: string | null;
  categoryId?: number | null;
  category?: { id?: number | null; name?: string | null } | null;
  variantId?: number | null;
  variant?:
    | {
        id?: number | null;
        sku?: string | null;
        name?: string | null;
        attributes?: {
          size?: string | null;
          color?: string | null;
          material?: string | null;
        } | null;
      }
    | null;
  variantAttributes?: {
    size?: string | null;
    color?: string | null;
    material?: string | null;
  } | null;
  status?: string | null;
  isActive?: boolean | null;
};

type CategoryOption = {
  id: number;
  name: string;
};

type VariantOption = {
  id: number;
  label?: string;
  sku?: string | null;
  name?: string | null;
  attributes?: {
    size?: string | null;
    color?: string | null;
    material?: string | null;
  } | null;
};

type ApiListResponse<T> = {
  success?: boolean;
  data?: T | { data?: T; items?: T; list?: T; products?: T };
  message?: string;
  pagination?: {
    totalItems?: number;
    currentPage?: number;
    totalPages?: number;
    limit?: number;
  };
};

const defaultFilters: PurchaseFiltersValue = {
  search: "",
  supplier: "ALL",
  status: "ALL",
  arrivalDate: "",
  sort: "arrival_desc",
};

const nextStatusMap: Record<PurchaseRow["status"], PurchaseRow["status"]> = {
  ORDERED: "IN_TRANSIT",
  IN_TRANSIT: "DELIVERED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
};

const toText = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const extractList = <T,>(payload: unknown): T[] => {
  if (Array.isArray(payload)) {
    return payload as T[];
  }
  if (!payload || typeof payload !== "object") {
    return [];
  }
  const record = payload as Record<string, unknown>;
  const candidates = [record.data, record.items, record.list, record.products, record.results, record.rows];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate as T[];
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

const formatVariantLabel = (variant?: VariantOption | CatalogProduct["variant"], fallback = "") => {
  const attributes =
    variant && typeof variant === "object" && "attributes" in variant ? variant.attributes : null;
  const color = toText(attributes?.color);
  const size = toText(attributes?.size);
  const material = toText(attributes?.material);
  const sku = toText(variant && typeof variant === "object" && "sku" in variant ? variant.sku : "");
  const name = toText(variant && typeof variant === "object" && "name" in variant ? variant.name : "");
  const parts = [color, size, material].filter(Boolean);
  if (parts.length > 0) {
    return parts.join(" / ");
  }
  return sku || name || fallback;
};

const formatProductLabel = (product: CatalogProduct) => {
  const name = toText(product.name) || `Product #${product.id}`;
  const variantLabel =
    formatVariantLabel(product.variant) ||
    formatVariantLabel(
      product.variantAttributes
        ? { id: product.variantId ?? 0, attributes: product.variantAttributes }
        : undefined
    );
  return variantLabel ? `${name} - ${variantLabel}` : name;
};

export default function PurchasesPage() {
  const { language } = useLocalization();
  const [rows, setRows] = useState<PurchaseRow[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [variants, setVariants] = useState<VariantOption[]>([]);
  const [draftFilters, setDraftFilters] = useState<PurchaseFiltersValue>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<PurchaseFiltersValue>(defaultFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedRow, setSelectedRow] = useState<PurchaseRow | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<PurchaseRow | null>(null);
  const [arrivalDateModalOpen, setArrivalDateModalOpen] = useState(false);
  const [rowForStatusUpdate, setRowForStatusUpdate] = useState<PurchaseRow | null>(null);
  const [arrivalDateInput, setArrivalDateInput] = useState("");
  const text =
    language === "ar"
      ? {
          title: "المشتريات",
          subtitle: "متابعة مشتريات الموردين ووصول مخزون المنتجات",
          addPurchase: "إضافة مشتريات",
          exportCsv: "تصدير CSV",
          exportExcel: "تصدير Excel",
          exportCsvQueued: "تمت جدولة تصدير CSV.",
          exportExcelQueued: "تمت جدولة تصدير Excel.",
          loadError: "فشل تحميل المشتريات.",
          retry: "إعادة المحاولة",
          emptyTitle: "لا توجد مشتريات",
          emptySubtitle: "جرّب تغيير عوامل التصفية أو أضف أمر شراء جديدًا.",
          purchaseCreated: "تم إنشاء أمر الشراء.",
          purchaseUpdated: "تم تحديث أمر الشراء.",
          purchaseCreateError: "فشل إنشاء أمر الشراء.",
          purchaseUpdateError: "فشل تحديث أمر الشراء.",
          productApproved: "تم اعتماد المنتج.",
          productApproveError: "فشل اعتماد المنتج.",
          purchaseDeleted: "تم حذف أمر الشراء.",
          purchaseDeleteError: "فشل حذف أمر الشراء.",
          purchaseStatusUpdated: "تم تحديث حالة الشراء.",
          purchaseStatusUpdateError: "فشل تحديث حالة الشراء.",
          previous: "السابق",
          next: "التالي",
          page: "الصفحة",
          of: "من",
          deleteTitle: "حذف أمر شراء",
          deleteDescription: "هل أنت متأكد أنك تريد حذف أمر الشراء هذا؟ لا يمكن التراجع عن هذا الإجراء.",
          arrivalModalTitle: "اختر تاريخ الوصول المتوقع",
          arrivalModalDescription: "حدّد تاريخ الوصول المتوقع قبل تغيير الحالة إلى قيد النقل.",
          selectArrivalError: "يرجى اختيار تاريخ الوصول المتوقع.",
          cancel: "إلغاء",
          confirm: "تأكيد",
          completeRequiredFields: "يرجى استكمال الحقول المطلوبة.",
        }
      : {
          title: "Purchases",
          subtitle: "Track supplier purchases and product stock arrivals",
          addPurchase: "Add Purchase",
          exportCsv: "Export CSV",
          exportExcel: "Export Excel",
          exportCsvQueued: "CSV export queued.",
          exportExcelQueued: "Excel export queued.",
          loadError: "Failed to load purchases.",
          retry: "Retry",
          emptyTitle: "No purchases found",
          emptySubtitle: "Try changing filters or add a new purchase order.",
          purchaseCreated: "Purchase created.",
          purchaseUpdated: "Purchase updated.",
          purchaseCreateError: "Failed to create purchase.",
          purchaseUpdateError: "Failed to update purchase.",
          productApproved: "Product approved.",
          productApproveError: "Failed to approve product.",
          purchaseDeleted: "Purchase deleted.",
          purchaseDeleteError: "Failed to delete purchase.",
          purchaseStatusUpdated: "Purchase status updated.",
          purchaseStatusUpdateError: "Failed to update purchase status.",
          previous: "Previous",
          next: "Next",
          page: "Page",
          of: "of",
          deleteTitle: "Delete Purchase",
          deleteDescription: "Are you sure you want to delete this purchase order? This action cannot be undone.",
          arrivalModalTitle: "Choose Expected Arrival Date",
          arrivalModalDescription: "Set expected arrival date before changing status to IN_TRANSIT.",
          selectArrivalError: "Please select expected arrival date.",
          cancel: "Cancel",
          confirm: "Confirm",
          completeRequiredFields: "Please complete required fields.",
        };

  const upsertPurchaseRow = (nextRow: PurchaseRow) => {
    setRows((current) => {
      let matched = false;

      const nextRows = current.map((row) => {
        const matchesById = Boolean(nextRow.id) && row.id === nextRow.id;
        const matchesByPurchaseId =
          Boolean(nextRow.purchaseId) && row.purchaseId === nextRow.purchaseId;

        if (!matchesById && !matchesByPurchaseId) {
          return row;
        }

        matched = true;
        return {
          ...row,
          ...nextRow,
          id: nextRow.id || row.id,
          purchaseId: nextRow.purchaseId || row.purchaseId,
          expectedArrivalDate: nextRow.expectedArrivalDate || row.expectedArrivalDate,
        };
      });

      return matched ? nextRows : current;
    });
  };

  const refreshPurchases = async () => {
    setIsError(false);
    try {
      const data = await purchasesApi.list();
      setRows(data);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refreshPurchases();
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchCatalog = async () => {
      setCatalogLoading(true);
      try {
        const productRows: CatalogProduct[] = [];
        let page = 1;
        let totalPages = 1;

        do {
          const productsResponse = await api.get<ApiListResponse<CatalogProduct[]>>(
            `/products?page=${page}&limit=100`
          );
          const payload = productsResponse.data?.data ?? productsResponse.data;
          productRows.push(...extractList<CatalogProduct>(payload));

          const pagination = extractPaginationMeta(productsResponse.data);
          const nextTotalPages = Number(
            pagination.totalPages ??
              Math.ceil(
                Number(pagination.totalItems ?? productRows.length) /
                  Math.max(1, Number(pagination.limit ?? 100))
              )
          );
          totalPages =
            Number.isFinite(nextTotalPages) && nextTotalPages > 0
              ? nextTotalPages
              : page;
          page += 1;
        } while (page <= totalPages);

        const [categoriesResponse, variantsResponse] = await Promise.all([
          api.get<ApiListResponse<CategoryOption[]>>("/categories"),
          api.get<ApiListResponse<VariantOption[]>>("/variants"),
        ]);

        if (!mounted) {
          return;
        }

        const activeProductRows = productRows.filter((product) => {
          if (typeof product.isActive === "boolean") {
            return product.isActive;
          }
          const status = toText(product.status).toLowerCase();
          return status ? status === "active" : true;
        });

        setProducts(activeProductRows);
        setCategories(extractList<CategoryOption>(categoriesResponse.data?.data ?? categoriesResponse.data));
        setVariants(extractList<VariantOption>(variantsResponse.data?.data ?? variantsResponse.data));
      } catch {
        if (!mounted) {
          return;
        }
        setProducts([]);
        setCategories([]);
        setVariants([]);
      } finally {
        if (mounted) {
          setCatalogLoading(false);
        }
      }
    };

    void fetchCatalog();
    return () => {
      mounted = false;
    };
  }, []);

  const existingProducts = useMemo(
    () =>
      products
        .map((product) => ({
          id: product.id,
          label: formatProductLabel(product),
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [products]
  );

  const variantOptions = useMemo(
    () =>
      variants
        .map((variant) => ({
          id: variant.id,
          label: formatVariantLabel(variant, `Variant #${variant.id}`),
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [variants]
  );

  const suppliers = useMemo(
    () => Array.from(new Set(rows.map((row) => row.supplierName))).sort(),
    [rows]
  );

  const filteredRows = useMemo(() => {
    const query = appliedFilters.search.trim().toLowerCase();
    const base = rows.filter((row) => {
      const matchesSearch =
        query.length === 0 ||
        row.productName.toLowerCase().includes(query) ||
        row.purchaseId.toLowerCase().includes(query);
      const matchesSupplier =
        appliedFilters.supplier === "ALL" || row.supplierName === appliedFilters.supplier;
      const matchesStatus =
        appliedFilters.status === "ALL" || row.status === appliedFilters.status;
      const matchesDate =
        appliedFilters.arrivalDate.length === 0 || row.expectedArrivalDate === appliedFilters.arrivalDate;
      return matchesSearch && matchesSupplier && matchesStatus && matchesDate;
    });

    return [...base].sort((a, b) => {
      if (appliedFilters.sort === "price_asc") {
        return a.totalCost - b.totalCost;
      }
      if (appliedFilters.sort === "price_desc") {
        return b.totalCost - a.totalCost;
      }
      if (appliedFilters.sort === "arrival_asc") {
        return a.expectedArrivalDate.localeCompare(b.expectedArrivalDate);
      }
      return b.expectedArrivalDate.localeCompare(a.expectedArrivalDate);
    });
  }, [rows, appliedFilters]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const buildMutationPayload = (payload: PurchaseFormValue, fallback?: PurchaseRow | null) => {
    const quantity = Number(payload.quantity || 0);
    const unitCost = Number(payload.unitCost || 0);
    const selectedProduct =
      payload.productMode === "existing"
        ? products.find((product) => String(product.id) === payload.existingProductId)
        : null;
    const selectedCategory =
      payload.productMode === "new"
        ? categories.find((category) => String(category.id) === payload.selectedCategoryId)
        : null;
    const selectedVariant =
      payload.productMode === "new"
        ? variants.find((variant) => String(variant.id) === payload.selectedVariantId)
        : null;

    const productName =
      payload.productMode === "existing"
        ? selectedProduct
          ? formatProductLabel(selectedProduct)
          : ""
        : [payload.productNameEn.trim(), payload.variant.trim()].filter(Boolean).join(" - ");

    return {
      quantity,
      unitCost,
      productName,
      mutation: {
        productId: selectedProduct?.id,
        productName,
        productNameEn:
          payload.productMode === "existing"
            ? selectedProduct?.name ?? productName
            : payload.productNameEn.trim(),
        productNameAr:
          payload.productMode === "existing" ? undefined : payload.productNameAr.trim() || undefined,
        categoryId:
          selectedProduct?.categoryId ??
          selectedProduct?.category?.id ??
          selectedCategory?.id ??
          undefined,
        categoryName:
          selectedProduct?.category?.name ??
          selectedCategory?.name ??
          payload.categoryEn.trim() ??
          fallback?.categoryName,
        categoryNameEn: payload.categoryEn.trim() || selectedCategory?.name || fallback?.categoryName,
        categoryNameAr: payload.categoryAr.trim() || undefined,
        variantId: selectedProduct?.variantId ?? selectedVariant?.id ?? undefined,
        variantName:
          formatVariantLabel(selectedProduct?.variant) ||
          formatVariantLabel(selectedVariant, payload.variant.trim()) ||
          fallback?.variantName,
        supplierName: payload.supplierNameEn.trim(),
        supplierNameEn: payload.supplierNameEn.trim(),
        supplierNameAr: payload.supplierNameAr.trim() || undefined,
        supplierContact: payload.supplierContact.trim() || undefined,
        supplierEmail: payload.supplierEmail.trim() || undefined,
        supplierPhone: payload.supplierPhone.trim() || undefined,
        quantity,
        unitCost,
        status: payload.status,
        expectedArrivalDate: payload.expectedArrivalDate || undefined,
        pendingApproval: fallback?.pendingApproval ?? false,
      },
    };
  };

  const handleSavePurchase = async (payload: PurchaseFormValue) => {
    const { quantity, unitCost, productName, mutation } = buildMutationPayload(payload, selectedRow);

    if (!productName || !mutation.supplierName || quantity <= 0 || unitCost <= 0) {
      toast.error(text.completeRequiredFields);
      return;
    }

    try {
      if (formMode === "create") {
        await purchasesApi.create(mutation);
        toast.success(text.purchaseCreated);
      } else if (selectedRow) {
        await purchasesApi.update(selectedRow.id, mutation);
        toast.success(text.purchaseUpdated);
      }
      await refreshPurchases();
      setFormOpen(false);
      setSelectedRow(null);
    } catch {
      toast.error(formMode === "create" ? text.purchaseCreateError : text.purchaseUpdateError);
    }
  };

  const handleApproveProduct = async (row: PurchaseRow) => {
    try {
        await purchasesApi.update(row.id, {
          productId: row.productId ?? undefined,
          productName: row.productName,
          productNameEn: row.productNameEn,
          productNameAr: row.productNameAr,
          categoryId: row.categoryId ?? undefined,
          categoryName: row.categoryName,
          categoryNameEn: row.categoryNameEn,
          categoryNameAr: row.categoryNameAr,
          variantId: row.variantId ?? undefined,
          variantName: row.variantName,
          supplierName: row.supplierName,
          supplierNameEn: row.supplierNameEn,
          supplierNameAr: row.supplierNameAr,
        supplierContact: row.supplierContact,
        supplierEmail: row.supplierEmail,
        supplierPhone: row.supplierPhone,
        quantity: row.quantity,
        unitCost: row.unitCost,
        status: row.status,
        expectedArrivalDate: row.expectedArrivalDate || undefined,
        pendingApproval: false,
      });
      await refreshPurchases();
      toast.success(text.productApproved);
    } catch {
      toast.error(text.productApproveError);
    }
  };

  return (
    <AdminLayout>
      <section className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{text.title}</h1>
              <p className="text-sm text-slate-500">{text.subtitle}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                onClick={() => {
                  setFormMode("create");
                  setSelectedRow(null);
                  setFormOpen(true);
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                {text.addPurchase}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="gap-2"
                onClick={() => toast.success(text.exportCsvQueued)}
              >
                <Download className="h-4 w-4" />
                {text.exportCsv}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="gap-2"
                onClick={() => toast.success(text.exportExcelQueued)}
              >
                <FileSpreadsheet className="h-4 w-4" />
                {text.exportExcel}
              </Button>
            </div>
          </div>
        </div>

        <PurchasesModuleNav />

        <PurchaseFilters
          value={draftFilters}
          suppliers={suppliers}
          onChange={setDraftFilters}
          onApply={() => {
            setAppliedFilters(draftFilters);
            setPage(1);
          }}
          onClear={() => {
            setDraftFilters(defaultFilters);
            setAppliedFilters(defaultFilters);
            setPage(1);
          }}
          disabled={isLoading}
        />

        {isLoading ? (
          <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="h-10 animate-pulse rounded bg-slate-200" />
            <div className="h-10 animate-pulse rounded bg-slate-200" />
            <div className="h-10 animate-pulse rounded bg-slate-200" />
          </div>
        ) : null}

        {isError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 shadow-sm">
            {text.loadError}
            <button
              type="button"
              onClick={() => {
                setIsLoading(true);
                void refreshPurchases();
              }}
              className="ml-2 font-semibold underline"
            >
              {text.retry}
            </button>
          </div>
        ) : null}

        {!isLoading && !isError && filteredRows.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">{text.emptyTitle}</h2>
            <p className="mt-1 text-sm text-slate-500">{text.emptySubtitle}</p>
            <div className="mt-4">
              <Button
                type="button"
                onClick={() => {
                  setFormMode("create");
                  setSelectedRow(null);
                  setFormOpen(true);
                }}
              >
                {text.addPurchase}
              </Button>
            </div>
          </div>
        ) : null}

        {!isLoading && !isError && filteredRows.length > 0 ? (
          <>
            <PurchasesTable
              rows={pagedRows}
              onEdit={(row) => {
                setSelectedRow(row);
                setFormMode("edit");
                setFormOpen(true);
              }}
              onDelete={(row) => {
                setRowToDelete(row);
                setDeleteOpen(true);
              }}
              onUpdateStatus={(row) => {
                if (row.status === "ORDERED") {
                  setRowForStatusUpdate(row);
                  setArrivalDateInput(new Date().toISOString().slice(0, 10));
                  setArrivalDateModalOpen(true);
                  return;
                }

                const nextStatus = nextStatusMap[row.status];
                void purchasesApi
                  .patchStatus(row.id, nextStatus)
                  .then((updatedRow) => {
                    upsertPurchaseRow(updatedRow);
                    toast.success(text.purchaseStatusUpdated);
                  })
                  .catch(() => {
                    toast.error(text.purchaseStatusUpdateError);
                  })
                  .finally(() => undefined);
              }}
              onApproveProduct={(row) => {
                void handleApproveProduct(row);
              }}
            />

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <Button
                type="button"
                variant="secondary"
                disabled={currentPage <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                {text.previous}
              </Button>
              <div className="text-sm text-slate-600">
                {text.page} <span className="font-semibold">{currentPage}</span> {text.of}{" "}
                <span className="font-semibold">{totalPages}</span>
              </div>
              <Button
                type="button"
                variant="secondary"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              >
                {text.next}
              </Button>
            </div>
          </>
        ) : null}
      </section>

      {formOpen ? (
        <PurchaseFormModal
          key={`${formMode}-${selectedRow?.id ?? "new"}`}
          open={formOpen}
          mode={formMode}
          initial={selectedRow}
          existingProducts={existingProducts}
          categories={categories}
          variants={variantOptions}
          catalogLoading={catalogLoading}
          onClose={() => setFormOpen(false)}
          onSubmit={(payload) => {
            void handleSavePurchase(payload);
          }}
        />
      ) : null}

      <ConfirmDeleteModal
        open={deleteOpen}
        title={text.deleteTitle}
        description={text.deleteDescription}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          if (!rowToDelete) {
            return;
          }
          void purchasesApi
            .remove(rowToDelete.id)
            .then(async () => {
              await refreshPurchases();
              setDeleteOpen(false);
              toast.success(text.purchaseDeleted);
            })
            .catch(() => {
              toast.error(text.purchaseDeleteError);
            })
            .finally(() => undefined);
        }}
      />

      <Modal
        title={text.arrivalModalTitle}
        isOpen={arrivalDateModalOpen}
        onClose={() => setArrivalDateModalOpen(false)}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">{text.arrivalModalDescription}</p>
          <Input
            type="date"
            value={arrivalDateInput}
            onChange={(event) => setArrivalDateInput(event.target.value)}
            onClick={(event) => event.currentTarget.showPicker?.()}
            className="cursor-pointer"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setArrivalDateModalOpen(false);
                setRowForStatusUpdate(null);
              }}
            >
              {text.cancel}
            </Button>
            <Button
              onClick={() => {
                if (!rowForStatusUpdate || !arrivalDateInput) {
                  toast.error(text.selectArrivalError);
                  return;
                }
                void purchasesApi
                  .patchStatus(rowForStatusUpdate.id, "IN_TRANSIT", arrivalDateInput)
                  .then((updatedRow) => {
                    upsertPurchaseRow(updatedRow);
                    setArrivalDateModalOpen(false);
                    setRowForStatusUpdate(null);
                    toast.success(text.purchaseStatusUpdated);
                  })
                  .catch(() => {
                    toast.error(text.purchaseStatusUpdateError);
                  })
                  .finally(() => undefined);
              }}
            >
              {text.confirm}
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
