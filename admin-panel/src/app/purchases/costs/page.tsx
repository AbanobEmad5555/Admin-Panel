"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, FileSpreadsheet, Plus } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/layout/AdminLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ConfirmDeleteModal from "@/components/purchases/ConfirmDeleteModal";
import CostFormModal from "@/components/purchases/CostFormModal";
import CostsTable from "@/components/purchases/CostsTable";
import PurchasesModuleNav from "@/components/purchases/PurchasesModuleNav";
import { costCategories } from "@/components/purchases/mock-data";
import { loadCostRows, saveCostRows } from "@/components/purchases/storage";
import type { CostFormValue, CostRow } from "@/components/purchases/types";

const PAGE_SIZE = 20;

export default function PurchasesCostsPage() {
  const [rows, setRows] = useState<CostRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [page, setPage] = useState(1);
  const [draftNameFilter, setDraftNameFilter] = useState("");
  const [draftCategoryFilter, setDraftCategoryFilter] = useState<CostRow["category"] | "ALL">("ALL");
  const [draftDateFilter, setDraftDateFilter] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CostRow["category"] | "ALL">("ALL");
  const [dateFilter, setDateFilter] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedRow, setSelectedRow] = useState<CostRow | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<CostRow | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setRows(loadCostRows());
      setIsLoading(false);
      setIsHydrated(true);
    }, 600);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    saveCostRows(rows);
  }, [rows, isHydrated]);

  const filteredRows = useMemo(() => {
    const query = nameFilter.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesName = query.length === 0 || row.name.toLowerCase().includes(query);
      const matchesCategory = categoryFilter === "ALL" || row.category === categoryFilter;
      const matchesDate = dateFilter.length === 0 || row.date === dateFilter;
      return matchesName && matchesCategory && matchesDate;
    });
  }, [rows, nameFilter, categoryFilter, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = useMemo(
    () => filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredRows, currentPage]
  );

  const handleSubmit = (payload: CostFormValue) => {
    const amount = Number(payload.amount || 0);
    if (!payload.name.trim() || amount <= 0 || !payload.date) {
      toast.error("Please complete required fields.");
      return;
    }

    if (formMode === "create") {
      const next: CostRow = {
        id: `${Date.now()}`,
        name: payload.name.trim(),
        category: payload.category,
        amount,
        date: payload.date,
        notes: payload.notes.trim(),
      };
      setRows((prev) => [next, ...prev]);
      toast.success("Cost added.");
    } else if (selectedRow) {
      setRows((prev) =>
        prev.map((row) =>
          row.id === selectedRow.id
            ? {
                ...row,
                name: payload.name.trim(),
                category: payload.category,
                amount,
                date: payload.date,
                notes: payload.notes.trim(),
              }
            : row
        )
      );
      toast.success("Cost updated.");
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
              <h1 className="text-2xl font-bold text-slate-900">Operational Costs</h1>
              <p className="text-sm text-slate-500">
                Track rent, utilities, salaries and other expenses
              </p>
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
                Add Cost
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="gap-2"
                onClick={() => toast.success("Operational costs CSV export queued.")}
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="gap-2"
                onClick={() => toast.success("Operational costs Excel export queued.")}
              >
                <FileSpreadsheet className="h-4 w-4" />
                Export Excel
              </Button>
            </div>
          </div>
        </div>

        <PurchasesModuleNav />

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Input
              placeholder="Filter by cost name"
              value={draftNameFilter}
              onChange={(event) => setDraftNameFilter(event.target.value)}
            />
            <select
              value={draftCategoryFilter}
              onChange={(event) =>
                setDraftCategoryFilter(event.target.value as CostRow["category"] | "ALL")
              }
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              <option value="ALL">All categories</option>
              {costCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <Input
              type="date"
              value={draftDateFilter}
              onChange={(event) => setDraftDateFilter(event.target.value)}
              onClick={(event) => event.currentTarget.showPicker?.()}
              className="cursor-pointer"
            />
          </div>
          <div className="mt-3 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setDraftNameFilter("");
                setDraftCategoryFilter("ALL");
                setDraftDateFilter("");
                setNameFilter("");
                setCategoryFilter("ALL");
                setDateFilter("");
                setPage(1);
              }}
            >
              Clear
            </Button>
            <Button
              type="button"
              onClick={() => {
                setNameFilter(draftNameFilter);
                setCategoryFilter(draftCategoryFilter);
                setDateFilter(draftDateFilter);
                setPage(1);
              }}
            >
              Apply
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="h-10 animate-pulse rounded bg-slate-200" />
            <div className="h-10 animate-pulse rounded bg-slate-200" />
          </div>
        ) : null}

        {isError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 shadow-sm">
            Failed to load operational costs.
            <button
              type="button"
              onClick={() => {
                setIsError(false);
                setRows(loadCostRows());
              }}
              className="ml-2 font-semibold underline"
            >
              Retry
            </button>
          </div>
        ) : null}

        {!isLoading && !isError && filteredRows.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">No costs found</h2>
            <p className="mt-1 text-sm text-slate-500">
              Try adjusting filters or add a new operational cost.
            </p>
            <div className="mt-4">
              <Button
                type="button"
                onClick={() => {
                  setFormMode("create");
                  setSelectedRow(null);
                  setFormOpen(true);
                }}
              >
                Add Cost
              </Button>
            </div>
          </div>
        ) : null}

        {!isLoading && !isError && filteredRows.length > 0 ? (
          <>
            <CostsTable
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
                <span className="font-semibold">{totalPages}</span> • 20 rows per page
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
        <CostFormModal
          key={`${formMode}-${selectedRow?.id ?? "new"}`}
          open={formOpen}
          mode={formMode}
          initial={selectedRow}
          onClose={() => setFormOpen(false)}
          onSubmit={handleSubmit}
        />
      ) : null}

      <ConfirmDeleteModal
        open={deleteOpen}
        title="Delete Cost"
        description="Delete this operational cost entry?"
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          if (!rowToDelete) {
            return;
          }
          setRows((prev) => prev.filter((row) => row.id !== rowToDelete.id));
          setDeleteOpen(false);
          toast.success("Cost deleted.");
        }}
      />
    </AdminLayout>
  );
}
