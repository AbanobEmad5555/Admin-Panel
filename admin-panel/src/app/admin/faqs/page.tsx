"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { extractList } from "@/lib/extractList";
import LocalizedDisplayText from "@/modules/shared/components/LocalizedDisplayText";
import { useLocalization } from "@/modules/localization/LocalizationProvider";
import api from "@/services/api";
import type { ApiResponse } from "@/types";

type FaqRecord = {
  id: number;
  question: string;
  answer: string;
  questionEn?: string | null;
  questionAr?: string | null;
  answerEn?: string | null;
  answerAr?: string | null;
  order?: number | null;
  isActive?: boolean | null;
  categoryId?: number | null;
};

type FaqCategory = {
  id: number;
  name: string;
  nameEn?: string | null;
  nameAr?: string | null;
  order?: number | null;
  isActive?: boolean | null;
  faqs?: FaqRecord[] | null;
};

type AlertState = {
  type: "success" | "error";
  text: string;
};

type CategoryFormState = {
  nameEn: string;
  nameAr: string;
  order: string;
  isActive: boolean;
};

type FaqFormState = {
  questionEn: string;
  questionAr: string;
  answerEn: string;
  answerAr: string;
  order: string;
  categoryId: string;
  isActive: boolean;
};

const initialCategoryForm: CategoryFormState = {
  nameEn: "",
  nameAr: "",
  order: "",
  isActive: true,
};

const initialFaqForm: FaqFormState = {
  questionEn: "",
  questionAr: "",
  answerEn: "",
  answerAr: "",
  order: "",
  categoryId: "",
  isActive: true,
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null) {
    const responseError = error as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    return responseError.response?.data?.message ?? responseError.message ?? fallback;
  }
  return fallback;
};

const formatStatusClass = (isActive?: boolean | null) =>
  isActive
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-slate-200 bg-slate-100 text-slate-600";

const resolveActiveValue = (value?: boolean | null) =>
  typeof value === "boolean" ? value : true;

