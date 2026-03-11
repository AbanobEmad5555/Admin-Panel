"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AxiosError } from "axios";
import { Download, FileSpreadsheet, Plus } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/layout/AdminLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ConfirmDeleteModal from "@/components/purchases/ConfirmDeleteModal";
import CostFormModal from "@/components/purchases/CostFormModal";
import {
  costCategories,
  costCategoryArabicLabels,
  costCategoryLabels,
} from "@/components/purchases/constants";
import CostsTable from "@/components/purchases/CostsTable";
import PurchasesModuleNav from "@/components/purchases/PurchasesModuleNav";
import type { CostFormValue, CostRow } from "@/components/purchases/types";
import { purchaseCostsApi } from "@/features/purchases/api/purchases.api";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

const PAGE_SIZE = 20;

const getApiErrorMessage = (error: unknown, fallback: string) =>
  ((error as AxiosError<{ message?: string }>)?.response?.data?.message ?? fallback);

export default function PurchasesCostsPage() {
  const { language, t } = useLocalization();
  const text = {
    title: t("nav.operationalCosts") || "Operational Costs",
    subtitle:
      language === "ar"
        ? "تابع الإيجار والمرافق والرواتب والمصروفات الأخرى"
        : "Track rent, utilities, salaries and other expenses",
    addCost: language === "ar" ? "إضافة مصروف" : "Add Cost",
    exportCsv: language === "ar" ? "تصدير CSV" : "Export CSV",
    exportExcel: language === "ar" ? "تصدير Excel" : "Export Excel",
    csvQueued:
      language === "ar"
        ? "تمت جدولة تصدير CSV للمصروفات التشغيلية."
        : "Operational costs CSV export queued.",
    excelQueued:
      language === "ar"
        ? "تمت جدولة تصدير Excel للمصروفات التشغيلية."
        : "Operational costs Excel export queued.",
    loadError:
      language === "ar" ? "تعذر تحميل المصروفات التشغيلية." : "Failed to load operational costs.",
    requiredFields:
      language === "ar" ? "يرجى استكمال الحقول المطلوبة." : "Please complete required fields.",
    costAdded: language === "ar" ? "تمت إضافة المصروف." : "Cost added.",
    costUpdated: language === "ar" ? "تم تحديث المصروف." : "Cost updated.",
    createError: language === "ar" ? "تعذر إنشاء المصروف." : "Failed to create cost.",
    updateError: language === "ar" ? "تعذر تحديث المصروف." : "Failed to update cost.",
    namePlaceholder: language === "ar" ? "التصفية باسم المصروف" : "Filter by cost name",
    allCategories: language === "ar" ? "كل الفئات" : "All categories",
    clear: language === "ar" ? "مسح" : "Clear",
    apply: language === "ar" ? "تطبيق" : "Apply",
    retry: language === "ar" ? "إعادة المحاولة" : "Retry",
    emptyTitle: language === "ar" ? "لا توجد مصروفات" : "No costs found",
    emptyDescription:
      language === "ar"
        ? "جرّب تعديل الفلاتر أو أضف مصروفًا تشغيليًا جديدًا."
        : "Try adjusting filters or add a new operational cost.",
    previous: t("common.previous") || "Previous",
    next: t("common.next") || "Next",
    pageLabel: language === "ar" ? "الصفحة" : "Page",
    ofLabel: language === "ar" ? "من" : "of",
    rowsPerPage: language === "ar" ? "صفًا لكل صفحة" : "rows per page",
    deleteTitle: language === "ar" ? "حذف المصروف" : "Delete Cost",
    deleteDescription:
      language === "ar" ? "هل تريد حذف سجل المصروف التشغيلي هذا؟" : "Delete this operational cost entry?",
    costDeleted: language === "ar" ? "تم حذف المصروف." : "Cost deleted.",
    deleteError: language === "ar" ? "تعذر حذف المصروف." : "Failed to delete cost.",
  };

  const [rows, setRows] = useState<CostRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
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

  const refreshCosts = useCallback(async () => {
    setError("");
    try {
      const data = await purchaseCostsApi.list();
      setRows(data);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, text.loadError));
    } finally {
      setIsLoading(false);
    }
  }, [text.loadError]);

  useEffect(() => {
    void refreshCosts();
  }, [refreshCosts]);

  const filteredRows = useMemo(() => {
    const query = nameFilter.trim().toLowerCase();
    return rows.filter((row) => {
      const localizedName = [row.name, row.costNameEn, row.costNameAr].filter(Boolean).join(" ").toLowerCase();
      const matchesName = query.length === 0 || localizedName.includes(query);
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

  const handleSubmit = async (payload: CostFormValue) => {
    const amount = Number(payload.amount || 0);
    if (!payload.costNameEn.trim() || amount <= 0 || !payload.date) {
      toast.error(text.requiredFields);
      return;
    }

    try {
      if (formMode === "create") {
        await purchaseCostsApi.create({
          name: payload.costNameEn.trim(),
          costNameEn: payload.costNameEn.trim(),
          costNameAr: payload.costNameAr.trim() || undefined,
          category: payload.category,
          amount,
          date: payload.date,
          notes: payload.notes.trim() || undefined,
        });
        toast.success(text.costAdded);
      } else if (selectedRow) {
        await purchaseCostsApi.update(selectedRow.id, {
          name: payload.costNameEn.trim(),
          costNameEn: payload.costNameEn.trim(),
          costNameAr: payload.costNameAr.trim() || undefined,
          category: payload.category,
          amount,
          date: payload.date,
          notes: payload.notes.trim() || undefined,
        });
        toast.success(text.costUpdated);
      }

      await refreshCosts();
      setFormOpen(false);
      setSelectedRow(null);
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, formMode === "create" ? text.createError : text.updateError));
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
                {text.addCost}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="gap-2"
                onClick={() => toast.success(text.csvQueued)}
              >
                <Download className="h-4 w-4" />
                {text.exportCsv}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="gap-2"
                onClick={() => toast.success(text.excelQueued)}
              >
                <FileSpreadsheet className="h-4 w-4" />
                {text.exportExcel}
              </Button>
            </div>
          </div>
        </div>

        <PurchasesModuleNav />

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Input
              placeholder={text.namePlaceholder}
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
              <option value="ALL">{text.allCategories}</option>
              {costCategories.map((category) => (
                <option key={category} value={category}>
                  {language === "ar" ? costCategoryArabicLabels[category] : costCategoryLabels[category]}
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
              {text.clear}
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
              {text.apply}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="h-10 animate-pulse rounded bg-slate-200" />
            <div className="h-10 animate-pulse rounded bg-slate-200" />
          </div>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 shadow-sm">
            {error}
            <button
              type="button"
              onClick={() => {
                setIsLoading(true);
                void refreshCosts();
              }}
              className="ml-2 font-semibold underline"
            >
              {text.retry}
            </button>
          </div>
        ) : null}

        {!isLoading && !error && filteredRows.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">{text.emptyTitle}</h2>
            <p className="mt-1 text-sm text-slate-500">{text.emptyDescription}</p>
            <div className="mt-4">
              <Button
                type="button"
                onClick={() => {
                  setFormMode("create");
                  setSelectedRow(null);
                  setFormOpen(true);
                }}
              >
                {text.addCost}
              </Button>
            </div>
          </div>
        ) : null}

        {!isLoading && !error && filteredRows.length > 0 ? (
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
                {text.previous}
              </Button>
              <div className="text-sm text-slate-600">
                {text.pageLabel} <span className="font-semibold">{currentPage}</span> {text.ofLabel}{" "}
                <span className="font-semibold">{totalPages}</span> • 20 {text.rowsPerPage}
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
        <CostFormModal
          key={`${formMode}-${selectedRow?.id ?? "new"}`}
          open={formOpen}
          mode={formMode}
          initial={selectedRow}
          onClose={() => setFormOpen(false)}
          onSubmit={(payload) => {
            void handleSubmit(payload);
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

          void purchaseCostsApi
            .remove(rowToDelete.id)
            .then(async () => {
              await refreshCosts();
              setDeleteOpen(false);
              toast.success(text.costDeleted);
            })
            .catch((requestError: unknown) => {
              toast.error(getApiErrorMessage(requestError, text.deleteError));
            })
            .finally(() => undefined);
        }}
      />
    </AdminLayout>
  );
}
