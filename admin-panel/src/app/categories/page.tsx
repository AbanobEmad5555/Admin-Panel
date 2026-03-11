"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/components/layout/AdminLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { useLocalization } from "@/modules/localization/LocalizationProvider";
import api from "@/services/api";
import LocalizedDisplayText from "@/modules/shared/components/LocalizedDisplayText";
import { getLocalizedValue } from "@/modules/localization/utils";

type Category = {
  id: number;
  name: string;
  nameEn?: string | null;
  nameAr?: string | null;
  createdAt: string;
  image?: string | null;
  imageUrl?: string | null;
  image_path?: string | null;
};

type ApiListResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

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

const resolveImageUrl = (category: Category) => {
  const raw =
    category.imageUrl || category.image || category.image_path || "";
  if (!raw) {
    return "";
  }
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  return `${base.replace(/\/$/, "")}/${raw.replace(/^\//, "")}`;
};

const getErrorMessage = (error: unknown) => {
  if (typeof error === "object" && error !== null) {
    const anyError = error as { response?: { data?: { message?: string } } };
    return anyError.response?.data?.message ?? "Something went wrong.";
  }
  return "Something went wrong.";
};

export default function CategoriesPage() {
  const { language } = useLocalization();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterId, setFilterId] = useState("");
  const [filterName, setFilterName] = useState("");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [nameEnInput, setNameEnInput] = useState("");
  const [nameArInput, setNameArInput] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.id - b.id),
    [categories]
  );

  const fetchCategories = async (params?: URLSearchParams) => {
    setIsLoading(true);
    setError("");
    try {
      const query = params?.toString() ?? "";
      const response = await api.get<ApiListResponse<Category[]>>(
        `/categories${query ? `?${query}` : ""}`
      );
      setCategories(response.data?.data ?? []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleApplyFilters = () => {
    const params = new URLSearchParams();
    if (filterId.trim()) {
      params.set("id", filterId.trim());
    }
    if (filterName.trim()) {
      params.set("name", filterName.trim());
    }
    fetchCategories(params);
  };

  const handleResetFilters = () => {
    setFilterId("");
    setFilterName("");
    fetchCategories();
  };

  useEffect(() => {
    if (!toastMessage) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setToastMessage("");
    }, 5000);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  const openAddModal = () => {
    setActionError("");
    setSuccessMessage("");
    setNameEnInput("");
    setNameArInput("");
    setImageFile(null);
    setIsAddOpen(true);
  };

  const openEditModal = (category: Category) => {
    setSelectedCategory(category);
    setNameEnInput(category.nameEn ?? category.name);
    setNameArInput(category.nameAr ?? "");
    setActionError("");
    setEditImageFile(null);
    setIsEditOpen(true);
  };

  const openDeleteModal = (category: Category) => {
    setSelectedCategory(category);
    setActionError("");
    setIsDeleteOpen(true);
  };

  const handleAdd = async () => {
    setIsSubmitting(true);
    setActionError("");
    setSuccessMessage("");
    try {
      if (!imageFile) {
        const message = "Category image is required.";
        setActionError(message);
        setToastMessage(message);
        return;
      }
      const formData = new FormData();
      formData.append("name", nameEnInput.trim());
      formData.append("nameEn", nameEnInput.trim());
      if (nameArInput.trim()) {
        formData.append("nameAr", nameArInput.trim());
      }
      formData.append("image", imageFile);
      await api.post("/categories", formData);
      setSuccessMessage("Category created successfully.");
      setIsAddOpen(false);
      await fetchCategories();
    } catch (err) {
      const message = getErrorMessage(err);
      setActionError(message);
      setToastMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedCategory) {
      return;
    }
    setIsSubmitting(true);
    setActionError("");
    try {
      const trimmedName = nameEnInput.trim();
      if (editImageFile) {
        const formData = new FormData();
        formData.append("name", trimmedName);
        formData.append("nameEn", trimmedName);
        if (nameArInput.trim()) {
          formData.append("nameAr", nameArInput.trim());
        }
        formData.append("image", editImageFile);
        await api.put(`/categories/${selectedCategory.id}`, formData);
      } else {
        await api.put(`/categories/${selectedCategory.id}`, {
          name: trimmedName,
          nameEn: trimmedName,
          nameAr: nameArInput.trim() || undefined,
        });
      }
      setIsEditOpen(false);
      setSelectedCategory(null);
      await fetchCategories();
    } catch (err) {
      const message = getErrorMessage(err);
      setActionError(message);
      setToastMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) {
      return;
    }
    setIsSubmitting(true);
    setActionError("");
    try {
      await api.delete(`/categories/${selectedCategory.id}`);
      setIsDeleteOpen(false);
      setSelectedCategory(null);
      await fetchCategories();
    } catch (err) {
      const message = getErrorMessage(err);
      setActionError(message);
      setToastMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {toastMessage ? (
          <div className="flex items-center justify-between rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
            <span>{toastMessage}</span>
            <button
              type="button"
              onClick={() => setToastMessage("")}
              className="text-rose-600 hover:text-rose-800"
            >
              ×
            </button>
          </div>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {language === "ar" ? "الفئات" : "Categories"}
            </h1>
            <p className="text-sm text-slate-500">
              {language === "ar"
                ? "إدارة فئات المنتجات وظهورها."
                : "Manage product categories and visibility."}
            </p>
          </div>
          <Button onClick={openAddModal}>
            {language === "ar" ? "إضافة فئة" : "Add Category"}
          </Button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">ID</label>
              <Input
                value={filterId}
                onChange={(event) => setFilterId(event.target.value)}
                placeholder="ID"
                type="number"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {language === "ar" ? "اسم الفئة" : "Category Name"}
              </label>
              <select
                value={filterName}
                onChange={(event) => setFilterName(event.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value="">{language === "ar" ? "الكل" : "All"}</option>
                {sortedCategories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {getLocalizedValue({
                      en: category.nameEn,
                      ar: category.nameAr,
                      legacy: category.name,
                      lang: language,
                    })}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleApplyFilters}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              {language === "ar" ? "تطبيق الفلاتر" : "Apply Filters"}
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              {language === "ar" ? "إعادة الضبط" : "Reset Filters"}
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
          ) : sortedCategories.length === 0 ? (
            <p className="text-sm text-slate-500">
              {language === "ar" ? "لا توجد فئات." : "No categories found."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className={`w-full text-sm ${language === "ar" ? "text-right" : "text-left"}`}>
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="py-2 pr-4 font-medium">ID</th>
                    <th className="py-2 pr-4 font-medium">{language === "ar" ? "الصورة" : "Image"}</th>
                    <th className="py-2 pr-4 font-medium">{language === "ar" ? "اسم الفئة" : "Category Name"}</th>
                    <th className="py-2 pr-4 font-medium">{language === "ar" ? "تاريخ الإنشاء" : "Created At"}</th>
                    <th className="py-2 font-medium">{language === "ar" ? "الإجراءات" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sortedCategories.map((category) => (
                    <tr key={category.id} className="text-slate-700">
                      <td className="py-3 pr-4">{category.id}</td>
                      <td className="py-3 pr-4">
                        {resolveImageUrl(category) ? (
                          <img
                            src={resolveImageUrl(category)}
                          alt={category.name}
                            className="h-10 w-10 rounded-md object-cover"
                          />
                        ) : (
                          <span className="text-xs text-slate-400">
                            {language === "ar" ? "لا توجد صورة" : "No image"}
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <Link
                          href={`/categories/${category.id}`}
                          className="text-slate-900 hover:underline"
                        >
                          <LocalizedDisplayText
                            valueEn={category.nameEn}
                            valueAr={category.nameAr}
                            legacyValue={category.name}
                          />
                        </Link>
                      </td>
                      <td className="py-3 pr-4">
                        {formatDate(category.createdAt)}
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="secondary"
                            onClick={() => openEditModal(category)}
                          >
                            {language === "ar" ? "تعديل" : "Edit"}
                          </Button>
                          <Button
                            variant="danger"
                            onClick={() => openDeleteModal(category)}
                          >
                            {language === "ar" ? "حذف" : "Delete"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Modal
          title={language === "ar" ? "إضافة فئة" : "Add Category"}
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {language === "ar" ? "اسم الفئة (بالإنجليزية)" : "Category Name (English)"}
              </label>
              <Input
                value={nameEnInput}
                onChange={(event) => setNameEnInput(event.target.value)}
                placeholder={language === "ar" ? "أدخل اسم الفئة" : "Enter category name"}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {language === "ar" ? "اسم الفئة (بالعربية)" : "Category Name (Arabic)"}
              </label>
              <Input
                value={nameArInput}
                onChange={(event) => setNameArInput(event.target.value)}
                placeholder={language === "ar" ? "أدخل اسم الفئة بالعربية" : "Enter Arabic category name"}
                dir="rtl"
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {language === "ar" ? "صورة الفئة" : "Category Image"}
              </label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={(event) =>
                  setImageFile(event.target.files?.[0] ?? null)
                }
                className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
              />
              {imageFile ? (
                <p className="text-xs text-slate-500">{imageFile.name}</p>
              ) : null}
            </div>
            {successMessage ? (
              <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {successMessage}
              </p>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setIsAddOpen(false)}
                disabled={isSubmitting}
              >
                {language === "ar" ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                onClick={handleAdd}
                disabled={
                  isSubmitting ||
                  nameEnInput.trim().length === 0 ||
                  imageFile === null
                }
              >
                {isSubmitting
                  ? language === "ar"
                    ? "جارٍ الحفظ..."
                    : "Saving..."
                  : language === "ar"
                    ? "حفظ"
                    : "Save"}
              </Button>
            </div>
          </div>
        </Modal>

        <Modal
          title={language === "ar" ? "تعديل الفئة" : "Edit Category"}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {language === "ar" ? "اسم الفئة (بالإنجليزية)" : "Category Name (English)"}
              </label>
              <Input
                value={nameEnInput}
                onChange={(event) => setNameEnInput(event.target.value)}
                placeholder={language === "ar" ? "أدخل اسم الفئة" : "Enter category name"}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {language === "ar" ? "اسم الفئة (بالعربية)" : "Category Name (Arabic)"}
              </label>
              <Input
                value={nameArInput}
                onChange={(event) => setNameArInput(event.target.value)}
                placeholder={language === "ar" ? "أدخل اسم الفئة بالعربية" : "Enter Arabic category name"}
                dir="rtl"
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {language === "ar" ? "صورة الفئة" : "Category Image"}
              </label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={(event) =>
                  setEditImageFile(event.target.files?.[0] ?? null)
                }
                className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
              />
              {editImageFile ? (
                <p className="text-xs text-slate-500">{editImageFile.name}</p>
              ) : null}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setIsEditOpen(false)}
                disabled={isSubmitting}
              >
                {language === "ar" ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                onClick={handleEdit}
                disabled={isSubmitting || nameEnInput.trim().length === 0}
              >
                {isSubmitting
                  ? language === "ar"
                    ? "جارٍ التحديث..."
                    : "Updating..."
                  : language === "ar"
                    ? "تحديث"
                    : "Update"}
              </Button>
            </div>
          </div>
        </Modal>

        <Modal
          title={language === "ar" ? "حذف الفئة" : "Delete Category"}
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              {language === "ar"
                ? "هل أنت متأكد من حذف هذه الفئة؟ لا يمكن التراجع عن هذا الإجراء."
                : "Are you sure you want to delete this category? This action cannot be undone."}
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setIsDeleteOpen(false)}
                disabled={isSubmitting}
              >
                {language === "ar" ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? language === "ar"
                    ? "جارٍ الحذف..."
                    : "Deleting..."
                  : language === "ar"
                    ? "حذف"
                    : "Delete"}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}
