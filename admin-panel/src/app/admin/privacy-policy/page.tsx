"use client";

import { useCallback, useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { extractList } from "@/lib/extractList";
import privacyPolicyApi, {
  PrivacyPolicyRecord,
} from "@/services/privacyPolicyApi";
import LocalizedDisplayText from "@/modules/shared/components/LocalizedDisplayText";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

type AlertState = { type: "success" | "error"; text: string };

type PolicyForm = {
  questionEn: string;
  questionAr: string;
  answerEn: string;
  answerAr: string;
  isActive: boolean;
};

type ValidationErrors = {
  question?: string;
  answer?: string;
};

const initialForm: PolicyForm = {
  questionEn: "",
  questionAr: "",
  answerEn: "",
  answerAr: "",
  isActive: true,
};

const validateForm = (
  values: PolicyForm,
  messages: {
    questionMin: string;
    questionMax: string;
    answerMin: string;
    answerMax: string;
  }
): ValidationErrors => {
  const errors: ValidationErrors = {};
  if (values.questionEn.trim().length < 3) {
    errors.question = messages.questionMin;
  } else if (values.questionEn.trim().length > 500) {
    errors.question = messages.questionMax;
  }
  if (values.answerEn.trim().length < 3) {
    errors.answer = messages.answerMin;
  } else if (values.answerEn.trim().length > 5000) {
    errors.answer = messages.answerMax;
  }
  return errors;
};

export default function AdminPrivacyPolicyPage() {
  const { language } = useLocalization();
  const text =
    language === "ar"
      ? {
          questionMin: "يجب أن يكون السؤال 3 أحرف على الأقل.",
          questionMax: "يجب ألا يزيد السؤال عن 500 حرف.",
          answerMin: "يجب أن تكون الإجابة 3 أحرف على الأقل.",
          answerMax: "يجب ألا تزيد الإجابة عن 5000 حرف.",
          loadFailed: "فشل تحميل سياسات الخصوصية.",
          saved: "تم حفظ سياسة الخصوصية بنجاح.",
          deleted: "تم حذف سياسة الخصوصية.",
          genericError: "حدث خطأ ما.",
          title: "سياسة الخصوصية",
          subtitle:
            "استعرض الأسئلة عبر GET /privacy-policy وأدر السجلات باستخدام POST/PUT/DELETE.",
          addPolicy: "إضافة سياسة",
          browseList:
            "استعرض قائمة سياسات الخصوصية عبر GET /privacy-policy.",
          loading: "جارٍ تحميل سياسات الخصوصية...",
          noPolicies:
            'لا توجد سياسات بعد. استخدم "إضافة سياسة" لإنشاء أول سجل.',
          question: "السؤال",
          answer: "الإجابة",
          status: "الحالة",
          actions: "الإجراءات",
          active: "نشط",
          inactive: "غير نشط",
          edit: "تعديل",
          delete: "حذف",
          previous: "السابق",
          next: "التالي",
          page: "الصفحة",
          addPolicyTitle: "إضافة سياسة",
          editPolicyTitle: "تعديل السياسة",
          questionEn: "السؤال (بالإنجليزية)",
          questionAr: "السؤال (بالعربية)",
          answerEn: "الإجابة (بالإنجليزية)",
          answerAr: "الإجابة (بالعربية)",
          enterQuestion: "أدخل السؤال",
          enterArabicQuestion: "أدخل السؤال بالعربية",
          enterAnswer: "أدخل الإجابة",
          enterArabicAnswer: "أدخل الإجابة بالعربية",
          cancel: "إلغاء",
          save: "حفظ",
          saving: "جارٍ الحفظ...",
          confirmDelete: "تأكيد الحذف",
          deleteConfirmBody: "هل تريد حذف سياسة الخصوصية هذه؟",
          deleting: "جارٍ الحذف...",
        }
      : {
          questionMin: "Question must be at least 3 characters.",
          questionMax: "Question cannot exceed 500 characters.",
          answerMin: "Answer must be at least 3 characters.",
          answerMax: "Answer cannot exceed 5000 characters.",
          loadFailed: "Failed to load privacy policies.",
          saved: "Privacy policy saved successfully.",
          deleted: "Privacy policy deleted.",
          genericError: "Something went wrong.",
          title: "Privacy Policy",
          subtitle:
            "Browse questions via GET /privacy-policy and manage entries with POST/PUT/DELETE.",
          addPolicy: "Add Policy",
          browseList:
            "Browse the privacy policy list (paginated via GET /privacy-policy).",
          loading: "Loading privacy policies...",
          noPolicies:
            'No policies found. Use "Add Policy" to create the first entry.',
          question: "Question",
          answer: "Answer",
          status: "Status",
          actions: "Actions",
          active: "Active",
          inactive: "Inactive",
          edit: "Edit",
          delete: "Delete",
          previous: "Previous",
          next: "Next",
          page: "Page",
          addPolicyTitle: "Add Policy",
          editPolicyTitle: "Edit Policy",
          questionEn: "Question (English)",
          questionAr: "Question (Arabic)",
          answerEn: "Answer (English)",
          answerAr: "Answer (Arabic)",
          enterQuestion: "Enter question",
          enterArabicQuestion: "Enter Arabic question",
          enterAnswer: "Enter answer",
          enterArabicAnswer: "Enter Arabic answer",
          cancel: "Cancel",
          save: "Save",
          saving: "Saving...",
          confirmDelete: "Confirm delete",
          deleteConfirmBody: "Are you sure you want to delete this privacy policy?",
          deleting: "Deleting...",
        };
  const [policies, setPolicies] = useState<PrivacyPolicyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [alert, setAlert] = useState<AlertState | null>(null);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formValues, setFormValues] = useState<PolicyForm>(initialForm);
  const [formErrors, setFormErrors] = useState<ValidationErrors>({});
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [selectedPolicy, setSelectedPolicy] =
    useState<PrivacyPolicyRecord | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<PrivacyPolicyRecord | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPolicies = useCallback(async () => {
    setIsLoading(true);
    setFetchError("");
    try {
      const response = await privacyPolicyApi.getPrivacyPolicies({
        page,
        limit,
      });
      setPolicies(extractList<PrivacyPolicyRecord>(response.data?.data ?? response.data));
    } catch {
      setFetchError(text.loadFailed);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, text.loadFailed]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const hasPrev = page > 1;
  const hasNext = policies.length === limit;

  const openCreate = () => {
    setSelectedPolicy(null);
    setFormMode("create");
    setFormValues(initialForm);
    setFormErrors({});
    setIsFormOpen(true);
  };

  const openEdit = (policy: PrivacyPolicyRecord) => {
    setSelectedPolicy(policy);
    setFormMode("edit");
    setFormValues({
      questionEn: policy.questionEn ?? policy.question,
      questionAr: policy.questionAr ?? "",
      answerEn: policy.answerEn ?? policy.answer,
      answerAr: policy.answerAr ?? "",
      isActive: policy.isActive,
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const submitForm = async () => {
    const errors = validateForm(formValues, text);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setIsFormSubmitting(true);
    try {
      const payload = {
        question: formValues.questionEn.trim(),
        answer: formValues.answerEn.trim(),
        questionEn: formValues.questionEn.trim(),
        questionAr: formValues.questionAr.trim() || undefined,
        answerEn: formValues.answerEn.trim(),
        answerAr: formValues.answerAr.trim() || undefined,
        isActive: formValues.isActive,
      };
      const response =
        formMode === "create"
          ? await privacyPolicyApi.createPrivacyPolicy(payload)
          : selectedPolicy
          ? await privacyPolicyApi.updatePrivacyPolicy(selectedPolicy.id, payload)
          : null;
      setAlert({
        type: "success",
        text: response?.data?.message ?? text.saved,
      });
      setIsFormOpen(false);
      setPage(1);
      await fetchPolicies();
    } catch {
      setAlert({ type: "error", text: text.genericError });
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const response = await privacyPolicyApi.deletePrivacyPolicy(
        deleteTarget.id
      );
      setAlert({
        type: "success",
        text: response.data?.message ?? text.deleted,
      });
      setDeleteTarget(null);
      await fetchPolicies();
    } catch {
      setAlert({ type: "error", text: text.genericError });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {text.title}
            </h1>
            <p className="text-sm text-slate-600">
              {text.subtitle}
            </p>
          </div>
          <Button onClick={openCreate}>{text.addPolicy}</Button>
        </div>

        {alert ? (
          <div
            className={`rounded-md border px-4 py-2 text-sm ${
              alert.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {alert.text}
          </div>
        ) : null}

        {fetchError ? (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
            {fetchError}
          </p>
        ) : null}

        <div className="text-sm text-slate-600">
          {text.browseList}
        </div>

        {isLoading ? (
          <p className="text-sm text-slate-600">{text.loading}</p>
        ) : policies.length === 0 ? (
          <p className="text-sm text-slate-600">
            {text.noPolicies}
          </p>
        ) : (
          <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-3">{text.question}</th>
                  <th className="px-3 py-3">{text.answer}</th>
                  <th className="px-3 py-3">{text.status}</th>
                  <th className="px-3 py-3">{text.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {policies.map((policy) => (
                  <tr key={policy.id}>
                    <td className="px-3 py-3">
                      <p className="font-semibold text-slate-900">
                        <LocalizedDisplayText
                          valueEn={policy.questionEn}
                          valueAr={policy.questionAr}
                          legacyValue={policy.question}
                        />
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-sm text-slate-600">
                        {policy.answer.length > 120
                          ? `${policy.answer.slice(0, 120)}…`
                          : policy.answer}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                          policy.isActive
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-rose-200 bg-rose-50 text-rose-700"
                        }`}
                      >
                        {policy.isActive ? text.active : text.inactive}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => openEdit(policy)}
                          className="text-xs"
                        >
                          {text.edit}
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => setDeleteTarget(policy)}
                          className="text-xs"
                        >
                          {text.delete}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          <Button
            variant="secondary"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={!hasPrev}
            className="text-xs"
          >
            {text.previous}
          </Button>
          <span className="text-sm text-slate-500">{text.page} {page}</span>
          <Button
            variant="secondary"
            onClick={() => setPage((prev) => prev + 1)}
            disabled={!hasNext}
            className="text-xs"
          >
            {text.next}
          </Button>
        </div>

        <Modal
          title={formMode === "create" ? text.addPolicyTitle : text.editPolicyTitle}
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
        >
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">
                {text.questionEn}
              </label>
              <Input
                value={formValues.questionEn}
                onChange={(event) =>
                  setFormValues((prev) => ({
                    ...prev,
                    questionEn: event.target.value,
                  }))
                }
                placeholder={text.enterQuestion}
              />
              {formErrors.question ? (
                <p className="mt-1 text-xs text-rose-600">
                  {formErrors.question}
                </p>
              ) : null}
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                {text.questionAr}
              </label>
              <Input
                value={formValues.questionAr}
                onChange={(event) =>
                  setFormValues((prev) => ({
                    ...prev,
                    questionAr: event.target.value,
                  }))
                }
                placeholder={text.enterArabicQuestion}
                dir="rtl"
                className="text-right"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                {text.answerEn}
              </label>
              <textarea
                value={formValues.answerEn}
                onChange={(event) =>
                  setFormValues((prev) => ({
                    ...prev,
                    answerEn: event.target.value,
                  }))
                }
                rows={6}
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                placeholder={text.enterAnswer}
              />
              {formErrors.answer ? (
                <p className="mt-1 text-xs text-rose-600">
                  {formErrors.answer}
                </p>
              ) : null}
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                {text.answerAr}
              </label>
              <textarea
                value={formValues.answerAr}
                onChange={(event) =>
                  setFormValues((prev) => ({
                    ...prev,
                    answerAr: event.target.value,
                  }))
                }
                rows={6}
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-right text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                placeholder={text.enterArabicAnswer}
                dir="rtl"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={formValues.isActive}
                onChange={(event) =>
                  setFormValues((prev) => ({
                    ...prev,
                    isActive: event.target.checked,
                  }))
                }
                className="h-4 w-4 accent-slate-900"
              />
              {text.active}
            </label>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setIsFormOpen(false)}
                disabled={isFormSubmitting}
              >
                {text.cancel}
              </Button>
              <Button onClick={submitForm} disabled={isFormSubmitting}>
                {isFormSubmitting ? text.saving : text.save}
              </Button>
            </div>
          </div>
        </Modal>

        <Modal
          title={text.confirmDelete}
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              {text.deleteConfirmBody}
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
              >
                {text.cancel}
              </Button>
              <Button
                variant="danger"
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? text.deleting : text.delete}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}
