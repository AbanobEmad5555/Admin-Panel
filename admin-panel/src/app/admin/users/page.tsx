"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/components/layout/AdminLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { useLocalization } from "@/modules/localization/LocalizationProvider";
import api from "@/services/api";
import LocalizedDisplayText from "@/modules/shared/components/LocalizedDisplayText";
import { getLocalizedValue } from "@/modules/localization/utils";

type User = {
  id: number;
  name?: string | null;
  nameEn?: string | null;
  nameAr?: string | null;
  fullName?: string | null;
  full_name?: string | null;
  username?: string | null;
  email?: string | null;
  phone?: string | null;
  phoneNumber?: string | null;
  phone_number?: string | null;
  role?: string | null;
  status?: string | null;
  isActive?: boolean | null;
  createdAt?: string | null;
  created_at?: string | null;
};

type ApiListResponse<T> = {
  success?: boolean;
  data?: T;
  message?: string;
  pagination?: {
    totalItems?: number;
    currentPage?: number;
    totalPages?: number;
    limit?: number;
  };
};

type UsersPayload = {
  users?: User[];
  pagination?: {
    totalItems?: number;
    currentPage?: number;
    totalPages?: number;
    limit?: number;
  };
};

const ROLE_OPTIONS = ["USER", "ADMIN"] as const;

const formatDate = (
  value: string | null | undefined,
  language: "en" | "ar"
) => {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null) {
    const anyError = error as { response?: { data?: { message?: string } } };
    return anyError.response?.data?.message ?? fallback;
  }
  return fallback;
};

const resolveName = (user: User, language: "en" | "ar") =>
  getLocalizedValue({
    en: user.nameEn,
    ar: user.nameAr,
    legacy: user.fullName || user.full_name || user.name || user.username || "Unknown",
    lang: language,
  });

const resolvePhone = (user: User) =>
  user.phoneNumber || user.phone_number || user.phone || "-";

const resolveRole = (user: User) => {
  const raw = user.role ?? "USER";
  return String(raw).toUpperCase();
};

const resolveStatus = (user: User) => {
  if (user.status) {
    return String(user.status).toUpperCase();
  }
  if (typeof user.isActive === "boolean") {
    return user.isActive ? "ACTIVE" : "SUSPENDED";
  }
  return "ACTIVE";
};

const getStatusLabel = (
  status: string,
  language: "en" | "ar"
) => {
  const labels = {
    ACTIVE: language === "ar" ? "نشط" : "ACTIVE",
    SUSPENDED: language === "ar" ? "معلّق" : "SUSPENDED",
  } as const;

  return labels[status as keyof typeof labels] ?? status;
};

const getRoleLabel = (
  role: (typeof ROLE_OPTIONS)[number],
  language: "en" | "ar"
) => {
  if (language === "ar") {
    return role === "ADMIN" ? "مسؤول" : "مستخدم";
  }
  return role;
};

const getStatusBadgeClass = (status: string) => {
  if (status === "ACTIVE") {
    return "bg-emerald-100 text-emerald-700";
  }
  if (status === "SUSPENDED") {
    return "bg-rose-100 text-rose-700";
  }
  return "bg-slate-100 text-slate-700";
};

