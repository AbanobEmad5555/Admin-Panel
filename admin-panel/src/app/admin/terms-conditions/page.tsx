"use client";

import { useCallback, useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import LocalizedDisplayText from "@/modules/shared/components/LocalizedDisplayText";
import { useLocalization } from "@/modules/localization/LocalizationProvider";
import api from "@/services/api";
import type { ApiResponse } from "@/types";

type TermRecord = {
  id: number;
  question: string;
  answer: string;
  questionEn?: string | null;
  questionAr?: string | null;
  answerEn?: string | null;
  answerAr?: string | null;
  isActive?: boolean | null;
};

type AlertState = {
  type: "success" | "error";
  text: string;
};

type TermFormState = {
  questionEn: string;
  questionAr: string;
  answerEn: string;
  answerAr: string;
  isActive: boolean;
};

type TermValidationErrors = {
  questionEn?: string;
  answerEn?: string;
};

const initialTermForm: TermFormState = {
  questionEn: "",
  questionAr: "",
  answerEn: "",
  answerAr: "",
  isActive: true,
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null) {
    const responseError = error as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    return (
      responseError.response?.data?.message ??
      responseError.message ??
      fallback
    );
  }
  return fallback;
};

const validateTermForm = (
  values: TermFormState,
  messages: { questionMin: string; answerMin: string }
) => {
  const errors: TermValidationErrors = {};
  if (values.questionEn.trim().length < 3) {
    errors.questionEn = messages.questionMin;
  }
  if (values.answerEn.trim().length < 3) {
    errors.answerEn = messages.answerMin;
  }
  return errors;
};

const resolveActiveValue = (isActive?: boolean | null) =>
  typeof isActive === "boolean" ? isActive : true;

