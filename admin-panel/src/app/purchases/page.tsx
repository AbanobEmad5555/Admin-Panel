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
        const [productsResponse, categoriesResponse, variantsResponse] = await Promise.all([
          api.get<ApiListResponse<CatalogProduct[]>>("/products?page=1&limit=1000"),
          api.get<ApiListResponse<CategoryOption[]>>("/categories"),
          api.get<ApiListResponse<VariantOption[]>>("/variants"),
        ]);

        if (!mounted) {
          return;
        }

        const productRows = extractList<CatalogProduct>(
          productsResponse.data?.data ?? productsResponse.data
        ).filter((product) => {
          if (typeof product.isActive === "boolean") {
            return product.isActive;
          }
          const status = toText(product.status).toLowerCase();
          return status ? status === "active" : true;
        });

        setProducts(productRows);
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
        : [payload.productName.trim(), payload.variant.trim()].filter(Boolean).join(" - ");

    return {
      quantity,
      unitCost,
      productName,
      mutation: {
        productId: selectedProduct?.id,
        productName,
        categoryId:
          selectedProduct?.categoryId ??
          selectedProduct?.category?.id ??
          selectedCategory?.id ??
          undefined,
        categoryName:
          selectedProduct?.category?.name ??
          selectedCategory?.name ??
          payload.category.trim() ??
          fallback?.categoryName,
        variantId: selectedProduct?.variantId ?? selectedVariant?.id ?? undefined,
        variantName:
          formatVariantLabel(selectedProduct?.variant) ||
          formatVariantLabel(selectedVariant, payload.variant.trim()) ||
          fallback?.variantName,
        supplierName: payload.supplierName.trim(),
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
      toast.error("Please complete required fields.");
      return;
    }

    try {
      if (formMode === "create") {
        await purchasesApi.create(mutation);
        toast.success("Purchase created.");
      } else if (selectedRow) {
        await purchasesApi.update(selectedRow.id, mutation);
        toast.success("Purchase updated.");
      }
      await refreshPurchases();
      setFormOpen(false);
      setSelectedRow(null);
    } catch {
      toast.error(formMode === "create" ? "Failed to create purchase." : "Failed to update purchase.");
    }
  };

  const handleApproveProduct = async (row: PurchaseRow) => {
    try {
      await purchasesApi.update(row.id, {
        productId: row.productId ?? undefined,
        productName: row.productName,
        categoryId: row.categoryId ?? undefined,
        categoryName: row.categoryName,
        variantId: row.variantId ?? undefined,
        variantName: row.variantName,
        supplierName: row.supplierName,
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
      toast.success("Product approved.");
    } catch {
      toast.error("Failed to approve product.");
    }
  };

  return (
    <AdminLayout>
      <section className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Purchases</h1>
              <p className="text-sm text-slate-500">Track supplier purchases and product stock arrivals</p>
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
                Add Purchase
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="gap-2"
                onClick={() => toast.success("CSV export queued.")}
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="gap-2"
                onClick={() => toast.success("Excel export queued.")}
              >
                <FileSpreadsheet className="h-4 w-4" />
                Export Excel
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
            Failed to load purchases.
            <button
              type="button"
              onClick={() => {
                setIsLoading(true);
                void refreshPurchases();
              }}
              className="ml-2 font-semibold underline"
            >
              Retry
            </button>
          </div>
        ) : null}

        {!isLoading && !isError && filteredRows.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">No purchases found</h2>
            <p className="mt-1 text-sm text-slate-500">Try changing filters or add a new purchase order.</p>
            <div className="mt-4">
              <Button
                type="button"
                onClick={() => {
                  setFormMode("create");
                  setSelectedRow(null);
                  setFormOpen(true);
                }}
              >
                Add Purchase
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
                  .then(async () => {
                    await refreshPurchases();
                    toast.success("Purchase status updated.");
                  })
                  .catch(() => {
                    toast.error("Failed to update purchase status.");
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
                Previous
              </Button>
              <div className="text-sm text-slate-600">
                Page <span className="font-semibold">{currentPage}</span> of{" "}
                <span className="font-semibold">{totalPages}</span>
              </div>
              <Button
                type="button"
                variant="secondary"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              >
                Next
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
        title="Delete Purchase"
        description="Are you sure you want to delete this purchase order? This action cannot be undone."
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
              toast.success("Purchase deleted.");
            })
            .catch(() => {
              toast.error("Failed to delete purchase.");
            })
            .finally(() => undefined);
        }}
      />

      <Modal
        title="Choose Expected Arrival Date"
        isOpen={arrivalDateModalOpen}
        onClose={() => setArrivalDateModalOpen(false)}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Set expected arrival date before changing status to IN_TRANSIT.
          </p>
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
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!rowForStatusUpdate || !arrivalDateInput) {
                  toast.error("Please select expected arrival date.");
                  return;
                }
                void purchasesApi
                  .patchStatus(rowForStatusUpdate.id, "IN_TRANSIT", arrivalDateInput)
                  .then(async () => {
                    await refreshPurchases();
                    setArrivalDateModalOpen(false);
                    setRowForStatusUpdate(null);
                    toast.success("Status updated to IN_TRANSIT.");
                  })
                  .catch(() => {
                    toast.error("Failed to update purchase status.");
                  })
                  .finally(() => undefined);
              }}
            >
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