export default function AdminUsersPage() {
  const { language } = useLocalization();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [error, setError] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [toastError, setToastError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit] = useState(10);

  const [filterId, setFilterId] = useState("");
  const [filterName, setFilterName] = useState("");
  const [filterEmail, setFilterEmail] = useState("");
  const [filterPhone, setFilterPhone] = useState("");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSuspendOpen, setIsSuspendOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [nameEnInput, setNameEnInput] = useState("");
  const [nameArInput, setNameArInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [roleInput, setRoleInput] = useState<(typeof ROLE_OPTIONS)[number]>(
    "USER"
  );
  const [passwordInput, setPasswordInput] = useState("");
  const [actionError, setActionError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rowLoading, setRowLoading] = useState<Record<number, boolean>>({});

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => a.id - b.id),
    [users]
  );

  const text = useMemo(
    () => ({
      genericError:
        language === "ar" ? "حدث خطأ غير متوقع." : "Something went wrong.",
      title: language === "ar" ? "المستخدمون" : "Users",
      subtitle:
        language === "ar"
          ? "إدارة صلاحيات المستخدمين والأدوار والحالة."
          : "Manage user access, roles, and status.",
      addUser: language === "ar" ? "إضافة مستخدم" : "Add User",
      id: language === "ar" ? "المعرّف" : "ID",
      fullName: language === "ar" ? "الاسم الكامل" : "Full Name",
      email: language === "ar" ? "البريد الإلكتروني" : "Email",
      phone: language === "ar" ? "الهاتف" : "Phone",
      role: language === "ar" ? "الدور" : "Role",
      status: language === "ar" ? "الحالة" : "Status",
      createdAt: language === "ar" ? "تاريخ الإنشاء" : "Created At",
      actions: language === "ar" ? "الإجراءات" : "Actions",
      userIdPlaceholder: language === "ar" ? "معرّف المستخدم" : "User ID",
      fullNamePlaceholder: language === "ar" ? "الاسم الكامل" : "Full name",
      emailPlaceholder: language === "ar" ? "البريد الإلكتروني" : "Email",
      phonePlaceholder: language === "ar" ? "الهاتف" : "Phone",
      loading: language === "ar" ? "جارٍ التحميل..." : "Loading...",
      applyFilters: language === "ar" ? "تطبيق الفلاتر" : "Apply Filters",
      reset: language === "ar" ? "إعادة تعيين" : "Reset",
      noUsers: language === "ar" ? "لا يوجد مستخدمون." : "No users found.",
      showing:
        language === "ar"
          ? ({ from, to, total }: { from: number; to: number; total: number }) =>
              `عرض ${from}-${to} من ${total}`
          : ({ from, to, total }: { from: number; to: number; total: number }) =>
              `Showing ${from}-${to} of ${total}`,
      view: language === "ar" ? "عرض" : "View",
      edit: language === "ar" ? "تعديل" : "Edit",
      suspend: language === "ar" ? "تعليق" : "Suspend",
      activate: language === "ar" ? "تفعيل" : "Activate",
      delete: language === "ar" ? "حذف" : "Delete",
      previous: language === "ar" ? "السابق" : "Previous",
      next: language === "ar" ? "التالي" : "Next",
      addUserTitle: language === "ar" ? "إضافة مستخدم" : "Add User",
      editUserTitle: language === "ar" ? "تعديل مستخدم" : "Edit User",
      nameEnglish: language === "ar" ? "الاسم (الإنجليزية)" : "Name (English)",
      nameArabic: language === "ar" ? "الاسم (العربية)" : "Name (Arabic)",
      enterEnglishName:
        language === "ar" ? "أدخل الاسم بالإنجليزية" : "Enter English name",
      enterArabicName:
        language === "ar" ? "أدخل الاسم بالعربية" : "Enter Arabic name",
      enterEmail: language === "ar" ? "أدخل البريد الإلكتروني" : "Enter email",
      password: language === "ar" ? "كلمة المرور" : "Password",
      enterPassword:
        language === "ar" ? "أدخل كلمة المرور" : "Enter password",
      passwordOptional:
        language === "ar" ? "كلمة المرور (اختياري)" : "Password (optional)",
      keepCurrentPassword:
        language === "ar"
          ? "اتركه فارغًا للاحتفاظ بكلمة المرور الحالية"
          : "Leave blank to keep current password",
      cancel: language === "ar" ? "إلغاء" : "Cancel",
      save: language === "ar" ? "حفظ" : "Save",
      saving: language === "ar" ? "جارٍ الحفظ..." : "Saving...",
      suspendUser: language === "ar" ? "تعليق المستخدم" : "Suspend User",
      activateUser: language === "ar" ? "تفعيل المستخدم" : "Activate User",
      confirmSuspend:
        language === "ar"
          ? "هل أنت متأكد من رغبتك في تعليق هذا المستخدم؟"
          : "Are you sure you want to suspend this user?",
      confirmActivate:
        language === "ar"
          ? "هل أنت متأكد من رغبتك في تفعيل هذا المستخدم؟"
          : "Are you sure you want to activate this user?",
      deleteUserTitle: language === "ar" ? "حذف المستخدم" : "Delete User",
      deleteUserBody:
        language === "ar"
          ? "سيتم حذف هذا المستخدم نهائيًا ولا يمكن التراجع عن هذا الإجراء."
          : "This action will permanently remove the user and cannot be undone.",
      deleting: language === "ar" ? "جارٍ الحذف..." : "Deleting...",
      userCreated:
        language === "ar" ? "تم إنشاء المستخدم بنجاح." : "User created successfully.",
      userUpdated:
        language === "ar" ? "تم تحديث المستخدم بنجاح." : "User updated successfully.",
      userActivated: language === "ar" ? "تم تفعيل المستخدم." : "User activated.",
      userSuspended: language === "ar" ? "تم تعليق المستخدم." : "User suspended.",
      userDeleted: language === "ar" ? "تم حذف المستخدم." : "User deleted.",
      unknown: language === "ar" ? "غير معروف" : "Unknown",
    }),
    [language]
  );

  const fetchUsers = useCallback(async (page: number, initial = false) => {
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
      if (filterId.trim()) {
        params.set("id", filterId.trim());
      }
      if (filterName.trim()) {
        params.set("name", filterName.trim());
      }
      if (filterEmail.trim()) {
        params.set("email", filterEmail.trim());
      }
      if (filterPhone.trim()) {
        params.set("phone", filterPhone.trim());
      }
      const response = await api.get<ApiListResponse<UsersPayload | User[]>>(
        `/admin/users?${params.toString()}`
      );
      const payload = response.data?.data ?? response.data;
      const list: User[] = Array.isArray(payload)
        ? payload
        : payload && typeof payload === "object" && "users" in payload
          ? ((payload as UsersPayload).users ?? [])
          : [];
      const filteredList = list.filter((user: User) => resolveStatus(user) !== "DELETED");
      const pagination = Array.isArray(payload)
        ? response.data?.pagination
        : payload && typeof payload === "object" && "pagination" in payload
          ? (payload as UsersPayload).pagination ?? response.data?.pagination
          : response.data?.pagination;

      setUsers(filteredList);
      setCurrentPage(pagination?.currentPage ?? safePage);
      setTotalPages(pagination?.totalPages ?? 1);
      setTotalItems(
        pagination?.totalItems ?? (Array.isArray(list) ? list.length : 0)
      );
    } catch (err) {
      setError(getErrorMessage(err, text.genericError));
    } finally {
      setIsLoading(false);
      setIsPageLoading(false);
    }
  }, [filterEmail, filterId, filterName, filterPhone, limit, text.genericError]);

  useEffect(() => {
    fetchUsers(1, true);
  }, [fetchUsers]);

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

  const openAddModal = () => {
    setActionError("");
    setNameEnInput("");
    setNameArInput("");
    setEmailInput("");
    setRoleInput("USER");
    setPasswordInput("");
    setIsAddOpen(true);
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setActionError("");
    setNameEnInput(user.nameEn ?? user.name ?? resolveName(user, language));
    setNameArInput(user.nameAr ?? "");
    setEmailInput(user.email ?? "");
    setRoleInput(resolveRole(user) as (typeof ROLE_OPTIONS)[number]);
    setPasswordInput("");
    setIsEditOpen(true);
  };

  const openSuspendModal = (user: User) => {
    setSelectedUser(user);
    setActionError("");
    setIsSuspendOpen(true);
  };

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setActionError("");
    setIsDeleteOpen(true);
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    fetchUsers(1);
  };

  const handleResetFilters = () => {
    setFilterId("");
    setFilterName("");
    setFilterEmail("");
    setFilterPhone("");
    setCurrentPage(1);
    fetchUsers(1);
  };

  const handleAdd = async () => {
    setIsSubmitting(true);
    setActionError("");
    setToastMessage("");
    setToastError("");
    try {
      await api.post("/admin/users", {
        name: nameEnInput.trim(),
        nameEn: nameEnInput.trim(),
        nameAr: nameArInput.trim() || undefined,
        email: emailInput.trim(),
        password: passwordInput,
        role: roleInput,
      });
      setIsAddOpen(false);
      setToastMessage(text.userCreated);
      await fetchUsers(currentPage);
    } catch (err) {
      const message = getErrorMessage(err, text.genericError);
      setActionError(message);
      setToastError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedUser) {
      return;
    }
    setIsSubmitting(true);
    setActionError("");
    setToastMessage("");
    setToastError("");
    try {
      const payload: Record<string, unknown> = {
        name: nameEnInput.trim(),
        nameEn: nameEnInput.trim(),
        nameAr: nameArInput.trim() || undefined,
        email: emailInput.trim(),
        role: roleInput,
      };
      if (passwordInput.trim()) {
        payload.password = passwordInput;
      }
      await api.put(`/admin/users/${selectedUser.id}`, payload);
      setIsEditOpen(false);
      setSelectedUser(null);
      setToastMessage(text.userUpdated);
      await fetchUsers(currentPage);
    } catch (err) {
      const message = getErrorMessage(err, text.genericError);
      setActionError(message);
      setToastError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuspendToggle = async () => {
    if (!selectedUser) {
      return;
    }
    const userId = selectedUser.id;
    const currentStatus = resolveStatus(selectedUser);
    const nextStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";

    setIsSubmitting(true);
    setRowLoading((prev) => ({ ...prev, [userId]: true }));
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, status: nextStatus } : user
      )
    );
    setActionError("");
    setToastMessage("");
    setToastError("");
    try {
      await api.patch(`/admin/users/${userId}/status`, { status: nextStatus });
      setIsSuspendOpen(false);
      setSelectedUser(null);
      setToastMessage(nextStatus === "ACTIVE" ? text.userActivated : text.userSuspended);
    } catch (err) {
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, status: currentStatus } : user
        )
      );
      const message = getErrorMessage(err, text.genericError);
      setActionError(message);
      setToastError(message);
    } finally {
      setIsSubmitting(false);
      setRowLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) {
      return;
    }
    setIsSubmitting(true);
    setActionError("");
    setToastMessage("");
    setToastError("");
    try {
      await api.delete(`/admin/users/${selectedUser.id}`);
      setIsDeleteOpen(false);
      setSelectedUser(null);
      setToastMessage(text.userDeleted);
      await fetchUsers(currentPage);
    } catch (err) {
      const message = getErrorMessage(err, text.genericError);
      setActionError(message);
      setToastError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getToggleLabel = (user: User) =>
    resolveStatus(user) === "ACTIVE" ? text.suspend : text.activate;

  return (
    <AdminLayout>
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
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{text.title}</h1>
            <p className="text-sm text-slate-500">{text.subtitle}</p>
          </div>
          <Button onClick={openAddModal}>{text.addUser}</Button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">{text.id}</label>
              <Input
                value={filterId}
                onChange={(event) => setFilterId(event.target.value)}
                placeholder={text.userIdPlaceholder}
                type="number"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">{text.fullName}</label>
              <Input
                value={filterName}
                onChange={(event) => setFilterName(event.target.value)}
                placeholder={text.fullNamePlaceholder}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">{text.email}</label>
              <Input
                value={filterEmail}
                onChange={(event) => setFilterEmail(event.target.value)}
                placeholder={text.emailPlaceholder}
                type="email"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">{text.phone}</label>
              <Input
                value={filterPhone}
                onChange={(event) => setFilterPhone(event.target.value)}
                placeholder={text.phonePlaceholder}
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleApplyFilters}
              disabled={isLoading || isPageLoading}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPageLoading ? text.loading : text.applyFilters}
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              disabled={isLoading || isPageLoading}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {text.reset}
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
          ) : sortedUsers.length === 0 ? (
            <p className="text-sm text-slate-500">{text.noUsers}</p>
          ) : (
            <div className="overflow-x-auto">
              {isPageLoading ? (
                <div className="mb-3 text-xs text-slate-500">{text.loading}</div>
              ) : null}
              {totalItems > 0 ? (
                <div className="mb-3 text-xs text-slate-500">
                  {text.showing({
                    from: (currentPage - 1) * limit + 1,
                    to: Math.min(currentPage * limit, totalItems),
                    total: totalItems,
                  })}
                </div>
              ) : null}
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="py-2 pr-4 font-medium">{text.id}</th>
                    <th className="py-2 pr-4 font-medium">{text.fullName}</th>
                    <th className="py-2 pr-4 font-medium">{text.email}</th>
                    <th className="py-2 pr-4 font-medium">{text.phone}</th>
                    <th className="py-2 pr-4 font-medium">{text.role}</th>
                    <th className="py-2 pr-4 font-medium">{text.status}</th>
                    <th className="py-2 pr-4 font-medium">{text.createdAt}</th>
                    <th className="py-2 font-medium">{text.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sortedUsers.map((user) => {
                    const status = resolveStatus(user);
                    return (
                      <tr key={user.id} className="text-slate-700">
                        <td className="py-3 pr-4">{user.id}</td>
                        <td className="py-3 pr-4">
                          <Link
                            href={`/admin/users/${user.id}`}
                            className="text-slate-900 hover:underline"
                          >
                            <LocalizedDisplayText
                              valueEn={user.nameEn}
                              valueAr={user.nameAr}
                              legacyValue={resolveName(user, language)}
                            />
                          </Link>
                        </td>
                        <td className="py-3 pr-4">{user.email ?? "-"}</td>
                        <td className="py-3 pr-4">{resolvePhone(user)}</td>
                        <td className="py-3 pr-4">
                          {getRoleLabel(resolveRole(user) as (typeof ROLE_OPTIONS)[number], language)}
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(
                              status
                            )}`}
                          >
                            {getStatusLabel(status, language)}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          {formatDate(user.createdAt ?? user.created_at, language)}
                        </td>
                        <td className="py-3">
                          <div className="flex flex-wrap gap-2">
                            <Link
                              href={`/admin/users/${user.id}`}
                              className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                            >
                              {text.view}
                            </Link>
                            <Button
                              variant="secondary"
                              onClick={() => openEditModal(user)}
                              disabled={rowLoading[user.id]}
                            >
                              {text.edit}
                            </Button>
                            <Button
                              variant="secondary"
                              onClick={() => openSuspendModal(user)}
                              disabled={rowLoading[user.id]}
                            >
                              {getToggleLabel(user)}
                            </Button>
                            <Button
                              variant="danger"
                              onClick={() => openDeleteModal(user)}
                              disabled={rowLoading[user.id]}
                            >
                              {text.delete}
                            </Button>
                          </div>
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
              onClick={() => fetchUsers(currentPage - 1)}
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
                    onClick={() => fetchUsers(page)}
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
              onClick={() => fetchUsers(currentPage + 1)}
              disabled={currentPage === totalPages || isPageLoading}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {text.next}
            </button>
          </div>
        ) : null}
      </div>

      <Modal
        title={text.addUserTitle}
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{text.nameEnglish}</label>
            <Input
              value={nameEnInput}
              onChange={(event) => setNameEnInput(event.target.value)}
              placeholder={text.enterEnglishName}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{text.nameArabic}</label>
            <Input
              value={nameArInput}
              onChange={(event) => setNameArInput(event.target.value)}
              placeholder={text.enterArabicName}
              dir="rtl"
              className="text-right"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{text.email}</label>
            <Input
              value={emailInput}
              onChange={(event) => setEmailInput(event.target.value)}
              placeholder={text.enterEmail}
              type="email"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{text.password}</label>
            <Input
              value={passwordInput}
              onChange={(event) => setPasswordInput(event.target.value)}
              placeholder={text.enterPassword}
              type="password"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{text.role}</label>
            <select
              value={roleInput}
              onChange={(event) =>
                setRoleInput(event.target.value as (typeof ROLE_OPTIONS)[number])
              }
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {getRoleLabel(role, language)}
                </option>
              ))}
            </select>
          </div>
          {actionError ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {actionError}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setIsAddOpen(false)}
              disabled={isSubmitting}
            >
              {text.cancel}
            </Button>
            <Button
              onClick={handleAdd}
              disabled={
                isSubmitting ||
                !nameEnInput.trim() ||
                !emailInput.trim() ||
                !passwordInput.trim()
              }
            >
              {isSubmitting ? text.saving : text.save}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        title={text.editUserTitle}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{text.nameEnglish}</label>
            <Input
              value={nameEnInput}
              onChange={(event) => setNameEnInput(event.target.value)}
              placeholder={text.enterEnglishName}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{text.nameArabic}</label>
            <Input
              value={nameArInput}
              onChange={(event) => setNameArInput(event.target.value)}
              placeholder={text.enterArabicName}
              dir="rtl"
              className="text-right"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{text.email}</label>
            <Input
              value={emailInput}
              onChange={(event) => setEmailInput(event.target.value)}
              placeholder={text.enterEmail}
              type="email"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{text.passwordOptional}</label>
            <Input
              value={passwordInput}
              onChange={(event) => setPasswordInput(event.target.value)}
              placeholder={text.keepCurrentPassword}
              type="password"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{text.role}</label>
            <select
              value={roleInput}
              onChange={(event) =>
                setRoleInput(event.target.value as (typeof ROLE_OPTIONS)[number])
              }
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {getRoleLabel(role, language)}
                </option>
              ))}
            </select>
          </div>
          {actionError ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {actionError}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setIsEditOpen(false)}
              disabled={isSubmitting}
            >
              {text.cancel}
            </Button>
            <Button
              onClick={handleEdit}
              disabled={isSubmitting || !nameEnInput.trim() || !emailInput.trim()}
            >
              {isSubmitting ? text.saving : text.save}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        title={
          selectedUser && resolveStatus(selectedUser) === "ACTIVE"
            ? text.suspendUser
            : text.activateUser
        }
        isOpen={isSuspendOpen}
        onClose={() => setIsSuspendOpen(false)}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            {selectedUser && resolveStatus(selectedUser) === "ACTIVE"
              ? text.confirmSuspend
              : text.confirmActivate}
          </p>
          {actionError ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {actionError}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setIsSuspendOpen(false)}
              disabled={isSubmitting}
            >
              {text.cancel}
            </Button>
            <Button
              onClick={handleSuspendToggle}
              disabled={isSubmitting}
            >
              {selectedUser && resolveStatus(selectedUser) === "ACTIVE"
                ? text.suspend
                : text.activate}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        title={text.deleteUserTitle}
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            {text.deleteUserBody}
          </p>
          {actionError ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {actionError}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setIsDeleteOpen(false)}
              disabled={isSubmitting}
            >
              {text.cancel}
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? text.deleting : text.delete}
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
