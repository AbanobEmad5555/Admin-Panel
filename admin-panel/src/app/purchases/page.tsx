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
import { loadPurchaseRows, savePurchaseRows } from "@/components/purchases/storage";
import type { PurchaseFormValue, PurchaseRow } from "@/components/purchases/types";

const PAGE_SIZE = 10;

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

export default function PurchasesPage() {
  const [rows, setRows] = useState<PurchaseRow[]>([]);
  const [draftFilters, setDraftFilters] = useState<PurchaseFiltersValue>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<PurchaseFiltersValue>(defaultFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedRow, setSelectedRow] = useState<PurchaseRow | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<PurchaseRow | null>(null);
  const [arrivalDateModalOpen, setArrivalDateModalOpen] = useState(false);
  const [rowForStatusUpdate, setRowForStatusUpdate] = useState<PurchaseRow | null>(null);
  const [arrivalDateInput, setArrivalDateInput] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setRows(loadPurchaseRows());
      setIsLoading(false);
      setIsHydrated(true);
    }, 700);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    savePurchaseRows(rows);
  }, [rows, isHydrated]);

  const suppliers = useMemo(
    () => Array.from(new Set(rows.map((row) => row.supplier))).sort(),
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
        appliedFilters.supplier === "ALL" || row.supplier === appliedFilters.supplier;
      const matchesStatus =
        appliedFilters.status === "ALL" || row.status === appliedFilters.status;
      const matchesDate =
        appliedFilters.arrivalDate.length === 0 || row.expectedArrival === appliedFilters.arrivalDate;
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
        return a.expectedArrival.localeCompare(b.expectedArrival);
      }
      return b.expectedArrival.localeCompare(a.expectedArrival);
    });
  }, [rows, appliedFilters]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSavePurchase = (payload: PurchaseFormValue) => {
    const quantity = Number(payload.quantity || 0);
    const unitCost = Number(payload.unitCost || 0);
    const productName = payload.productMode === "existing" ? payload.existingProductId : payload.productName;

    if (!productName || !payload.supplierName || quantity <= 0 || unitCost <= 0) {
      toast.error("Please complete required fields.");
      return;
    }

    if (formMode === "create") {
      const nextId = `${Date.now()}`;
      const purchaseId = `PO-${String(rows.length + 10240).padStart(5, "0")}`;
      const next: PurchaseRow = {
        id: nextId,
        productName,
        purchaseId,
        supplier: payload.supplierName,
        quantity,
        unitCost,
        totalCost: quantity * unitCost,
        expectedArrival:
          payload.status === "IN_TRANSIT"
            ? payload.expectedArrivalDate || new Date().toISOString().slice(0, 10)
            : "",
        delivered: payload.status === "DELIVERED",
        status: payload.status,
      };
      setRows((prev) => [next, ...prev]);
      toast.success("Purchase created.");
    } else if (selectedRow) {
      setRows((prev) =>
        prev.map((row) =>
          row.id === selectedRow.id
            ? {
                ...row,
                productName,
                supplier: payload.supplierName,
                quantity,
                unitCost,
                totalCost: quantity * unitCost,
                expectedArrival:
                  payload.status === "IN_TRANSIT"
                    ? payload.expectedArrivalDate || row.expectedArrival
                    : "",
                status: payload.status,
                delivered: payload.status === "DELIVERED",
              }
            : row
        )
      );
      toast.success("Purchase updated.");
    }

    setFormOpen(false);
    setSelectedRow(null);
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
                setIsError(false);
                setIsLoading(true);
                window.setTimeout(() => {
                  setRows(loadPurchaseRows());
                  setIsLoading(false);
                }, 500);
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

                setRows((prev) =>
                  prev.map((entry) =>
                    entry.id === row.id
                      ? {
                          ...entry,
                          status: nextStatusMap[entry.status],
                          delivered: nextStatusMap[entry.status] === "DELIVERED",
                          expectedArrival:
                            nextStatusMap[entry.status] === "IN_TRANSIT"
                              ? entry.expectedArrival
                              : "",
                        }
                      : entry
                  )
                );
                toast.success("Purchase status updated.");
              }}
              onApproveProduct={(row) => {
                setRows((prev) =>
                  prev.map((entry) =>
                    entry.id === row.id ? { ...entry, pendingApproval: false } : entry
                  )
                );
                toast.success("Product approved.");
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
          onClose={() => setFormOpen(false)}
          onSubmit={handleSavePurchase}
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
          setRows((prev) => prev.filter((row) => row.id !== rowToDelete.id));
          setDeleteOpen(false);
          toast.success("Purchase deleted.");
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
                setRows((prev) =>
                  prev.map((entry) =>
                    entry.id === rowForStatusUpdate.id
                      ? {
                          ...entry,
                          status: "IN_TRANSIT",
                          expectedArrival: arrivalDateInput,
                          delivered: false,
                        }
                      : entry
                  )
                );
                setArrivalDateModalOpen(false);
                setRowForStatusUpdate(null);
                toast.success("Status updated to IN_TRANSIT.");
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
