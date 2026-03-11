"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import type { AxiosError } from "axios";
import { FilePlus2, Pencil, ShieldAlert, UserRoundX } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/layout/AdminLayout";
import Button from "@/components/ui/Button";
import ConfirmDeleteModal from "@/components/purchases/ConfirmDeleteModal";
import AuditLogsList from "@/features/team/components/AuditLogsList";
import DocumentsTable from "@/features/team/components/DocumentsTable";
import EditEmployeeDrawer from "@/features/team/components/EditEmployeeDrawer";
import StatusBadge from "@/features/team/components/StatusBadge";
import StatusChangeModal from "@/features/team/components/StatusChangeModal";
import UploadDocumentModal from "@/features/team/components/UploadDocumentModal";
import { teamApi } from "@/features/team/api/team.api";
import {
  useChangeEmployeeStatus,
  useDeleteEmployeeDocument,
  useEmployee,
  useEmployeeAuditLogs,
  useEmployeeDocuments,
  useUpdateEmployee,
  useUploadEmployeeDocument,
} from "@/features/team/hooks/useTeam";
import type { EmployeeDocument, EmploymentType } from "@/features/team/types";
import { formatEGP } from "@/lib/currency";
import {
  getCachedEmploymentType,
  setCachedEmploymentType,
} from "@/features/team/utils/employmentTypeCache";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

const getStatus = (error: unknown) => (error as AxiosError)?.response?.status;
const getErrorMessage = (error: unknown, fallback = "Something went wrong.") =>
  ((error as AxiosError<{ message?: string }>)?.response?.data?.message ?? fallback);