export default function AdminFaqPage() {
  const { language } = useLocalization();
  const text =
    language === "ar"
      ? {
          genericError: "حدث خطأ ما.",
          categoryNameRequired: "اسم الفئة الإنجليزية مطلوب.",
          questionRequired: "السؤال الإنجليزي مطلوب.",
          answerRequired: "الإجابة الإنجليزية مطلوبة.",
          categoryRequired: "اختيار الفئة مطلوب.",
          orderInteger: "يجب أن يكون الترتيب رقمًا صحيحًا.",
          faqUpdated: "تم تحديث السؤال الشائع بنجاح.",
          faqCreated: "تم إنشاء السؤال الشائع بنجاح.",
          categoryCreated: "تم إنشاء الفئة بنجاح.",
          removeFaqsBeforeDelete: "احذف جميع الأسئلة من هذه الفئة قبل حذفها.",
          deleteCategoryConfirm: "هل تريد حذف هذه الفئة؟",
          categoryDeleted: "تم حذف الفئة بنجاح.",
          deleteFaqConfirm: "هل تريد حذف هذا السؤال الشائع؟",
          faqDeleted: "تم حذف السؤال الشائع بنجاح.",
          title: "الأسئلة الشائعة",
          subtitle: "أدر الفئات والأسئلة الشائعة باللغتين.",
          addCategory: "إضافة فئة",
          addFaq: "إضافة سؤال شائع",
          loading: "جارٍ تحميل الأسئلة الشائعة...",
          noCategoriesYet: "لا توجد فئات بعد.",
          active: "نشط",
          inactive: "غير نشط",
          orderLabel: "الترتيب",
          deleting: "جارٍ الحذف...",
          deleteCategory: "حذف الفئة",
          edit: "تعديل",
          delete: "حذف",
          noFaqsInCategory: "لا توجد أسئلة شائعة في هذه الفئة بعد.",
          noCategoriesAvailable: "لا توجد فئات متاحة.",
          createCategory: "إضافة فئة",
          editCategory: "تعديل الفئة",
          faqDetails: "تفاصيل السؤال الشائع",
          questionEn: "السؤال (بالإنجليزية)",
          questionAr: "السؤال (بالعربية)",
          answerEn: "الإجابة (بالإنجليزية)",
          answerAr: "الإجابة (بالعربية)",
          categoryNameEn: "اسم الفئة (بالإنجليزية)",
          categoryNameAr: "اسم الفئة (بالعربية)",
          sortOrder: "الترتيب",
          optionalInteger: "رقم اختياري",
          save: "حفظ",
          saving: "جارٍ الحفظ...",
          cancel: "إلغاء",
          enterQuestion: "أدخل السؤال",
          provideAnswer: "أدخل الإجابة",
          category: "الفئة",
          selectCategory: "اختر فئة",
        }
      : {
          genericError: "Something went wrong.",
          categoryNameRequired: "English category name is required.",
          questionRequired: "English question is required.",
          answerRequired: "English answer is required.",
          categoryRequired: "Category selection is required.",
          orderInteger: "Order must be an integer.",
          faqUpdated: "FAQ updated successfully.",
          faqCreated: "FAQ created successfully.",
          categoryCreated: "Category created successfully.",
          removeFaqsBeforeDelete: "Remove all FAQs from this category before deletion.",
          deleteCategoryConfirm: "Delete this category?",
          categoryDeleted: "Category deleted successfully.",
          deleteFaqConfirm: "Delete this FAQ?",
          faqDeleted: "FAQ deleted successfully.",
          title: "FAQs",
          subtitle: "Manage FAQ categories and entries in both languages.",
          addCategory: "Add Category",
          addFaq: "Add FAQ",
          loading: "Loading FAQs...",
          noCategoriesYet: "No categories yet.",
          active: "Active",
          inactive: "Inactive",
          orderLabel: "Order",
          deleting: "Deleting...",
          deleteCategory: "Delete Category",
          edit: "Edit",
          delete: "Delete",
          noFaqsInCategory: "No FAQs in this category yet.",
          noCategoriesAvailable: "No categories available.",
          createCategory: "Add Category",
          editCategory: "Edit Category",
          faqDetails: "FAQ Details",
          questionEn: "Question (English)",
          questionAr: "Question (Arabic)",
          answerEn: "Answer (English)",
          answerAr: "Answer (Arabic)",
          categoryNameEn: "Category Name (English)",
          categoryNameAr: "Category Name (Arabic)",
          sortOrder: "Sort Order",
          optionalInteger: "Optional integer",
          save: "Save",
          saving: "Saving...",
          cancel: "Cancel",
          enterQuestion: "Enter question",
          provideAnswer: "Enter answer",
          category: "Category",
          selectCategory: "Select a category",
        };

  const [categories, setCategories] = useState<FaqCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FaqCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(initialCategoryForm);
  const [categoryServerError, setCategoryServerError] = useState("");
  const [isCategorySubmitting, setIsCategorySubmitting] = useState(false);
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [faqForm, setFaqForm] = useState<FaqFormState>(initialFaqForm);
  const [faqServerError, setFaqServerError] = useState("");
  const [isFaqSubmitting, setIsFaqSubmitting] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState<FaqRecord | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null);
  const [deletingFaqId, setDeletingFaqId] = useState<number | null>(null);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setFetchError("");
    try {
      const response = await api.get<ApiResponse<FaqCategory[]>>("/admin/faq-categories");
      setCategories(extractList<FaqCategory>(response.data?.data ?? response.data));
    } catch (error) {
      setFetchError(getErrorMessage(error, text.genericError));
    } finally {
      setIsLoading(false);
    }
  }, [text.genericError]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (categories.length === 0) {
      setActiveCategoryId(null);
      return;
    }
    setActiveCategoryId((prev) =>
      prev && categories.some((category) => category.id === prev) ? prev : categories[0].id
    );
  }, [categories]);

  const activeCategory = useMemo(
    () => categories.find((category) => category.id === activeCategoryId) ?? null,
    [activeCategoryId, categories]
  );
  const activeFaqs = activeCategory?.faqs ?? [];

  const openCategoryModal = (category?: FaqCategory) => {
    setEditingCategory(category ?? null);
    setCategoryForm(
      category
        ? {
            nameEn: category.nameEn ?? category.name ?? "",
            nameAr: category.nameAr ?? "",
            order: category.order != null ? String(category.order) : "",
            isActive: resolveActiveValue(category.isActive),
          }
        : initialCategoryForm
    );
    setCategoryServerError("");
    setIsCategoryModalOpen(true);
  };

  const openFaqModal = (mode: "create" | "edit", faq?: FaqRecord) => {
    if (mode === "create") {
      setSelectedFaq(null);
      setFaqForm({
        ...initialFaqForm,
        categoryId: activeCategoryId != null ? String(activeCategoryId) : categories[0]?.id ? String(categories[0].id) : "",
      });
    } else if (faq) {
      setSelectedFaq(faq);
      setFaqForm({
        questionEn: faq.questionEn ?? faq.question ?? "",
        questionAr: faq.questionAr ?? "",
        answerEn: faq.answerEn ?? faq.answer ?? "",
        answerAr: faq.answerAr ?? "",
        order: faq.order != null ? String(faq.order) : "",
        categoryId: faq.categoryId != null ? String(faq.categoryId) : "",
        isActive: resolveActiveValue(faq.isActive),
      });
    }
    setFaqServerError("");
    setIsFaqModalOpen(true);
  };

  const handleCategorySubmit = async () => {
    if (!categoryForm.nameEn.trim()) {
      setCategoryServerError(text.categoryNameRequired);
      return;
    }
    setIsCategorySubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        name: categoryForm.nameEn.trim(),
        nameEn: categoryForm.nameEn.trim(),
        nameAr: categoryForm.nameAr.trim() || undefined,
        isActive: categoryForm.isActive,
      };
      if (categoryForm.order.trim()) {
        payload.order = Number(categoryForm.order);
      }
      if (editingCategory) {
        await api.put(`/admin/faq-categories/${editingCategory.id}`, payload);
      } else {
        await api.post("/admin/faq-categories", payload);
      }
      setAlert({ type: "success", text: text.categoryCreated });
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
      await fetchCategories();
    } catch (error) {
      setCategoryServerError(getErrorMessage(error, text.genericError));
    } finally {
      setIsCategorySubmitting(false);
    }
  };

  const handleFaqSubmit = async () => {
    if (!faqForm.questionEn.trim()) {
      setFaqServerError(text.questionRequired);
      return;
    }
    if (!faqForm.answerEn.trim()) {
      setFaqServerError(text.answerRequired);
      return;
    }
    if (!faqForm.categoryId.trim()) {
      setFaqServerError(text.categoryRequired);
      return;
    }
    setIsFaqSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        question: faqForm.questionEn.trim(),
        answer: faqForm.answerEn.trim(),
        questionEn: faqForm.questionEn.trim(),
        questionAr: faqForm.questionAr.trim() || undefined,
        answerEn: faqForm.answerEn.trim(),
        answerAr: faqForm.answerAr.trim() || undefined,
        categoryId: Number(faqForm.categoryId),
        isActive: faqForm.isActive,
      };
      if (faqForm.order.trim()) {
        payload.order = Number(faqForm.order);
      }
      if (selectedFaq) {
        await api.put(`/admin/faqs/${selectedFaq.id}`, payload);
        setAlert({ type: "success", text: text.faqUpdated });
      } else {
        await api.post("/admin/faqs", payload);
        setAlert({ type: "success", text: text.faqCreated });
      }
      setIsFaqModalOpen(false);
      setSelectedFaq(null);
      await fetchCategories();
    } catch (error) {
      setFaqServerError(getErrorMessage(error, text.genericError));
    } finally {
      setIsFaqSubmitting(false);
    }
  };

  const handleDeleteCategory = async (category: FaqCategory) => {
    if ((category.faqs ?? []).length > 0) {
      setAlert({ type: "error", text: text.removeFaqsBeforeDelete });
      return;
    }
    if (!window.confirm(text.deleteCategoryConfirm)) return;
    setDeletingCategoryId(category.id);
    try {
      await api.delete(`/admin/faq-categories/${category.id}`);
      setAlert({ type: "success", text: text.categoryDeleted });
      await fetchCategories();
    } catch (error) {
      setAlert({ type: "error", text: getErrorMessage(error, text.genericError) });
    } finally {
      setDeletingCategoryId(null);
    }
  };

  const handleDeleteFaq = async (faq: FaqRecord) => {
    if (!window.confirm(text.deleteFaqConfirm)) return;
    setDeletingFaqId(faq.id);
    try {
      await api.delete(`/admin/faqs/${faq.id}`);
      setAlert({ type: "success", text: text.faqDeleted });
      await fetchCategories();
    } catch (error) {
      setAlert({ type: "error", text: getErrorMessage(error, text.genericError) });
    } finally {
      setDeletingFaqId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{text.title}</h1>
            <p className="text-sm text-slate-600">{text.subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => openCategoryModal()}>{text.addCategory}</Button>
            <Button onClick={() => openFaqModal("create")} disabled={categories.length === 0}>
              {text.addFaq}
            </Button>
          </div>
        </div>

        {alert ? <div className={`rounded-md border px-4 py-2 text-sm ${alert.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}>{alert.text}</div> : null}
        {fetchError ? <p className="rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{fetchError}</p> : null}

        {isLoading ? (
          <p className="text-sm text-slate-600">{text.loading}</p>
        ) : categories.length === 0 ? (
          <p className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">{text.noCategoriesYet}</p>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <div className="inline-flex gap-2 rounded-2xl border border-slate-200 bg-white p-1">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategoryId(category.id)}
                    className={`inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold transition ${activeCategoryId === category.id ? "bg-slate-900 text-white shadow" : "bg-transparent text-slate-600 hover:bg-slate-100"}`}
                  >
                    <LocalizedDisplayText valueEn={category.nameEn} valueAr={category.nameAr} legacyValue={category.name} />
                    <span className="ml-2 text-[11px] font-normal uppercase tracking-wider text-slate-400">{category.order ?? "-"}</span>
                  </button>
                ))}
              </div>
            </div>

            {activeCategory ? (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <p className="text-lg font-semibold text-slate-900">
                        <LocalizedDisplayText valueEn={activeCategory.nameEn} valueAr={activeCategory.nameAr} legacyValue={activeCategory.name} />
                      </p>
                      <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${formatStatusClass(resolveActiveValue(activeCategory.isActive))}`}>
                        {resolveActiveValue(activeCategory.isActive) ? text.active : text.inactive}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{text.orderLabel} {activeCategory.order ?? "-"}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => openCategoryModal(activeCategory)}>{text.edit}</Button>
                    <Button variant="danger" onClick={() => handleDeleteCategory(activeCategory)} disabled={deletingCategoryId === activeCategory.id}>
                      {deletingCategoryId === activeCategory.id ? text.deleting : text.deleteCategory}
                    </Button>
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  {activeFaqs.length > 0 ? (
                    activeFaqs.map((faq) => (
                      <article key={faq.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="max-w-3xl space-y-2">
                            <p className="text-sm font-semibold text-slate-900">
                              <LocalizedDisplayText valueEn={faq.questionEn} valueAr={faq.questionAr} legacyValue={faq.question} />
                            </p>
                            <p className="text-sm text-slate-600">
                              <LocalizedDisplayText valueEn={faq.answerEn} valueAr={faq.answerAr} legacyValue={faq.answer} />
                            </p>
                            <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                              <span>{text.orderLabel} {faq.order ?? "-"}</span>
                              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${formatStatusClass(resolveActiveValue(faq.isActive))}`}>
                                {resolveActiveValue(faq.isActive) ? text.active : text.inactive}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button variant="secondary" onClick={() => openFaqModal("edit", faq)}>{text.edit}</Button>
                            <Button variant="danger" onClick={() => handleDeleteFaq(faq)} disabled={deletingFaqId === faq.id}>
                              {deletingFaqId === faq.id ? text.deleting : text.delete}
                            </Button>
                          </div>
                        </div>
                      </article>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">{text.noFaqsInCategory}</p>
                  )}
                </div>
              </section>
            ) : (
              <p className="text-sm text-slate-500">{text.noCategoriesAvailable}</p>
            )}
          </div>
        )}

        <Modal title={editingCategory ? text.editCategory : text.createCategory} isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)}>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">{text.categoryNameEn}</label>
              <Input value={categoryForm.nameEn} onChange={(event) => setCategoryForm((prev) => ({ ...prev, nameEn: event.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">{text.categoryNameAr}</label>
              <Input value={categoryForm.nameAr} onChange={(event) => setCategoryForm((prev) => ({ ...prev, nameAr: event.target.value }))} dir="rtl" className="text-right" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">{text.sortOrder}</label>
              <Input type="number" value={categoryForm.order} onChange={(event) => setCategoryForm((prev) => ({ ...prev, order: event.target.value }))} placeholder={text.optionalInteger} />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={categoryForm.isActive} onChange={(event) => setCategoryForm((prev) => ({ ...prev, isActive: event.target.checked }))} className="h-4 w-4 accent-slate-900" />
              {text.active}
            </label>
            {categoryServerError ? <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{categoryServerError}</p> : null}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setIsCategoryModalOpen(false)} disabled={isCategorySubmitting}>{text.cancel}</Button>
              <Button onClick={handleCategorySubmit} disabled={isCategorySubmitting}>{isCategorySubmitting ? text.saving : text.save}</Button>
            </div>
          </div>
        </Modal>

        <Modal title={text.faqDetails} isOpen={isFaqModalOpen} onClose={() => setIsFaqModalOpen(false)}>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">{text.questionEn}</label>
              <Input value={faqForm.questionEn} onChange={(event) => setFaqForm((prev) => ({ ...prev, questionEn: event.target.value }))} placeholder={text.enterQuestion} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">{text.questionAr}</label>
              <Input value={faqForm.questionAr} onChange={(event) => setFaqForm((prev) => ({ ...prev, questionAr: event.target.value }))} placeholder={text.enterQuestion} dir="rtl" className="text-right" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">{text.answerEn}</label>
              <textarea value={faqForm.answerEn} onChange={(event) => setFaqForm((prev) => ({ ...prev, answerEn: event.target.value }))} rows={4} placeholder={text.provideAnswer} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">{text.answerAr}</label>
              <textarea value={faqForm.answerAr} onChange={(event) => setFaqForm((prev) => ({ ...prev, answerAr: event.target.value }))} rows={4} dir="rtl" placeholder={text.provideAnswer} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-right text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">{text.category}</label>
              <select value={faqForm.categoryId} onChange={(event) => setFaqForm((prev) => ({ ...prev, categoryId: event.target.value }))} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200">
                <option value="">{text.selectCategory}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {language === "ar" ? category.nameAr || category.nameEn || category.name : category.nameEn || category.nameAr || category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">{text.sortOrder}</label>
              <Input type="number" value={faqForm.order} onChange={(event) => setFaqForm((prev) => ({ ...prev, order: event.target.value }))} placeholder={text.optionalInteger} />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={faqForm.isActive} onChange={(event) => setFaqForm((prev) => ({ ...prev, isActive: event.target.checked }))} className="h-4 w-4 accent-slate-900" />
              {text.active}
            </label>
            {faqServerError ? <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{faqServerError}</p> : null}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setIsFaqModalOpen(false)} disabled={isFaqSubmitting}>{text.cancel}</Button>
              <Button onClick={handleFaqSubmit} disabled={isFaqSubmitting}>{isFaqSubmitting ? text.saving : text.save}</Button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}