export default function AdminTermsConditionsPage() {
  const { language } = useLocalization();
  const text =
    language === "ar"
      ? {
          genericError: "حدث خطأ ما.",
          questionMin: "يجب أن يكون السؤال الإنجليزي 3 أحرف على الأقل.",
          answerMin: "يجب أن تكون الإجابة الإنجليزية 3 أحرف على الأقل.",
          created: "تم إنشاء البند بنجاح.",
          updated: "تم تحديث البند بنجاح.",
          disableConfirm: "هل تريد حذف هذا البند؟",
          disabled: "تم حذف البند بنجاح.",
          title: "الشروط والأحكام",
          subtitle: "أدر المحتوى القانوني المعروض للمستخدمين باللغتين.",
          addTerm: "إضافة بند",
          loading: "جارٍ تحميل الشروط والأحكام...",
          noTerms: "لا توجد بنود بعد.",
          active: "نشط",
          inactive: "غير نشط",
          edit: "تعديل",
          disable: "حذف",
          disabling: "جارٍ الحذف...",
          addTermTitle: "إضافة بند",
          editTermTitle: "تعديل البند",
          questionEn: "السؤال (بالإنجليزية)",
          questionAr: "السؤال (بالعربية)",
          answerEn: "الإجابة (بالإنجليزية)",
          answerAr: "الإجابة (بالعربية)",
          enterQuestion: "أدخل السؤال",
          enterAnswer: "أدخل الإجابة",
          cancel: "إلغاء",
          save: "حفظ",
          saving: "جارٍ الحفظ...",
        }
      : {
          genericError: "Something went wrong.",
          questionMin: "English question must be at least 3 characters.",
          answerMin: "English answer must be at least 3 characters.",
          created: "Term created successfully.",
          updated: "Term updated successfully.",
          disableConfirm: "Delete this entry?",
          disabled: "Term deleted successfully.",
          title: "Terms & Conditions",
          subtitle: "Manage the legal content shown to users in both languages.",
          addTerm: "Add Term",
          loading: "Loading terms...",
          noTerms: "No terms found yet.",
          active: "Active",
          inactive: "Inactive",
          edit: "Edit",
          disable: "Delete",
          disabling: "Deleting...",
          addTermTitle: "Add Term",
          editTermTitle: "Edit Term",
          questionEn: "Question (English)",
          questionAr: "Question (Arabic)",
          answerEn: "Answer (English)",
          answerAr: "Answer (Arabic)",
          enterQuestion: "Enter question",
          enterAnswer: "Enter answer",
          cancel: "Cancel",
          save: "Save",
          saving: "Saving...",
        };

  const [terms, setTerms] = useState<TermRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<TermFormState>(initialTermForm);
  const [createErrors, setCreateErrors] = useState<TermValidationErrors>({});
  const [isCreateSubmitting, setIsCreateSubmitting] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<TermFormState>(initialTermForm);
  const [editErrors, setEditErrors] = useState<TermValidationErrors>({});
  const [selectedTerm, setSelectedTerm] = useState<TermRecord | null>(null);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchTerms = useCallback(async () => {
    setIsLoading(true);
    setFetchError("");
    try {
      const response = await api.get<ApiResponse<TermRecord[]>>(
        "/admin/terms-conditions"
      );
      setTerms(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (error) {
      setFetchError(getErrorMessage(error, text.genericError));
    } finally {
      setIsLoading(false);
    }
  }, [text.genericError]);

  useEffect(() => {
    fetchTerms();
  }, [fetchTerms]);

  const openCreateModal = () => {
    setCreateForm(initialTermForm);
    setCreateErrors({});
    setIsCreateOpen(true);
  };

  const openEditModal = (term: TermRecord) => {
    setSelectedTerm(term);
    setEditForm({
      questionEn: term.questionEn ?? term.question ?? "",
      questionAr: term.questionAr ?? "",
      answerEn: term.answerEn ?? term.answer ?? "",
      answerAr: term.answerAr ?? "",
      isActive: resolveActiveValue(term.isActive),
    });
    setEditErrors({});
    setIsEditOpen(true);
  };

  const handleCreate = async () => {
    const errors = validateTermForm(createForm, text);
    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors);
      return;
    }
    setIsCreateSubmitting(true);
    try {
      await api.post("/admin/terms-conditions", {
        question: createForm.questionEn.trim(),
        answer: createForm.answerEn.trim(),
        questionEn: createForm.questionEn.trim(),
        questionAr: createForm.questionAr.trim() || undefined,
        answerEn: createForm.answerEn.trim(),
        answerAr: createForm.answerAr.trim() || undefined,
        isActive: createForm.isActive,
      });
      setAlert({ type: "success", text: text.created });
      setIsCreateOpen(false);
      await fetchTerms();
    } catch (error) {
      setAlert({ type: "error", text: getErrorMessage(error, text.genericError) });
    } finally {
      setIsCreateSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedTerm) return;
    const errors = validateTermForm(editForm, text);
    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }
    setIsEditSubmitting(true);
    try {
      await api.put(`/admin/terms-conditions/${selectedTerm.id}`, {
        question: editForm.questionEn.trim(),
        answer: editForm.answerEn.trim(),
        questionEn: editForm.questionEn.trim(),
        questionAr: editForm.questionAr.trim() || undefined,
        answerEn: editForm.answerEn.trim(),
        answerAr: editForm.answerAr.trim() || undefined,
        isActive: editForm.isActive,
      });
      setAlert({ type: "success", text: text.updated });
      setIsEditOpen(false);
      setSelectedTerm(null);
      await fetchTerms();
    } catch (error) {
      setAlert({ type: "error", text: getErrorMessage(error, text.genericError) });
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleDelete = async (term: TermRecord) => {
    if (!window.confirm(text.disableConfirm)) return;
    setDeletingId(term.id);
    try {
      await api.delete(`/admin/terms-conditions/${term.id}`);
      setAlert({ type: "success", text: text.disabled });
      await fetchTerms();
    } catch (error) {
      setAlert({ type: "error", text: getErrorMessage(error, text.genericError) });
    } finally {
      setDeletingId(null);
    }
  };

  const renderForm = (
    values: TermFormState,
    setValues: React.Dispatch<React.SetStateAction<TermFormState>>,
    errors: TermValidationErrors
  ) => (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-slate-700">{text.questionEn}</label>
        <Input
          value={values.questionEn}
          onChange={(event) =>
            setValues((prev) => ({ ...prev, questionEn: event.target.value }))
          }
          placeholder={text.enterQuestion}
        />
        {errors.questionEn ? <p className="mt-1 text-xs text-rose-600">{errors.questionEn}</p> : null}
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">{text.questionAr}</label>
        <Input
          value={values.questionAr}
          onChange={(event) =>
            setValues((prev) => ({ ...prev, questionAr: event.target.value }))
          }
          placeholder={text.enterQuestion}
          dir="rtl"
          className="text-right"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">{text.answerEn}</label>
        <textarea
          value={values.answerEn}
          onChange={(event) =>
            setValues((prev) => ({ ...prev, answerEn: event.target.value }))
          }
          rows={4}
          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          placeholder={text.enterAnswer}
        />
        {errors.answerEn ? <p className="mt-1 text-xs text-rose-600">{errors.answerEn}</p> : null}
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">{text.answerAr}</label>
        <textarea
          value={values.answerAr}
          onChange={(event) =>
            setValues((prev) => ({ ...prev, answerAr: event.target.value }))
          }
          rows={4}
          dir="rtl"
          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-right text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          placeholder={text.enterAnswer}
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          className="h-4 w-4 accent-slate-900"
          checked={values.isActive}
          onChange={(event) =>
            setValues((prev) => ({ ...prev, isActive: event.target.checked }))
          }
        />
        {text.active}
      </label>
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{text.title}</h1>
            <p className="text-sm text-slate-600">{text.subtitle}</p>
          </div>
          <Button onClick={openCreateModal}>{text.addTerm}</Button>
        </div>

        {alert ? (
          <div className={`rounded-md border px-4 py-2 text-sm ${alert.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
            {alert.text}
          </div>
        ) : null}
        {fetchError ? <p className="rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{fetchError}</p> : null}

        {isLoading ? (
          <p className="text-sm text-slate-600">{text.loading}</p>
        ) : terms.length === 0 ? (
          <p className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">{text.noTerms}</p>
        ) : (
          <div className="space-y-4">
            {terms.map((term) => (
              <article key={term.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-base font-semibold text-slate-900">
                      <LocalizedDisplayText valueEn={term.questionEn} valueAr={term.questionAr} legacyValue={term.question} />
                    </p>
                    <p className="text-sm text-slate-600">
                      <LocalizedDisplayText valueEn={term.answerEn} valueAr={term.answerAr} legacyValue={term.answer} />
                    </p>
                    <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${resolveActiveValue(term.isActive) ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
                      {resolveActiveValue(term.isActive) ? text.active : text.inactive}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button variant="secondary" onClick={() => openEditModal(term)}>{text.edit}</Button>
                    <Button variant="danger" onClick={() => handleDelete(term)} disabled={deletingId === term.id}>
                      {deletingId === term.id ? text.disabling : text.disable}
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <Modal title={text.addTermTitle} isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)}>
          {renderForm(createForm, setCreateForm, createErrors)}
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)} disabled={isCreateSubmitting}>{text.cancel}</Button>
            <Button onClick={handleCreate} disabled={isCreateSubmitting}>{isCreateSubmitting ? text.saving : text.save}</Button>
          </div>
        </Modal>

        <Modal title={text.editTermTitle} isOpen={isEditOpen} onClose={() => { setIsEditOpen(false); setSelectedTerm(null); }}>
          {renderForm(editForm, setEditForm, editErrors)}
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => { setIsEditOpen(false); setSelectedTerm(null); }} disabled={isEditSubmitting}>{text.cancel}</Button>
            <Button onClick={handleEdit} disabled={isEditSubmitting}>{isEditSubmitting ? text.saving : text.save}</Button>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}