export default function TeamProfilePage() {
  const { language } = useLocalization();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const employeeId = params.id;
  const tabParam = searchParams.get("tab");
  const tab = tabParam === "documents" || tabParam === "audit" ? tabParam : "overview";
  const auditPage = Math.max(1, Number(searchParams.get("auditPage") ?? "1"));

  const employeeQuery = useEmployee(employeeId);
  const documentsQuery = useEmployeeDocuments(employeeId);
  const auditLogsQuery = useEmployeeAuditLogs(employeeId, auditPage, 20);

  const updateMutation = useUpdateEmployee(employeeId);
  const profileImageMutation = useUpdateEmployee(employeeId);
  const statusMutation = useChangeEmployeeStatus(employeeId);
  const uploadMutation = useUploadEmployeeDocument(employeeId);
  const deleteDocMutation = useDeleteEmployeeDocument(employeeId);

  const [editOpen, setEditOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteDoc, setDeleteDoc] = useState<EmployeeDocument | null>(null);
  const profileImageInputRef = useRef<HTMLInputElement | null>(null);

  const text = useMemo(
    () =>
      language === "ar"
        ? {
            genericError: "حدث خطأ غير متوقع.",
            team: "الفريق",
            employeeProfile: "ملف الموظف",
            backToTeam: "العودة إلى الفريق",
            forbidden: "ممنوع",
            forbiddenMessage: "ليست لديك صلاحية لعرض هذا الموظف.",
            notFound: "لم يتم العثور على الموظف.",
            profileImageUploadFailed: "فشل رفع صورة الملف الشخصي.",
            profilePictureUpdated: "تم تحديث صورة الملف الشخصي.",
            profilePictureRemoved: "تم حذف صورة الملف الشخصي.",
            changePhoto: "تغيير الصورة",
            uploadPhoto: "رفع صورة",
            deletePhoto: "حذف الصورة",
            edit: "تعديل",
            changeStatus: "تغيير الحالة",
            employeeDetails: "تفاصيل الموظف",
            employeeId: "معرّف الموظف:",
            autoAssigned: "تلقائي",
            title: "المسمى الوظيفي:",
            employmentType: "نوع التوظيف:",
            department: "القسم:",
            email: "البريد الإلكتروني:",
            phone: "الهاتف:",
            salary: "الراتب:",
            shift: "الوردية:",
            workingDays: "أيام العمل:",
            rating: "التقييم:",
            hireDate: "تاريخ التعيين:",
            notes: "ملاحظات:",
            overview: "نظرة عامة",
            documents: "المستندات",
            auditLogs: "سجلات المراجعة",
            overviewHint: "اختر المستندات أو سجلات المراجعة لعرض سجلات الموظف.",
            uploadDocument: "رفع مستند",
            loadingDocuments: "جارٍ تحميل المستندات...",
            noDocuments: "لا توجد مستندات مرفوعة بعد.",
            loadingAuditLogs: "جارٍ تحميل سجلات المراجعة...",
            noAuditLogs: "لا توجد سجلات مراجعة.",
            previous: "السابق",
            next: "التالي",
            page: "الصفحة",
            of: "من",
            employeeUpdated: "تم تحديث الموظف.",
            employeeStatusUpdated: "تم تحديث حالة الموظف.",
            uploadFilesFailed: "فشل رفع الملفات المحددة.",
            documentsUploaded: (count: number) => `تم رفع ${count} مستندات.`,
            documentUploaded: "تم رفع المستند.",
            deleteDocumentTitle: "حذف المستند",
            deleteDocumentDescription: (title?: string) => `حذف "${title ?? "المستند"}"؟`,
            documentDeleted: "تم حذف المستند.",
          }
        : {
            genericError: "Something went wrong.",
            team: "Team",
            employeeProfile: "Employee Profile",
            backToTeam: "Back to Team",
            forbidden: "Forbidden",
            forbiddenMessage: "You don't have permission to view this employee.",
            notFound: "Employee not found.",
            profileImageUploadFailed: "Failed to upload profile image.",
            profilePictureUpdated: "Profile picture updated.",
            profilePictureRemoved: "Profile picture removed.",
            changePhoto: "Change Photo",
            uploadPhoto: "Upload Photo",
            deletePhoto: "Delete Photo",
            edit: "Edit",
            changeStatus: "Change Status",
            employeeDetails: "Employee Details",
            employeeId: "Employee ID:",
            autoAssigned: "Auto assigned",
            title: "Title:",
            employmentType: "Employment Type:",
            department: "Department:",
            email: "Email:",
            phone: "Phone:",
            salary: "Salary:",
            shift: "Shift:",
            workingDays: "Working Days:",
            rating: "Rating:",
            hireDate: "Hire Date:",
            notes: "Notes:",
            overview: "Overview",
            documents: "Documents",
            auditLogs: "Audit Logs",
            overviewHint: "Select Documents or Audit Logs to view employee records.",
            uploadDocument: "Upload Document",
            loadingDocuments: "Loading documents...",
            noDocuments: "No documents uploaded yet.",
            loadingAuditLogs: "Loading audit logs...",
            noAuditLogs: "No audit logs available.",
            previous: "Previous",
            next: "Next",
            page: "Page",
            of: "of",
            employeeUpdated: "Employee updated.",
            employeeStatusUpdated: "Employee status updated.",
            uploadFilesFailed: "Failed to upload selected files.",
            documentsUploaded: (count: number) => `${count} documents uploaded.`,
            documentUploaded: "Document uploaded.",
            deleteDocumentTitle: "Delete Document",
            deleteDocumentDescription: (title?: string) => `Delete "${title ?? "document"}"?`,
            documentDeleted: "Document deleted.",
          },
    [language]
  );

  const employee = employeeQuery.data ?? null;
  const forbidden = getStatus(employeeQuery.error) === 403;
  const notFound = getStatus(employeeQuery.error) === 404;
  const documentRows = documentsQuery.data ?? [];

  const changeTab = (next: "overview" | "documents" | "audit") => {
    const query = new URLSearchParams(searchParams.toString());
    query.set("tab", next);
    if (next !== "audit") {
      query.delete("auditPage");
    }
    router.replace(`/admin/team/${employeeId}?${query.toString()}`);
  };

  const canShow = !employeeQuery.isLoading && !employeeQuery.isError && employee;
  const profileImage = useMemo(
    () => employee?.profileImageUrl || "https://placehold.co/160x160/e2e8f0/334155?text=EMP",
    [employee?.profileImageUrl]
  );
  const displayedEmploymentType = useMemo<EmploymentType | null>(
    () => employee?.employmentType ?? getCachedEmploymentType(employeeId),
    [employee?.employmentType, employeeId]
  );

  useEffect(() => {
    if (!employee?.id || !employee.employmentType) {
      return;
    }
    setCachedEmploymentType(employee.id, employee.employmentType);
  }, [employee?.employmentType, employee?.id]);

  const handleProfileImageUpload = async (file: File) => {
    try {
      const uploadedUrls = await teamApi.uploadFiles([file]);
      const imageUrl = uploadedUrls[0];
      if (!imageUrl) {
        toast.error(text.profileImageUploadFailed);
        return;
      }

      await profileImageMutation.mutateAsync({ profileImageUrl: imageUrl });
      toast.success(text.profilePictureUpdated);
    } catch (error) {
      toast.error(getErrorMessage(error, text.genericError));
    }
  };

  const handleProfileImageDelete = () => {
    profileImageMutation.mutate(
      { profileImageUrl: null },
      {
        onSuccess: () => toast.success(text.profilePictureRemoved),
        onError: (error) => toast.error(getErrorMessage(error, text.genericError)),
      }
    );
  };

  return (
    <AdminLayout>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-900">
            <Link href="/admin/team" className="hover:text-slate-900">
              {text.team}
            </Link>{" "}
            / {text.employeeProfile}
          </div>
          <Link href="/admin/team" className="text-sm text-slate-900 hover:text-slate-900">
            {text.backToTeam}
          </Link>
        </div>

        {employeeQuery.isLoading ? (
          <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="h-10 animate-pulse rounded bg-slate-200" />
            <div className="h-8 animate-pulse rounded bg-slate-200" />
          </div>
        ) : null}

        {forbidden ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-800 shadow-sm">
            <div className="flex items-center gap-2 font-medium">
              <ShieldAlert className="h-5 w-5" />
              {text.forbidden}
            </div>
            <p className="mt-2 text-sm">{text.forbiddenMessage}</p>
          </div>
        ) : null}

        {notFound ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            {text.notFound}
          </div>
        ) : null}

        {employeeQuery.isError && !forbidden && !notFound ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700 shadow-sm">
            {getErrorMessage(employeeQuery.error, text.genericError)}
          </div>
        ) : null}

        {canShow ? (
          <>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src={profileImage}
                    alt={employee.fullName}
                    className="h-[72px] w-[72px] rounded-full object-cover ring-1 ring-slate-200"
                    onError={(event) => {
                      event.currentTarget.src =
                        "https://placehold.co/160x160/e2e8f0/334155?text=EMP";
                    }}
                  />
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900">{employee.fullName}</h1>
                    <p className="text-sm text-slate-900">
                      {employee.employeeCode || `AUTO-${employee.id.slice(0, 6)}`} • {employee.role}
                    </p>
                    <div className="mt-2">
                      <StatusBadge status={employee.status} />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <input
                        ref={profileImageInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          const selectedFile = event.target.files?.[0];
                          if (!selectedFile) {
                            return;
                          }
                          void handleProfileImageUpload(selectedFile);
                          event.currentTarget.value = "";
                        }}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-8 px-3 text-xs"
                        disabled={profileImageMutation.isPending}
                        onClick={() => profileImageInputRef.current?.click()}
                      >
                        {employee.profileImageUrl ? text.changePhoto : text.uploadPhoto}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-8 border-rose-200 px-3 text-xs text-rose-700 hover:bg-rose-50"
                        disabled={!employee.profileImageUrl || profileImageMutation.isPending}
                        onClick={handleProfileImageDelete}
                      >
                        {text.deletePhoto}
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="secondary" className="gap-2" onClick={() => setEditOpen(true)}>
                    <Pencil className="h-4 w-4" />
                    {text.edit}
                  </Button>
                  <Button variant="secondary" className="gap-2" onClick={() => setStatusOpen(true)}>
                    <UserRoundX className="h-4 w-4" />
                    {text.changeStatus}
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">{text.employeeDetails}</h2>
              <div className="mt-3 grid gap-3 text-sm text-slate-900 md:grid-cols-2 xl:grid-cols-3">
                <p><span className="font-medium text-slate-900">{text.employeeId}</span> {employee.id || text.autoAssigned}</p>
                <p><span className="font-medium text-slate-900">{text.title}</span> {employee.title || "-"}</p>
                <p><span className="font-medium text-slate-900">{text.employmentType}</span> {displayedEmploymentType ? displayedEmploymentType.replace("_", " ") : "-"}</p>
                <p><span className="font-medium text-slate-900">{text.department}</span> {employee.department || "-"}</p>
                <p><span className="font-medium text-slate-900">{text.email}</span> {employee.email || "-"}</p>
                <p><span className="font-medium text-slate-900">{text.phone}</span> {employee.phone || "-"}</p>
                <p><span className="font-medium text-slate-900">{text.salary}</span> {formatEGP(employee.salary)}</p>
                <p><span className="font-medium text-slate-900">{text.shift}</span> {employee.shiftStart || "-"} - {employee.shiftEnd || "-"}</p>
                <p><span className="font-medium text-slate-900">{text.workingDays}</span> {employee.workingDays.join(", ") || "-"}</p>
                <p><span className="font-medium text-slate-900">{text.rating}</span> {typeof employee.rating === "number" && employee.rating > 0 ? employee.rating.toFixed(1) : "-"}</p>
                <p><span className="font-medium text-slate-900">{text.hireDate}</span> {employee.hireDate || "-"}</p>
              </div>
              <p className="mt-3 text-sm text-slate-900">
                <span className="font-medium text-slate-900">{text.notes}</span> {employee.notes || "-"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
              <div className={`flex flex-wrap gap-2 ${language === "ar" ? "justify-end" : ""}`}>
                <button
                  type="button"
                  onClick={() => changeTab("overview")}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    tab === "overview" ? "bg-slate-900 text-white" : "text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  {text.overview}
                </button>
                <button
                  type="button"
                  onClick={() => changeTab("documents")}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    tab === "documents" ? "bg-slate-900 text-white" : "text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  {text.documents}
                </button>
                <button
                  type="button"
                  onClick={() => changeTab("audit")}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    tab === "audit" ? "bg-slate-900 text-white" : "text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  {text.auditLogs}
                </button>
              </div>
            </div>

            {tab === "overview" ? (
              <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-900 shadow-sm">
                {text.overviewHint}
              </div>
            ) : null}

            {tab === "documents" ? (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <Button className="gap-2" onClick={() => setUploadOpen(true)}>
                    <FilePlus2 className="h-4 w-4" />
                    {text.uploadDocument}
                  </Button>
                </div>
                {documentsQuery.isLoading ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-4 text-slate-950 shadow-sm">
                    {text.loadingDocuments}
                  </div>
                ) : documentsQuery.isError ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700 shadow-sm">
                    {getErrorMessage(documentsQuery.error, text.genericError)}
                  </div>
                ) : documentRows.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-950 shadow-sm">
                    {text.noDocuments}
                  </div>
                ) : (
                  <DocumentsTable rows={documentRows} onDelete={(doc) => setDeleteDoc(doc)} />
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {auditLogsQuery.isLoading ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    {text.loadingAuditLogs}
                  </div>
                ) : auditLogsQuery.isError ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700 shadow-sm">
                    {getErrorMessage(auditLogsQuery.error, text.genericError)}
                  </div>
                ) : (auditLogsQuery.data?.items?.length ?? 0) === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                    {text.noAuditLogs}
                  </div>
                ) : (
                  <>
                    <AuditLogsList rows={auditLogsQuery.data?.items ?? []} />
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={auditPage <= 1}
                        onClick={() => {
                          const query = new URLSearchParams(searchParams.toString());
                          query.set("tab", "audit");
                          query.set("auditPage", String(Math.max(1, auditPage - 1)));
                          router.replace(`/admin/team/${employeeId}?${query.toString()}`);
                        }}
                      >
                        {text.previous}
                      </Button>
                      <p className="text-sm text-slate-900">
                        {text.page} {auditPage} {text.of} {auditLogsQuery.data?.totalPages ?? 1}
                      </p>
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={auditPage >= (auditLogsQuery.data?.totalPages ?? 1)}
                        onClick={() => {
                          const query = new URLSearchParams(searchParams.toString());
                          query.set("tab", "audit");
                          query.set("auditPage", String(auditPage + 1));
                          router.replace(`/admin/team/${employeeId}?${query.toString()}`);
                        }}
                      >
                        {text.next}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        ) : null}
      </section>

      <EditEmployeeDrawer
        open={editOpen}
        employee={employee}
        pending={updateMutation.isPending}
        onClose={() => setEditOpen(false)}
        onSubmit={(values) => {
          updateMutation.mutate(values, {
            onSuccess: () => {
              setCachedEmploymentType(employeeId, values.employmentType);
              toast.success(text.employeeUpdated);
              setEditOpen(false);
            },
            onError: (error) => toast.error(getErrorMessage(error, text.genericError)),
          });
        }}
      />

      <StatusChangeModal
        open={statusOpen}
        currentStatus={employee?.status}
        pending={statusMutation.isPending}
        onClose={() => setStatusOpen(false)}
        onSubmit={(values) => {
          statusMutation.mutate(values, {
            onSuccess: () => {
              toast.success(text.employeeStatusUpdated);
              setStatusOpen(false);
            },
            onError: (error) => toast.error(getErrorMessage(error, text.genericError)),
          });
        }}
      />

      <UploadDocumentModal
        open={uploadOpen}
        pending={uploadMutation.isPending}
        onClose={() => setUploadOpen(false)}
        onSubmit={async (payload) => {
          try {
            if (payload.sourceMode === "file") {
              const uploadedUrls = await teamApi.uploadFiles(payload.files);
              if (uploadedUrls.length === 0) {
                toast.error(text.uploadFilesFailed);
                return;
              }

              const normalizedUrls = payload.files.map((_, index) => uploadedUrls[index] ?? uploadedUrls[0]);
              for (let index = 0; index < payload.values.length; index += 1) {
                const value = payload.values[index];
                await uploadMutation.mutateAsync({
                  type: value.type,
                  title: value.title,
                  expiresAt: value.expiresAt,
                  fileUrl: normalizedUrls[index],
                });
              }
              toast.success(
                payload.values.length > 1
                  ? text.documentsUploaded(payload.values.length)
                  : text.documentUploaded
              );
              setUploadOpen(false);
              return;
            }

            for (const value of payload.values) {
              await uploadMutation.mutateAsync({
                type: value.type,
                title: value.title,
                expiresAt: value.expiresAt,
                fileUrl: value.fileUrl || "",
              });
            }
            toast.success(
              payload.values.length > 1
                ? text.documentsUploaded(payload.values.length)
                : text.documentUploaded
            );
            setUploadOpen(false);
          } catch (error) {
            toast.error(getErrorMessage(error, text.genericError));
          }
        }}
      />

      <ConfirmDeleteModal
        open={Boolean(deleteDoc)}
        title={text.deleteDocumentTitle}
        description={text.deleteDocumentDescription(deleteDoc?.title)}
        onClose={() => setDeleteDoc(null)}
        onConfirm={() => {
          if (!deleteDoc) return;
          deleteDocMutation.mutate(deleteDoc.id, {
            onSuccess: () => {
              toast.success(text.documentDeleted);
              setDeleteDoc(null);
            },
            onError: (error) => toast.error(getErrorMessage(error, text.genericError)),
          });
        }}
      />
    </AdminLayout>
  );
}
